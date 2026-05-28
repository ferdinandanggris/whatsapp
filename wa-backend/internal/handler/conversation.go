package handler

import (
	"net/http"
	"strconv"

	"github.com/ferdinandanggris/wa-backend/internal/middleware"
	"github.com/ferdinandanggris/wa-backend/internal/model"
	"github.com/ferdinandanggris/wa-backend/internal/repository"
)

type ConversationHandler struct {
	convs *repository.ConversationRepository
	msgs  *repository.MessageRepository
}

func NewConversationHandler(convs *repository.ConversationRepository, msgs *repository.MessageRepository) *ConversationHandler {
	return &ConversationHandler{convs: convs, msgs: msgs}
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

	writeJSON(w, http.StatusOK, msgs)
}
