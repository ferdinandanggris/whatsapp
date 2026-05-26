# Logging Strategy — Structured Logging with slog

## Rationale

Gunakan `log/slog` (Go 1.21+ standard library) karena:
- Zero external dependency
- Structured JSON output by default
- Level-based logging (Debug, Info, Warn, Error)
- Context-aware (add request-scoped fields)
- Performa tinggi (optimized by Go team)

## Setup

```go
package config

import (
    "log/slog"
    "os"
)

func InitLogger(level, format string) {
    var l slog.Level
    switch level {
    case "debug":
        l = slog.LevelDebug
    case "info":
        l = slog.LevelInfo
    case "warn":
        l = slog.LevelWarn
    case "error":
        l = slog.LevelError
    default:
        l = slog.LevelInfo
    }

    opts := &slog.HandlerOptions{Level: l}

    var handler slog.Handler
    if format == "text" {
        handler = slog.NewTextHandler(os.Stdout, opts)
    } else {
        handler = slog.NewJSONHandler(os.Stdout, opts)
    }

    slog.SetDefault(slog.New(handler))
}
```

## Context Fields

Setiap request harus punya context fields yang konsisten:

```go
// Middleware: inject request-scoped fields
func LoggingMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        ctx := r.Context()

        // Always present
        logger := slog.With(
            "request_id", r.Header.Get("X-Request-ID"),
            "method", r.Method,
            "path", r.URL.Path,
            "remote_addr", r.RemoteAddr,
        )

        // If user authenticated
        if user, ok := ctx.Value("user").(*Claims); ok {
            logger = logger.With(
                "user_id", user.UserID,
                "role", user.Role,
            )
        }

        ctx = slog.NewContext(ctx, logger)
        next.ServeHTTP(w, r.WithContext(ctx))
    })
}
```

## Log Levels Per Layer

| Layer | Default Level | When |
|-------|---------------|------|
| HTTP Handler | Info | Every request (method, path, status, duration) |
| Repository | Debug | SQL queries (only in dev) |
| Webhook receiver | Info | Inbound message received |
| WebSocket Hub | Debug | Connect/disconnect events |
| Worker/Queue | Warn | Queue full, retry attempts |
| wapi-lib calls | Info | SendMessage success/failure |
| Error boundary | Error | Panics, unexpected errors |

## Example Output

```json
// Inbound message received
{
  "time": "2026-05-26T10:00:00Z",
  "level": "INFO",
  "msg": "inbound message received",
  "request_id": "req-xxx",
  "wamid": "wamid.abc123",
  "from": "6281234567890",
  "phone_number_id": "1001",
  "type": "text",
  "company_id": 1
}

// Send message success
{
  "time": "2026-05-26T10:01:00Z",
  "level": "INFO",
  "msg": "message sent",
  "wamid": "wamid.def456",
  "to": "6281234567890",
  "phone_number_id": "1001",
  "type": "text",
  "agent_id": "uuid-xxx",
  "duration_ms": 245
}

// Rate limit warning
{
  "time": "2026-05-26T10:02:00Z",
  "level": "WARN",
  "msg": "rate limit approaching",
  "phone_number_id": "1001",
  "current_tps": 75,
  "max_tps": 80
}

// Error
{
  "time": "2026-05-26T10:03:00Z",
  "level": "ERROR",
  "msg": "send message failed",
  "error": "API error 130429: rate limit hit",
  "wamid": "",
  "phone_number_id": "1001",
  "retry_count": 3,
  "stack": "..."
}
```

## Logging in Repositories

```go
func (r *Repository) SaveMessage(ctx context.Context, msg *model.Message) (*model.Message, error) {
    logger := slog.FromContext(ctx)
    logger.Debug("saving message",
        "wamid", msg.WamID,
        "direction", msg.Direction,
    )

    query := `INSERT INTO messages (...) VALUES (...) RETURNING *`
    // ... execute query

    if err != nil {
        logger.Error("failed to save message",
            "error", err,
        )
        return nil, err
    }

    return msg, nil
}
```

## Sensitive Data — Jangan Log

```
✗ Password (hash punya)
✗ Token / JWT
✗ App Secret
✗ PIN
✗ Personal Identifiable Information (PII) yang tidak perlu
```

## Log Rotation (Production)

Di production, stdout + Docker/Systemd handle rotation:

```
docker logs → AWS CloudWatch / Grafana Loki / ELK
systemd → journald → rsyslog
```

Jika non-Docker: gunakan `logrotate` untuk file log.
