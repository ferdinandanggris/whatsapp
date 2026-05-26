package repository

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
)

type CompanyRepository struct {
	pool *pgxpool.Pool
}

func NewCompanyRepository(pool *pgxpool.Pool) *CompanyRepository {
	return &CompanyRepository{pool: pool}
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
