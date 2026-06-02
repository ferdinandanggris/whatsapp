# wa-backend — Go API Server

## Project Context
- **Name**: wa-backend
- **Type**: backend-api
- **Stack**: Go 1.25 + chi + pgx (PostgreSQL) + gorilla/websocket + golang-jwt
- **Scale**: startup
- **Created**: 2026-06-02

## Active Skills

### Core
- `project-readability` — naming, structure, boring code
- `token-efficient-coding` — dense code, no fluff

### Framework
- `golang-readability` — idiomatic Go, error handling, domain-first

### Database
- `database-designer` — schema design
- `database-optimizer` — query performance, N+1 detection

### Quality
- `code-health` — security & performance audit

## Workflows

### Implement Feature
Trigger: "implement [feature]", "add [feature]", "build [feature]"

1. Load `feature-architect` → plan feature
2. Load `golang-readability` → implement
3. Read relevant flow dari `.opencode/flows/`
4. Load `database-designer` (kalau touch DB)
5. Load `code-health` → audit

### Code Review
Trigger: "review", "audit code", "check handler"

1. Load `golang-readability`
2. Load `code-health`

## Flow References

- [Auth Flow](./flows/auth-flow.md) — JWT login, refresh, setup, RBAC
- [Message Flow](./flows/message-flow.md) — send text/template/media/reaction
- [WebSocket Flow](./flows/websocket-flow.md) — real-time events hub
- [Webhook Flow](./flows/webhook-flow.md) — Meta Cloud API inbound
- [Template Flow](./flows/template-flow.md) — sync & manage templates

## MCP Servers

Recommended:
- `dbhub` — PostgreSQL inspection & query
- `github-mcp` — git workflow

## Conventions

- **Naming**: snake_case for JSON fields (Go idiomatic), PascalCase for exports
- **Error handling**: return structured `{ error: string }` with appropriate HTTP status
- **DB**: pgxpool with embedded migrations, raw SQL queries in repository layer
- **Auth**: JWT access + refresh tokens, role-based middleware (super_admin/company_admin/agent)
- **Logging**: structured via `slog`

## Notes

- Redis in docker-compose but not wired yet — don't assume Redis availability
- `worker/` is empty placeholder
- wapi-lib is local path `../../wapi-lib` — Meta Cloud API client
- 24h service window enforced in service layer
