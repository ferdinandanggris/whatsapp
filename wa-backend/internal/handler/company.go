package handler

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"strconv"

	"github.com/ferdinandanggris/wa-backend/internal/middleware"
	"github.com/ferdinandanggris/wa-backend/internal/repository"
)

type CompanyHandler struct {
	repo *repository.CompanyRepository
}

func NewCompanyHandler(repo *repository.CompanyRepository) *CompanyHandler {
	return &CompanyHandler{repo: repo}
}

type createCompanyRequest struct {
	Name string `json:"name"`
}

type updateCompanyRequest struct {
	Name string `json:"name"`
}

func (h *CompanyHandler) List(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r.Context())

	// company_admin only sees their own company
	if claims.Role != "super_admin" {
		if claims.CompanyID == nil {
			writeError(w, http.StatusForbidden, "no company assigned")
			return
		}
		c, err := h.repo.GetByID(r.Context(), *claims.CompanyID)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "failed to get company")
			return
		}
		writeJSON(w, http.StatusOK, map[string]interface{}{"data": []interface{}{c}})
		return
	}

	companies, err := h.repo.List(r.Context())
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to list companies")
		return
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{"data": companies})
}

func (h *CompanyHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid company id")
		return
	}

	claims := middleware.GetClaims(r.Context())
	if claims.Role != "super_admin" {
		if claims.CompanyID == nil || *claims.CompanyID != id {
			writeError(w, http.StatusForbidden, "access denied")
			return
		}
	}

	c, err := h.repo.GetByID(r.Context(), id)
	if err != nil {
		writeError(w, http.StatusNotFound, "company not found")
		return
	}
	writeJSON(w, http.StatusOK, c)
}

func (h *CompanyHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req createCompanyRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if req.Name == "" {
		writeError(w, http.StatusBadRequest, "name is required")
		return
	}

	id, err := h.repo.Create(r.Context(), req.Name)
	if err != nil {
		slog.Error("create company", "error", err)
		writeError(w, http.StatusInternalServerError, "failed to create company")
		return
	}

	c, err := h.repo.GetByID(r.Context(), id)
	if err != nil {
		slog.Error("get created company", "id", id, "error", err)
		writeError(w, http.StatusInternalServerError, "failed to get created company")
		return
	}
	writeJSON(w, http.StatusCreated, c)
}

func (h *CompanyHandler) Update(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid company id")
		return
	}

	claims := middleware.GetClaims(r.Context())
	if claims.Role != "super_admin" {
		if claims.CompanyID == nil || *claims.CompanyID != id {
			writeError(w, http.StatusForbidden, "access denied")
			return
		}
	}

	var req updateCompanyRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if req.Name == "" {
		writeError(w, http.StatusBadRequest, "name is required")
		return
	}

	if err := h.repo.Update(r.Context(), id, req.Name); err != nil {
		slog.Error("update company", "id", id, "error", err)
		writeError(w, http.StatusInternalServerError, "failed to update company")
		return
	}

	c, err := h.repo.GetByID(r.Context(), id)
	if err != nil {
		slog.Error("get updated company", "id", id, "error", err)
		writeError(w, http.StatusInternalServerError, "failed to get updated company")
		return
	}
	writeJSON(w, http.StatusOK, c)
}

func (h *CompanyHandler) Delete(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid company id")
		return
	}

	if err := h.repo.Delete(r.Context(), id); err != nil {
		slog.Error("delete company", "id", id, "error", err)
		writeError(w, http.StatusInternalServerError, "failed to delete company")
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "deleted"})
}
