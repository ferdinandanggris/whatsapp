# Development Environment

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Go | 1.22+ | Backend |
| Node.js | 20+ | Frontend |
| Docker | 24+ | PostgreSQL, Redis |
| .NET SDK | 8.0 | WinForm desktop |
| Ngrok | Latest | Webhook tunnel |
| Air | Latest | Go hot reload |

## Folder Structure

```
/mnt/d/project/whatsapp/
├── wa-backend/        # Go backend
├── wa-frontend/       # React + Vite
├── wa-desktop/        # WinForm WebView2
├── wapi-lib/          # Go library (local replace)
└── dokumen/           # PRD & workflows
```

## Docker Compose

```yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: wa_center
      POSTGRES_USER: wa_user
      POSTGRES_PASSWORD: wa_pass
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  pgdata:
```

```bash
docker compose up -d
```

## Backend Environment (.env)

```bash
# Database
DATABASE_URL=postgres://wa_user:wa_pass@localhost:5432/wa_center?sslmode=disable

# Redis
REDIS_URL=redis://localhost:6379/0

# WhatsApp
WABA_TOKEN=EAAT...
WABA_ID=1161653909380123

# JWT
JWT_SECRET=your-256-bit-secret-key-change-in-production

# Server
PORT=8080

# Logging
LOG_LEVEL=debug
LOG_FORMAT=json

# Media cache
MEDIA_CACHE_DIR=./data/media
```

## Air Config (Hot Reload)

```yaml
# .air.toml
root = "."
tmp_dir = "tmp"

[build]
  cmd = "go build -o ./tmp/server ./cmd/server"
  bin = "./tmp/server"
  include_ext = ["go", "env", "tpl", "tmpl", "html"]
  exclude_dir = ["tmp", "vendor", "data"]
```

## Frontend Dev

```bash
cd wa-frontend
npm install
npm run dev
# → http://localhost:5173

# Vite proxy to backend
# vite.config.ts
server: {
  proxy: {
    '/api': 'http://localhost:8080',
    '/ws': { target: 'ws://localhost:8080', ws: true }
  }
}
```

## Ngrok (Webhook Tunnel)

```bash
ngrok http 8080
# → https://abc123.ngrok-free.app

# Set this URL as webhook callback in Meta:
# https://abc123.ngrok-free.app/webhook
```

## Run Backend

```bash
cd wa-backend

# With Air (hot reload)
air

# Without Air
go run ./cmd/server
```

## Tips

- Gunakan `make` commands untuk shortcut (defined di Makefile)
- Migrations jalan otomatis di startup (`go-migrate` or manual SQL)
- Jangan commit `.env` (sudah di `.gitignore`)
- Ngrok URL berubah setiap restart — update di Meta App dashboard
- Untuk development CSS/UI cepat, bisa mock data di Zustand store tanpa backend
