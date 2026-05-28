package repository

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/ferdinandanggris/wa-backend/internal/model"
)

type TemplateRepository struct {
	pool *pgxpool.Pool
}

func NewTemplateRepository(pool *pgxpool.Pool) *TemplateRepository {
	return &TemplateRepository{pool: pool}
}

func (r *TemplateRepository) List(ctx context.Context, category string) ([]*model.Template, error) {
	var rows pgx.Rows
	var err error
	if category != "" {
		rows, err = r.pool.Query(ctx, `
			SELECT id, name, category, language, status, components, meta_template_id, created_at, updated_at
			FROM templates
			WHERE category = $1
			ORDER BY name`, category)
	} else {
		rows, err = r.pool.Query(ctx, `
			SELECT id, name, category, language, status, components, meta_template_id, created_at, updated_at
			FROM templates
			ORDER BY name`)
	}
	if err != nil {
		return nil, fmt.Errorf("list templates: %w", err)
	}
	defer rows.Close()

	var tpls []*model.Template
	for rows.Next() {
		t, err := scanTemplate(rows)
		if err != nil {
			return nil, err
		}
		tpls = append(tpls, t)
	}
	return tpls, nil
}

func (r *TemplateRepository) GetByID(ctx context.Context, id string) (*model.Template, error) {
	return r.queryOne(ctx, `SELECT id, name, category, language, status, components, meta_template_id, created_at, updated_at
		FROM templates WHERE id = $1`, id)
}

func (r *TemplateRepository) GetByName(ctx context.Context, name, lang string) (*model.Template, error) {
	return r.queryOne(ctx, `SELECT id, name, category, language, status, components, meta_template_id, created_at, updated_at
		FROM templates WHERE name = $1 AND language = $2`, name, lang)
}

func (r *TemplateRepository) Create(ctx context.Context, t *model.Template) error {
	t.CreatedAt = time.Now()
	t.UpdatedAt = t.CreatedAt
	compJSON, err := json.Marshal(t.Components)
	if err != nil {
		return fmt.Errorf("marshal components: %w", err)
	}
	err = r.pool.QueryRow(ctx, `
		INSERT INTO templates (name, category, language, status, components, meta_template_id, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id`, t.Name, t.Category, t.Language, t.Status, compJSON, t.MetaTemplateID, t.CreatedAt, t.UpdatedAt,
	).Scan(&t.ID)
	if err != nil {
		return fmt.Errorf("create template: %w", err)
	}
	return nil
}

func (r *TemplateRepository) Upsert(ctx context.Context, t *model.Template) (bool, error) {
	existing, err := r.GetByName(ctx, t.Name, t.Language)
	if err != nil {
		return false, err
	}
	if existing != nil {
		t.ID = existing.ID
		t.CreatedAt = existing.CreatedAt
		t.UpdatedAt = time.Now()
		compJSON, err := json.Marshal(t.Components)
		if err != nil {
			return false, fmt.Errorf("marshal components: %w", err)
		}
		_, err = r.pool.Exec(ctx, `
			UPDATE templates SET category=$1, status=$2, components=$3, meta_template_id=$4, updated_at=$5
			WHERE id=$6`, t.Category, t.Status, compJSON, t.MetaTemplateID, t.UpdatedAt, t.ID)
		if err != nil {
			return false, fmt.Errorf("update template: %w", err)
		}
		return false, nil
	}
	if err := r.Create(ctx, t); err != nil {
		return false, err
	}
	return true, nil
}

func (r *TemplateRepository) Update(ctx context.Context, t *model.Template) error {
	t.UpdatedAt = time.Now()
	compJSON, err := json.Marshal(t.Components)
	if err != nil {
		return fmt.Errorf("marshal components: %w", err)
	}
	_, err = r.pool.Exec(ctx, `
		UPDATE templates SET name=$1, category=$2, language=$3, status=$4, components=$5, meta_template_id=$6, updated_at=$7
		WHERE id=$8`, t.Name, t.Category, t.Language, t.Status, compJSON, t.MetaTemplateID, t.UpdatedAt, t.ID)
	if err != nil {
		return fmt.Errorf("update template: %w", err)
	}
	return nil
}

func (r *TemplateRepository) Delete(ctx context.Context, id string) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM templates WHERE id = $1`, id)
	if err != nil {
		return fmt.Errorf("delete template: %w", err)
	}
	return nil
}

func (r *TemplateRepository) queryOne(ctx context.Context, query string, args ...interface{}) (*model.Template, error) {
	rows, _ := r.pool.Query(ctx, query, args...)
	defer rows.Close()

	if !rows.Next() {
		return nil, nil
	}
	t, err := scanTemplate(rows)
	if err != nil {
		return nil, err
	}
	return t, nil
}

func scanTemplate(row pgx.Row) (*model.Template, error) {
	var t model.Template
	var compJSON []byte
	err := row.Scan(&t.ID, &t.Name, &t.Category, &t.Language, &t.Status, &compJSON, &t.MetaTemplateID, &t.CreatedAt, &t.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("scan template: %w", err)
	}
	t.Components = json.RawMessage(compJSON)
	return &t, nil
}
