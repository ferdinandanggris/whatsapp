package repository

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/ferdinandanggris/wa-backend/internal/model"
)

type MessageRepository struct {
	pool *pgxpool.Pool
}

func NewMessageRepository(pool *pgxpool.Pool) *MessageRepository {
	return &MessageRepository{pool: pool}
}

func (r *MessageRepository) Save(ctx context.Context, m *model.Message) error {
	_, err := r.pool.Exec(ctx, `
		INSERT INTO messages (wamid, phone_number_id, wa_id, direction, type, content, status, timestamp, agent_id)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		ON CONFLICT (wamid) DO NOTHING
	`, m.WamID, m.PhoneNumberID, m.WaID, m.Direction, m.Type, m.Content, m.Status, m.Timestamp, m.AgentID)
	if err != nil {
		return fmt.Errorf("save message: %w", err)
	}
	return nil
}

func (r *MessageRepository) GetByWamID(ctx context.Context, wamid string) (*model.Message, error) {
	var m model.Message
	err := r.pool.QueryRow(ctx, `
		SELECT wamid, phone_number_id, wa_id, direction, type, content, status, timestamp, error_code, agent_id
		FROM messages WHERE wamid = $1
	`, wamid).Scan(&m.WamID, &m.PhoneNumberID, &m.WaID, &m.Direction, &m.Type,
		&m.Content, &m.Status, &m.Timestamp, &m.ErrorCode, &m.AgentID)
	if err == pgx.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("get message by wamid: %w", err)
	}
	return &m, nil
}

func (r *MessageRepository) UpdateStatus(ctx context.Context, wamid, status string, errorCode *int) error {
	_, err := r.pool.Exec(ctx, `
		UPDATE messages SET status = $1, error_code = $2 WHERE wamid = $3
	`, status, errorCode, wamid)
	if err != nil {
		return fmt.Errorf("update message status: %w", err)
	}
	return nil
}

func (r *MessageRepository) ListByConversation(ctx context.Context, phoneNumberID, waID string, limit, offset int) ([]*model.Message, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT wamid, phone_number_id, wa_id, direction, type, content, status, timestamp, error_code, agent_id
		FROM messages
		WHERE phone_number_id = $1 AND wa_id = $2
		ORDER BY timestamp DESC
		LIMIT $3 OFFSET $4
	`, phoneNumberID, waID, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("list messages: %w", err)
	}
	defer rows.Close()

	var msgs []*model.Message
	for rows.Next() {
		var m model.Message
		if err := rows.Scan(&m.WamID, &m.PhoneNumberID, &m.WaID, &m.Direction, &m.Type,
			&m.Content, &m.Status, &m.Timestamp, &m.ErrorCode, &m.AgentID); err != nil {
			return nil, fmt.Errorf("scan message: %w", err)
		}
		msgs = append(msgs, &m)
	}
	return msgs, nil
}

func MustJSON(v interface{}) json.RawMessage {
	b, err := json.Marshal(v)
	if err != nil {
		panic("must json: " + err.Error())
	}
	return b
}
