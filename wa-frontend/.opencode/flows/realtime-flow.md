# Real-time Flow — Frontend

## Overview
WebSocket event handling: connect, reconnect, process events, update UI. Bridge between backend WS hub and React state.

## Actors
- Zustand ws store (connection lifecycle)
- WebMetaEventEmitter (event bus pattern)
- React components (subscribe to events)

## Preconditions
- User authenticated (JWT available)
- Backend WS endpoint at `/ws`

## Steps

### Step 1: Connect
- **Trigger**: After auth restore (`auth.init()` completes)
- **Action**: Create native WebSocket to `ws://host/ws?token={jwt}`
- **Store**: Zustand `ws` store tracks connection status: `disconnected → connecting → connected`
- **Retry**: Exponential backoff (1s, 2s, 4s, 8s, max 30s) on failure

### Step 2: Message Processing
- **Incoming**: Raw WebSocket `onmessage` → parse JSON `{ type, payload }`
- **Event emitter**: `emitter.emit(type, payload)` → React components handle via `useEffect` listeners
- **Event types**:
  - `new_message` → invalidate conversation + message queries
  - `message_sent` → update optimistic message
  - `message_status` → update message status (sending→sent→delivered→read)
  - `UpdateConversation` → refresh conversation list
  - `AgentTyping` → show typing indicator in conversation sidebar
  - `service_window_opened` → update UI (allow free-form text)

### Step 3: UI Updates
- **ChatWindow**: `useEffect` subscribes to `new_message`, `message_sent`, `message_status`
- **ConversationSidebar**: subscribes to `UpdateConversation`, `new_message` (for reorder)
- **Typing indicator**: subscribes to `AgentTyping`, shows/hides with 3s timeout
- **ConnectionBanner**: subscribes to WS store `status` → shows "Reconnecting..." when disconnected

### Step 4: Disconnect & Reconnect
- **Trigger**: Network loss, server restart, token expiry
- **Action**: WS `onclose` → set status to `disconnected` → start reconnect timer
- **Reconnect**: Clear old socket → create new socket with fresh token
- **State reconciliation**: On reconnect, invalidate all queries via TanStack Query (refetch)

## Event Contracts

### Server → Client Events
```json
{ "type": "new_message", "payload": { "conversation_id": "uuid", "message": { ... } } }
{ "type": "message_sent", "payload": { "temp_id": "uuid", "message": { ... } } }
{ "type": "message_status", "payload": { "message_id": "uuid", "status": "sent|delivered|read|failed" } }
{ "type": "UpdateConversation", "payload": { "conversation": { ... } } }
{ "type": "AgentTyping", "payload": { "conversation_id": "uuid", "agent_name": "string" } }
{ "type": "service_window_opened", "payload": { "conversation_id": "uuid" } }
```

## State Management
- **Zustand ws store**: `{ ws: WebSocket | null, status: 'connecting'|'connected'|'disconnected', reconnectAttempts: number }`
- **Event emitter**: Singleton `WebMetaEventEmitter` with `on`/`off` pattern
- **TanStack Query**: `invalidateQueries` on relevant events

## Database Touchpoints
- None (frontend-only)

## Security
- Token passed as query param (wss recommended in production)
- Connection scoped to user's company (server-enforced)

## Related Flows
- [Auth Flow](./auth-flow.md) — WS connects after auth
- [Conversation Flow](./conversation-flow.md) — updated via WS events
- [Send Message Flow](./send-message-flow.md) — receives `message_sent` confirmation
