package handler

import (
	"context"
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/ferdinandanggris/wa-backend/internal/middleware"
	"github.com/ferdinandanggris/wa-backend/internal/model"
	"github.com/ferdinandanggris/wa-backend/internal/repository"
	"github.com/ferdinandanggris/wa-backend/internal/service"
)

type ConversationHandler struct {
	convs *repository.ConversationRepository
	msgs  *repository.MessageRepository
	svc   *service.WhatsAppService
}

// contextRef extracts the replied-to wamid from raw Meta message content.
func contextRef(content json.RawMessage) string {
	var c struct {
		Context *struct {
			ID        string `json:"id"`
			MessageID string `json:"message_id"`
		} `json:"context"`
	}
	if json.Unmarshal(content, &c) == nil && c.Context != nil {
		if c.Context.ID != "" {
			return c.Context.ID
		}
		return c.Context.MessageID
	}
	return ""
}

func enrichReplies(ctx context.Context, h *ConversationHandler, msgs []*model.Message) {
	var replyIDs []string
	for _, m := range msgs {
		if id := contextRef(m.Content); id != "" {
			replyIDs = append(replyIDs, id)
		}
	}
	if len(replyIDs) == 0 {
		return
	}

	originals, err := h.msgs.GetByWamIDs(ctx, replyIDs)
	if err != nil || len(originals) == 0 {
		return
	}

	for _, m := range msgs {
		refID := contextRef(m.Content)
		if refID == "" {
			continue
		}
		orig, ok := originals[refID]
		if !ok {
			continue
		}

		m.ReplyWamID = refID
		m.ReplyText = previewOrig(orig)
		if orig.Direction == "inbound" {
			m.ReplyName = orig.WaID
		} else {
			m.ReplyName = "Agent"
		}
	}
}

func previewOrig(m *model.Message) string {
	switch m.Type {
	case "text":
		var t struct {
			Text *struct{ Body string `json:"body"` } `json:"text"`
		}
		if json.Unmarshal(m.Content, &t) == nil && t.Text != nil {
			return truncateStr(t.Text.Body, 100)
		}
	case "image":
		return "📷 Photo"
	case "video":
		return "🎥 Video"
	case "audio":
		return "🎵 Audio"
	case "document":
		return "📄 Document"
	case "location":
		return "📍 Location"
	case "interactive":
		return "🔄 Reply button"
	case "template":
		return "📋 Template"
	case "reaction":
		var r struct {
			Reaction *struct{ Emoji string `json:"emoji"` } `json:"reaction"`
		}
		if json.Unmarshal(m.Content, &r) == nil && r.Reaction != nil && r.Reaction.Emoji != "" {
			return r.Reaction.Emoji
		}
		return "👍 Reaction"
	case "order":
		return "🛒 Order"
	}
	return "[message]"
}

func truncateStr(s string, n int) string {
	runes := []rune(s)
	if len(runes) <= n {
		return s
	}
	return string(runes[:n]) + "..."
}

func NewConversationHandler(convs *repository.ConversationRepository, msgs *repository.MessageRepository, svc *service.WhatsAppService) *ConversationHandler {
	return &ConversationHandler{convs: convs, msgs: msgs, svc: svc}
}

func (h *ConversationHandler) List(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r.Context())
	if claims == nil {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	if page < 1 {
		page = 1
	}
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if limit < 1 || limit > 100 {
		limit = 20
	}
	filter := r.URL.Query().Get("filter")
	if filter != "unread" && filter != "read" {
		filter = ""
	}
	phoneNumberID := r.URL.Query().Get("phone_number_id")

	var companyID *int64
	if claims.Role != "super_admin" {
		companyID = claims.CompanyID
	}
	if companyID == nil && claims.Role != "super_admin" {
		writeError(w, http.StatusForbidden, "no company access")
		return
	}

	convs, total, err := h.convs.List(r.Context(), companyID, phoneNumberID, filter, page, limit)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to list conversations")
		return
	}
	if convs == nil {
		convs = []*model.Conversation{}
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"data":  convs,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

func (h *ConversationHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		writeError(w, http.StatusBadRequest, "conversation id required")
		return
	}

	conv, err := h.convs.GetByID(r.Context(), id)
	if err != nil {
		writeError(w, http.StatusNotFound, "conversation not found")
		return
	}

	writeJSON(w, http.StatusOK, conv)
}

func (h *ConversationHandler) ListMessages(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		writeError(w, http.StatusBadRequest, "conversation id required")
		return
	}

	conv, err := h.convs.GetByID(r.Context(), id)
	if err != nil {
		writeError(w, http.StatusNotFound, "conversation not found")
		return
	}

	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if limit <= 0 || limit > 100 {
		limit = 50
	}
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))

	msgs, err := h.msgs.ListByConversation(r.Context(), conv.PhoneNumberID, conv.WaID, limit, offset)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to list messages")
		return
	}

	// Enrich reply info from context
	enrichReplies(r.Context(), h, msgs)

	writeJSON(w, http.StatusOK, msgs)
}

func (h *ConversationHandler) MarkRead(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		writeError(w, http.StatusBadRequest, "conversation id required")
		return
	}

	if err := h.svc.MarkConversationRead(r.Context(), id); err != nil {
		writeError(w, http.StatusNotFound, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{"status": true, "message": "conversation marked as read"})
}
