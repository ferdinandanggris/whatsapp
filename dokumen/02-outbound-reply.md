# Outbound Reply — Agent → Send → Database → WebSocket

## Flow
```
Agent CS → React Chat UI → InputBar (typed a message)
     │
     ├─ 1. 24h window check (sebelum hit API)
     │   - If last_customer_message_at > 24h → BLOCK
     │   - If open → lanjut
     │
     └─ 2. POST /api/v1/messages/send
         Body: {
           "conversation_id": "uuid-xxx",
           "type": "text",
           "content": { "body": "Baik Bu, akan segera diproses" }
         }
         Header: Authorization: Bearer <jwt>

Backend Handler
     │
     ├─ 3. Validate JWT → extract user_id, company_id
     ├─ 4. Verify user has access to conversation's phone_number_id
     ├─ 5. Re-check 24h window (server-side validation!)
     │   - SELECT last_customer_message_at FROM contacts
     │   - If > 24h → 403 "Service window closed, use template"
     │
     ├─ 6. Call wapi.Client.SendMessage(ctx, phoneNumberID, msg)
     │   - Build types.Message from request
     │   - Send via wapi-lib → wapi.SendMessage()
     │
     ├─ 7. Save message to DB
     │   - INSERT INTO messages (wamid=response.WAMID, direction='outbound', ...)
     │
     ├─ 8. Update conversation
     │   - UPDATE conversations SET last_message_at=NOW(), last_message_preview=...
     │
     └─ 9. WebSocket push
         - Emit to sender agent's WebSocket connection
         - Event: "message_sent"
         - Payload: { conversation_id, message }
```

## Handler Code (pseudo)

```go
type SendRequest struct {
    ConversationID string          `json:"conversation_id"`
    Type           string          `json:"type"`
    Content        json.RawMessage `json:"content"`
    TemplateName   string          `json:"template_name,omitempty"` // for template
}

func (h *MessageHandler) Send(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()
    agent := ctx.Value("user").(*model.User)

    var req SendRequest
    json.NewDecoder(r.Body).Decode(&req)

    // Verify access
    conv := h.repo.GetConversation(ctx, req.ConversationID)
    if !h.auth.CanAccessConversation(agent, conv) {
        http.Error(w, "forbidden", 403)
        return
    }

    // 24h window check
    contact := h.repo.GetContact(ctx, conv.WaID, conv.PhoneNumberID)
    if time.Since(contact.LastCustomerMessageAt) > 24*time.Hour && req.Type == "text" {
        writeJSON(w, 403, map[string]string{
            "error": "service_window_closed",
            "message": "Service window >24h, send template only",
        })
        return
    }

    // Build & send via wapi-lib
    var msg *types.Message
    switch req.Type {
    case "text":
        msg = types.NewTextMessage(conv.WaID, extractBody(req.Content), false)
    case "template":
        msg = buildTemplateMessage(conv.WaID, req.TemplateName, req.Content)
    }

    resp, err := h.wapi.SendMessage(ctx, conv.PhoneNumberID, msg)
    if err != nil {
        slog.Error("send message failed", "error", err)
        writeJSON(w, 500, map[string]string{"error": err.Error()})
        return
    }

    // Save to DB
    message := h.repo.SaveMessage(ctx, &model.Message{
        WamID:         resp.Messages[0].ID,
        PhoneNumberID: conv.PhoneNumberID,
        WaID:          conv.WaID,
        Direction:     "outbound",
        Type:          req.Type,
        Content:       req.Content,
        Status:        "sent",
        Timestamp:     time.Now(),
        AgentID:       &agent.ID,
    })

    h.repo.UpdateConversationPreview(ctx, conv.ID, message)

    // Push WS
    h.hub.PushToUser(agent.ID, ws.Event{
        Type: "message_sent",
        Data: map[string]interface{}{
            "conversation_id": conv.ID,
            "message":         message,
        },
    })

    writeJSON(w, 200, message)
}
```

## API Contract

```
POST /api/v1/messages/send
Authorization: Bearer <jwt>
Content-Type: application/json

Request (text):
{
  "conversation_id": "uuid-xxx",
  "type": "text",
  "content": { "body": "Baik Bu, akan segera diproses" }
}

Request (template):
{
  "conversation_id": "uuid-xxx",
  "type": "template",
  "template_name": "order_confirmation",
  "content": {
    "header_parameters": [{"type": "text", "text": "ORD-123"}],
    "body_parameters": [
      {"type": "text", "text": "Budi"},
      {"type": "text", "text": "50000"}
    ]
  }
}

Response 200:
{
  "wamid": "wamid.xxx",
  "type": "text",
  "direction": "outbound",
  "status": "sent",
  "timestamp": "2026-05-26T10:01:00Z"
}

Response 403 (window closed):
{
  "error": "service_window_closed",
  "message": "Cannot send free-form message. Service window >24 hours. Use template instead."
}
```

## WebSocket Event

```json
{
  "type": "message_sent",
  "data": {
    "conversation_id": "uuid-xxx",
    "message": {
      "wamid": "wamid.xxx",
      "type": "text",
      "direction": "outbound",
      "content": {"body": "Baik Bu, akan segera diproses"},
      "status": "sent",
      "timestamp": "2026-05-26T10:01:00Z"
    }
  }
}
```

## Key Points
- **Always check 24h window on server side** — client check is UX sugar, server check is security
- Template messages **tidak dicek** 24h window (boleh kapan saja sesuai kebijakan Meta)
- Save to DB **setelah** sukses dari API Meta — jangan simpan dulu sebelum send
- Agent ID dicatat di message untuk tracking siapa yang reply
