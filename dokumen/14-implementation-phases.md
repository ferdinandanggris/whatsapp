# Implementation Phases — Execution Plan

## Phase 1: Backend Foundation

**Goal**: Go project running, Chi router, PostgreSQL connected, migrations applied.

| Task | File | Description |
|------|------|-------------|
| 1.1 | `wa-backend/cmd/server/main.go` | Entry point, config load, server bootstrap |
| 1.2 | `wa-backend/internal/config/config.go` | Env config loader |
| 1.3 | `wa-backend/go.mod` | Module init, deps (chi, pgx, wapi-lib) |
| 1.4 | `wa-backend/migrations/001_initial.sql` | All tables (companies, wa_phone_numbers, users, contacts, messages, conversations, media_cache, templates) |
| 1.5 | `wa-backend/internal/repository/db.go` | PostgreSQL connection pool |
| 1.6 | `wa-backend/internal/repository/migrate.go` | Auto-run migrations on startup |
| 1.7 | `wa-backend/docker-compose.yml` | PostgreSQL + Redis |
| 1.8 | `wa-backend/.env` | Dev environment variables |

**Files to create**: 8

---

## Phase 2: Authentication & User Management

**Goal**: Login, JWT, user CRUD, RBAC middleware.

| Task | File | Description |
|------|------|-------------|
| 2.1 | `wa-backend/internal/handler/auth.go` | POST /login, /refresh, /logout |
| 2.2 | `wa-backend/internal/handler/user.go` | CRUD users, deactivate, reset password |
| 2.3 | `wa-backend/internal/middleware/auth.go` | JWT validation middleware |
| 2.4 | `wa-backend/internal/middleware/tenant.go` | Company scoping middleware |
| 2.5 | `wa-backend/internal/repository/user.go` | User queries |
| 2.6 | `wa-backend/internal/service/auth.go` | Login logic, password verify |

**Files to create**: 6

---

## Phase 3: Webhook Receiver & Inbound Processing

**Goal**: Meta webhook → HTTP 200 → parse → save to DB.

| Task | File | Description |
|------|------|-------------|
| 3.1 | `wa-backend/internal/webhook/handler.go` | GET verify + POST handler, signature validation |
| 3.2 | `wa-backend/internal/webhook/processor.go` | Parse inbound: save contact, message, conversation |
| 3.3 | `wa-backend/internal/repository/contact.go` | FindOrCreateContact, search, update |
| 3.4 | `wa-backend/internal/repository/message.go` | SaveMessage, GetMessageByWAMID, UpdateStatus |
| 3.5 | `wa-backend/internal/repository/conversation.go` | UpsertConversation, GetConversations, GetByID |

**Files to create**: 5

---

## Phase 4: WebSocket Hub

**Goal**: Real-time push for inbound, outbound, status updates.

| Task | File | Description |
|------|------|-------------|
| 4.1 | `wa-backend/internal/ws/hub.go` | Room management, register/unregister, broadcast |
| 4.2 | `wa-backend/internal/ws/client.go` | Connection handler, read/write loops, ping/pong |
| 4.3 | `wa-backend/internal/handler/ws.go` | WS upgrade endpoint with JWT validation |

**Files to create**: 3

---

## Phase 5: Send Message & Outbound Flow

**Goal**: Agent can reply to conversations with 24h check.

| Task | File | Description |
|------|------|-------------|
| 5.1 | `wa-backend/internal/service/whatsapp.go` | wapi-lib wrapper: SendText, SendTemplate, SendMedia |
| 5.2 | `wa-backend/internal/handler/message.go` | POST /send, GET /messages/:wamid |
| 5.3 | `wa-backend/internal/handler/conversation.go` | GET /conversations, GET /conversations/:id |
| 5.4 | `wa-backend/internal/service/window.go` | 24h window check logic |

**Files to create**: 4

---

## Phase 6: Template Management

**Goal**: Sync & send template messages.

| Task | File | Description |
|------|------|-------------|
| 6.1 | `wa-backend/internal/handler/template.go` | CRUD + sync templates |
| 6.2 | `wa-backend/internal/repository/template.go` | Template queries |
| 6.3 | `wa-backend/internal/service/template.go` | Sync logic, parameter validation |

**Files to create**: 3

---

## Phase 7: Media Handling

**Goal**: Upload, proxy download, cache media.

| Task | File | Description |
|------|------|-------------|
| 7.1 | `wa-backend/internal/handler/media.go` | POST /upload, GET /media/:id |
| 7.2 | `wa-backend/internal/service/media.go` | Upload to Meta, download + cache |
| 7.3 | `wa-backend/internal/repository/media.go` | Media cache queries |

