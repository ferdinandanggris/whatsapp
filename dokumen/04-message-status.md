# Message Status — Delivery Tracking via Webhook

## Latar Belakang

WhatsApp Cloud API mengirimkan status update untuk setiap pesan yang dikirim:
- `sent` — Pesan diterima oleh WhatsApp
- `delivered` — Pesan sampai ke perangkat customer
- `read` — Customer membuka pesan (blue tick, jika diaktifkan)
- `failed` — Pesan gagal dikirim (dengan error code)

Status update datang melalui **webhook yang sama** dengan inbound messages.
Dibedakan oleh adanya field `statuses` di payload (vs `messages` untuk inbound).

## Flow

```
Agent sends reply via backend
     │
     ├─ wapi.SendMessage() → success
     │   → Save message with status='sent'
     │
     └─ Meta sends status webhook updates:
         │
         ├─ 1. { status: "sent" }     → update DB sent
         ├─ 2. { status: "delivered" } → update DB delivered
         └─ 3. { status: "read" }     → update DB read
                                                     │
                                                     ▼
                                            WebSocket push to agent:
                                            { type: "message_status", ... }
```

## Webhook Handler

```go
func (h *WebhookHandler) HandleStatus(ctx context.Context, status types.StatusUpdate) {
    // Update message status
    h.repo.UpdateMessageStatus(ctx, status.ID, status.Status, status.ErrorCode)

    // Get conversation for WS push
    message := h.repo.GetMessageByWAMID(ctx, status.ID)

    // Push to relevant agents
    h.hub.PushToRoom(message.PhoneNumberID, ws.Event{
        Type: "message_status",
        Data: map[string]interface{}{
            "wamid":           status.ID,
            "status":          status.Status,
            "conversation_id": message.ConversationID,
            "timestamp":       time.Now(),
        },
    })
}
```

## Database

```sql
UPDATE messages
SET status = $1, error_code = $2
WHERE wamid = $3;

-- Status progression: sent → delivered → read
-- Failed bisa terjadi kapan saja, final state
```

## Possible Status Transitions

```
sent ──→ delivered ──→ read
  │                      │
  └──→ failed            │
                          │
              (final state, no further updates)
```

## UI Indicator

```
[wamid.xxx]
  │
  ├─ sent:      ✓     (single gray check)
  ├─ delivered: ✓✓    (double gray check)
  ├─ read:      ✓✓    (double blue check)
  └─ failed:    ⚠️    (red, clickable for error detail)
```

## WebSocket Event

```json
{
  "type": "message_status",
  "data": {
    "wamid": "wamid.xxx",
    "status": "read",
    "conversation_id": "uuid-xxx",
    "timestamp": "2026-05-26T10:02:30Z"
  }
}
```

## Key Points
- Status update datang **terpisah** dari send response (send response dapet `wamid`, status update datang kemudian)
- Failed messages dapat `error_code` yang perlu ditampilkan ke agent
- Status update harus **real-time** di UI via WebSocket — jangan pakai polling
- Idempotent: status update bisa datang duplikat, UPDATE should handle gracefully
