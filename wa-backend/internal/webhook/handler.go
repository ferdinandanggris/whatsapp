package webhook

import (
	"encoding/json"
	"io"
	"log/slog"
	"net/http"
	"strconv"
	"time"

	"github.com/ferdinandanggris/wapi/types"
	wapiwebhook "github.com/ferdinandanggris/wapi/webhook"

	"github.com/ferdinandanggris/wa-backend/internal/model"
	"github.com/ferdinandanggris/wa-backend/internal/repository"
	"github.com/ferdinandanggris/wa-backend/internal/ws"
)

type Handler struct {
	VerifyToken string
	AppSecret   string
	Contacts    *repository.ContactRepository
	Messages    *repository.MessageRepository
	Convs       *repository.ConversationRepository
	Hub         *ws.Hub
}

func (h *Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		h.verify(w, r)
	case http.MethodPost:
		h.handle(w, r)
	default:
		http.Error(w, `{"error":"method not allowed"}`, http.StatusMethodNotAllowed)
	}
}

func (h *Handler) verify(w http.ResponseWriter, r *http.Request) {
	mode := r.URL.Query().Get("hub.mode")
	token := r.URL.Query().Get("hub.verify_token")
	challenge := r.URL.Query().Get("hub.challenge")

	if mode != "subscribe" || token != h.VerifyToken {
		slog.Warn("webhook verification failed", "mode", mode)
		http.Error(w, "Forbidden", http.StatusForbidden)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte(challenge))
	slog.Info("webhook verified")
}

