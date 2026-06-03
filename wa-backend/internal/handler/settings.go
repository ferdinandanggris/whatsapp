package handler

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/ferdinandanggris/wa-backend/internal/config"
	"github.com/ferdinandanggris/wa-backend/internal/middleware"
	"github.com/ferdinandanggris/wa-backend/internal/repository"
)

// SettingsReloadFn is called after a setting is saved to DB.
// Return error for a warning in the API response (setting still saved).
type SettingsReloadFn func(ctx context.Context, name, value string) error

type SettingsHandler struct {
	repo   *repository.SettingsRepository
	cfg    *config.Config
	reload SettingsReloadFn
}

func NewSettingsHandler(repo *repository.SettingsRepository, cfg *config.Config, reload SettingsReloadFn) *SettingsHandler {
	return &SettingsHandler{repo: repo, cfg: cfg, reload: reload}
}

func (h *SettingsHandler) GetSettings(w http.ResponseWriter, r *http.Request) {
	settings, err := h.repo.GetAll(r.Context())
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to load settings")
		return
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{"data": settings})
}

func (h *SettingsHandler) UpdateSettings(w http.ResponseWriter, r *http.Request) {
	var payload map[string]string
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if len(payload) == 0 {
		writeError(w, http.StatusBadRequest, "at least one setting required")
		return
	}

	claims := middleware.GetClaims(r.Context())
	var warnings []string

	for name, value := range payload {
		if err := h.repo.Upsert(r.Context(), name, value, &claims.UserID); err != nil {
			writeError(w, http.StatusInternalServerError, "failed to update settings")
			return
		}
		h.cfg.Override(name, value)

		if h.reload != nil {
			if err := h.reload(r.Context(), name, value); err != nil {
				warnings = append(warnings, fmt.Sprintf("%s: %s", name, err.Error()))
			}
		}
	}

	settings, err := h.repo.GetAll(r.Context())
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to reload settings")
		return
	}

	resp := map[string]interface{}{"data": settings}
	if len(warnings) > 0 {
		resp["warnings"] = warnings
	}
	writeJSON(w, http.StatusOK, resp)
}
