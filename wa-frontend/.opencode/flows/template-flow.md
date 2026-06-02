# Template Management Flow — Frontend

## Overview
Full CRUD for WhatsApp message templates: list, create, edit, delete, sync from Meta. Template picker dialog for sending.

## Actors
- Company Admin / Super Admin (manage)
- TemplateManagement page
- TemplateCreator page (create/edit)
- TemplatePickerDialog (for sending)

## Preconditions
- User has admin+ role
- WABA connected

## Steps

### Step 1: List Templates
- **Route**: `/templates`
- **Component**: TemplateManagement
- **Query**: `useQuery(['templates'])` → GET `/api/v1/templates`
- **Display**: Table with name, language, status (APPROVED/PENDING/REJECTED), category, actions
- **Status badges**: Color-coded (green=APPROVED, yellow=PENDING, red=REJECTED)

### Step 2: Sync from Meta
- **Trigger**: Admin clicks "Sync" button
- **Action**: POST `/api/v1/templates/sync`
- **Loading**: Show progress indicator
- **Result**: Toast with synced/new/updated counts → refetch list

### Step 3: Create Template
- **Route**: `/templates/new`
- **Component**: TemplateCreator (mode: "create")
- **Form**: name, language, category, body text with {{variable}} placeholders, header (optional), footer (optional), buttons (optional)
- **Variable mapping**: Auto-detect `{{variable}}` in body → create input fields for each
- **Validation**: name format, required fields, button limits
- **Action**: POST `/api/v1/templates` → navigate to `/templates` on success

### Step 4: Edit Template
- **Route**: `/templates/:id/edit`
- **Component**: TemplateCreator (mode: "edit", pre-filled)
- **Note**: Editing an approved template creates a new version (Meta re-approval needed)
- **Action**: PUT `/api/v1/templates/:id`

### Step 5: Delete Template
- **Trigger**: Admin clicks delete with confirmation
- **Action**: DELETE `/api/v1/templates/:id` → refetch list

### Step 6: Pick Template for Sending
- **Dialog**: TemplatePickerDialog (opened from ChatInput)
- **Filter**: Show only APPROVED templates
- **Action**: Select template → fill variables → send via message flow

## API Contracts

### GET /api/v1/templates
**Response:** `{ data: Template[] }`

### POST /api/v1/templates
**Payload:** `{ name, language, category, components: [...] }`
**Response (201):** `{ data: Template }`

### POST /api/v1/templates/sync
**Response:** `{ synced_count, new_count, updated_count }`

## State Management
- **TanStack Query**: `['templates']` cache, invalidated on mutations
- **Form state**: local state in TemplateCreator (useState for form fields)
- **Variable mapping**: Dynamic form inputs based on detected variables

## Database Touchpoints
- None (all via backend API)

## Security
- Admin+ role required (route guard + API enforcement)
- Template names validated client-side (alphanumeric + underscore only)

## Related Flows
- [Send Message Flow](./send-message-flow.md) — uses TemplatePickerDialog
- Backend: [Template Flow](../../wa-backend/.opencode/flows/template-flow.md)
