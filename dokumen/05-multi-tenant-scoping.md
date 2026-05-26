# Multi-Tenant Scoping — Isolasi Data Antar Perusahaan

## Architecture

```
Super Admin (pusat)
  │
  ├─ Manage companies
  ├─ Assign wa_phone_numbers ke companies
  └─ Manage users (all companies)

Company Admin (perusahaan X)
  │
  ├─ Melihat data hanya untuk nomor-nomor perusahaan X
  └─ Manage agents di perusahaannya

Agent (perusahaan X)
  │
  ├─ Melihat conversations hanya untuk nomor perusahaan X
  └─ Tidak bisa lihat data perusahaan lain
```

## Data Isolation Model

```
companies
  │
  ├─ wa_phone_numbers.company_id → FK to companies.id
  │
  ├─ users.company_id → FK to companies.id
  │
  └─ contacts.phone_number_id → FK to wa_phone_numbers.phone_number_id
       │
       └─ messages.phone_number_id → FK via contacts
            │
            └─ conversations.phone_number_id → FK via contacts
```

Setiap data di-scope ke `phone_number_id`, dan setiap `phone_number_id` terikat ke satu `company`.

## Query Scoping

Semua query **wajib** di-scope dengan company milik user yang login.

```go
// Middleware: inject scope into context
func TenantMiddleware(repo *repository.Repository) func(http.Handler) http.Handler {
    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            user := r.Context().Value("user").(*model.User)

            // Super admin bisa lihat semua
            if user.Role == "super_admin" {
                next.ServeHTTP(w, r)
                return
            }

            // Ambil phone_number_ids milik company user
            phoneIDs := repo.GetCompanyPhoneIDs(r.Context(), user.CompanyID)
            ctx := context.WithValue(r.Context(), "allowed_phone_ids", phoneIDs)
            next.ServeHTTP(w, r.WithContext(ctx))
        })
    }
}
```

## Repository Pattern

```go
func (r *Repository) GetConversations(ctx context.Context) ([]model.Conversation, error) {
    allowed := ctx.Value("allowed_phone_ids").([]string)

    query := `SELECT * FROM conversations
              WHERE phone_number_id = ANY($1)
              ORDER BY last_message_at DESC`

    rows, err := r.db.Query(ctx, query, allowed)
    // ...
}
```

## Example Scenarios

| User | Role | Company | Can See |
|------|------|---------|---------|
| Budi | super_admin | NULL | Semua nomor, semua perusahaan |
| Siti | company_admin | PT A | Nomor PT A, agents PT A |
| Adi | agent | PT A | Conversations PT A |
| Rudi | agent | PT B | Conversations PT B (tidak lihat PT A) |

## Authentication Middleware Chain

```
request → JWT middleware → extract user
         → Tenant middleware → inject allowed_phone_ids
         → Handler → scope all queries with allowed_phone_ids
```

## Key Points
- Super Admin punya akses **unrestricted** — bisa manage semua company
- `company_admin` dan `agent` **terbatas** hanya ke phone numbers company mereka
- Semua repository query **wajib** filter by `allowed_phone_ids`
- Jangan pernah query tanpa filter — pastikan middleware sudah jalan
- Tambahkan safety net: test yang sengaja coba akses data company lain (harus gagal)
