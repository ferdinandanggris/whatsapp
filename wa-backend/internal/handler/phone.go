package handler

import (
	"net/http"

	"github.com/ferdinandanggris/wa-backend/internal/middleware"
	"github.com/ferdinandanggris/wa-backend/internal/repository"
)

type PhoneHandler struct {
	repo *repository.PhoneRepository
}

func NewPhoneHandler(repo *repository.PhoneRepository) *PhoneHandler {
	return &PhoneHandler{repo: repo}
}

func (h *PhoneHandler) List(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r.Context())
	if claims == nil {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	companyID := claims.CompanyID
	if claims.Role != "super_admin" && claims.Role != "company_admin" && claims.Role != "agent" {
		writeError(w, http.StatusForbidden, "no access")
		return
	}
	if claims.Role == "super_admin" {
		companyID = nil
	}

	phones, err := h.repo.ListByCompany(r.Context(), companyID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	if phones == nil {
		phones = []*repository.PhoneNumber{}
	}

	writeJSON(w, http.StatusOK, phones)
}
