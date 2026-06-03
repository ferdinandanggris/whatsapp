package config

import (
	"bufio"
	"log/slog"
	"os"
	"strconv"
	"strings"
)

func init() {
	loadEnvFile(".env")
}

func loadEnvFile(path string) {
	f, err := os.Open(path)
	if err != nil {
		return
	}
	defer f.Close()

	scanner := bufio.NewScanner(f)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		parts := strings.SplitN(line, "=", 2)
		if len(parts) != 2 {
			continue
		}
		key := strings.TrimSpace(parts[0])
		val := strings.TrimSpace(parts[1])
		if os.Getenv(key) == "" {
			os.Setenv(key, val)
		}
	}
}

type Config struct {
	DatabaseURL       string
	RedisURL          string
	WABAToken         string
	WABAID            string
	JWTSecret         string
	Port              string
	LogLevel          string
	LogFormat         string
	MediaDir          string
	WebhookVerifyToken string
	AppSecret          string
}

// Override sets a config field from a settings key-value pair.
// Returns true if the name was recognized.
func (c *Config) Override(name, value string) bool {
	if value == "" {
		return false
	}
	switch name {
	case "api_key":
		c.WABAToken = value
		return true
	case "waba_id":
		c.WABAID = value
		return true
	case "app_secret":
		c.AppSecret = value
		return true
	case "webhook_verify_token":
		c.WebhookVerifyToken = value
		return true
	default:
		return false
	}
}

func Load() *Config {
	return &Config{
		DatabaseURL:        getEnv("DATABASE_URL", "postgres://wa_user:wa_pass@localhost:5432/wa_center?sslmode=disable"),
		RedisURL:           getEnv("REDIS_URL", "redis://localhost:6379/0"),
		WABAToken:          os.Getenv("WABA_TOKEN"),
		WABAID:             getEnv("WABA_ID", ""),
		JWTSecret:          getEnv("JWT_SECRET", "change-me-in-production-use-256-bit-key"),
		Port:               getEnv("PORT", "8080"),
		LogLevel:           getEnv("LOG_LEVEL", "debug"),
		LogFormat:          getEnv("LOG_FORMAT", "json"),
		MediaDir:           getEnv("MEDIA_CACHE_DIR", "./data/media"),
		WebhookVerifyToken: getEnv("WEBHOOK_VERIFY_TOKEN", "verify_token"),
		AppSecret:          getEnv("APP_SECRET", ""),
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
