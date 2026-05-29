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
		SELECT m.wamid, m.phone_number_id, m.wa_id, m.direction, m.type, m.content, m.status, m.timestamp, m.error_code, m.agent_id,
		       COALESCE(u.display_name, '')
		FROM messages m
		LEFT JOIN users u ON m.agent_id = u.id
		WHERE m.wamid = $1
	`, wamid).Scan(&m.WamID, &m.PhoneNumberID, &m.WaID, &m.Direction, &m.Type,
		&m.Content, &m.Status, &m.Timestamp, &m.ErrorCode, &m.AgentID,
		&m.AgentName)
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
		SELECT m.wamid, m.phone_number_id, m.wa_id, m.direction, m.type, m.content, m.status, m.timestamp, m.error_code, m.agent_id,
		       COALESCE(u.display_name, '')
		FROM messages m
		LEFT JOIN users u ON m.agent_id = u.id
		WHERE m.phone_number_id = $1 AND m.wa_id = $2
		ORDER BY m.timestamp DESC
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
			&m.Content, &m.Status, &m.Timestamp, &m.ErrorCode, &m.AgentID,
			&m.AgentName); err != nil {
			return nil, fmt.Errorf("scan message: %w", err)
		}
		msgs = append(msgs, &m)
	}
	return msgs, nil
}

func (r *MessageRepository) GetByWamIDs(ctx context.Context, wamids []string) (map[string]*model.Message, error) {
	if len(wamids) == 0 {
		return nil, nil
	}
	rows, err := r.pool.Query(ctx, `
		SELECT m.wamid, m.phone_number_id, m.wa_id, m.direction, m.type, m.content, m.status, m.timestamp, m.error_code, m.agent_id,
		       COALESCE(u.display_name, '')
		FROM messages m
		LEFT JOIN users u ON m.agent_id = u.id
		WHERE m.wamid = ANY($1)
	`, wamids)
	if err != nil {
		return nil, fmt.Errorf("get messages by wamids: %w", err)
	}
	defer rows.Close()

	result := make(map[string]*model.Message, len(wamids))
	for rows.Next() {
		var m model.Message
		if err := rows.Scan(&m.WamID, &m.PhoneNumberID, &m.WaID, &m.Direction, &m.Type,
			&m.Content, &m.Status, &m.Timestamp, &m.ErrorCode, &m.AgentID,
			&m.AgentName); err != nil {
			return nil, fmt.Errorf("scan message: %w", err)
		}
		result[m.WamID] = &m
	}
	return result, nil
}

func (r *MessageRepository) GetLatestInboundByConversation(ctx context.Context, phoneNumberID, waID string) (*model.Message, error) {
	var m model.Message
	err := r.pool.QueryRow(ctx, `
		SELECT m.wamid, m.phone_number_id, m.wa_id, m.direction, m.type, m.content, m.status, m.timestamp, m.error_code, m.agent_id,
		       COALESCE(u.display_name, '')
		FROM messages m
		LEFT JOIN users u ON m.agent_id = u.id
		WHERE m.phone_number_id = $1 AND m.wa_id = $2 AND m.direction = 'inbound'
		ORDER BY m.timestamp DESC
		LIMIT 1
	`, phoneNumberID, waID).Scan(&m.WamID, &m.PhoneNumberID, &m.WaID, &m.Direction, &m.Type,
		&m.Content, &m.Status, &m.Timestamp, &m.ErrorCode, &m.AgentID,
		&m.AgentName)
	if err == pgx.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("get latest inbound: %w", err)
	}
	return &m, nil
}

func MustJSON(v interface{}) json.RawMessage {
	b, err := json.Marshal(v)
	if err != nil {
		panic("must json: " + err.Error())
	}
	return b
}
