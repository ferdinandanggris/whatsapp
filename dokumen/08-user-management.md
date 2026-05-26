# User Management — RBAC

## Roles

| Role | Level | Description |
|------|-------|-------------|
| `super_admin` | System-wide | Manage companies, phone numbers, all users |
| `company_admin` | Per company | Manage agents within company, view analytics |
| `agent` | Per company | Handle conversations, send messages |

## Table Schema

```sql
CREATE TYPE user_role AS ENUM ('super_admin', 'company_admin', 'agent');

CREATE TABLE users (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    role            user_role NOT NULL,
    company_id      BIGINT REFERENCES companies(id) ON DELETE CASCADE,
    email           VARCHAR(255) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    display_name    VARCHAR(100) NOT NULL,
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT now()
);
```

## API Endpoints

```
# Super Admin only
GET    /api/v1/users                  → List all users (filter by company_id optional)
POST   /api/v1/users                  → Create user (any role)

# Company Admin only
GET    /api/v1/users?company_id=X     → List users in own company
POST   /api/v1/users                  → Create agent (scoped to own company)

# Super Admin & Company Admin
PUT    /api/v1/users/:id              → Update user (name, email, role)
PATCH  /api/v1/users/:id/deactivate   → Soft-delete (is_active=false)
PATCH  /api/v1/users/:id/reset-password → Reset password

# User (self)
GET    /api/v1/me                     → Get own profile
PATCH  /api/v1/me/password            → Change own password
```

## Create User Request

```json
POST /api/v1/users
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "role": "agent",
  "company_id": 1,
  "email": "adi@perusahaan.com",
  "password": "temporary123",
  "display_name": "Adi Santoso"
}
```

## Permissions Matrix

| Action | super_admin | company_admin | agent |
|--------|-------------|---------------|-------|
| Create company | ✅ | ❌ | ❌ |
| List companies | ✅ | ❌ | ❌ |
| Assign phone number to company | ✅ | ❌ | ❌ |
| Create user (any company) | ✅ | ❌ | ❌ |
| Create user (own company) | ✅ | ✅ | ❌ |
| Deactivate user (own company) | ✅ | ✅ | ❌ |
| View conversations (own company) | ✅ | ✅ | ✅ |
| Send message | ✅ | ✅ | ✅ |
| View own profile | ✅ | ✅ | ✅ |
| Change own password | ✅ | ✅ | ✅ |

## Super Admin — Registration Flow

```
Step 1: POST /api/v1/auth/register (no auth required, first-time only)
        → Create initial super_admin account
        → Set JWT_SECRET, redirect to login

Step 2: Login as super_admin
Step 3: Create company (POST /api/v1/companies)
Step 4: Assign phone number to company
Step 5: Create company_admin user
Step 6: company_admin creates agents
```

**Note:** Register endpoint hanya aktif jika belum ada satupun user di database (`users` table empty).

## Key Points
- Password selalu di-hash dengan bcrypt sebelum disimpan
- `is_active=false` untuk soft-delete — data tetap ada, user tidak bisa login
- Super Admin bisa create user di company mana pun
- Company Admin hanya bisa create agent di company-nya sendiri
- Agent tidak punya akses ke user management endpoints
