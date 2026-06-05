package handler

import (
	"encoding/json"
	"log/slog"
	"net/http"

	"github.com/ferdinandanggris/wa-backend/internal/repository"
	"github.com/ferdinandanggris/wa-backend/internal/ws"
)

type TypingHandler struct {
	hub  *ws.Hub
	convs *repository.ConversationRepository
}

func NewTypingHandler(hub *ws.Hub, convs *repository.ConversationRepository) *TypingHandler {
	return &TypingHandler{hub: hub, convs: convs}
}

func (h *TypingHandler) Send(w http.ResponseWriter, r *http.Request) {
	var req struct {
		ConversationID string `json:"conversation_id"`
		SenderName     string `json:"sender_name"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	// Reset unread count when agent sends typing (signals they've seen the conversation)
	if req.ConversationID != "" {
		if err := h.convs.ResetUnread(r.Context(), req.ConversationID); err != nil {
			slog.Error("typing: reset unread", "conversation_id", req.ConversationID, "error", err)
		} else if conv, err := h.convs.GetByID(r.Context(), req.ConversationID); err == nil && conv != nil {
			conv.UnreadCount = 0
			h.hub.BroadcastEventToAll(ws.Event{
				Type: "conversation_updated",
				Data: map[string]interface{}{"conversation": conv},
			})
		}
	}

	h.hub.BroadcastEventToAll(ws.Event{
		Type: "agent_typing",
		Data: req,
	})

	writeJSON(w, http.StatusOK, map[string]interface{}{"status": true})
}