func (h *Handler) handle(w http.ResponseWriter, r *http.Request) {
	body, err := io.ReadAll(r.Body)
	if err != nil {
		slog.Error("webhook: read body", "error", err)
		http.Error(w, `{"error":"bad request"}`, http.StatusBadRequest)
		return
	}
	r.Body.Close()

	if h.AppSecret != "" {
		sig := r.Header.Get("X-Hub-Signature-256")
		if sig == "" || !wapiwebhook.VerifySignature(body, sig, h.AppSecret) {
			slog.Warn("webhook: invalid signature")
			http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
			return
		}
	}

	// Always return 200 immediately before async processing
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"status":"ok"}`))

	var payload types.WebhookPayload
	if err := json.Unmarshal(body, &payload); err != nil {
		slog.Error("webhook: decode payload", "error", err)
		return
	}

	for _, entry := range payload.Entry {
		if entry == nil {
			continue
		}
		for _, change := range entry.Changes {
			if change == nil || change.Value == nil {
				continue
			}
			v := change.Value

			if v.Metadata != nil {
				if len(v.Messages) > 0 {
					h.processInbound(r, v.Messages[0], v.Metadata, v.Contacts)
				}
				for _, status := range v.Statuses {
					h.processStatus(r, status, v.Metadata)
				}
			}
		}
	}
}

func (h *Handler) processInbound(r *http.Request, msg *types.IncomingMsg, meta *types.Metadata, waContacts []*types.WaContact) {
	phoneNumberID := meta.PhoneNumberID
	waID := msg.From

	profileName := ""
	if len(waContacts) > 0 && waContacts[0].Profile != nil {
		profileName = waContacts[0].Profile.Name
	}

	contact, err := h.Contacts.FindOrCreate(r.Context(), waID, phoneNumberID, profileName)
	if err != nil {
		slog.Error("webhook: contact", "error", err)
		return
	}

	msgType, content := inboundContent(msg)
	ts, _ := strconv.ParseInt(msg.Timestamp, 10, 64)

	message := &model.Message{
		WamID:         msg.ID,
		PhoneNumberID: phoneNumberID,
		WaID:          waID,
		Direction:     "inbound",
		Type:          msgType,
		Content:       content,
		Status:        "received",
		Timestamp:     time.Unix(ts, 0),
	}

	if err := h.Messages.Save(r.Context(), message); err != nil {
		slog.Error("webhook: save message", "error", err)
		return
	}

	preview := previewText(msgType, content)
	conv, err := h.Convs.Upsert(r.Context(), phoneNumberID, waID, preview)
	if err != nil {
		slog.Error("webhook: upsert conversation", "error", err)
		return
	}

	slog.Info("inbound message",
		"wamid", msg.ID,
		"from", waID,
		"phone_number_id", phoneNumberID,
		"type", msgType,
		"conversation_id", conv.ID,
	)

	if h.Hub != nil {
		h.Hub.BroadcastEventToAll(ws.Event{
			Type: "new_message",
			Data: map[string]interface{}{
				"conversation": conv,
				"message":      message,
				"contact":      contact,
			},
		})
	}
}

func (h *Handler) processStatus(r *http.Request, status *types.StatusUpdate, meta *types.Metadata) {
	var errCode *int
	if status.Errors != nil && len(status.Errors) > 0 {
		errCode = &status.Errors[0].Code
	}

	if err := h.Messages.UpdateStatus(r.Context(), status.ID, status.Status, errCode); err != nil {
		slog.Error("webhook: update status", "wamid", status.ID, "error", err)
		return
	}

	slog.Info("message status",
		"wamid", status.ID,
		"status", status.Status,
		"error_code", errCode,
	)

	if h.Hub != nil {
		h.Hub.BroadcastEventToAll(ws.Event{
			Type: "message_status",
			Data: map[string]string{
				"wamid":  status.ID,
				"status": status.Status,
			},
		})
	}
}

func inboundContent(msg *types.IncomingMsg) (string, json.RawMessage) {
	switch msg.Type {
	case "text":
		if msg.Text != nil {
			return "text", repository.MustJSON(map[string]string{"body": msg.Text.Body})
		}
	case "image":
		if msg.Image != nil {
			return "image", repository.MustJSON(map[string]string{
				"id": msg.Image.ID, "caption": msg.Image.Caption, "mime_type": msg.Image.MimeType,
			})
		}
	case "video":
		if msg.Video != nil {
			return "video", repository.MustJSON(map[string]string{
				"id": msg.Video.ID, "caption": msg.Video.Caption,
			})
		}
	case "audio":
		if msg.Audio != nil {
			return "audio", repository.MustJSON(map[string]string{
				"id": msg.Audio.ID, "mime_type": msg.Audio.MimeType,
			})
		}
	case "document":
		if msg.Document != nil {
			return "document", repository.MustJSON(map[string]string{
				"id": msg.Document.ID, "filename": msg.Document.Filename,
				"caption": msg.Document.Caption, "mime_type": msg.Document.MimeType,
			})
		}
	case "location":
		if msg.Location != nil {
			return "location", repository.MustJSON(map[string]interface{}{
				"latitude": msg.Location.Latitude, "longitude": msg.Location.Longitude,
				"name": msg.Location.Name, "address": msg.Location.Address,
			})
		}
	case "interactive":
		if msg.Interactive != nil && msg.Interactive.InButtonReply != nil {
			return "interactive", repository.MustJSON(map[string]string{
				"type": "button_reply", "id": msg.Interactive.InButtonReply.ID,
				"title": msg.Interactive.InButtonReply.Title,
			})
		}
		if msg.Interactive != nil && msg.Interactive.InListReply != nil {
			return "interactive", repository.MustJSON(map[string]string{
				"type": "list_reply", "id": msg.Interactive.InListReply.ID,
				"title": msg.Interactive.InListReply.Title,
			})
		}
	}
	return "text", repository.MustJSON(map[string]string{"body": "[unsupported type]"})
}

func previewText(msgType string, content json.RawMessage) string {
	switch msgType {
	case "text":
		var t struct{ Body string `json:"body"` }
		if json.Unmarshal(content, &t) == nil && t.Body != "" {
			return truncate(t.Body, 100)
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
		return "🔄 Reply"
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
