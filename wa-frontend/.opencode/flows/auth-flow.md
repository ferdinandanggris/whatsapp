# Auth Flow — Frontend

## Overview
Login, session restore (JWT in memory, refresh on mount), role-based route protection, WebSocket connection after auth.

## Actors
- Agent / Admin (user)
- Auth Zustand store
- API client (auto-refresh on 401)
- ProtectedRoute component

## Preconditions
- Backend running at configured API URL
- User has account (created via setup)

## Steps

### Step 1: Login
- **Trigger**: User navigates to `/login`
- **Form**: email + password
- **Action**: POST `/api/v1/auth/login` → store tokens in Zustand
- **Store update**: `auth.setAuth({ user, accessToken, refreshToken })`
- **Navigation**: Redirect to `/inbox` on success
- **Errors**: Show inline error for invalid credentials

### Step 2: Session Restore (Page Reload)
- **Trigger**: App mounts, ProtectedRoute checks auth
- **Action**: If refresh_token exists → POST `/api/v1/auth/refresh` → set new access token → call `getMe()`
- **Store update**: `auth.init()` handles full restore flow
- **Error**: If refresh fails → redirect to `/login`

### Step 3: Auth Guard (Routing)
- **Component**: `ProtectedRoute` wraps all authenticated routes
- **Logic**: If no token → immediately redirect to `/login`
- **On mount**: Call `auth.init()` → if token exists, refresh + getMe
- **Loading**: Show spinner while restoring session

### Step 4: Logout
- **Trigger**: User clicks logout
- **Action**: Clear tokens from Zustand, disconnect WebSocket
- **Navigation**: Redirect to `/login`

## API Contracts

### POST /api/v1/auth/login
**Request:** `{ email, password }`
**Response:** `{ access_token, refresh_token, user: { id, email, name, role, company_id } }`

### POST /api/v1/auth/refresh
**Request:** `{ refresh_token }`
**Response:** `{ access_token, refresh_token }`

## State Management
- Zustand `auth` store: `{ user, accessToken, refreshToken, isAuthenticated, isLoading }`
- Tokens stored in memory only (not localStorage — refresh token rotation)
- API client reads `accessToken` from Zustand for every request

## Database Touchpoints
- None (frontend-only)

## Security
- Tokens never stored in localStorage (XSS protection)
- Auto-refresh on 401 interceptor in API client
- Logout clears all state

## Related Flows
- Backend: [Auth Flow](../../wa-backend/.opencode/flows/auth-flow.md)
- [Real-time Flow](./realtime-flow.md) — WS connects after auth
