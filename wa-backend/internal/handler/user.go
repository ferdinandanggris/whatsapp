package handler

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"strings"

	"github.com/ferdinandanggris/wa-backend/internal/middleware"
	"github.com/ferdinandanggris/wa-backend/internal/model"
	"github.com/ferdinandanggris/wa-backend/internal/repository"
	"github.com/ferdinandanggris/wa-backend/internal/service"
)

type UserHandler struct {
	users *repository.UserRepository
}

func NewUserHandler(users *repository.UserRepository) *UserHandler {
	return &UserHandler{users: users}
}

type createUserRequest struct {
	Email       string `json:"email"`
	Password    string `json:"password"`
	Role        string `json:"role"`
	CompanyID   *int64 `json:"company_id,omitempty"`
	DisplayName string `json:"display_name"`
}

type updateUserRequest struct {
	DisplayName string `json:"display_name"`
	Role        string `json:"role"`
	CompanyID   *int64 `json:"company_id,omitempty"`
	IsActive    *bool  `json:"is_active,omitempty"`
}

type resetPasswordRequest struct {
	NewPassword string `json:"new_password"`
}

func (h *UserHandler) List(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r.Context())

	var companyID *int64
	if claims.Role != "super_admin" {
		companyID = claims.CompanyID
	}

	users, err := h.users.List(r.Context(), companyID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to list users")
		return
	}

	resp := make([]*userResponse, 0, len(users))
	for _, u := range users {
		resp = append(resp, &userResponse{
			ID:          u.ID,
			Email:       u.Email,
			Role:        u.Role,
			CompanyID:   u.CompanyID,
			DisplayName: u.DisplayName,
			IsActive:    u.IsActive,
		})
	}

	writeJSON(w, http.StatusOK, resp)
}

func (h *UserHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req createUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if req.Email == "" || req.Password == "" || req.DisplayName == "" {
		writeError(w, http.StatusBadRequest, "email, password, and display_name required")
		return
	}

	if len(req.Password) < 8 {
		writeError(w, http.StatusBadRequest, "password must be at least 8 characters")
		return
	}

	claims := middleware.GetClaims(r.Context())
	if claims.Role != "super_admin" {
		if req.Role == "super_admin" {
			writeError(w, http.StatusForbidden, "cannot create super_admin")
			return
		}
		req.Role = "agent"
		req.CompanyID = claims.CompanyID
	}

	hash, err := service.HashPassword(req.Password)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to create user")
		return
	}

	user := &model.User{
		Role:         req.Role,
		CompanyID:    req.CompanyID,
		Email:        req.Email,
		PasswordHash: hash,
		DisplayName:  req.DisplayName,
	}

	if err := h.users.Create(r.Context(), user); err != nil {
		if isDuplicateEmail(err) {
			writeError(w, http.StatusConflict, "email already exists")
			return
		}
		writeError(w, http.StatusInternalServerError, "failed to create user")
		return
	}

	writeJSON(w, http.StatusCreated, &userResponse{
		ID:          user.ID,
		Email:       user.Email,
		Role:        user.Role,
		CompanyID:   user.CompanyID,
		DisplayName: user.DisplayName,
		IsActive:    user.IsActive,
	})
}

func (h *UserHandler) Update(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		writeError(w, http.StatusBadRequest, "user id required")
		return
	}

	claims := middleware.GetClaims(r.Context())

	// company_admin can only update users in their own company
	if claims.Role != "super_admin" {
		existing, err := h.users.FindByID(r.Context(), id)
		if err != nil || existing == nil {
			writeError(w, http.StatusNotFound, "user not found")
			return
		}
		if existing.CompanyID == nil || claims.CompanyID == nil || *existing.CompanyID != *claims.CompanyID {
			writeError(w, http.StatusForbidden, "access denied")
			return
		}

		var req updateUserRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeError(w, http.StatusBadRequest, "invalid request body")
			return
		}
		if req.DisplayName == "" {
			writeError(w, http.StatusBadRequest, "display_name is required")
			return
		}

		// company_admin: keep existing role & company_id
		if err := h.users.UpdateUser(r.Context(), id, existing.Role, req.DisplayName, existing.CompanyID, req.IsActive); err != nil {
			writeError(w, http.StatusInternalServerError, "failed to update user")
			return
		}

		writeJSON(w, http.StatusOK, map[string]string{"status": "updated"})
		return
	}

	// super_admin: full update
	var req updateUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if req.DisplayName == "" {
		writeError(w, http.StatusBadRequest, "display_name is required")
		return
	}

	role := req.Role
	if role == "" {
		role = "agent"
	}

	if err := h.users.UpdateUser(r.Context(), id, role, req.DisplayName, req.CompanyID, req.IsActive); err != nil {
		writeError(w, http.StatusInternalServerError, "failed to update user")
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"status": "updated"})
}

func (h *UserHandler) Deactivate(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		writeError(w, http.StatusBadRequest, "user id required")
		return
	}

	claims := middleware.GetClaims(r.Context())
	if claims.UserID == id {
		writeError(w, http.StatusBadRequest, "cannot deactivate yourself")
		return
	}

	if claims.Role != "super_admin" {
		existing, err := h.users.FindByID(r.Context(), id)
		if err != nil || existing == nil {
			writeError(w, http.StatusNotFound, "user not found")
			return
		}
		if existing.CompanyID == nil || claims.CompanyID == nil || *existing.CompanyID != *claims.CompanyID {
			writeError(w, http.StatusForbidden, "access denied")
			return
		}
	}

	if err := h.users.Deactivate(r.Context(), id); err != nil {
		writeError(w, http.StatusInternalServerError, "failed to deactivate user")
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"status": "deactivated"})
}

func (h *UserHandler) ResetPassword(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		writeError(w, http.StatusBadRequest, "user id required")
		return
	}

	var req resetPasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if req.NewPassword == "" {
		writeError(w, http.StatusBadRequest, "new_password is required")
		return
	}
	if len(req.NewPassword) < 8 {
		writeError(w, http.StatusBadRequest, "password must be at least 8 characters")
		return
	}

	claims := middleware.GetClaims(r.Context())
	if claims.Role != "super_admin" {
		existing, err := h.users.FindByID(r.Context(), id)
		if err != nil || existing == nil {
			writeError(w, http.StatusNotFound, "user not found")
			return
		}
		if existing.CompanyID == nil || claims.CompanyID == nil || *existing.CompanyID != *claims.CompanyID {
			writeError(w, http.StatusForbidden, "access denied")
			return
		}
	}

	hash, err := service.HashPassword(req.NewPassword)
	if err != nil {
		slog.Error("hash password", "error", err)
		writeError(w, http.StatusInternalServerError, "failed to reset password")
		return
	}

	if err := h.users.UpdatePassword(r.Context(), id, hash); err != nil {
		slog.Error("update password", "error", err)
		writeError(w, http.StatusInternalServerError, "failed to reset password")
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"status": "password_reset"})
}

func isDuplicateEmail(err error) bool {
	return err != nil && (strings.Contains(err.Error(), "duplicate key") || strings.Contains(err.Error(), "unique"))
}
