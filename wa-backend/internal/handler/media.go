package handler

import (
	"context"
	"mime"
	"net/http"
	"path/filepath"
	"strings"
	"time"

	"github.com/ferdinandanggris/wa-backend/internal/service"
)

func detectMimeType(filename string) string {
	ext := strings.ToLower(filepath.Ext(filename))
	switch ext {
	case ".jpg", ".jpeg":
		return "image/jpeg"
	case ".png":
		return "image/png"
	case ".gif":
		return "image/gif"
	case ".webp":
		return "image/webp"
	case ".mp4":
		return "video/mp4"
	case ".ogg":
		return "audio/ogg"
	case ".mp3":
		return "audio/mpeg"
	case ".pdf":
		return "application/pdf"
	case ".txt":
		return "text/plain"
	case ".doc", ".docx":
		return "application/msword"
	case ".xls", ".xlsx":
		return "application/vnd.ms-excel"
	case ".ppt", ".pptx":
		return "application/vnd.ms-powerpoint"
	default:
		if t := mime.TypeByExtension(ext); t != "" {
			return t
		}
		return "image/jpeg"
	}
}

type MediaHandler struct {
	svc *service.MediaService
}

func NewMediaHandler(svc *service.MediaService) *MediaHandler {
	return &MediaHandler{svc: svc}
}

func (h *MediaHandler) Upload(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseMultipartForm(100 << 20); err != nil {
		writeError(w, http.StatusBadRequest, "invalid multipart form")
		return
	}

	phoneNumberID := r.FormValue("phone_number_id")
	if phoneNumberID == "" {
		writeError(w, http.StatusBadRequest, "phone_number_id required")
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		writeError(w, http.StatusBadRequest, "file required")
		return
	}
	defer file.Close()

	mimeType := header.Header.Get("Content-Type")
	if mimeType == "" || mimeType == "application/octet-stream" {
		mimeType = detectMimeType(header.Filename)
	}

	mediaID, err := h.svc.Upload(r.Context(), phoneNumberID, header.Filename, file, mimeType)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"media_id": mediaID})
}

func (h *MediaHandler) Serve(w http.ResponseWriter, r *http.Request) {
	mediaID := r.PathValue("mediaID")
	if mediaID == "" {
		writeError(w, http.StatusBadRequest, "mediaID required")
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 3*time.Second)
	defer cancel()

	if err := h.svc.Serve(ctx, w, r.WithContext(ctx), mediaID); err != nil {
		writeError(w, http.StatusNotFound, "media not found")
		return
	}
}
