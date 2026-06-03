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
	whatsappSvc := service.NewWhatsAppService(wapiClient, msgRepo, convRepo, contactRepo, windowSvc, hub)
	tplSvc := service.NewTemplateService(tplRepo, wapiClient, cfg.WABAToken, cfg.WABAID)
	mediaSvc := service.NewMediaService(mediaRepo, wapiClient, cfg.WABAToken, cfg.MediaDir)

	settingsRepo := repository.NewSettingsRepository(pool)
	companyRepo := repository.NewCompanyRepository(pool)

	authHandler := handler.NewAuthHandler(authSvc, userRepo)
	userHandler := handler.NewUserHandler(userRepo)
	convHandler := handler.NewConversationHandler(contactRepo, convRepo, msgRepo, whatsappSvc)
	wsHandler := handler.NewWSHandler(hub, authSvc)
	msgHandler := handler.NewMessageHandler(whatsappSvc, msgRepo)
	tplHandler := handler.NewTemplateHandler(tplSvc, tplRepo, cfg.WABAID)
	mediaHandler := handler.NewMediaHandler(mediaSvc)
	contactHandler := handler.NewContactHandler(contactRepo)
	phoneHandler := handler.NewPhoneHandler(repository.NewPhoneRepository(pool))
	typingHandler := handler.NewTypingHandler(hub)
	webhookOverrideHandler := handler.NewWebhookOverrideHandler(wapiClient, cfg.WABAID, cfg.WebhookVerifyToken)
	settingsHandler := handler.NewSettingsHandler(settingsRepo)
	companyHandler := handler.NewCompanyHandler(companyRepo)

	wh := &webhook.Handler{
		VerifyToken: cfg.WebhookVerifyToken,
		AppSecret:   cfg.AppSecret,
		Contacts:    contactRepo,
		Messages:    msgRepo,
		Convs:       convRepo,
		Hub:         hub,
	}

	r := chi.NewRouter()
	r.Use(chimw.RequestID)
	r.Use(chimw.RealIP)
	r.Use(requestLogger)
	r.Use(chimw.Recoverer)
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
				r.Patch("/users/{id}/deactivate", userHandler.Deactivate)
				r.Post("/templates/sync", tplHandler.Sync)
				r.Post("/templates", tplHandler.Create)
				r.Put("/templates/{id}", tplHandler.Update)
				r.Delete("/templates/{id}", tplHandler.Delete)
			})

			r.Group(func(r chi.Router) {
				r.Use(middleware.RequireRole("super_admin"))
				r.Get("/webhook/override", webhookOverrideHandler.Get)
				r.Post("/webhook/override", webhookOverrideHandler.Set)
				r.Delete("/webhook/override", webhookOverrideHandler.Remove)
				r.Get("/settings", settingsHandler.GetSettings)
				r.Put("/settings", settingsHandler.UpdateSettings)
			})

			// Companies — super_admin sees all, company_admin sees own
			r.Get("/companies", companyHandler.List)
			r.Get("/companies/{id}", companyHandler.GetByID)
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
