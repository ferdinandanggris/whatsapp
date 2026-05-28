package ws

import (
	"encoding/json"
	"log/slog"
	"sync"
)

type Event struct {
	Type string      `json:"type"`
	Data interface{} `json:"data"`
}

type Hub struct {
	rooms      map[string]map[*Client]bool
	register   chan *Client
	unregister chan *Client
	mu         sync.RWMutex
}

func NewHub() *Hub {
	return &Hub{
		rooms:      make(map[string]map[*Client]bool),
		register:   make(chan *Client, 256),
		unregister: make(chan *Client, 256),
	}
}

func (h *Hub) Register(client *Client) {
	h.register <- client
}

func (h *Hub) Unregister(client *Client) {
	h.unregister <- client
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.joinRoom(client, "user_"+client.userID)
			if client.companyID != nil {
				h.joinRoom(client, companyRoom(*client.companyID))
			}
			slog.Info("ws client registered", "user_id", client.userID)

		case client := <-h.unregister:
			h.removeFromAllRooms(client)
			close(client.send)
			slog.Info("ws client unregistered", "user_id", client.userID)
		}
	}
}

func (h *Hub) joinRoom(client *Client, roomID string) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if h.rooms[roomID] == nil {
		h.rooms[roomID] = make(map[*Client]bool)
	}
	h.rooms[roomID][client] = true
}

func (h *Hub) removeFromAllRooms(client *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()
	for roomID, clients := range h.rooms {
		delete(clients, client)
		if len(clients) == 0 {
			delete(h.rooms, roomID)
		}
	}
}

func (h *Hub) BroadcastToRoom(roomID string, data []byte) {
	h.mu.RLock()
	defer h.mu.RUnlock()
	for client := range h.rooms[roomID] {
		select {
		case client.send <- data:
		default:
			slog.Warn("ws client send buffer full, dropping", "user_id", client.userID)
		}
	}
}

func (h *Hub) BroadcastToAllRooms(data []byte) {
	h.mu.RLock()
	defer h.mu.RUnlock()
	for _, clients := range h.rooms {
		for client := range clients {
			select {
			case client.send <- data:
			default:
			}
		}
	}
}

func (h *Hub) BroadcastEventToRoom(roomID string, event Event) {
	data, err := json.Marshal(event)
	if err != nil {
		slog.Error("ws marshal event", "error", err)
		return
	}
	h.BroadcastToRoom(roomID, data)
}

func (h *Hub) BroadcastEventToAll(event Event) {
	data, err := json.Marshal(event)
	if err != nil {
		slog.Error("ws marshal event", "error", err)
		return
	}
	h.BroadcastToAllRooms(data)
}

func companyRoom(companyID int64) string {
	return "company_" + formatInt(companyID)
}

func formatInt(n int64) string {
	if n == 0 {
		return "0"
	}
	digits := make([]byte, 0, 20)
	for n > 0 {
		digits = append(digits, byte('0'+n%10))
		n /= 10
	}
	for i, j := 0, len(digits)-1; i < j; i, j = i+1, j-1 {
		digits[i], digits[j] = digits[j], digits[i]
	}
	return string(digits)
}
