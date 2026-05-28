package handler

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/ferdinandanggris/wa-backend/internal/middleware"
	"github.com/ferdinandanggris/wa-backend/internal/repository"
	"github.com/ferdinandanggris/wa-backend/internal/service"
)

type AuthHandler struct {
	auth  *service.AuthService
	users *repository.UserRepository
}

func NewAuthHandler(auth *service.AuthService, users *repository.UserRepository) *AuthHandler {
	return &AuthHandler{auth: auth, users: users}
}

type loginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type loginResponse struct {
	AccessToken  string        `json:"access_token"`
	RefreshToken string        `json:"refresh_token"`
	User         *userResponse `json:"user"`
}

type userResponse struct {
	ID          string `json:"id"`
	Email       string `json:"email"`
	Role        string `json:"role"`
	CompanyID   *int64 `json:"company_id,omitempty"`
	DisplayName string `json:"display_name"`
	IsActive    bool   `json:"is_active"`
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req loginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if req.Email == "" || req.Password == "" {
		writeError(w, http.StatusBadRequest, "email and password required")
		return
	}

	user, accessToken, refreshToken, err := h.auth.Login(r.Context(), req.Email, req.Password)
	if err != nil {
		if errors.Is(err, service.ErrInvalidCredentials) {
			writeError(w, http.StatusUnauthorized, "invalid email or password")
			return
		}
		if errors.Is(err, service.ErrUserInactive) {
			writeError(w, http.StatusForbidden, "account is deactivated")
			return
		}
		writeError(w, http.StatusInternalServerError, "login failed")
		return
	}

	resp := loginResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		User: &userResponse{
			ID:          user.ID,
			Email:       user.Email,
			Role:        user.Role,
			CompanyID:   user.CompanyID,
			DisplayName: user.DisplayName,
			IsActive:    user.IsActive,
		},
	}

	writeJSON(w, http.StatusOK, resp)
}

type refreshRequest struct {
	RefreshToken string `json:"refresh_token"`
}

type refreshResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
}

func (h *AuthHandler) Refresh(w http.ResponseWriter, r *http.Request) {
	var req refreshRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if req.RefreshToken == "" {
		writeError(w, http.StatusBadRequest, "refresh_token required")
		return
	}

	accessToken, refreshToken, err := h.auth.RefreshToken(r.Context(), req.RefreshToken)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "invalid or expired refresh token")
		return
	}

	writeJSON(w, http.StatusOK, refreshResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
	})
}

func (h *AuthHandler) Me(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r.Context())
	if claims == nil {
		writeError(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	user, err := h.users.FindByID(r.Context(), claims.UserID)
	if err != nil || user == nil {
		writeError(w, http.StatusNotFound, "user not found")
		return
	}

	writeJSON(w, http.StatusOK, &userResponse{
		ID:          user.ID,
		Email:       user.Email,
		Role:        user.Role,
		CompanyID:   user.CompanyID,
		DisplayName: user.DisplayName,
		IsActive:    user.IsActive,
	})
}

type setupRequest struct {
	Email       string `json:"email"`
	Password    string `json:"password"`
	DisplayName string `json:"display_name"`
}

func (h *AuthHandler) Setup(w http.ResponseWriter, r *http.Request) {
	exists, err := h.users.HasUsers(r.Context())
	if err != nil {
		writeError(w, http.StatusInternalServerError, "server error")
		return
	}
	if exists {
		writeError(w, http.StatusForbidden, "setup already completed")
		return
	}

	var req setupRequest
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

	hash, err := service.HashPassword(req.Password)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "setup failed")
		return
	}

	user, err := h.users.CreateInitialSuperAdmin(r.Context(), req.Email, hash, req.DisplayName)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "setup failed")
		return
	}

	writeJSON(w, http.StatusCreated, map[string]string{
		"message":      "super admin created",
		"id":           user.ID,
		"display_name": user.DisplayName,
	})
}

func writeJSON(w http.ResponseWriter, status int, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}

func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]string{"error": msg})
}
