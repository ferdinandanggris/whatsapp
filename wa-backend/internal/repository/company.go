package repository

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/ferdinandanggris/wa-backend/internal/model"
)

type CompanyRepository struct {
	pool *pgxpool.Pool
}

func NewCompanyRepository(pool *pgxpool.Pool) *CompanyRepository {
	return &CompanyRepository{pool: pool}
}

const companyCols = `id, name, created_at`

func scanCompany(scanner interface{ Scan(...interface{}) error }) (*model.Company, error) {
	var c model.Company
	err := scanner.Scan(&c.ID, &c.Name, &c.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &c, nil
}

func (r *CompanyRepository) Create(ctx context.Context, name string) (int64, error) {
	var id int64
	err := r.pool.QueryRow(ctx,
		"INSERT INTO companies (name) VALUES ($1) RETURNING id", name,
	).Scan(&id)
	if err != nil {
		return 0, fmt.Errorf("create company: %w", err)
	}
	return id, nil
}

func (r *CompanyRepository) Update(ctx context.Context, id int64, name string) error {
	_, err := r.pool.Exec(ctx, "UPDATE companies SET name = $1 WHERE id = $2", name, id)
	if err != nil {
		return fmt.Errorf("update company %d: %w", id, err)
	}
	return nil
}

func (r *CompanyRepository) Delete(ctx context.Context, id int64) error {
	_, err := r.pool.Exec(ctx, "DELETE FROM companies WHERE id = $1", id)
	if err != nil {
		return fmt.Errorf("delete company %d: %w", id, err)
	}
	return nil
}

func (r *CompanyRepository) List(ctx context.Context) ([]*model.Company, error) {
	rows, err := r.pool.Query(ctx, "SELECT "+companyCols+" FROM companies ORDER BY name")
	if err != nil {
		return nil, fmt.Errorf("list companies: %w", err)
	}
	defer rows.Close()

	var out []*model.Company
	for rows.Next() {
		c, err := scanCompany(rows)
		if err != nil {
			return nil, fmt.Errorf("scan company: %w", err)
		}
		out = append(out, c)
	}
	if out == nil {
		out = []*model.Company{}
	}
	return out, nil
}

func (r *CompanyRepository) GetByID(ctx context.Context, id int64) (*model.Company, error) {
	c, err := scanCompany(r.pool.QueryRow(ctx,
		"SELECT "+companyCols+" FROM companies WHERE id = $1", id))
	if err != nil {
		return nil, fmt.Errorf("get company %d: %w", id, err)
	}
	return c, nil
}

func (r *CompanyRepository) GetPhoneIDsByCompanyID(ctx context.Context, companyID int64) ([]string, error) {
	rows, err := r.pool.Query(ctx,
		"SELECT phone_number_id FROM wa_phone_numbers WHERE company_id = $1", companyID)
	if err != nil {
		return nil, fmt.Errorf("get phone ids: %w", err)
	}
	defer rows.Close()

	var ids []string
	for rows.Next() {
		var id string
		if err := rows.Scan(&id); err != nil {
			return nil, fmt.Errorf("scan phone id: %w", err)
		}
		ids = append(ids, id)
	}
	return ids, nil
}
