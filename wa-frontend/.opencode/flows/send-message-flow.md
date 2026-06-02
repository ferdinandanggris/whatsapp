# Send Message Flow — Frontend

## Overview
Compose and send WhatsApp messages: text, template, media, reaction. Optimistic UI with real-time confirmation.

## Actors
- Agent (user)
- ChatInput component
- TanStack Query mutation

## Preconditions
- Conversation selected
- 24h service window open (or using template)
- Media uploaded if sending media message

## Steps

### Step 1: Send Text Message
- **Trigger**: Agent types message + presses Enter / clicks Send
- **Component**: `ChatInput`
- **Action**: 
  1. Create optimistic message in UI (status: "sending")
  2. POST `/api/v1/messages` with `type: "text"`
  3. On success: update message status to "sent" via WS `message_sent` event
  4. On error: mark as "failed" with retry option
- **State**: Message appears immediately in ChatWindow
- **Errors**: 403 service window → show template suggestion

### Step 2: Send Template
- **Trigger**: Agent clicks template button → picks from TemplatePickerDialog
- **Dialog**: TemplatePickerDialog lists available templates → select → fill variables
- **Action**: POST with `type: "template"` + resolved components
- **Variable mapping**: UI shows input fields for each {{variable}} in template body

### Step 3: Send Media
- **Trigger**: Agent clicks attachment icon → picks file
- **Pre-step**: POST `/api/v1/media/upload` (returns media_id)
- **Action**: POST message with `type: "image|video|audio|document"` + media_id
- **Preview**: Show thumbnail while uploading, then inline media in chat

### Step 4: Send Reaction
- **Trigger**: Agent hovers message → clicks emoji picker
- **Action**: POST `/api/v1/messages/reaction` with `{ emoji }`
- **UI**: Emoji overlaid on message bubble

### Step 5: Typing Indicator
- **Trigger**: Agent typing (with 500ms debounce)
- **Action**: POST `/api/v1/typing` `{ typing: true }`
- **Stop**: POST `{ typing: false }` when input cleared or message sent

## API Contracts

### POST /api/v1/messages
**Request:** `{ conversation_id, type: "text|template|image|video|audio|document", content: {...} }`
**Response (201):** `{ message: { id, wamid, status, type, conversation_id, created_at } }`

### POST /api/v1/messages/reaction
**Request:** `{ message_id, emoji }`
**Response (200):** `{ message }`

## State Management
- **TanStack Query mutation**: invalidates `['messages', conversationId]` on success
- **Optimistic updates**: add message to cache immediately, replace on server response
- **Local state**: input text, attachment, emoji picker open/close

## Database Touchpoints
- None (all via backend API)

## Security
- Attachment validation: file size (max 16MB), type whitelist
- Media uploaded to Meta servers via backend proxy

## Related Flows
- [Conversation Flow](./conversation-flow.md) — parent context
- [Real-time Flow](./realtime-flow.md) — delivers sent confirmation
