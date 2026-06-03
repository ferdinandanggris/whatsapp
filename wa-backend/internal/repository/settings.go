package repository

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/ferdinandanggris/wa-backend/internal/model"
)

type SettingsRepository struct {
	pool *pgxpool.Pool
}

func NewSettingsRepository(pool *pgxpool.Pool) *SettingsRepository {
	return &SettingsRepository{pool: pool}
}

const settingsCols = `id, name, value, notes, updated_at, updated_by`

func scanSetting(scanner interface{ Scan(...interface{}) error }) (*model.Setting, error) {
	var s model.Setting
	err := scanner.Scan(&s.ID, &s.Name, &s.Value, &s.Notes, &s.UpdatedAt, &s.UpdatedBy)
	if err != nil {
		return nil, err
	}
	return &s, nil
}

func (r *SettingsRepository) GetAll(ctx context.Context) ([]*model.Setting, error) {
	rows, err := r.pool.Query(ctx, "SELECT "+settingsCols+" FROM settings ORDER BY name")
	if err != nil {
		return nil, fmt.Errorf("list settings: %w", err)
	}
	defer rows.Close()

	var out []*model.Setting
	for rows.Next() {
		s, err := scanSetting(rows)
		if err != nil {
			return nil, fmt.Errorf("scan setting: %w", err)
		}
		out = append(out, s)
	}
	if out == nil {
		out = []*model.Setting{}
	}
	return out, nil
}

func (r *SettingsRepository) GetByName(ctx context.Context, name string) (*model.Setting, error) {
	s, err := scanSetting(r.pool.QueryRow(ctx,
		"SELECT "+settingsCols+" FROM settings WHERE name = $1", name))
	if err != nil {
		return nil, fmt.Errorf("get setting %s: %w", name, err)
	}
	return s, nil
}

func (r *SettingsRepository) Upsert(ctx context.Context, name, value string, updatedBy *string) error {
	_, err := r.pool.Exec(ctx, `
		INSERT INTO settings (name, value, updated_by, updated_at)
		VALUES ($1, $2, $3, now())
		ON CONFLICT (name) DO UPDATE SET
			value = EXCLUDED.value,
			updated_by = EXCLUDED.updated_by,
			updated_at = now()
	`, name, value, updatedBy)
	if err != nil {
		return fmt.Errorf("upsert setting %s: %w", name, err)
	}
	return nil
}
