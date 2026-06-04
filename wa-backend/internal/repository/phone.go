package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type PhoneNumber struct {
	PhoneNumberID string `json:"phone_number_id"`
	DisplayName   string `json:"display_name"`
	DisplayPhone  string `json:"display_phone_number"`
	QualityRating string `json:"quality_rating"`
	Description   string `json:"description,omitempty"`
	UnreadCount   int    `json:"unread_count"`
	CompanyID     *int64 `json:"company_id,omitempty"`
	CompanyName   string `json:"company_name,omitempty"`
}

type PhoneDetail struct {
	PhoneNumberID        string   `json:"phone_number_id"`
	DisplayName          string   `json:"display_name"`
	DisplayPhone         string   `json:"display_phone_number"`
	QualityRating        string   `json:"quality_rating"`
	Description          string   `json:"description,omitempty"`
	Email                string   `json:"email,omitempty"`
	About                string   `json:"about,omitempty"`
	Address              string   `json:"address,omitempty"`
	Vertical             string   `json:"vertical,omitempty"`
	Websites             []string `json:"websites,omitempty"`
	ProfilePictureURL    string   `json:"profile_picture_url,omitempty"`
	ProfilePictureHandle string   `json:"profile_picture_handle,omitempty"`
	CompanyID            *int64   `json:"company_id,omitempty"`
	CompanyName          string   `json:"company_name,omitempty"`
	CreatedAt            string   `json:"created_at,omitempty"`
	UpdatedAt            string   `json:"updated_at,omitempty"`
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
		       COALESCE(SUM(c.unread_count), 0),
		       wpn.company_id, COALESCE(co.name, '')
		FROM wa_phone_numbers wpn
		LEFT JOIN conversations c ON c.phone_number_id = wpn.phone_number_id
		LEFT JOIN companies co ON co.id = wpn.company_id
	`
	args := []interface{}{}
	if companyID != nil {
		query += ` WHERE wpn.company_id = $1`
		args = append(args, *companyID)
	}
	query += ` GROUP BY wpn.phone_number_id, wpn.display_name, wpn.display_phone_number, wpn.quality_rating, wpn.description, wpn.company_id, co.name ORDER BY wpn.display_name`

	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("list phones: %w", err)
	}
	defer rows.Close()

	var phones []*PhoneNumber
	for rows.Next() {
		var p PhoneNumber
		if err := rows.Scan(&p.PhoneNumberID, &p.DisplayName, &p.DisplayPhone, &p.QualityRating, &p.Description, &p.UnreadCount, &p.CompanyID, &p.CompanyName); err != nil {
			return nil, fmt.Errorf("scan phone: %w", err)
		}
		phones = append(phones, &p)
	}
	return phones, nil
}

func (r *PhoneRepository) GetByID(ctx context.Context, id string) (*PhoneDetail, error) {
	query := `
		SELECT wpn.phone_number_id, wpn.display_name, wpn.display_phone_number,
		       COALESCE(wpn.quality_rating, ''), COALESCE(wpn.description, ''),
		       COALESCE(wpn.email, ''), COALESCE(wpn.about, ''), COALESCE(wpn.address, ''),
		       COALESCE(wpn.vertical, ''), COALESCE(wpn.websites, '{}'),
		       COALESCE(wpn.profile_picture_url, ''), COALESCE(wpn.profile_picture_handle, ''),
		       wpn.company_id, COALESCE(co.name, ''),
		       COALESCE(to_char(wpn.created_at, 'YYYY-MM-DD HH24:MI:SS'), ''),
		       COALESCE(to_char(wpn.updated_at, 'YYYY-MM-DD HH24:MI:SS'), '')
		FROM wa_phone_numbers wpn
		LEFT JOIN companies co ON co.id = wpn.company_id
		WHERE wpn.phone_number_id = $1`
	var p PhoneDetail
	err := r.pool.QueryRow(ctx, query, id).Scan(
		&p.PhoneNumberID, &p.DisplayName, &p.DisplayPhone,
		&p.QualityRating, &p.Description,
		&p.Email, &p.About, &p.Address, &p.Vertical, &p.Websites,
		&p.ProfilePictureURL, &p.ProfilePictureHandle,
		&p.CompanyID, &p.CompanyName,
		&p.CreatedAt, &p.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("get phone %s: %w", id, err)
	}
	return &p, nil
}

func (r *PhoneRepository) Update(ctx context.Context, id string, displayName, description string, companyID *int64) error {
	query := `UPDATE wa_phone_numbers SET display_name = $1, description = $2, company_id = $3, updated_at = NOW() WHERE phone_number_id = $4`
	_, err := r.pool.Exec(ctx, query, displayName, description, companyID, id)
	if err != nil {
		return fmt.Errorf("update phone %s: %w", id, err)
	}
	return nil
}

func (r *PhoneRepository) UpdateBusinessProfileFields(ctx context.Context, id string, profile *PhoneBusinessProfile) error {
	query := `
		UPDATE wa_phone_numbers SET
			description = $1, email = $2, about = $3, address = $4,
			vertical = $5, websites = $6, profile_picture_url = $7,
			profile_picture_handle = $8, business_profile_updated = $9, updated_at = NOW()
		WHERE phone_number_id = $10`
	now := time.Now()
	_, err := r.pool.Exec(ctx, query,
		profile.Description, profile.Email, profile.About, profile.Address,
		profile.Vertical, profile.Websites, profile.ProfilePictureURL,
		profile.ProfilePictureHandle, now, id,
	)
	if err != nil {
		return fmt.Errorf("update business profile %s: %w", id, err)
	}
	return nil
}

type PhoneBusinessProfile struct {
	Description          string   `json:"description"`
	Email                string   `json:"email"`
	About                string   `json:"about"`
	Address              string   `json:"address"`
	Vertical             string   `json:"vertical"`
	Websites             []string `json:"websites"`
	ProfilePictureURL    string   `json:"profile_picture_url"`
	ProfilePictureHandle string   `json:"profile_picture_handle"`
}
