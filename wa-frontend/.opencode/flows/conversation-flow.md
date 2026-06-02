# Conversation Flow — Frontend

## Overview
Three-panel inbox: app switcher (left) → conversation list (center) → messages (right). Tracks unread counts, real-time updates.

## Actors
- Agent (user)
- TanStack Query (server state cache)
- WebSocket (real-time updates)

## Preconditions
- User authenticated
- WebSocket connected
- At least one WhatsApp phone number configured for company

## Steps

### Step 1: Load Conversations
- **Trigger**: User navigates to `/inbox`
- **Query**: `useQuery(['conversations'])` → GET `/api/v1/conversations`
- **Response**: `{ data: Conversation[], meta: { total, unread } }`
- **State**: Rendered in center panel (`ConversationSidebar`)
- **Loading**: Skeleton loader in sidebar

### Step 2: Select Conversation
- **Trigger**: User clicks a conversation in list
- **Action**: Update selected conversation ID → load messages
- **Query**: `useInfiniteQuery(['messages', conversationId])` → GET `/api/v1/conversations/:id/messages?offset=0&limit=50`
- **Response**: `{ data: Message[], meta: { has_more, next_offset } }`
- **State**: Messages rendered in ChatWindow, scroll to bottom

### Step 3: Infinite Scroll (Load Older Messages)
- **Trigger**: User scrolls to top of message list
- **Action**: `fetchNextPage()` → GET with next offset
- **Merge**: Prepend older messages to existing list

### Step 4: Mark as Read
- **Trigger**: Conversation selected, messages visible
- **Action**: PATCH `/api/v1/conversations/:id/read` + optimistic update of unread_count

### Step 5: Real-time Update (via WS)
- **Event**: `new_message` or `UpdateConversation` from WebSocket
- **Action**: Invalidate `['conversations']` query → update sidebar order
- **If conversation selected**: invalidate `['messages', conversationId]`
- **If new conversation**: add to list, update unread badge

### Step 6: New Chat
- **Dialog**: NewChatDialog → search contact by wa_id → if not found, prompts to send first message to create
- **Action**: POST `/api/v1/messages` → conversation created → navigate to it

## API Contracts

### GET /api/v1/conversations
**Response:** `{ data: Conversation[], meta: { total: int, unread: int } }`

### GET /api/v1/conversations/:id/messages?offset=0&limit=50
**Response:** `{ data: Message[], meta: { has_more: bool, next_offset: int } }`

## State Management
- **Server state**: TanStack Query with 30s staleTime
- **Unread badge**: From query meta, updated via WS events
- **Selected conversation**: Local state in ChatLayout (useState)
- **Optimistic updates**: Mark read immediately in cache

## Database Touchpoints
- None (all via backend API)

## Security
- User only sees conversations for their company
- No agent can access cross-company data

## Related Flows
- [Send Message Flow](./send-message-flow.md) — triggered within conversation
- [Real-time Flow](./realtime-flow.md) — updates conversation list live
