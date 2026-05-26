# Template Management — Sync, Store, Send

## Latar Belakang

Template Message adalah satu-satunya cara untuk menghubungi customer di luar 24h window.
Template harus disetujui oleh Meta sebelum bisa dipakai.
Backend perlu menyimpan template lokal untuk dropdown di UI agent.

## Table Schema

```sql
CREATE TABLE templates (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name            VARCHAR(255) NOT NULL,        -- template name di Meta
    category        VARCHAR(50) NOT NULL,          -- UTILITY / MARKETING / AUTHENTICATION
    language        VARCHAR(10) NOT NULL,          -- id, en_US, etc
    status          VARCHAR(20) NOT NULL,          -- APPROVED / PENDING / REJECTED
    components      JSONB NOT NULL DEFAULT '[]',   -- header/body/buttons structure
    meta_template_id VARCHAR(100),                 -- ID dari Meta
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now(),
    UNIQUE (name, language)
);
```

## Sync Flow

```
Manual trigger (Super Admin) → POST /api/v1/templates/sync
     │
     ├─ Backend panggil c.ListTemplates(ctx)
     ├─ Iterate semua template dari Meta
     ├─ UPSERT ke templates table
     └─ Return count: { synced: 15, created: 2, updated: 1 }
```

```go
func (s *TemplateService) Sync(ctx context.Context, phoneNumberID string) (*SyncResult, error) {
    templates, err := s.wapi.ListTemplates(ctx, phoneNumberID)
    if err != nil {
        return nil, fmt.Errorf("sync templates: %w", err)
    }

    var created, updated int
    for _, t := range templates.Data {
        existing, err := s.repo.GetByName(ctx, t.Name, t.Language)
        if err == nil {
            s.repo.Update(ctx, existing.ID, t)
            updated++
        } else {
            s.repo.Create(ctx, t)
            created++
        }
    }

    return &SyncResult{Synced: len(templates.Data), Created: created, Updated: updated}, nil
}
```

## API Endpoints

```
# Template Admin (Super Admin / Company Admin)
GET    /api/v1/templates                     → List approved templates (for dropdown)
GET    /api/v1/templates?category=UTILITY    → Filter by category
GET    /api/v1/templates/:id                 → Detail template + components
POST   /api/v1/templates/sync                → Sync dari Meta (trigger manual)
POST   /api/v1/templates                     → Create template di Meta + local
PUT    /api/v1/templates/:id                  → Edit template (Meta + local)
DELETE /api/v1/templates/:id                 → Delete (Meta + local)
```

## Response Format

```json
GET /api/v1/templates

{
  "data": [
    {
      "id": "uuid-xxx",
      "name": "order_confirmation",
      "category": "UTILITY",
      "language": "id",
      "status": "APPROVED",
      "components": [
        {
          "type": "HEADER",
          "format": "TEXT",
          "text": "Pesanan #{{1}}"
        },
        {
          "type": "BODY",
          "text": "Halo {{1}}, pesanan Anda sebesar Rp{{2}} telah dikonfirmasi.",
          "example": {
            "body_text": [
              ["Budi", "50000"]
            ]
          }
        },
        {
          "type": "BUTTONS",
          "buttons": [
            {
              "type": "URL",
              "text": "Lihat Pesanan",
              "url": "https://example.com/order/{{1}}"
            }
          ]
        }
      ]
    }
  ]
}
```

## UI Integration (24h Window)

Ketika window >24h, dropdown menampilkan template yang sudah disync:

```
[Select template ▼]
  ┌──────────────────────────────────────┐
  │ 📋 order_confirmation (id)           │
  │    Halo {nama}, pesanan Anda dikonfirm│
  ├──────────────────────────────────────┤
  │ 📋 shipping_update (id)              │
  │    Pesanan {order} sudah dikirim via  │
  ├──────────────────────────────────────┤
  │ 📋 payment_reminder (id)             │
  │    Tagihan {amount} jatuh tempo...    │
  └──────────────────────────────────────┘
```

Setelah pilih template, agent mengisi parameter:

```
Template: order_confirmation
─────────────────────────────
Header:  [ORD-12345]          ← parameter 1
Body 1:  [Budi]               ← parameter 2
Body 2:  [50000]              ← parameter 3
Button:  [ORD-12345]          ← parameter URL

                     [Send Template]
```

## Key Points
- Templates wajib **disync** secara berkala atau trigger manual dari Super Admin
- Hanya template dengan status `APPROVED` yang muncul di dropdown agent
- Template `REJECTED` atau `PENDING` tidak bisa dikirim
- Parameter template diisi agent melalui form yang di-generate dari komponen template
- Template adalah fitur **cross-cutting** — bisa dipakai oleh semua nomor dalam satu WABA
- Create/update/delete template dilakukan via Meta API, local DB sebagai cache
