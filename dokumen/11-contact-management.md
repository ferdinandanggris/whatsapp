# Contact Management — Composite Key Isolation

## Latar Belakang

PRD mensyaratkan kontak diisolasi per nomor bisnis (`phone_number_id`).
Customer yang sama (sama `wa_id`) tapi menghubungi nomor bisnis berbeda dianggap kontak terpisah.

## Composite Primary Key

```sql
CREATE TABLE contacts (
    wa_id                   VARCHAR(20) NOT NULL,    -- ID WhatsApp customer (angka tanpa '+')
    phone_number_id         VARCHAR(50) NOT NULL,    -- Nomor bisnis yang dihubungi
    profile_name            VARCHAR(255),            -- Nama dari WhatsApp
    company_custom_name     VARCHAR(255),            -- Nama yang disimpan agent
    last_customer_message_at TIMESTAMPTZ,             -- Untuk 24h window
    PRIMARY KEY (wa_id, phone_number_id)
);
```

## Find or Create — Inbound Handler

Setiap inbound message:

```go
func (r *Repository) FindOrCreateContact(ctx context.Context, waID, phoneNumberID, profileName string) (*model.Contact, error) {
    query := `
        INSERT INTO contacts (wa_id, phone_number_id, profile_name, last_customer_message_at)
        VALUES ($1, $2, $3, NOW())
        ON CONFLICT (wa_id, phone_number_id)
        DO UPDATE SET
            profile_name = COALESCE(NULLIF($3, ''), contacts.profile_name),
            last_customer_message_at = NOW()
        RETURNING *
    `
    var c model.Contact
    err := r.db.QueryRow(ctx, query, waID, phoneNumberID, profileName).Scan(...)
    return &c, err
}
```

## Search

```go
func (r *Repository) SearchContacts(ctx context.Context, companyID int64, query string) ([]model.Contact, error) {
    sql := `
        SELECT c.* FROM contacts c
        JOIN wa_phone_numbers wpn ON c.phone_number_id = wpn.phone_number_id
        WHERE wpn.company_id = $1
          AND (c.profile_name ILIKE $2 OR c.company_custom_name ILIKE $2 OR c.wa_id ILIKE $2)
        ORDER BY c.last_customer_message_at DESC
        LIMIT 20
    `
    // ...
}
```

## Agent Custom Name

Agent bisa mengubah nama kontak (hanya visible di company-nya):

```go
PATCH /api/v1/contacts/:waID/:phoneNumberID
Body: { "company_custom_name": "Budi Pelanggan Setia" }
```

```sql
UPDATE contacts
SET company_custom_name = $1
WHERE wa_id = $2 AND phone_number_id = $3;
```

## Data Isolation Example

```
Scenario:
- Customer A (wa_id: 6281234567890) chat ke nomor "CS Pulsa" (phone_number_id: 1001)
- Customer A (wa_id: 6281234567890) chat ke nomor "CS Token" (phone_number_id: 1002)

Database:
  wa_id            | phone_number_id | profile_name
  6281234567890    | 1001            | Budi
  6281234567890    | 1002            | Budi

→ Dua baris terpisah. Agent CS Pulsa lihat Budi dengan custom_name sendiri.
  Agent CS Token lihat Budi dengan custom_name berbeda (jika diubah).
```

## Key Points
- `wa_id` tanpa karakter '+' (hanya digit angka, sesuai format Meta)
- `phone_number_id` sebagai second key untuk isolasi multi-tenant
- `last_customer_message_at` critical untuk 24h service window
- `company_custom_name` hanya visible untuk company yang punya nomor tersebut
- Search harus di-scope per company (jangan tampilkan kontak dari company lain)
