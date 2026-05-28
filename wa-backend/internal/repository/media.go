package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type MediaCache struct {
	ID        string    `json:"id"`
	MediaID   string    `json:"media_id"`
	MimeType  string    `json:"mime_type"`
	FileSize  int       `json:"file_size"`
	LocalPath string    `json:"local_path"`
	CreatedAt time.Time `json:"created_at"`
}

type MediaRepository struct {
	pool *pgxpool.Pool
}

func NewMediaRepository(pool *pgxpool.Pool) *MediaRepository {
	return &MediaRepository{pool: pool}
}

func (r *MediaRepository) Save(ctx context.Context, mediaID, mimeType, localPath string, fileSize int) (*MediaCache, error) {
	var mc MediaCache
	err := r.pool.QueryRow(ctx, `
		INSERT INTO media_cache (media_id, mime_type, file_size, local_path)
		VALUES ($1, $2, $3, $4)
		ON CONFLICT (media_id) DO UPDATE SET local_path=$4
		RETURNING id, media_id, mime_type, file_size, local_path, created_at
	`, mediaID, mimeType, fileSize, localPath).Scan(
		&mc.ID, &mc.MediaID, &mc.MimeType, &mc.FileSize, &mc.LocalPath, &mc.CreatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("save media cache: %w", err)
	}
	return &mc, nil
}

func (r *MediaRepository) GetByMediaID(ctx context.Context, mediaID string) (*MediaCache, error) {
	var mc MediaCache
	err := r.pool.QueryRow(ctx, `
		SELECT id, media_id, mime_type, file_size, local_path, created_at
		FROM media_cache WHERE media_id = $1
	`, mediaID).Scan(&mc.ID, &mc.MediaID, &mc.MimeType, &mc.FileSize, &mc.LocalPath, &mc.CreatedAt)
	if err != nil {
		return nil, nil
	}
	return &mc, nil
}
