package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/ferdinandanggris/wa-backend/internal/model"
)

type ContactRepository struct {
	pool *pgxpool.Pool
}

func NewContactRepository(pool *pgxpool.Pool) *ContactRepository {
	return &ContactRepository{pool: pool}
}

const contactCols = `wa_id, phone_number_id, profile_name, company_custom_name, is_blocked, blocked_at, last_customer_message_at`

func scanContact(s pgx.Row) (*model.Contact, error) {
	var c model.Contact
	err := s.Scan(&c.WaID, &c.PhoneNumberID, &c.ProfileName,
		&c.CompanyCustomName, &c.IsBlocked, &c.BlockedAt, &c.LastCustomerMessageAt)
	if err != nil {
		return nil, err
	}
	return &c, nil
}

func (r *ContactRepository) FindOrCreate(ctx context.Context, waID, phoneNumberID, profileName string) (*model.Contact, error) {
	c, err := scanContact(r.pool.QueryRow(ctx, `
		INSERT INTO contacts (wa_id, phone_number_id, profile_name, last_customer_message_at)
		VALUES ($1, $2, $3, NOW())
		ON CONFLICT (wa_id, phone_number_id)
		DO UPDATE SET
			profile_name = COALESCE(NULLIF($3, ''), contacts.profile_name),
			last_customer_message_at = NOW()
		RETURNING `+contactCols+`
	`, waID, phoneNumberID, profileName))
	if err != nil {
		return nil, fmt.Errorf("find or create contact: %w", err)
	}
	return c, nil
}

func (r *ContactRepository) EnsureOutboundContact(ctx context.Context, waID, phoneNumberID string) error {
	_, err := r.pool.Exec(ctx, `
		INSERT INTO contacts (wa_id, phone_number_id)
		VALUES ($1, $2)
		ON CONFLICT (wa_id, phone_number_id) DO NOTHING
	`, waID, phoneNumberID)
	if err != nil {
		return fmt.Errorf("ensure outbound contact: %w", err)
	}
	return nil
}

func (r *ContactRepository) GetByID(ctx context.Context, waID, phoneNumberID string) (*model.Contact, error) {
	c, err := scanContact(r.pool.QueryRow(ctx, `
		SELECT `+contactCols+` FROM contacts WHERE wa_id = $1 AND phone_number_id = $2
	`, waID, phoneNumberID))
	if err == pgx.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("get contact: %w", err)
	}
	return c, nil
}

func (r *ContactRepository) UpdateLastCustomerMessage(ctx context.Context, waID, phoneNumberID string) error {
	_, err := r.pool.Exec(ctx, `
		UPDATE contacts SET last_customer_message_at = NOW()
		WHERE wa_id = $1 AND phone_number_id = $2
	`, waID, phoneNumberID)
	if err != nil {
		return fmt.Errorf("update last customer message: %w", err)
	}
	return nil
}

func (r *ContactRepository) List(ctx context.Context, companyID *int64, q string, page, limit int) ([]*model.Contact, int, error) {
	offset := (page - 1) * limit
	join := ""
	where := ""
	args := []interface{}{}
	if companyID != nil {
		join = ` JOIN wa_phone_numbers wpn ON c.phone_number_id = wpn.phone_number_id`
		where = ` WHERE wpn.company_id = $1`
		args = append(args, *companyID)
	}
	if q != "" {
		paramIdx := len(args) + 1
		if where == "" {
			where = " WHERE"
		} else {
			where += " AND"
		}
		where += fmt.Sprintf(` (c.profile_name ILIKE $%d OR c.company_custom_name ILIKE $%d OR c.wa_id ILIKE $%d)`, paramIdx, paramIdx+1, paramIdx+2)
		args = append(args, "%"+q+"%", "%"+q+"%", "%"+q+"%")
	}

	countQuery := `SELECT COUNT(*) FROM contacts c` + join + where
	var total int
	if err := r.pool.QueryRow(ctx, countQuery, args...).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("count contacts: %w", err)
	}

	args = append(args, limit, offset)
	rows, err := r.pool.Query(ctx, `
		SELECT `+contactCols+` FROM contacts c`+join+where+`
		ORDER BY c.last_customer_message_at DESC NULLS LAST
		LIMIT $`+fmt.Sprintf("%d", len(args)-1)+` OFFSET $`+fmt.Sprintf("%d", len(args)), args...)
	if err != nil {
		return nil, 0, fmt.Errorf("list contacts: %w", err)
	}
	defer rows.Close()

	var contacts []*model.Contact
	for rows.Next() {
		c, err := scanContact(rows)
		if err != nil {
			return nil, 0, fmt.Errorf("scan contact: %w", err)
		}
		contacts = append(contacts, c)
	}
	return contacts, total, nil
}

func (r *ContactRepository) Update(ctx context.Context, waID, phoneNumberID string, customName *string) (*model.Contact, error) {
	c, err := scanContact(r.pool.QueryRow(ctx, `
		UPDATE contacts SET
			company_custom_name = COALESCE($3, company_custom_name)
		WHERE wa_id = $1 AND phone_number_id = $2
		RETURNING `+contactCols+`
	`, waID, phoneNumberID, customName))
	if err == pgx.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("update contact: %w", err)
	}
	return c, nil
}

func (r *ContactRepository) Block(ctx context.Context, waID, phoneNumberID string) (*model.Contact, error) {
	now := time.Now()
	c, err := scanContact(r.pool.QueryRow(ctx, `
		UPDATE contacts SET is_blocked = TRUE, blocked_at = $3
		WHERE wa_id = $1 AND phone_number_id = $2
		RETURNING `+contactCols+`
	`, waID, phoneNumberID, now))
	if err == pgx.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("block contact: %w", err)
	}
	return c, nil
}

func (r *ContactRepository) Unblock(ctx context.Context, waID, phoneNumberID string) (*model.Contact, error) {
	c, err := scanContact(r.pool.QueryRow(ctx, `
		UPDATE contacts SET is_blocked = FALSE, blocked_at = NULL
		WHERE wa_id = $1 AND phone_number_id = $2
		RETURNING `+contactCols+`
	`, waID, phoneNumberID))
	if err == pgx.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("unblock contact: %w", err)
	}
	return c, nil
}
