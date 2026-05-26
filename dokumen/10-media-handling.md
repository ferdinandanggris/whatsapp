# Media Handling — Upload, Send, and Display

## Flow — Receiving Media

```
Inbound webhook → message type = image / video / audio / document
     │
     ├─ Meta hanya kirim media ID (tidak langsung URL)
     │   { "type": "image", "image": { "id": "media-id-xxx" } }
     │
     ├─ Save ke DB: type + media_id + caption
     │
     └─ Agent melihat di UI → loading thumbnail
         │
         └─ Klik → GET /api/v1/media/:mediaID
             → Backend panggil c.GetMediaURL() + c.DownloadMedia()
             → Proxy binary ke client (atau redirect ke URL Meta)
```

## Flow — Sending Media

```
Agent upload file → React UI (drag & drop / file picker)
     │
     ├─ POST /api/v1/media/upload
     │   Content-Type: multipart/form-data
     │   { file, phone_number_id }
     │
     ├─ Backend:
     │   1. Baca file dari request
     │   2. Call c.UploadMedia(ctx, phoneNumberID, filename, reader, mimeType)
     │   3. Store mapping: local_id → media_id Meta
     │   4. Return { media_id: "meta-id-xxx" }
     │
     └─ Agent sends:
        POST /api/v1/messages/send
        { type: "image", content: { "id": "meta-id-xxx", "caption": "..." } }
```

## API Endpoints

```
GET  /api/v1/media/:mediaID          → Proxy download dari Meta (or redirect)
POST /api/v1/media/upload            → Upload ke Meta, return media_id
```

## Media Type Mapping

| Extension | MIME Type | WhatsApp Type |
|-----------|-----------|---------------|
| .jpg, .jpeg | image/jpeg | image |
| .png | image/png | image |
| .mp4 | video/mp4 | video |
| .pdf | application/pdf | document |
| .doc, .docx | application/msword | document |
| .mp3, .aac | audio/mpeg | audio |
| .webp | image/webp | sticker |

## Limitations (WhatsApp Cloud API)

| Type | Max Size |
|------|----------|
| Image | 5 MB |
| Video | 16 MB |
| Audio | 16 MB |
| Document | 100 MB |
| Sticker | 100 KB |

## Local Caching Strategy

```
Media dari Meta → Download via API Meta
                → Simpan di disk local (/data/media/{media_id})
                → Serve dari local untuk akses berikutnya
                → Cache eviction: 7 days (atau based on disk usage)
```

Why cache? Meta media URL memiliki expiry. Dengan cache local, media tetap bisa diakses kapan saja tanpa perlu download ulang.

## Database

```sql
CREATE TABLE media_cache (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    media_id    VARCHAR(100) UNIQUE NOT NULL,
    mime_type   VARCHAR(50) NOT NULL,
    file_size   INT NOT NULL,
    local_path  VARCHAR(500) NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT now()
);
```

## Key Points
- Inbound media hanya bawa `media_id` — URL didapat via `GetMediaURL()`
- Cache media local untuk menghindari expiry URL dari Meta
- Upload harus handled sebagai multipart/form-data
- Media yang diterima dari customer langsung siap di-render tanpa download dari Meta (cukup display info + loading indicator)
- Click-to-download untuk menghindari bandwidth tidak perlu
