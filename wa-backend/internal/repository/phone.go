package repository

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
)

type PhoneNumber struct {
	PhoneNumberID    string `json:"phone_number_id"`
	DisplayName      string `json:"display_name"`
	DisplayPhone     string `json:"display_phone_number"`
	QualityRating    string `json:"quality_rating"`
	Description      string `json:"description,omitempty"`
	UnreadCount      int    `json:"unread_count"`
}

type PhoneRepository struct {
	pool *pgxpool.Pool
}

func NewPhoneRepository(pool *pgxpool.Pool) *PhoneRepository {
	return &PhoneRepository{pool: pool}
}

func (r *PhoneRepository) ListByCompany(ctx context.Context, companyID *int64) ([]*PhoneNumber, error) {
	query := `
		SELECT wpn.phone_number_id, wpn.display_name, wpn.display_phone_number,
		       COALESCE(wpn.quality_rating, ''), COALESCE(wpn.description, ''),
		       COALESCE(SUM(c.unread_count), 0)
		FROM wa_phone_numbers wpn
		LEFT JOIN conversations c ON c.phone_number_id = wpn.phone_number_id
	`
	args := []interface{}{}
	if companyID != nil {
		query += ` WHERE wpn.company_id = $1`
		args = append(args, *companyID)
	}
	query += ` GROUP BY wpn.phone_number_id, wpn.display_name, wpn.display_phone_number, wpn.quality_rating, wpn.description ORDER BY wpn.display_name`

	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("list phones: %w", err)
	}
	defer rows.Close()

	var phones []*PhoneNumber
	for rows.Next() {
		var p PhoneNumber
		if err := rows.Scan(&p.PhoneNumberID, &p.DisplayName, &p.DisplayPhone, &p.QualityRating, &p.Description, &p.UnreadCount); err != nil {
			return nil, fmt.Errorf("scan phone: %w", err)
		}
		phones = append(phones, &p)
	}
	return phones, nil
}
