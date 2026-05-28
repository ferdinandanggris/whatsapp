package handler

import (
	"net/http"

	"github.com/gorilla/websocket"

	"github.com/ferdinandanggris/wa-backend/internal/service"
	"github.com/ferdinandanggris/wa-backend/internal/ws"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin:     func(r *http.Request) bool { return true },
}

type WSHandler struct {
	hub  *ws.Hub
	auth *service.AuthService
}

func NewWSHandler(hub *ws.Hub, auth *service.AuthService) *WSHandler {
	return &WSHandler{hub: hub, auth: auth}
}

func (h *WSHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	token := r.URL.Query().Get("token")
	if token == "" {
		http.Error(w, `{"error":"token required"}`, http.StatusUnauthorized)
		return
	}

	claims, err := h.auth.ValidateToken(token)
	if err != nil {
		http.Error(w, `{"error":"invalid token"}`, http.StatusUnauthorized)
		return
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		return
	}

	client := ws.NewClient(h.hub, conn, claims.UserID, claims.CompanyID, claims.Role)
	h.hub.Register(client)

	go client.WritePump()
	go client.ReadPump()
}