**Files to create**: 3

---

## Phase 8: Contact Management

**Goal**: Search contacts, set custom name.

| Task | File | Description |
|------|------|-------------|
| 8.1 | `wa-backend/internal/handler/contact.go` | GET /contacts, PATCH /contacts/:id |

**Files to create**: 1

---

## Phase 9: Frontend Foundation

**Goal**: React + Vite + Zustand project running with basic layout.

| Task | File | Description |
|------|------|-------------|
| 9.1 | `wa-frontend/package.json` | Dependencies |
| 9.2 | `wa-frontend/vite.config.ts` | Dev proxy, build config |
| 9.3 | `wa-frontend/src/App.tsx` | Router setup (login page, main layout) |
| 9.4 | `wa-frontend/src/store/auth.ts` | Auth state (Zustand) |
| 9.5 | `wa-frontend/src/types/index.ts` | Shared types |
| 9.6 | `wa-frontend/src/api/client.ts` | Axios/fetch wrapper with JWT |

**Files to create**: 6

---

## Phase 10: Frontend — Chat UI

**Goal**: WhatsApp-like chat interface.

| Task | File | Description |
|------|------|-------------|
| 10.1 | `wa-frontend/src/components/ConversationList/` | Inbox list with search |
| 10.2 | `wa-frontend/src/components/ChatArea/` | Message bubbles, date separators |
| 10.3 | `wa-frontend/src/components/InputBar/` | Text input + template dropdown |
| 10.4 | `wa-frontend/src/components/MessageBubble/` | Message bubble with status |
| 10.5 | `wa-frontend/src/hooks/useWebSocket.ts` | WS connection + reconnection |
| 10.6 | `wa-frontend/src/store/chat.ts` | Conversations + messages state |

**Files to create**: 6+

---

## Phase 11: Frontend — Auth + User Pages

**Goal**: Login, profile, user management UI.

| Task | File | Description |
|------|------|-------------|
| 11.1 | `wa-frontend/src/pages/Login.tsx` | Login form |
| 11.2 | `wa-frontend/src/pages/Users.tsx` | User list (admin only) |
| 11.3 | `wa-frontend/src/pages/Settings.tsx` | Profile, password change |

**Files to create**: 3

---

## Phase 12: WinForm Desktop Shell

**Goal**: WebView2 embed React app in WinForm.

| Task | File | Description |
|------|------|-------------|
| 12.1 | `wa-desktop/FormMain.cs` | Main form with WebView2 |
| 12.2 | `wa-desktop/FormLogin.cs` | Login form |
| 12.3 | `wa-desktop/WebViewEngine.cs` | WebView2 setup, URL loading, JS bridge |

**Files to create**: 3

---

## Phase 13: Integration & Testing

| Task | Description |
|------|-------------|
| 13.1 | Manual test: inbound → DB → WS → UI |
| 13.2 | Manual test: outbound → wapi → DB → WS → UI |
| 13.3 | Manual test: 24h window lock/unlock |
| 13.4 | Manual test: multi-tenant isolation |
| 13.5 | Manual test: template sync + send |
| 13.6 | Manual test: media upload + display |

---

## Phase 14: Polish & Production Readiness

| Task | Description |
|------|-------------|
| 14.1 | Error handling: all endpoints return consistent error format |
| 14.2 | Loading states + skeletons in UI |
| 14.3 | WebSocket reconnection with exponential backoff |
| 14.4 | Notification sound on new message |
| 14.5 | Tray icon for WinForm (minimize to tray) |
| 14.6 | Logging audit trail |

---

## Summary

| Phase | Scope | Files | Dependencies |
|-------|-------|-------|------|
| 1 | Backend foundation | 8 | wapi-lib |
| 2 | Auth + Users | 6 | Phase 1 |
| 3 | Webhook receiver | 5 | Phase 1 |
| 4 | WebSocket hub | 3 | Phase 1 |
| 5 | Send message | 4 | Phase 3, 4 |
| 6 | Templates | 3 | Phase 5 |
| 7 | Media | 3 | Phase 5 |
| 8 | Contacts | 1 | Phase 3 |
| 9 | Frontend foundation | 6 | - |
| 10 | Chat UI | 6+ | Phase 9 |
| 11 | Auth pages | 3 | Phase 9 |
| 12 | WinForm shell | 3 | Phase 10 |
| 13 | Integration testing | 0 | All above |
| 14 | Polish | 0 | Phase 13 |
