package handler

import (
	"encoding/json"
	"net/http"

	"github.com/ferdinandanggris/wa-backend/internal/middleware"
	"github.com/ferdinandanggris/wa-backend/internal/model"
	"github.com/ferdinandanggris/wa-backend/internal/repository"
	"github.com/ferdinandanggris/wa-backend/internal/service"
)

type MessageHandler struct {
	svc  *service.WhatsAppService
	msgs *repository.MessageRepository
}

func NewMessageHandler(svc *service.WhatsAppService, msgs *repository.MessageRepository) *MessageHandler {
	return &MessageHandler{svc: svc, msgs: msgs}
}

type sendRequest struct {
	To              string                       `json:"to"`
	PhoneNumberID   string                       `json:"phone_number_id"`
	Type            string                       `json:"type"`
	Body            string                       `json:"body,omitempty"`
	TemplateName    string                       `json:"template_name,omitempty"`
	TemplateLang    string                       `json:"template_lang,omitempty"`
	TemplateParams  map[string]string            `json:"template_params,omitempty"`
	TemplateButtons []service.TemplateButtonSpec `json:"template_buttons,omitempty"`
	MediaID         string                       `json:"media_id,omitempty"`
	Caption         string                       `json:"caption,omitempty"`
}

func (h *MessageHandler) Send(w http.ResponseWriter, r *http.Request) {
	var req sendRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if req.To == "" || req.PhoneNumberID == "" || req.Type == "" {
		writeError(w, http.StatusBadRequest, "to, phone_number_id, type required")
		return
	}

	claims := middleware.GetClaims(r.Context())
	if claims == nil {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	var msg *model.Message
	var err error

	switch req.Type {
	case "text":
		if req.Body == "" {
			writeError(w, http.StatusBadRequest, "body required for text messages")
			return
		}
		msg, err = h.svc.SendText(r.Context(), req.PhoneNumberID, req.To, req.Body, claims.UserID)
	case "template":
		if req.TemplateName == "" {
			writeError(w, http.StatusBadRequest, "template_name required for template messages")
			return
		}
		lang := req.TemplateLang
		if lang == "" {
			lang = "id"
		}
		msg, err = h.svc.SendTemplate(r.Context(), req.PhoneNumberID, req.To, req.TemplateName, lang, req.TemplateParams, req.TemplateButtons, claims.UserID)
	case "image", "video", "audio", "document":
		if req.MediaID == "" {
			writeError(w, http.StatusBadRequest, "media_id required for "+req.Type+" messages")
			return
		}
		msg, err = h.svc.SendMedia(r.Context(), req.PhoneNumberID, req.To, req.Type, req.MediaID, req.Caption, claims.UserID)
	default:
		writeError(w, http.StatusBadRequest, "unsupported message type: "+req.Type)
		return
	}

	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	writeJSON(w, http.StatusCreated, msg)
}

func (h *MessageHandler) GetByWAMID(w http.ResponseWriter, r *http.Request) {
	wamid := r.PathValue("wamid")
	if wamid == "" {
		writeError(w, http.StatusBadRequest, "wamid required")
		return
	}

	msg, err := h.msgs.GetByWamID(r.Context(), wamid)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to get message")
		return
	}
	if msg == nil {
		writeError(w, http.StatusNotFound, "message not found")
		return
	}

	writeJSON(w, http.StatusOK, msg)
}
