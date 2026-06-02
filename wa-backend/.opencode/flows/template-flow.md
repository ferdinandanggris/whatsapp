# Template Flow — Backend

## Overview
Manage WhatsApp message templates: list, sync from Meta, create, update, delete. Templates are pre-approved message formats required for outbound messaging outside the 24h service window.

## Actors
- Company Admin / Super Admin (manage templates)
- Meta Cloud API (template CRUD)
- Local DB (template cache)

## Preconditions
- Company has WABA (WhatsApp Business Account) configured
- User has `company_admin` or `super_admin` role

## Steps

### Step 1: List Templates
- **Trigger**: Admin opens template management page
- **Endpoint**: `GET /api/v1/templates`
- **Auth**: Bearer token (admin+)
- **Action**: Fetch from local DB, filtered by company
- **Output**: `{ templates: [{ id, name, language, status, category, components, ... }] }`
- **Errors**: 401, 403

### Step 2: Sync Templates from Meta
- **Trigger**: Admin clicks "Sync" button
- **Endpoint**: `POST /api/v1/templates/sync`
- **Action**: Call Meta API `GET /{{waba-id}}/message_templates` → upsert all to local DB
- **State change**: Templates updated/inserted in DB
- **Output**: `{ synced_count, new_count, updated_count }`
- **Errors**: 502 Meta API unreachable

### Step 3: Create Template
- **Trigger**: Admin fills template creation form
- **Endpoint**: `POST /api/v1/templates`
- **Payload**: `{ name, language, category, components, ... }`
- **Action**: Validate → call Meta API to create → save to local DB
- **Output**: `{ template: { id, name, status: "PENDING", ... } }`
- **Errors**: 400 validation, 502 Meta API error

### Step 4: Update Template
- **Endpoint**: `PUT /api/v1/templates/:id`
- **Action**: Update in Meta API → update local DB
- **Note**: Meta requires re-submission for approval after edit

### Step 5: Delete Template
- **Endpoint**: `DELETE /api/v1/templates/:id`
- **Action**: Delete from Meta API → delete from local DB

## API Contracts

### GET /api/v1/templates
**Response (200):** `{ templates: Template[] }`

### POST /api/v1/templates
**Payload:** `{ name, language, category, components: [{ type: "BODY|HEADER|FOOTER|BUTTONS", text?, example?, buttons?: [...] }] }`
**Response (201):** `{ template }`

### POST /api/v1/templates/sync
**Response (200):** `{ synced_count: int }`

## Database Touchpoints
- Tables read/written: `templates`
- Sync: UPSERT by `(company_id, name, language)` unique constraint

## Security
- Auth: required, admin+ role only
- Validation: template name must match regex `^[a-z0-9_]{1,512}$`
- Rate limit: 10 template operations/min

## Related Flows
- [Message Flow](./message-flow.md) — templates used for outbound messages
- Frontend: [Template Management Flow](../../wa-frontend/.opencode/flows/template-flow.md)
