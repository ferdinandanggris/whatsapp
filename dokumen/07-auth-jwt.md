# Authentication & JWT

## Login Flow

```
Client                                    Backend
  │                                         │
  │  POST /api/v1/auth/login               │
  │  { email, password }                   │
  │ ─────────────────────────────────────> │
  │                                         │
  │                               Validate credentials
  │                               SELECT FROM users
  │                               WHERE email=? AND is_active=true
  │                                         │
  │                               Compare bcrypt hash
  │                                         │
  │                               Generate JWT (access + refresh)
  │                                         │
  │  { access_token, refresh_token, user }  │
  │ <───────────────────────────────────── │
```

## JWT Claims

```go
type Claims struct {
    UserID    string `json:"user_id"`
    Email     string `json:"email"`
    Role      string `json:"role"`
    CompanyID *int64 `json:"company_id"` // nil if super_admin
    jwt.RegisteredClaims
}
```

## Token Lifetimes

| Token | Lifetime | Usage |
|-------|----------|-------|
| Access Token | 15 minutes | API requests + WS connection |
| Refresh Token | 7 days | Get new access token |

## API Endpoints

```
POST /api/v1/auth/login     → { access_token, refresh_token, user }
POST /api/v1/auth/refresh   → { access_token } (with refresh_token in body)
POST /api/v1/auth/logout    → Invalidate refresh token (optional, server-side)
```

## Middleware

```go
func AuthMiddleware(jwtSecret string) func(http.Handler) http.Handler {
    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            token := extractBearerToken(r)
            if token == "" {
                http.Error(w, "unauthorized", 401)
                return
            }

            claims := &Claims{}
            parsed, err := jwt.ParseWithClaims(token, claims, func(t *jwt.Token) (interface{}, error) {
                return []byte(jwtSecret), nil
            })

            if err != nil || !parsed.Valid {
                http.Error(w, "invalid token", 401)
                return
            }

            ctx := context.WithValue(r.Context(), "user", claims)
            next.ServeHTTP(w, r.WithContext(ctx))
        })
    }
}
```

## Password Handling

```go
// Register (only super_admin can create users)
hash, _ := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)

// Login
err := bcrypt.CompareHashAndPassword(user.PasswordHash, []byte(password))
```

## Security Notes

- JWT secret dari environment variable (`JWT_SECRET`), minimal 256-bit
- Gunakan `jwt.SigningMethodHS256`
- Refresh token disimpan di database (allow server-side revocation)
- Rate limiter di endpoint login: max 5 attempts per email per menit
- WebSocket connection: validasi JWT di query string, sama seperti REST
- Jangan pernah expose password di response/log
- Password minimum 8 karakter

## WebSocket Token

WebSocket menggunakan JWT di query string karena WebSocket API browser tidak support custom headers:

```
ws://host:port/api/v1/ws?token=<access_token>
```

Validasi token dilakukan di middleware WebSocket handler (sama dengan HTTP middleware).
