# Service Window 24 Jam — Customer Initiated Conversation

## Latar Belakang

WhatsApp Cloud API memiliki aturan **Customer Initiated Conversation Window**:
- Setiap pesan **inbound** dari customer membuka jendela 24 jam
- Selama 24 jam, agen bisa kirim **free-form text** (dan media/template)
- Setelah 24 jam, agen **hanya** bisa kirim **Template Message** (kategori Utility/Marketing)
- Inbound baru mereset timer menjadi 24 jam lagi

## Trigger

`contacts.last_customer_message_at` di-update setiap kali ada inbound message.

## Logic

```go
func canSendFreeForm(lastCustomerMessageAt time.Time) bool {
    return time.Since(lastCustomerMessageAt) < 24*time.Hour
}
```

## Frontend Behavior

```
State: OPEN (< 24 jam)
┌─────────────────────────────────┐
│ [Type your message...] [Send]   │ ← Input aktif, bisa text bebas
└─────────────────────────────────┘

State: CLOSED (> 24 jam)
┌─────────────────────────────────┐
│ ⛔ Service window closed         │
│                                 │
│ [Select template ▼]             │ ← Dropdown pilih template
│ ┌─────────────────────────────┐ │
│ │ order_confirmation          │ │
│ │ shipping_update             │ │
│ │ payment_reminder            │ │
│ └─────────────────────────────┘ │
│                     [Send]      │
└─────────────────────────────────┘
```

## Backend Flow

```
POST /api/v1/messages/send (type=text)
     │
     ├─ SELECT last_customer_message_at FROM contacts
     │   WHERE wa_id=? AND phone_number_id=?
     │
     ├─ if time.Since(lastCustomerMessageAt) > 24h
     │   → return 403: "window_closed"
     │
     └─ else
         → proceed send via wapi-lib
```

## State Transition

```
Customer sends inbound → last_customer_message_at = NOW()
                                │
                                ├─ 0-24 jam → FREE FORM TEXT allowed
                                │
                                ├─ >24 jam  → FREE FORM TEXT blocked
                                │              TEMPLATE ONLY
                                │
                                └─ Customer sends again
                                   → Reset ke 0-24 jam
```

## Database

```sql
-- Update setiap inbound
UPDATE contacts
SET last_customer_message_at = NOW()
WHERE wa_id = $1 AND phone_number_id = $2;

-- Server check
SELECT last_customer_message_at
FROM contacts
WHERE wa_id = $1 AND phone_number_id = $2;
```

## WebSocket Event — Window Changed

Ketika inbound baru masuk dan membuka window:

```json
{
  "type": "service_window_opened",
  "data": {
    "conversation_id": "uuid-xxx",
    "wa_id": "6281234567890",
    "expires_at": "2026-05-27T10:00:00Z"
  }
}
```

## Key Points
- `last_customer_message_at` **wajib akurat** — ini menentukan apakah agent bisa reply
- Waktu menggunakan **UTC** (TIMESTAMPTZ)
- Template messages **tidak terpengaruh** 24h window — bisa dikirim kapan saja
- UI harus **real-time update** saat window status berubah (WebSocket event)
