# Auth Flow — Backend

## Overview
Multi-tenant JWT authentication with role-based access (super_admin, company_admin, agent).

## Actors
- Agent (customer service), Company Admin, Super Admin
- System (JWT token generation/refresh)

## Preconditions
- Database migrated with companies, users tables
- At least one company exists for setup flow

## Steps

### Step 1: Initial Setup
- **Trigger**: First-run, no admin exists
- **Endpoint**: `POST /api/v1/auth/setup`
- **Payload**: `{ company_name, email, password, name }`
- **Validation**: email format, password min 8 chars, no existing admin
- **Action**: Create company + super_admin user, hash password (bcrypt)
- **Output**: `{ access_token, refresh_token, user }`
- **Errors**: 409 if admin exists

### Step 2: Login
- **Trigger**: User submits credentials
- **Endpoint**: `POST /api/v1/auth/login`
- **Payload**: `{ email, password }`
- **Validation**: email format
- **Action**: Verify bcrypt hash, generate JWT access (15m) + refresh (7d) tokens
- **Output**: `{ access_token, refresh_token, user }`
- **Errors**: 401 invalid credentials

### Step 3: Token Refresh
- **Trigger**: Access token expired
- **Endpoint**: `POST /api/v1/auth/refresh`
- **Payload**: `{ refresh_token }`
- **Action**: Validate refresh token, issue new access token
- **Output**: `{ access_token, refresh_token }`
- **Errors**: 401 invalid/expired refresh token

### Step 4: Get Current User
- **Trigger**: App initialization / page reload
- **Endpoint**: `GET /api/v1/auth/me`
- **Auth**: Bearer token
- **Action**: Decode JWT, fetch user from DB
- **Output**: `{ user: { id, email, name, role, company_id } }`

## API Contracts

### POST /api/v1/auth/login
**Response (200):** `{ access_token, refresh_token, user: { id, email, name, role, company_id } }`
**Errors:** 400 validation, 401 bad credentials

### POST /api/v1/auth/refresh
**Response (200):** `{ access_token, refresh_token }`
**Errors:** 401

## State Management
- JWT stored in frontend Zustand (memory, not localStorage)
- Backend stateless (no session DB)

## Database Touchpoints
- Tables read: `users`, `companies`
- Tables written: none (stateless JWT)

## Security
- Passwords: bcrypt (cost 12)
- Access token: 15 min expiry
- Refresh token: 7 day expiry, single-use rotation
- Rate limit: 10 login attempts/min per IP

## Related Flows
- Frontend: [Auth Flow](../../wa-frontend/.opencode/flows/auth-flow.md)
