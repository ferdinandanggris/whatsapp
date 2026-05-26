# Inbound Message — Webhook → Database → WebSocket

## Flow
```
WhatsApp User
     ↓ (mengirim pesan)
Meta WhatsApp Cloud API
     ↓ (POST /webhook)
Go Backend — Webhook Handler
     │
     ├─ 1. HTTP 200 immediate response (sync)
     │
     └─ 2. Process async (goroutine):
         ├─ Validate X-Hub-Signature-256
         ├─ Parse payload → extract:
         │   - phone_number_id (target bisnis)
         │   - wa_id             (pengirim/customer)
         │   - wamid             (message ID)
         │   - type, content, timestamp
         │
         ├─ 3. Find or create contact
         │   - WHERE wa_id=? AND phone_number_id=?
         │   - If not exists → INSERT
         │   - UPDATE last_customer_message_at = now()
         │   - UPDATE profile_name (jika berubah)
         │
         ├─ 4. Save message
         │   - INSERT INTO messages (wamid, phone_number_id, wa_id,
         │     direction='inbound', type, content, status='received', timestamp)
         │
         ├─ 5. Upsert conversation
         │   - INSERT INTO conversations ON CONFLICT (phone_number_id, wa_id)
         │     DO UPDATE SET last_message_at, last_message_preview, unread_count+1
         │
         └─ 6. WebSocket push
             - Emit ke room perusahaan yang memiliki phone_number_id ini
             - Event: "new_message"
             - Payload: { conversation_id, message, contact }
```

## Handler Code (pseudo)

```go
func (h *WebhookHandler) HandleInbound(ctx context.Context, entry webhook.Entry) error {
    for _, change := range entry.Changes {
        if change.Field != "messages" { continue }

        for _, msg := range change.Value.Messages {
            // 1. Process async setelah return 200
            go h.processMessage(ctx, msg, change.Value.Metadata)
        }
    }
    return nil // HTTP 200
}

func (h *WebhookHandler) processMessage(ctx context.Context, msg types.InboundMessage, meta types.Metadata) {
    phoneNumberID := meta.PhoneNumberID
    waID := msg.From

    // Find or create contact
    contact, _ := h.repo.FindOrCreateContact(ctx, waID, phoneNumberID, msg.ProfileName)
    h.repo.UpdateLastCustomerMessage(ctx, waID, phoneNumberID)

    // Save inbound message
    message := h.repo.SaveMessage(ctx, &model.Message{
        WamID:          msg.ID,
        PhoneNumberID:  phoneNumberID,
        WaID:           waID,
        Direction:      "inbound",
        Type:           msg.Type,
        Content:        extractContent(msg),
        Status:         "received",
        Timestamp:      time.Unix(msg.Timestamp, 0),
    })

    // Upsert conversation
    conv := h.repo.UpsertConversation(ctx, phoneNumberID, waID, message)

    // Push via WebSocket
    h.hub.PushToRoom(phoneNumberID, ws.Event{
        Type: "new_message",
        Data: map[string]interface{}{
            "conversation": conv,
            "message":      message,
            "contact":      contact,
        },
    })
}
```

## Database Operations

```sql
-- Find or create contact
INSERT INTO contacts (wa_id, phone_number_id, profile_name, last_customer_message_at)
VALUES ($1, $2, $3, NOW())
ON CONFLICT (wa_id, phone_number_id)
DO UPDATE SET profile_name = COALESCE(NULLIF($3, ''), contacts.profile_name),
              last_customer_message_at = NOW();

-- Save message
INSERT INTO messages (wamid, phone_number_id, wa_id, direction, type, content, status, timestamp)
VALUES ($1, $2, $3, 'inbound', $4, $5, 'received', $6)
ON CONFLICT (wamid) DO NOTHING;  -- idempotency

-- Upsert conversation
INSERT INTO conversations (phone_number_id, wa_id, last_message_at, last_message_preview, unread_count)
VALUES ($1, $2, $3, $4, 1)
ON CONFLICT (phone_number_id, wa_id)
DO UPDATE SET last_message_at = $3,
              last_message_preview = $4,
              unread_count = conversations.unread_count + 1;
```

## WebSocket Event

```json
{
  "type": "new_message",
  "data": {
    "conversation": {
      "id": "uuid-xxx",
      "phone_number_id": "123456",
      "wa_id": "6281234567890",
      "last_message_preview": "Halo, ada yang bisa dibantu?",
      "unread_count": 3
    },
    "message": {
      "wamid": "wamid.xxx",
      "type": "text",
      "content": {"body": "Halo, ada yang bisa dibantu?"},
      "direction": "inbound",
      "status": "received",
      "timestamp": "2026-05-26T10:00:00Z"
    },
    "contact": {
      "wa_id": "6281234567890",
      "profile_name": "Budi",
      "last_customer_message_at": "2026-05-26T10:00:00Z"
    }
  }
}
```

## Key Points
- HTTP 200 dikirim **sebelum** proses apapun (sync response)
- Proses data dilakukan **async** di goroutine terpisah
- `ON CONFLICT DO NOTHING` pada messages untuk **idempotency** — Meta kadang kirim webhook duplikat
- WebSocket push hanya ke agents yang punya akses ke `phone_number_id` tersebut
