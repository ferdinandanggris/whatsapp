# Webhook Flow — Backend

## Overview
Receive inbound messages and status updates from Meta WhatsApp Cloud API via webhook. Process, persist, and broadcast to connected WebSocket clients.

## Actors
- Meta WhatsApp Cloud API (sends webhook POST)
- wa-backend webhook handler
- WebSocket hub (broadcasts to agents)

## Preconditions
- Webhook URL configured in Meta Developer Console: `{base_url}/webhook`
- Verify token matches config

## Steps

### Step 1: Webhook Verification (GET)
- **Trigger**: Meta sends GET request to verify webhook
- **Endpoint**: `GET /webhook`
- **Query params**: `hub.mode=subscribe&hub.verify_token={token}&hub.challenge={challenge}`
- **Action**: Validate verify_token matches config → return challenge
- **Output**: plain text `challenge` (200)
- **Errors**: 403 if token mismatch

### Step 2: Inbound Message (POST)
- **Trigger**: Customer sends WhatsApp message
- **Endpoint**: `POST /webhook`
- **Payload**: Meta Cloud API webhook payload (messages, statuses, etc.)
- **Action**: Parse entry → changes → messages/statuses → save to DB → broadcast via WS
- **Processing**:
  - Extract phone_number_id → map to company
  - Extract contact (wa_id) → create/update locally
  - Save message (inbound) or update status (outbound)
  - Broadcast `new_message` or `message_status` to company WS room
  - Update conversation `last_message` and `unread_count`
- **Output**: `200 OK` (must respond quickly to avoid retry)
- **Errors**: 400 bad payload, silently drop unrecognized events

### Step 3: Status Update
- **Trigger**: Outbound message status changes (sent → delivered → read → failed)
- **Payload includes**: `statuses[].{ id, status, timestamp, recipient_id }`
- **Action**: Update local message status in DB, broadcast `message_status` event

## API Contracts

### GET /webhook
**Response (200):** `{challenge}` (plain text)

### POST /webhook
**Response (200):** `OK`

## State Management
- All data persisted to PostgreSQL immediately on receipt
- WebSocket broadcast for real-time UI updates

## Database Touchpoints
- Tables read: `wa_phone_numbers` (to resolve company_id from phone_number_id)
- Tables written: `messages` (inbound INSERT, outbound status UPDATE), `conversations` (UPSERT), `contacts` (UPSERT)

## Security
- No auth on webhook endpoint (Meta sends plain POST)
- Verification via verify_token on GET
- Rate limit: 100 requests/sec (Meta can burst)
- Idempotency: webhook may deliver duplicate events — check wamid before insert

## Related Flows
- [Message Flow](./message-flow.md) — outbound message counterpart
- [WebSocket Flow](./websocket-flow.md) — broadcast inbound messages to agents
