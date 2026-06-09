package main

import (
	"context"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	chicors "github.com/go-chi/cors"
	chimw "github.com/go-chi/chi/v5/middleware"

	"github.com/ferdinandanggris/wa-backend/internal/config"
	"github.com/ferdinandanggris/wa-backend/internal/handler"
	"github.com/ferdinandanggris/wa-backend/internal/middleware"
	"github.com/ferdinandanggris/wa-backend/internal/repository"
	"github.com/ferdinandanggris/wa-backend/internal/service"
	"github.com/ferdinandanggris/wa-backend/internal/webhook"
	"github.com/ferdinandanggris/wa-backend/internal/ws"
	wapicloud "github.com/ferdinandanggris/wapi/cloud"
)

func main() {
	cfg := config.Load()
	config.InitLogger(cfg)

	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	pool, err := repository.NewPool(ctx, cfg.DatabaseURL)
	if err != nil {
		slog.Error("failed to connect to database", "error", err)
		os.Exit(1)
	}
	defer pool.Close()
	slog.Info("connected to database")

	if err := repository.RunMigrations(ctx, pool); err != nil {
		slog.Error("failed to run migrations", "error", err)
		os.Exit(1)
	}
	slog.Info("migrations complete")

	settingsRepo := repository.NewSettingsRepository(pool)
	companyRepo := repository.NewCompanyRepository(pool)

	// Override .env config from DB settings (api_key, waba_id, app_secret, etc.)
	overrideConfigFromDB(ctx, cfg, settingsRepo)

	userRepo := repository.NewUserRepository(pool)
	contactRepo := repository.NewContactRepository(pool)
	msgRepo := repository.NewMessageRepository(pool)
	convRepo := repository.NewConversationRepository(pool)
	tplRepo := repository.NewTemplateRepository(pool)
	mediaRepo := repository.NewMediaRepository(pool)
	authSvc := service.NewAuthService(userRepo, cfg)

	hub := ws.NewHub()
	go hub.Run()

	wapiClient := wapicloud.New(wapicloud.WithAccessToken(cfg.WABAToken))

	windowSvc := service.NewWindowService(contactRepo)
	whatsappSvc := service.NewWhatsAppService(wapiClient, msgRepo, convRepo, contactRepo, tplRepo, windowSvc, hub)
	tplSvc := service.NewTemplateService(tplRepo, wapiClient, cfg.WABAToken, cfg.WABAID)
	mediaSvc := service.NewMediaService(mediaRepo, wapiClient, cfg.WABAToken, cfg.MediaDir)

	authHandler := handler.NewAuthHandler(authSvc, userRepo)
	userHandler := handler.NewUserHandler(userRepo)
	convHandler := handler.NewConversationHandler(contactRepo, convRepo, msgRepo, whatsappSvc)
	wsHandler := handler.NewWSHandler(hub, authSvc)
	msgHandler := handler.NewMessageHandler(whatsappSvc, msgRepo)
	tplHandler := handler.NewTemplateHandler(tplSvc, tplRepo, cfg.WABAID)
	mediaHandler := handler.NewMediaHandler(mediaSvc)
	contactHandler := handler.NewContactHandler(contactRepo)
	phoneHandler := handler.NewPhoneHandler(repository.NewPhoneRepository(pool), mediaRepo, wapiClient, cfg.AppID, cfg.MediaDir)
	typingHandler := handler.NewTypingHandler(hub, convRepo)
	webhookOverrideHandler := handler.NewWebhookOverrideHandler(wapiClient, cfg.WABAID, cfg.WebhookVerifyToken)
	companyHandler := handler.NewCompanyHandler(companyRepo)

	wh := &webhook.Handler{
		VerifyToken: cfg.WebhookVerifyToken,
		AppSecret:   cfg.AppSecret,
		Contacts:    contactRepo,
		Messages:    msgRepo,
		Convs:       convRepo,
		Hub:         hub,
	}

	settingsHandler := handler.NewSettingsHandler(settingsRepo, cfg, func(ctx context.Context, name, value string) error {
		switch name {
		case "api_key":
			wapiClient.SetAccessToken(value)
			slog.Info("settings runtime reload", "setting", "api_key")
		case "app_secret":
			wh.AppSecret = value
			slog.Info("settings runtime reload", "setting", "app_secret")
		case "webhook_verify_token":
			wh.VerifyToken = value
			slog.Info("settings runtime reload", "setting", "webhook_verify_token")
		case "webhook_url":
			subCtx, cancel := context.WithTimeout(ctx, 15*time.Second)
			defer cancel()
			_, err := wapiClient.SetWebhookOverride(subCtx, cfg.WABAID, value, cfg.WebhookVerifyToken)
			if err != nil {
				slog.Error("webhook subscription failed", "url", value, "error", err)
				return fmt.Errorf("webhook subscription failed: %w", err)
			}
			slog.Info("webhook subscription updated", "url", value)
		}
		return nil
	})

	r := chi.NewRouter()
	r.Use(chimw.RequestID)
	r.Use(chimw.RealIP)
	r.Use(requestLogger)
	r.Use(chimw.Recoverer)
	r.Use(chicors.Handler(chicors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: false,
		MaxAge:           300,
	}))
	r.Use(chimw.Timeout(30 * time.Second))

	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"status":"ok"}`))
	})

	r.Handle("/webhook", wh)
	r.Get("/ws", wsHandler.ServeHTTP)

	r.Route("/api/v1", func(r chi.Router) {
		r.Post("/auth/login", authHandler.Login)
		r.Post("/auth/refresh", authHandler.Refresh)
		r.Post("/auth/setup", authHandler.Setup)
		r.Get("/media/{mediaID}", mediaHandler.Serve)

		r.Group(func(r chi.Router) {
			r.Use(middleware.Auth(authSvc))
			r.Get("/auth/me", authHandler.Me)
			r.Get("/conversations", convHandler.List)
			r.Get("/conversations/{id}", convHandler.GetByID)
			r.Patch("/conversations/{id}/read", convHandler.MarkRead)
			r.Get("/conversations/{id}/messages", convHandler.ListMessages)
			r.Post("/messages", msgHandler.Send)
			r.Post("/messages/reaction", msgHandler.SendReaction)
			r.Get("/messages/{wamid}", msgHandler.GetByWAMID)
			r.Get("/templates", tplHandler.List)
			r.Get("/templates/{id}", tplHandler.GetByID)
			r.Post("/media/upload", mediaHandler.Upload)
			r.Get("/phone-numbers", phoneHandler.List)
			r.Get("/phone-numbers/{id}", phoneHandler.Get)
			r.Get("/contacts", contactHandler.List)
			r.Get("/contacts/{waID}", contactHandler.Get)
			r.Patch("/contacts/{waID}", contactHandler.Update)
			r.Post("/contacts/{waID}/block", contactHandler.Block)
			r.Post("/contacts/{waID}/unblock", contactHandler.Unblock)
			r.Post("/typing", typingHandler.Send)

			r.Group(func(r chi.Router) {
				r.Use(middleware.RequireRole("super_admin", "company_admin"))
				r.Get("/users", userHandler.List)
				r.Post("/users", userHandler.Create)
				r.Put("/users/{id}", userHandler.Update)
				r.Patch("/users/{id}/deactivate", userHandler.Deactivate)
				r.Post("/users/{id}/reset-password", userHandler.ResetPassword)
				r.Put("/phone-numbers/{id}", phoneHandler.Update)
				r.Post("/phone-numbers/{id}/sync-profile", phoneHandler.SyncProfile)
				r.Post("/phone-numbers/{id}/profile-picture", phoneHandler.UploadPicture)
				r.Post("/templates/sync", tplHandler.Sync)
				r.Post("/templates", tplHandler.Create)
				r.Put("/templates/{id}", tplHandler.Update)
				r.Delete("/templates/{id}", tplHandler.Delete)
			})

			// Companies — authenticated
			r.Get("/companies", companyHandler.List)
			r.Get("/companies/{id}", companyHandler.GetByID)
			r.Put("/companies/{id}", companyHandler.Update)

			r.Group(func(r chi.Router) {
				r.Use(middleware.RequireRole("super_admin"))
				r.Get("/webhook/override", webhookOverrideHandler.Get)
				r.Post("/webhook/override", webhookOverrideHandler.Set)
				r.Delete("/webhook/override", webhookOverrideHandler.Remove)
				r.Get("/settings", settingsHandler.GetSettings)
				r.Put("/settings", settingsHandler.UpdateSettings)
				r.Post("/companies", companyHandler.Create)
				r.Delete("/companies/{id}", companyHandler.Delete)
			})
		})
	})

	srv := &http.Server{
		Addr:         fmt.Sprintf(":%s", cfg.Port),
		Handler:      r,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		slog.Info("server starting", "port", cfg.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			slog.Error("server error", "error", err)
			os.Exit(1)
		}
	}()

	<-quit
	slog.Info("shutting down...")

	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer shutdownCancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		slog.Error("server forced to shutdown", "error", err)
	}

	slog.Info("server stopped")
}

func overrideConfigFromDB(ctx context.Context, cfg *config.Config, repo *repository.SettingsRepository) {
	settings, err := repo.GetAll(ctx)
	if err != nil {
		slog.Warn("could not load settings from DB, using .env defaults", "error", err)
		return
	}

	overridden := 0
	for _, s := range settings {
		if cfg.Override(s.Name, s.Value) {
			slog.Info("config overridden from DB", "setting", s.Name)
			overridden++
		}
	}
	if overridden > 0 {
		slog.Info("config overridden from settings table", "count", overridden)
	} else {
		slog.Info("no config overrides from settings table")
	}
}

func requestLogger(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		ww := chimw.NewWrapResponseWriter(w, r.ProtoMajor)
		next.ServeHTTP(ww, r)
		slog.Info("request",
			"method", r.Method,
			"path", r.URL.Path,
			"status", ww.Status(),
			"duration", time.Since(start).String(),
			"request_id", chimw.GetReqID(r.Context()),
		)
	})
}
