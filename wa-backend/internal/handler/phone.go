package handler

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"os"
	"path/filepath"
	"time"

	wapi "github.com/ferdinandanggris/wapi"
	"github.com/ferdinandanggris/wapi/types"

	"github.com/ferdinandanggris/wa-backend/internal/middleware"
	"github.com/ferdinandanggris/wa-backend/internal/repository"
)

const profileMediaPrefix = "pp_"

type PhoneHandler struct {
	repo     *repository.PhoneRepository
	mediaRepo *repository.MediaRepository
	wapi     wapi.Client
	appID    string
	mediaDir string
}

func NewPhoneHandler(repo *repository.PhoneRepository, mediaRepo *repository.MediaRepository, wapiClient wapi.Client, appID, mediaDir string) *PhoneHandler {
	return &PhoneHandler{repo: repo, mediaRepo: mediaRepo, wapi: wapiClient, appID: appID, mediaDir: mediaDir}
}

func (h *PhoneHandler) List(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r.Context())
	if claims == nil {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}
	if claims.Role != "super_admin" && claims.Role != "company_admin" && claims.Role != "agent" {
		writeError(w, http.StatusForbidden, "no access")
		return
	}
	companyID := claims.CompanyID
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

// cacheProfilePicture downloads a profile picture from Meta's temporary URL,
// saves it to media_cache (table + file), and returns the local serve URL.
func (h *PhoneHandler) cacheProfilePicture(ctx context.Context, id, metaURL string) (string, error) {
	if metaURL == "" {
		return "", nil
	}

	mediaID := profileMediaPrefix + id

	// Download from Meta's temporary signed URL
	req, err := http.NewRequestWithContext(ctx, "GET", metaURL, nil)
	if err != nil {
		return "", fmt.Errorf("create download request: %w", err)
	}
	client := &http.Client{Timeout: 15 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("download: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("download: HTTP %d", resp.StatusCode)
	}

	data, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("read: %w", err)
	}

	// Save to local file
	localPath := filepath.Join(h.mediaDir, mediaID+".jpg")
	if err := os.MkdirAll(h.mediaDir, 0755); err != nil {
		return "", fmt.Errorf("create media dir: %w", err)
	}
	if err := os.WriteFile(localPath, data, 0644); err != nil {
		return "", fmt.Errorf("write file: %w", err)
	}

	// Save record to media_cache table
	mimeType := resp.Header.Get("Content-Type")
	if mimeType == "" {
		mimeType = "image/jpeg"
	}
	if _, err := h.mediaRepo.Save(ctx, mediaID, mimeType, localPath, len(data)); err != nil {
		slog.Warn("media_cache save failed, file still cached on disk", "id", id, "error", err)
	}

	localURL := "/api/v1/media/" + mediaID
	slog.Info("profile picture cached", "id", id, "media_id", mediaID, "size", len(data))
	return localURL, nil
}

func (h *PhoneHandler) Get(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		writeError(w, http.StatusBadRequest, "phone_number_id required")
		return
	}
	phone, err := h.repo.GetByID(r.Context(), id)
	if err != nil {
		slog.Error("phone getbyid failed", "id", id, "error", err)
		writeError(w, http.StatusNotFound, "phone number not found")
		return
	}
	writeJSON(w, http.StatusOK, phone)
}

type updatePhoneRequest struct {
	DisplayName string   `json:"display_name"`
	Description string   `json:"description"`
	CompanyID   *int64   `json:"company_id"`
	Email       string   `json:"email,omitempty"`
	About       string   `json:"about,omitempty"`
	Address     string   `json:"address,omitempty"`
	Vertical    string   `json:"vertical,omitempty"`
	Websites    []string `json:"websites,omitempty"`
}

func (h *PhoneHandler) Update(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		writeError(w, http.StatusBadRequest, "phone_number_id required")
		return
	}
	var req updatePhoneRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if err := h.repo.Update(r.Context(), id, req.DisplayName, req.Description, req.CompanyID,
		req.Email, req.About, req.Address, req.Vertical, req.Websites); err != nil {
		writeError(w, http.StatusInternalServerError, "failed to update")
		return
	}
	phone, err := h.repo.GetByID(r.Context(), id)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to reload")
		return
	}
	writeJSON(w, http.StatusOK, phone)
}

