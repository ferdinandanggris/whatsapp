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

type MessageFilter struct {
	Q         string // text search (ILIKE on content::text)
	Type      string // message type (text, image, etc.)
	Direction string // inbound / outbound
}

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
		SELECT m.id, m.wamid, m.phone_number_id, m.wa_id, m.direction, m.type, m.content, m.status, m.timestamp, m.error_code, m.agent_id,
		       COALESCE(u.display_name, ''),
		       tpl.components
		FROM messages m
		LEFT JOIN users u ON m.agent_id = u.id
		LEFT JOIN templates tpl ON m.type = 'template' AND tpl.name = COALESCE(m.content->'template'->>'name', m.content->>'body')
			AND (m.content->'template'->'language'->>'code' IS NULL OR tpl.language = m.content->'template'->'language'->>'code')
		WHERE m.wamid = $1
	`, wamid).Scan(&m.ID, &m.WamID, &m.PhoneNumberID, &m.WaID, &m.Direction, &m.Type,
		&m.Content, &m.Status, &m.Timestamp, &m.ErrorCode, &m.AgentID,
		&m.AgentName, &m.TemplateDefinition)
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

func (r *MessageRepository) ListByConversation(ctx context.Context, phoneNumberID, waID string, limit int, cursorTs *time.Time, cursorID *int64, filter *MessageFilter) ([]*model.Message, bool, *time.Time, *int64, error) {
	// Query limit+1 to detect has_more
	qlimit := limit + 1
	cond := `WHERE m.phone_number_id = $1 AND m.wa_id = $2`
	args := []interface{}{phoneNumberID, waID}
	p := 3 // next param index

	if cursorTs != nil && cursorID != nil {
		cond += fmt.Sprintf(` AND (m.timestamp, m.id) < ($%d, $%d)`, p, p+1)
		args = append(args, *cursorTs, *cursorID)
		p += 2
	}

	if filter != nil {
		if filter.Type != "" {
			cond += fmt.Sprintf(` AND m.type = $%d`, p)
			args = append(args, filter.Type)
			p++
		}
		if filter.Direction != "" {
			cond += fmt.Sprintf(` AND m.direction = $%d`, p)
			args = append(args, filter.Direction)
			p++
		}
		if filter.Q != "" {
			cond += fmt.Sprintf(` AND m.content::text ILIKE $%d`, p)
			args = append(args, "%"+filter.Q+"%")
			p++
		}
	}

	args = append(args, qlimit)

	rows, err := r.pool.Query(ctx, `
		SELECT m.id, m.wamid, m.phone_number_id, m.wa_id, m.direction, m.type, m.content, m.status, m.timestamp, m.error_code, m.agent_id,
		       COALESCE(u.display_name, ''),
		       tpl.components
		FROM messages m
		LEFT JOIN users u ON m.agent_id = u.id
		LEFT JOIN templates tpl ON m.type = 'template' AND tpl.name = COALESCE(m.content->'template'->>'name', m.content->>'body')
			AND (m.content->'template'->'language'->>'code' IS NULL OR tpl.language = m.content->'template'->'language'->>'code')
		`+cond+`
		ORDER BY m.timestamp DESC, m.id DESC
		LIMIT $`+fmt.Sprintf("%d", p), args...)
	if err != nil {
		return nil, false, nil, nil, fmt.Errorf("list messages: %w", err)
	}
	defer rows.Close()

	var msgs []*model.Message
	for rows.Next() {
		var m model.Message
		if err := rows.Scan(&m.ID, &m.WamID, &m.PhoneNumberID, &m.WaID, &m.Direction, &m.Type,
			&m.Content, &m.Status, &m.Timestamp, &m.ErrorCode, &m.AgentID,
			&m.AgentName, &m.TemplateDefinition); err != nil {
			return nil, false, nil, nil, fmt.Errorf("scan message: %w", err)
		}
		msgs = append(msgs, &m)
	}

	hasMore := len(msgs) > limit
	if hasMore {
		msgs = msgs[:limit]
	}
	var nextCursorTs *time.Time
	var nextCursorID *int64
	if hasMore && len(msgs) > 0 {
		last := msgs[len(msgs)-1]
		nextCursorTs = &last.Timestamp
		nextCursorID = &last.ID
	}
	return msgs, hasMore, nextCursorTs, nextCursorID, nil
}

func (r *MessageRepository) GetByWamIDs(ctx context.Context, wamids []string) (map[string]*model.Message, error) {
	if len(wamids) == 0 {
		return nil, nil
	}
	rows, err := r.pool.Query(ctx, `
		SELECT m.id, m.wamid, m.phone_number_id, m.wa_id, m.direction, m.type, m.content, m.status, m.timestamp, m.error_code, m.agent_id,
		       COALESCE(u.display_name, ''), COALESCE(c.company_custom_name, ''),
		       tpl.components
		FROM messages m
		LEFT JOIN contacts c ON m.phone_number_id = c.phone_number_id
		LEFT JOIN users u ON m.agent_id = u.id
		LEFT JOIN templates tpl ON m.type = 'template' AND tpl.name = COALESCE(m.content->'template'->>'name', m.content->>'body')
			AND (m.content->'template'->'language'->>'code' IS NULL OR tpl.language = m.content->'template'->'language'->>'code')
		WHERE m.wamid = ANY($1)
	`, wamids)
	if err != nil {
		return nil, fmt.Errorf("get messages by wamids: %w", err)
	}
	defer rows.Close()

	result := make(map[string]*model.Message, len(wamids))
	for rows.Next() {
		var m model.Message
		if err := rows.Scan(&m.ID, &m.WamID, &m.PhoneNumberID, &m.WaID, &m.Direction, &m.Type,
			&m.Content, &m.Status, &m.Timestamp, &m.ErrorCode, &m.AgentID,
			&m.AgentName, &m.CustomerName, &m.TemplateDefinition); err != nil {
			return nil, fmt.Errorf("scan message: %w", err)
		}
		result[m.WamID] = &m
	}
	return result, nil
}

func (r *MessageRepository) GetLatestInboundByConversation(ctx context.Context, phoneNumberID, waID string) (*model.Message, error) {
	var m model.Message
	err := r.pool.QueryRow(ctx, `
		SELECT m.id, m.wamid, m.phone_number_id, m.wa_id, m.direction, m.type, m.content, m.status, m.timestamp, m.error_code, m.agent_id,
		       COALESCE(u.display_name, ''),
		       tpl.components
		FROM messages m
		LEFT JOIN users u ON m.agent_id = u.id
		LEFT JOIN templates tpl ON m.type = 'template' AND tpl.name = COALESCE(m.content->'template'->>'name', m.content->>'body')
			AND (m.content->'template'->'language'->>'code' IS NULL OR tpl.language = m.content->'template'->'language'->>'code')
		WHERE m.phone_number_id = $1 AND m.wa_id = $2 AND m.direction = 'inbound'
		ORDER BY m.timestamp DESC
		LIMIT 1
	`, phoneNumberID, waID).Scan(&m.ID, &m.WamID, &m.PhoneNumberID, &m.WaID, &m.Direction, &m.Type,
		&m.Content, &m.Status, &m.Timestamp, &m.ErrorCode, &m.AgentID,
		&m.AgentName, &m.TemplateDefinition)
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
