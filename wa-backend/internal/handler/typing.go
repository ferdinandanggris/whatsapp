package handler

import (
	"encoding/json"
	"net/http"

	"github.com/ferdinandanggris/wa-backend/internal/ws"
)

type TypingHandler struct {
	hub *ws.Hub
}

func NewTypingHandler(hub *ws.Hub) *TypingHandler {
	return &TypingHandler{hub: hub}
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

	h.hub.BroadcastEventToAll(ws.Event{
		Type: "AgentTyping",
		Data: req,
	})

	writeJSON(w, http.StatusOK, map[string]interface{}{"status": true})
}
