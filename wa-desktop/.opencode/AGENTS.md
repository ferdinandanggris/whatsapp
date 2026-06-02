# WA Desktop — Agent Context

## Role
WinForms .NET 4.7.2 desktop shell for the WhatsApp Business platform.

## Project Structure
```
WaDesktop.sln
└── src/
    ├── WaDesktop.Domain/              # No WinForms deps
    │   ├── Interfaces/                # IView, IListener, IUseCase
    │   ├── Entities/                  # PhoneNumber, Company, User, Template, AppSetting
    │   ├── UseCases/                  # Business logic
    │   └── State/                     # AppStateContainer
    ├── WaDesktop.Infrastructure/
    │   ├── Services/                  # ApiClient, AuthService, SettingsService
    │   ├── EventAggregator/           # Pub/Sub message bus
    │   └── ServiceLocator.cs          # DI container
    └── WaDesktop.Client/              # WinForms .NET 4.7.2
        ├── Controls/                  # Custom controls
        ├── Views/
        │   ├── ShellView.cs           # MainForm (MenuBar + Sidebar + Workspace)
        │   ├── SidebarView.cs         # WA Phone Number TreeView
        │   ├── DashboardView.cs       # WebView2 embed wa-frontend
        │   └── ManagementViews/       # Company, Users, Templates, AppSettings
        └── Presenters/                # Per-View presenters
```

## Skills
- **winform-mvp**: `../../.agents/skills/winform-mvp/SKILL.md` — Enterprise MVP architecture
  - References: composite-shell, listener-pattern, unidirectional-flow, message-bus, memory-management, thread-safety, unit-testing

## Key Conventions
- Pure Passive View: code-behind has NO business logic
- IView interfaces: NO WinForms types leaked (primitives, DTOs, IList/IEnumerable only)
- IDisposable on all Presenters that subscribe to events
- Unidirectional data flow: UseCase → StateContainer → EventAggregator → Presenter
- WebView2: Evergreen mode (uses installed Edge Chromium)
- Background tasks via Task.Run, UI marshal via InvokeIfRequired
- Backend API: HttpClient + JWT Bearer, auto-refresh on 401

## Menu Structure

```
MENUBAR:
├── Dashboard        → WebView2 tab (wa-frontend SPA)
├── Company          → Management CRUD tab
├── Users            → Management CRUD tab
├── Templates        → Management CRUD tab
└── App Settings     → Super Admin only (webhook, API keys)

SIDEBAR:
└── WA Phone Numbers (TreeView)
    └── Click node → opens dedicated tab in Workspace
```

## Role Access
- **Admin**: Dashboard, Company, Users, Templates, WA Phone Numbers
- **Super Admin**: All of the above + App Settings

## Flows
_Flow docs will be added as features are implemented._
- dashboard-flow.md (TBD)
- management-flow.md (TBD)
- settings-flow.md (TBD)
