module github.com/ferdinandanggris/wa-backend

go 1.25.0

require (
	github.com/ferdinandanggris/wapi v0.0.0-00010101000000-000000000000
	github.com/go-chi/chi/v5 v5.2.1
	github.com/golang-jwt/jwt/v5 v5.2.1
	github.com/jackc/pgx/v5 v5.7.1
	golang.org/x/crypto v0.28.0
)

require (
	github.com/gorilla/websocket v1.5.3 // indirect
	github.com/jackc/pgpassfile v1.0.0 // indirect
	github.com/jackc/pgservicefile v0.0.0-20240606120523-5a60cdf6a761 // indirect
	github.com/jackc/puddle/v2 v2.2.2 // indirect
	golang.org/x/sync v0.20.0 // indirect
	golang.org/x/text v0.21.0 // indirect
)

replace github.com/ferdinandanggris/wapi => ../../wapi-lib
