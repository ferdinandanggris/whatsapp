# WebSocket Flow — Backend

## Overview
Real-time event hub using gorilla/websocket. Room-based pub/sub: per-company and per-user rooms. Events broadcast to all connected agents in the same company.

## Actors
- Agent (WebSocket client)
- WebSocket hub (server-side pub/sub)
- Service layer (publishes events)

## Preconditions
- WebSocket endpoint at `/ws?token={jwt}`
- Valid JWT token passed as query param

## Steps

### Step 1: Connect
- **Endpoint**: `GET /ws?token={jwt}`
- **Auth**: JWT token from query param
- **Action**: Validate JWT → register client → join company room + personal room
- **State change**: Client added to hub's client registry
- **Errors**: 401 invalid token, upgrade failure

### Step 2: Receive Events
- **Messages from server** (JSON):
  ```json
  { "type": "new_message|message_sent|message_status|UpdateConversation|AgentTyping|service_window_opened", "payload": { ... } }
  ```
- **Dispatch**: Hub broadcasts to all clients in the room (company scope)
- **Events**:
  - `new_message` — inbound message from Meta webhook
  - `message_sent` — outbound message confirmation
  - `message_status` — delivery/failure status update (sent → delivered → read)
  - `UpdateConversation` — conversation metadata changed
  - `AgentTyping` — typing indicator
  - `service_window_opened` — 24h window reopened (customer messaged)

### Step 3: Send Typing Indicator
- **Endpoint**: `POST /api/v1/typing`
- **Payload**: `{ conversation_id, typing: true|false }`
- **Action**: Broadcast `AgentTyping` event to company room
- **Note**: Typing indicators NOT sent to Meta API (local-only feature)

### Step 4: Disconnect
- **Trigger**: Client closes connection / network drop
- **Action**: Hub removes client from rooms, cleans up resources
- **State change**: Client count decreases (visible in connection banner)

## Connection Lifecycle
- Read pump: reads control messages (ping/pong, close)
- Write pump: queues outbound events, 10s write deadline
- Ping/pong: server sends ping every 30s, client must respond within 10s
- Reconnect: frontend auto-reconnects with exponential backoff

## API Contracts

### GET /ws?token={jwt}
**Upgrade:** 101 Switching Protocols
**Payload (from server):**
```json
{ "type": "new_message", "payload": { "conversation_id": "uuid", "message": { ... } } }
```

## State Management
- Hub holds in-memory client registry (per-company + per-user rooms)
- No persistence — all clients disconnect on server restart
- Frontend handles reconnection + state reconciliation

## Database Touchpoints
- None (in-memory only)

## Security
- Auth: JWT required as query param
- Scope: client only receives events for their own company
- Rate limit: connection rate limited (20/min per IP)

## Related Flows
- [Message Flow](./message-flow.md) — triggers `message_sent` and `new_message` events
- [Webhook Flow](./webhook-flow.md) — triggers `new_message` from inbound
- Frontend: [Real-time Flow](../../wa-frontend/.opencode/flows/realtime-flow.md)
