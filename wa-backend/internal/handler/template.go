package handler

import (
	"encoding/json"
	"net/http"

	"github.com/ferdinandanggris/wa-backend/internal/model"
	"github.com/ferdinandanggris/wa-backend/internal/repository"
	"github.com/ferdinandanggris/wa-backend/internal/service"
)

type TemplateHandler struct {
	svc    *service.TemplateService
	repo   *repository.TemplateRepository
	wabaID string
}

func NewTemplateHandler(svc *service.TemplateService, repo *repository.TemplateRepository, wabaID string) *TemplateHandler {
	return &TemplateHandler{svc: svc, repo: repo, wabaID: wabaID}
}

func (h *TemplateHandler) List(w http.ResponseWriter, r *http.Request) {
	category := r.URL.Query().Get("category")
	tpls, err := h.repo.List(r.Context(), category)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to list templates")
		return
	}
	if tpls == nil {
		tpls = []*model.Template{}
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{"data": tpls})
}

func (h *TemplateHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		writeError(w, http.StatusBadRequest, "id required")
		return
	}
	tpl, err := h.repo.GetByID(r.Context(), id)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to get template")
		return
	}
	if tpl == nil {
		writeError(w, http.StatusNotFound, "template not found")
		return
	}
	writeJSON(w, http.StatusOK, tpl)
}

func (h *TemplateHandler) Sync(w http.ResponseWriter, r *http.Request) {
	res, err := h.svc.Sync(r.Context(), h.wabaID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, res)
}

func (h *TemplateHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req service.CreateTemplateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if req.Name == "" || req.Category == "" || req.Language == "" {
		writeError(w, http.StatusBadRequest, "name, category, language required")
		return
	}

	tpl, err := h.svc.Create(r.Context(), h.wabaID, req)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	writeJSON(w, http.StatusCreated, tpl)
}

func (h *TemplateHandler) Update(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		writeError(w, http.StatusBadRequest, "id required")
		return
	}

	var req service.UpdateTemplateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	tpl, err := h.svc.Update(r.Context(), id, req)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, tpl)
}

func (h *TemplateHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		writeError(w, http.StatusBadRequest, "id required")
		return
	}

	if err := h.svc.Delete(r.Context(), id); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"message": "deleted"})
}
