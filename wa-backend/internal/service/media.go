package service

import (
	"context"
	"fmt"
	"io"
	"mime"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	wapi "github.com/ferdinandanggris/wapi"

	"github.com/ferdinandanggris/wa-backend/internal/repository"
)

type MediaService struct {
	repo    *repository.MediaRepository
	wapi    wapi.Client
	token   string
	mediaDir string
}

func NewMediaService(repo *repository.MediaRepository, wapiClient wapi.Client, token, mediaDir string) *MediaService {
	return &MediaService{repo: repo, wapi: wapiClient, token: token, mediaDir: mediaDir}
}

func (s *MediaService) Upload(ctx context.Context, phoneNumberID, filename string, file io.Reader, mimeType string) (string, error) {
	resp, err := s.wapi.UploadMedia(ctx, phoneNumberID, filename, file, mimeType)
	if err != nil {
		return "", fmt.Errorf("upload media: %w", err)
	}
	return resp.ID, nil
}

func (s *MediaService) Serve(ctx context.Context, w http.ResponseWriter, r *http.Request, mediaID string) error {
	cached, err := s.repo.GetByMediaID(ctx, mediaID)
	if err != nil {
		return fmt.Errorf("check cache: %w", err)
	}

	if cached != nil {
		return serveFile(w, r, cached.LocalPath, cached.MimeType)
	}

	info, err := s.wapi.GetMediaURL(ctx, mediaID)
	if err != nil {
		return fmt.Errorf("get media url: %w", err)
	}

	body, err := s.downloadFromMeta(ctx, info.URL)
	if err != nil {
		return fmt.Errorf("download: %w", err)
	}
	defer body.Close()

	localPath := filepath.Join(s.mediaDir, mediaID+mimeExt(info.MimeType))
	if err := os.MkdirAll(s.mediaDir, 0755); err != nil {
		return fmt.Errorf("create media dir: %w", err)
	}

	f, err := os.Create(localPath)
	if err != nil {
		return fmt.Errorf("create local file: %w", err)
	}

	written, err := io.Copy(f, body)
	if err != nil {
		f.Close()
		return fmt.Errorf("write media file: %w", err)
	}
	f.Close()

	if _, err := s.repo.Save(ctx, mediaID, info.MimeType, localPath, int(written)); err != nil {
		return err
	}

	return serveFile(w, r, localPath, info.MimeType)
}

func (s *MediaService) downloadFromMeta(ctx context.Context, url string) (io.ReadCloser, error) {
	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+s.token)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	if resp.StatusCode >= 400 {
		resp.Body.Close()
		return nil, fmt.Errorf("HTTP %d", resp.StatusCode)
	}
	return resp.Body, nil
}

func mimeExt(mimeType string) string {
	t := strings.Split(mimeType, ";")[0]
	switch t {
	case "image/jpeg":
		return ".jpg"
	case "image/png":
		return ".png"
	case "image/webp":
		return ".webp"
	case "video/mp4":
		return ".mp4"
	case "video/3gpp":
		return ".3gp"
	case "audio/aac":
		return ".aac"
	case "audio/mp4":
		return ".m4a"
	case "audio/mpeg":
		return ".mp3"
	case "audio/amr":
		return ".amr"
	case "audio/ogg":
		return ".ogg"
	case "audio/opus":
		return ".opus"
	case "text/plain":
		return ".txt"
	case "application/pdf":
		return ".pdf"
	case "application/msword":
		return ".doc"
	case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
		return ".docx"
	case "application/vnd.ms-excel":
		return ".xls"
	case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
		return ".xlsx"
	case "application/vnd.ms-powerpoint":
		return ".ppt"
	case "application/vnd.openxmlformats-officedocument.presentationml.presentation":
		return ".pptx"
	}
	exts, err := mime.ExtensionsByType(t)
	if err == nil && len(exts) > 0 {
		return exts[0]
	}
	return ""
}

func serveFile(w http.ResponseWriter, r *http.Request, path, mimeType string) error {
	f, err := os.Open(path)
	if err != nil {
		return fmt.Errorf("open file: %w", err)
	}
	defer f.Close()

	stat, err := f.Stat()
	if err != nil {
		return fmt.Errorf("stat file: %w", err)
	}

	w.Header().Set("Content-Type", mimeType)
	w.Header().Set("Cache-Control", "public, max-age=86400")
	http.ServeContent(w, r, "", stat.ModTime(), f)
	return nil
}
