package handler

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/ferdinandanggris/wa-backend/internal/middleware"
	"github.com/ferdinandanggris/wa-backend/internal/model"
	"github.com/ferdinandanggris/wa-backend/internal/repository"
	"github.com/ferdinandanggris/wa-backend/internal/service"
)

type ConversationHandler struct {
	convs    *repository.ConversationRepository
	msgs     *repository.MessageRepository
	contacts *repository.ContactRepository
	svc      *service.WhatsAppService
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

		contact, _ := h.contacts.GetByID(ctx, orig.WaID, orig.PhoneNumberID)

		m.ReplyWamID = refID
		m.ReplyText = previewOrig(contact, orig)
		if orig.Direction == "inbound" {
			m.ReplyName = orig.CustomerName
		} else {
			m.ReplyName = orig.AgentName
		}
	}
}

func previewOrig(contact *model.Contact, m *model.Message) string {
	switch m.Type {
	case "text":
		var t struct {
			Text *struct {
				Body string `json:"body"`
			} `json:"text"`
		}
		if json.Unmarshal(m.Content, &t) == nil && t.Text != nil && t.Text.Body != "" {
			return truncate(t.Text.Body, 100)
		}
	case "image":
		var i struct {
			Image *struct {
				Caption string `json:"caption"`
			} `json:"image"`
		}
		if json.Unmarshal(m.Content, &i) == nil && i.Image != nil && i.Image.Caption != "" {
			return "📷 " + truncate(i.Image.Caption, 100)
		}
		return "📷 Photo"
	case "video":
		var v struct {
			Video *struct {
				Caption string `json:"caption"`
			} `json:"video"`
		}
		if json.Unmarshal(m.Content, &v) == nil && v.Video != nil && v.Video.Caption != "" {
			return "🎥 " + truncate(v.Video.Caption, 100)
		}
		return "🎥 Video"
	case "audio":
		var a struct {
			Audio *struct {
				Caption string `json:"caption"`
			} `json:"audio"`
		}
		if json.Unmarshal(m.Content, &a) == nil && a.Audio != nil && a.Audio.Caption != "" {
			return "🎵 " + truncate(a.Audio.Caption, 100)
		}
		return "🎵 Audio"
	case "document":
		var d struct {
			Document *struct {
				Filename string `json:"filename"`
			} `json:"document"`
		}
		if json.Unmarshal(m.Content, &d) == nil && d.Document != nil && d.Document.Filename != "" {
			return "📄 " + truncate(d.Document.Filename, 100)
		}
		return "📄 Document"
	case "location":
		return "📍 Location"
	case "interactive":
		return "🔄 Reply"
	case "reaction":
		var r struct {
			Reaction *struct {
				Emoji string `json:"emoji"`
			} `json:"reaction"`
		}
		if json.Unmarshal(m.Content, &r) == nil && r.Reaction != nil {
			if r.Reaction.Emoji != "" {
				return fmt.Sprintf("%s reacted %s", *contact.CompanyCustomName, r.Reaction.Emoji)
			}
			return fmt.Sprintf("%s removed reaction", *contact.CompanyCustomName)
		}
		return "👍 Reaction"
	}
	return "[unknown]"
}

func truncate(s string, n int) string {
	runes := []rune(s)
	if len(runes) <= n {
		return s
	}
	return string(runes[:n]) + "..."
}

func NewConversationHandler(contacts *repository.ContactRepository, convs *repository.ConversationRepository, msgs *repository.MessageRepository, svc *service.WhatsAppService) *ConversationHandler {
	return &ConversationHandler{contacts: contacts, convs: convs, msgs: msgs, svc: svc}
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

	var cursorTs *time.Time
	var cursorID *int64
	if ct := r.URL.Query().Get("cursor_ts"); ct != "" {
		if t, err := time.Parse(time.RFC3339Nano, ct); err == nil {
			cursorTs = &t
		}
	}
	if ci := r.URL.Query().Get("cursor_id"); ci != "" {
		if v, err := strconv.ParseInt(ci, 10, 64); err == nil {
			cursorID = &v
		}
	}

	filter := &repository.MessageFilter{
		Q:         r.URL.Query().Get("q"),
		Type:      r.URL.Query().Get("type"),
		Direction: r.URL.Query().Get("direction"),
	}

	msgs, hasMore, nextCursorTs, nextCursorID, err := h.msgs.ListByConversation(r.Context(), conv.PhoneNumberID, conv.WaID, limit, cursorTs, cursorID, filter)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to list messages")
		return
	}

	// Enrich reply info from context
	enrichReplies(r.Context(), h, msgs)

	resp := map[string]interface{}{
		"data":     msgs,
		"has_more": hasMore,
	}
	if nextCursorTs != nil && nextCursorID != nil {
		resp["next_cursor_ts"] = nextCursorTs.Format(time.RFC3339Nano)
		resp["next_cursor_id"] = *nextCursorID
	}

	writeJSON(w, http.StatusOK, resp)
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