// SyncProfile fetches the WhatsApp Business Profile from Meta and updates local DB.
func (h *PhoneHandler) SyncProfile(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		writeError(w, http.StatusBadRequest, "phone_number_id required")
		return
	}

	profile, err := h.wapi.GetBusinessProfile(r.Context(), id)
	if err != nil {
		writeError(w, http.StatusBadGateway, "failed to fetch profile from Meta: "+err.Error())
		return
	}

	// Cache profile picture locally (Meta URL is temporary)
	localURL, _ := h.cacheProfilePicture(r.Context(), id, profile.ProfilePictureURL)
	picURL := localURL
	if picURL == "" {
		picURL = profile.ProfilePictureURL
	}

	// Ensure nil Websites becomes empty slice for pgx
	websites := profile.Websites
	if websites == nil {
		websites = []string{}
	}
	bp := &repository.PhoneBusinessProfile{
		Description:       profile.Description,
		Email:             profile.Email,
		About:             profile.About,
		Address:           profile.Address,
		Vertical:          profile.Vertical,
		Websites:          websites,
		ProfilePictureURL: picURL,
	}
	if err := h.repo.UpdateBusinessProfileFields(r.Context(), id, bp); err != nil {
		writeError(w, http.StatusInternalServerError, "failed to save profile")
		return
	}

	phone, err := h.repo.GetByID(r.Context(), id)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to reload")
		return
	}
	writeJSON(w, http.StatusOK, phone)
}

// UploadPicture uploads a profile picture to Meta and updates local DB.
func (h *PhoneHandler) UploadPicture(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		writeError(w, http.StatusBadRequest, "phone_number_id required")
		return
	}

	// Parse multipart form (max 5MB)
	if err := r.ParseMultipartForm(5 << 20); err != nil {
		writeError(w, http.StatusBadRequest, "failed to parse form")
		return
	}
	file, header, err := r.FormFile("photo")
	if err != nil {
		writeError(w, http.StatusBadRequest, "photo field required")
		return
	}
	defer file.Close()

	data, err := io.ReadAll(file)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to read file")
		return
	}

	mimeType := header.Header.Get("Content-Type")
	if mimeType == "" {
		mimeType = "image/jpeg"
	}

	// Step 1: Resumable Upload to Meta → get handle
	handle, err := h.wapi.ResumableUpload(r.Context(), h.appID, data, mimeType)
	if err != nil {
		slog.Error("resumable upload failed", "id", id, "error", err)
		writeError(w, http.StatusBadGateway, "resumable upload: "+err.Error())
		return
	}
	slog.Info("resumable upload ok", "id", id, "handle", handle)

	// Step 2: set profile picture handle via whatsapp_business_profile
	bp := &types.BusinessProfile{
		ProfilePictureHandle: handle,
	}
	if err := h.wapi.UpdateBusinessProfile(r.Context(), id, bp); err != nil {
		slog.Error("set profile picture handle failed", "id", id, "handle", handle, "error", err)
		writeError(w, http.StatusBadGateway, "set profile: "+err.Error())
		return
	}
	slog.Info("profile picture handle set", "id", id, "handle", handle)

	// Step 3: re-fetch profile to get the URL, then cache locally
	metaProfile, err := h.wapi.GetBusinessProfile(r.Context(), id)
	picBP := &repository.PhoneBusinessProfile{ProfilePictureHandle: handle}
	if err == nil && metaProfile.ProfilePictureURL != "" {
		localURL, cacheErr := h.cacheProfilePicture(r.Context(), id, metaProfile.ProfilePictureURL)
		if cacheErr != nil {
			slog.Warn("cache profile picture failed", "id", id, "error", cacheErr)
		}
		picURL := localURL
		if picURL == "" {
			picURL = metaProfile.ProfilePictureURL
		}
		picBP.ProfilePictureURL = picURL
	} else if err != nil {
		slog.Warn("re-fetch profile failed, saving handle only", "id", id, "error", err)
	}
	_ = h.repo.UpdateBusinessProfileFields(r.Context(), id, picBP)

	phone, err := h.repo.GetByID(r.Context(), id)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to reload")
		return
	}
	writeJSON(w, http.StatusOK, phone)
}
