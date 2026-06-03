package handler

import (
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
