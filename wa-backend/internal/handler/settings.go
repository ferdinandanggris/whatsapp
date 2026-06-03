package handler

import (
	"encoding/json"
	"net/http"

	"github.com/ferdinandanggris/wa-backend/internal/middleware"
	"github.com/ferdinandanggris/wa-backend/internal/repository"
)

type SettingsHandler struct {
	repo *repository.SettingsRepository
}

func NewSettingsHandler(repo *repository.SettingsRepository) *SettingsHandler {
	return &SettingsHandler{repo: repo}
}

func (h *SettingsHandler) GetSettings(w http.ResponseWriter, r *http.Request) {
	settings, err := h.repo.GetAll(r.Context())
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to load settings")
		return
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{"data": settings})
}

type updateSettingsValue struct {
	Value string `json:"value"`
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

	for name, value := range payload {
		if err := h.repo.Upsert(r.Context(), name, value, &claims.UserID); err != nil {
			writeError(w, http.StatusInternalServerError, "failed to update settings")
			return
		}
	}

	settings, err := h.repo.GetAll(r.Context())
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to reload settings")
		return
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{"data": settings})
}
