package config

import (
	"log/slog"
	"os"
	"strconv"
)

type Config struct {
	DatabaseURL string
	RedisURL    string
	WABAToken   string
	WABAID      string
	JWTSecret   string
	Port        string
	LogLevel    string
	LogFormat   string
	MediaDir    string
}

func Load() *Config {
	return &Config{
		DatabaseURL: getEnv("DATABASE_URL", "postgres://wa_user:wa_pass@localhost:5432/wa_center?sslmode=disable"),
		RedisURL:    getEnv("REDIS_URL", "redis://localhost:6379/0"),
		WABAToken:   os.Getenv("WABA_TOKEN"),
		WABAID:      getEnv("WABA_ID", ""),
		JWTSecret:   getEnv("JWT_SECRET", "change-me-in-production-use-256-bit-key"),
		Port:        getEnv("PORT", "8080"),
		LogLevel:    getEnv("LOG_LEVEL", "debug"),
		LogFormat:   getEnv("LOG_FORMAT", "json"),
		MediaDir:    getEnv("MEDIA_CACHE_DIR", "./data/media"),
	}
}

func InitLogger(cfg *Config) {
	var l slog.Level
	switch cfg.LogLevel {
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

	var h slog.Handler
	if cfg.LogFormat == "text" {
		h = slog.NewTextHandler(os.Stdout, opts)
	} else {
		h = slog.NewJSONHandler(os.Stdout, opts)
	}
	slog.SetDefault(slog.New(h))
}

func getEnv(key, fallback string) string {
	if v, ok := os.LookupEnv(key); ok && v != "" {
		return v
	}
	return fallback
}

func getEnvInt(key string, fallback int) int {
	if v, ok := os.LookupEnv(key); ok && v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			return n
		}
	}
	return fallback
}
