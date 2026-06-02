# wa-frontend — React SPA Dashboard

## Project Context
- **Name**: wa-frontend (WA Center)
- **Type**: web-app
- **Stack**: React 19 + Vite 6 + TypeScript + Tailwind v4 + Zustand + TanStack Query v5
- **Scale**: startup
- **Created**: 2026-06-02

## Active Skills

### Core
- `project-readability` — naming, structure, boring code
- `token-efficient-coding` — dense code, no fluff

### Framework
- `react-readability` — hooks, state, component patterns
- `tailwind-readability` — utility-first styling

### Quality
- `code-health` — bundle size, performance, security

## Workflows

### Implement Feature
Trigger: "implement [feature]", "add [feature]", "build [feature]"

1. Load `feature-architect` → plan feature
2. Read relevant flow dari `.opencode/flows/`
3. Load `react-readability`, `tailwind-readability` → implement
4. Load `code-health` → audit

### Code Review
Trigger: "review", "audit code", "check component"

1. Load `project-readability`
2. Load `react-readability`
3. Load `code-health`

### Add UI Component
Trigger: "add [component]", "create [component]", "new dialog"

1. Check existing `src/components/ui/` for patterns
2. Use Radix + CVA + lucide-react
3. Follow tailwind-readability conventions

## Flow References

- [Auth Flow](./flows/auth-flow.md) — login, session restore, WebSocket connect
- [Conversation Flow](./flows/conversation-flow.md) — list, select, load messages
- [Send Message Flow](./flows/send-message-flow.md) — text, template, media, reaction
- [Real-time Flow](./flows/realtime-flow.md) — WebSocket events handling
- [Template Management Flow](./flows/template-flow.md) — list, create, edit, sync

## MCP Servers

Recommended:
- `playwright-mcp` — E2E testing
- `chrome-devtools-mcp` — debug rendering
- `github-mcp` — git workflow

## Conventions

- **Naming**: camelCase everywhere (JS/TS idiomatic)
- **State**: Zustand for global (auth, ws), TanStack Query for server state (conversations, messages)
- **API client**: custom fetch wrapper with auto-refresh; axios in legacy code
- **Components**: Radix UI primitives + CVA for variants, lucide-react for icons
- **WebSocket**: Zustand ws store + WebMetaEventEmitter for event-driven updates
- **Routing**: react-router-dom v7, routes in App.tsx

## Notes

- Dual client: standalone browser OR WinForms WebView2 chrome.webview bridge
- Vite proxy `/api` + `/ws` → backend `:8080` in dev
- TanStack staleTime: 30s, gcTime: 5min
- `emoji-picker-react` available for chat input
