# Message Flow — Backend

## Overview
Send WhatsApp messages (text, template, media, reaction) via Meta Cloud API. Enforces 24h service window for free-form messages.

## Actors
- Agent (sends messages via frontend)
- Meta Cloud API (WhatsApp)
- WebSocket hub (broadcasts sent confirmation)

## Preconditions
- Company has at least one WhatsApp Business phone number connected
- Phone number is in `connected` status
- For free-form text: 24h window must be open (customer sent message first)

## Steps

### Step 1: Send Text Message
- **Trigger**: Agent submits text in chat input
- **Endpoint**: `POST /api/v1/messages`
- **Payload**: `{ conversation_id, type: "text", content: { body } }`
- **Validation**: non-empty body, 24h window check via `service/window.go`
- **Action**: Call Meta API `POST /{{phone-number-id}}/messages`, save to DB, broadcast via WS
- **State change**: `messages` row inserted, conversation `last_message` updated
- **Output**: `{ message: { id, wamid, status: "sent", ... } }`
- **Errors**: 403 service window closed (must use template), 400 validation

### Step 2: Send Template Message
- **Trigger**: Agent picks template + fills variables
- **Payload**: `{ conversation_id, type: "template", content: { template_name, language, components: [{ type: "body", parameters: [...] }] } }`
- **Action**: Resolve template components, call Meta API, save to DB
- **Output**: `{ message: { id, wamid, status: "sent" } }`

### Step 3: Send Media
- **Payload**: `{ conversation_id, type: "image|video|audio|document", content: { media_id, caption? } }`
- **Precondition**: Media uploaded first via `POST /api/v1/media/upload`
- **Action**: Call Meta API with media ID, save to DB

### Step 4: Send Reaction
- **Endpoint**: `POST /api/v1/messages/reaction`
- **Payload**: `{ message_id, emoji }` (empty emoji = remove reaction)
- **Action**: Call Meta API react endpoint, save to DB

### Step 5: Mark Conversation Read
- **Endpoint**: `PATCH /api/v1/conversations/:id/read`
- **Payload**: `{ wamid }` (last message ID)
- **Action**: Call Meta API mark-read, update conversation unread_count

## API Contracts

### POST /api/v1/messages
**Request:**
```json
{
  "conversation_id": "uuid",
  "type": "text|template|image|video|audio|document",
  "content": { "...": "..." }
}
```
**Response (201):** `{ message: { id, wamid, status, type, conversation_id, created_at } }`

### POST /api/v1/messages/reaction
**Request:** `{ message_id: "uuid", emoji: "👍" }`
**Response (200):** `{ message: { id, wamid, status: "sent" } }`

## State Management
- Messages saved to PostgreSQL, cached in TanStack Query on frontend
- WS pushes `message_sent` event for instant UI update
- Optimistic update on frontend (message shown immediately as "sending")

## Database Touchpoints
- Tables written: `messages`, updated `conversations.last_message`, `conversations.unread_count`
- 24h window: derived from most recent customer message timestamp in messages table

## Security
- Auth: required (agent role+)
- Validation: content safety (message length, media size limits)
- Rate limit: 60 messages/min per phone number

## Related Flows
- [WebSocket Flow](./websocket-flow.md) — real-time broadcast of sent messages
- Frontend: [Send Message Flow](../../wa-frontend/.opencode/flows/send-message-flow.md)
