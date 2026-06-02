package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/ferdinandanggris/wa-backend/internal/middleware"
	"github.com/ferdinandanggris/wa-backend/internal/model"
	"github.com/ferdinandanggris/wa-backend/internal/repository"
)

type ContactHandler struct {
	repo *repository.ContactRepository
}

func NewContactHandler(repo *repository.ContactRepository) *ContactHandler {
	return &ContactHandler{repo: repo}
}

func (h *ContactHandler) List(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r.Context())
	if claims == nil {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	q := r.URL.Query().Get("q")
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	if page < 1 {
		page = 1
	}
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if limit < 1 || limit > 100 {
		limit = 20
	}

	contacts, total, err := h.repo.List(r.Context(), claims.CompanyID, q, page, limit)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	if contacts == nil {
		contacts = []*model.Contact{}
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"data":  contacts,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

func (h *ContactHandler) Get(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r.Context())
	if claims == nil {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	waID := r.PathValue("waID")
	phoneNumberID := r.URL.Query().Get("phone_number_id")
	if waID == "" || phoneNumberID == "" {
		writeError(w, http.StatusBadRequest, "waID and phone_number_id required")
		return
	}

	contact, err := h.repo.GetByID(r.Context(), waID, phoneNumberID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	if contact == nil {
		writeError(w, http.StatusNotFound, "contact not found")
		return
	}

	writeJSON(w, http.StatusOK, contact)
}

type updateContactRequest struct {
	CompanyCustomName *string `json:"company_custom_name,omitempty"`
}

func (h *ContactHandler) Update(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r.Context())
	if claims == nil {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	waID := r.PathValue("waID")
	phoneNumberID := r.URL.Query().Get("phone_number_id")
	if waID == "" || phoneNumberID == "" {
		writeError(w, http.StatusBadRequest, "waID and phone_number_id required")
		return
	}

	var req updateContactRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	contact, err := h.repo.Update(r.Context(), waID, phoneNumberID, req.CompanyCustomName)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	if contact == nil {
		writeError(w, http.StatusNotFound, "contact not found")
		return
	}

	writeJSON(w, http.StatusOK, contact)
}

func (h *ContactHandler) Block(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r.Context())
	if claims == nil {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	waID := r.PathValue("waID")
	phoneNumberID := r.URL.Query().Get("phone_number_id")
	if waID == "" || phoneNumberID == "" {
		writeError(w, http.StatusBadRequest, "waID and phone_number_id required")
		return
	}

	contact, err := h.repo.Block(r.Context(), waID, phoneNumberID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	if contact == nil {
		writeError(w, http.StatusNotFound, "contact not found")
		return
	}

	writeJSON(w, http.StatusOK, contact)
}

func (h *ContactHandler) Unblock(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r.Context())
	if claims == nil {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	waID := r.PathValue("waID")
	phoneNumberID := r.URL.Query().Get("phone_number_id")
	if waID == "" || phoneNumberID == "" {
		writeError(w, http.StatusBadRequest, "waID and phone_number_id required")
		return
	}

	contact, err := h.repo.Unblock(r.Context(), waID, phoneNumberID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	if contact == nil {
		writeError(w, http.StatusNotFound, "contact not found")
		return
	}

	writeJSON(w, http.StatusOK, contact)
}
