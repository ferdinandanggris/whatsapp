# WhatsApp Platform — Orchestrator

## Project Structure
```
whatsapp/
├── wa-backend/          # Go API server (agent: backend)
├── wa-frontend/         # React SPA (agent: frontend)
└── wa-desktop/          # WinForms shell (agent: desktop)
```

## Agents

### Backend Agent (`wa-backend/`)
- **Stack**: Go 1.25 + chi + PostgreSQL + WebSocket + JWT
- **Role**: REST API + WebSocket hub + Webhook receiver
- **Skills**: golang-readability, database-designer, database-optimizer, code-health
- **Flows**: `.opencode/flows/` di dalam wa-backend

### Frontend Agent (`wa-frontend/`)
- **Stack**: React 19 + Vite + Tailwind v4 + Zustand + TanStack Query
- **Role**: SPA dashboard — inbox, messaging, template management
- **Skills**: react-readability, tailwind-readability, code-health
- **Flows**: `.opencode/flows/` di dalam wa-frontend

### Desktop Agent (`wa-desktop/`)
- **Stack**: .NET Framework 4.7.2, WinForms, MVP (Passive View), WebView2, EventAggregator
- **Role**: Desktop shell — WebView embed wa-frontend + admin management (Company, Users, Templates, WA Phone Numbers, App Settings)
- **Skills**: winform-mvp (dengan references: composite-shell, listener-pattern, unidirectional-flow, message-bus, memory-management, thread-safety, unit-testing)
- **Flows**: `.opencode/flows/` di dalam wa-desktop

## Conventions

### API Contract
- Backend serves REST at `/api/v1/*` + WebSocket at `/ws`
- Response format: `{ data, error?, meta? }`
- Auth: JWT Bearer token, auto-refresh on 401
- Frontend → Backend via Vite proxy (dev) or same-origin (production)
- Desktop → Backend via HttpClient with JWT token

### Cross-Cutting
- Snake_case di backend (Go idiomatic), transform ke camelCase di frontend/desktop API client
- Single source of truth: backend DB. Frontend caches via TanStack Query.
- Real-time via WebSocket (not polling)
- Desktop: MVP Passive View — Views are dumb, Presenters are the brain

## Flow References (Root)
- [Backend Auth Flow](./wa-backend/.opencode/flows/auth-flow.md)
- [Frontend Auth Flow](./wa-frontend/.opencode/flows/auth-flow.md)
- [Message Flow (Backend)](./wa-backend/.opencode/flows/message-flow.md)
- [Conversation Flow (Frontend)](./wa-frontend/.opencode/flows/conversation-flow.md)

## Skill References
- [WinForms MVP Skill](../.agents/skills/winform-mvp/SKILL.md)
