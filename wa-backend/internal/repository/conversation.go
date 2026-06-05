package repository

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/ferdinandanggris/wa-backend/internal/model"
)

type ConversationRepository struct {
	pool *pgxpool.Pool
}

func NewConversationRepository(pool *pgxpool.Pool) *ConversationRepository {
	return &ConversationRepository{pool: pool}
}

const convCols = `c.id, c.phone_number_id, c.wa_id, COALESCE(ct.profile_name, ''), ct.company_custom_name, COALESCE(ct.is_blocked, FALSE), c.last_message_at, c.last_message_preview, c.unread_count, COALESCE(wpn.display_name, ''), COALESCE(wpn.display_phone_number, ''), NOT EXISTS(SELECT 1 FROM messages m WHERE m.phone_number_id = c.phone_number_id AND m.wa_id = c.wa_id AND m.direction = 'INBOUND' AND m.type != 'system' AND m.type != 'unsupported' AND m.timestamp > NOW() - INTERVAL '24 hours') AS is_template_required`

func scanConversation(s pgx.Row) (*model.Conversation, error) {
	var cv model.Conversation
	err := s.Scan(&cv.ID, &cv.PhoneNumberID, &cv.WaID, &cv.ProfileName,
		&cv.CompanyCustomName, &cv.IsBlocked, &cv.LastMessageAt, &cv.LastMessagePreview, &cv.UnreadCount, &cv.DisplayName, &cv.DisplayPhoneNumber, &cv.IsTemplateRequired)
	if err != nil {
		return nil, err
	}
	return &cv, nil
}

func (r *ConversationRepository) Upsert(ctx context.Context, phoneNumberID, waID, preview string, incrementUnread bool) (*model.Conversation, error) {
	var id string
	err := r.pool.QueryRow(ctx, `
		INSERT INTO conversations (phone_number_id, wa_id, last_message_at, last_message_preview, unread_count)
		VALUES ($1, $2, NOW(), $3, 1)
		ON CONFLICT (phone_number_id, wa_id)
		DO UPDATE SET
			last_message_at = NOW(),
			last_message_preview = $3,
			unread_count = conversations.unread_count + (CASE WHEN $4 THEN 1 ELSE 0 END)
		RETURNING id
	`, phoneNumberID, waID, preview, incrementUnread).Scan(&id)
	if err != nil {
		return nil, fmt.Errorf("upsert conversation: %w", err)
	}

	cv, err := scanConversation(r.pool.QueryRow(ctx, `
		SELECT `+convCols+`
		FROM conversations c
		LEFT JOIN contacts ct ON c.wa_id = ct.wa_id AND c.phone_number_id = ct.phone_number_id
		LEFT JOIN wa_phone_numbers wpn ON c.phone_number_id = wpn.phone_number_id
		WHERE c.id = $1
	`, id))
	if err != nil {
		return nil, fmt.Errorf("upsert conversation: select: %w", err)
	}
	return cv, nil
}

func (r *ConversationRepository) GetByID(ctx context.Context, id string) (*model.Conversation, error) {
	cv, err := scanConversation(r.pool.QueryRow(ctx, `
		SELECT `+convCols+`
		FROM conversations c
		LEFT JOIN contacts ct ON c.wa_id = ct.wa_id AND c.phone_number_id = ct.phone_number_id
		LEFT JOIN wa_phone_numbers wpn ON c.phone_number_id = wpn.phone_number_id
		WHERE c.id = $1
	`, id))
	if err == pgx.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("get conversation: %w", err)
	}
	return cv, nil
}

func (r *ConversationRepository) List(ctx context.Context, companyID *int64, phoneNumberID, filter string, page, limit int) ([]*model.Conversation, int, error) {
	offset := (page - 1) * limit
	join := `FROM conversations c LEFT JOIN contacts ct ON c.wa_id = ct.wa_id AND c.phone_number_id = ct.phone_number_id LEFT JOIN wa_phone_numbers wpn ON c.phone_number_id = wpn.phone_number_id`
	where := ""
	args := []interface{}{}

	if companyID != nil {
		where = ` WHERE wpn.company_id = $1`
		args = append(args, *companyID)
	}
	if phoneNumberID != "" {
		pn := fmt.Sprintf(`$%d`, len(args)+1)
		if where == "" {
			where = ` WHERE c.phone_number_id = ` + pn
		} else {
			where += ` AND c.phone_number_id = ` + pn
		}
		args = append(args, phoneNumberID)
	}

	switch filter {
	case "unread":
		if where == "" {
			where = " WHERE"
		} else {
			where += " AND"
		}
		where += fmt.Sprintf(` c.unread_count > 0`)
	case "read":
		if where == "" {
			where = " WHERE"
		} else {
			where += " AND"
		}
		where += fmt.Sprintf(` c.unread_count = 0`)
	}

	countQuery := `SELECT COUNT(*) ` + join + where
	var total int
	if err := r.pool.QueryRow(ctx, countQuery, args...).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("count conversations: %w", err)
	}

	args = append(args, limit, offset)
	rows, err := r.pool.Query(ctx, `
		SELECT `+convCols+` `+join+where+`
		ORDER BY c.last_message_at DESC NULLS LAST
		LIMIT $`+fmt.Sprintf("%d", len(args)-1)+` OFFSET $`+fmt.Sprintf("%d", len(args)), args...)
	if err != nil {
		return nil, 0, fmt.Errorf("list conversations: %w", err)
	}
	defer rows.Close()

	var convs []*model.Conversation
	for rows.Next() {
		cv, err := scanConversation(rows)
		if err != nil {
			return nil, 0, fmt.Errorf("scan conversation: %w", err)
		}
		convs = append(convs, cv)
	}
	return convs, total, nil
}

func (r *ConversationRepository) ResetUnread(ctx context.Context, id string) error {
	_, err := r.pool.Exec(ctx, "UPDATE conversations SET unread_count = 0 WHERE id = $1", id)
	if err != nil {
		return fmt.Errorf("reset unread: %w", err)
	}
	return nil
}
