package model

import (
	"encoding/json"
	"time"
)

type Contact struct {
	WaID                  string     `json:"wa_id"`
	PhoneNumberID         string     `json:"phone_number_id"`
	ProfileName           string     `json:"profile_name"`
	CompanyCustomName     *string    `json:"company_custom_name,omitempty"`
	IsBlocked             bool       `json:"is_blocked"`
	BlockedAt             *time.Time `json:"blocked_at,omitempty"`
	LastCustomerMessageAt *time.Time `json:"last_customer_message_at,omitempty"`
}

type Message struct {
	ID            int64           `json:"id"`
	WamID         string          `json:"wamid"`
	PhoneNumberID string          `json:"phone_number_id"`
	WaID          string          `json:"wa_id"`
	Direction     string          `json:"direction"`
	Type          string          `json:"type"`
	Content       json.RawMessage `json:"content"`
	Status        string          `json:"status"`
	Timestamp     time.Time       `json:"timestamp"`
	ErrorCode     *int            `json:"error_code,omitempty"`
	AgentID       *string         `json:"agent_id,omitempty"`

	// Reply enrichment (not stored in DB, populated at query time)
	ReplyWamID string `json:"reply_wamid,omitempty"`
	ReplyText  string `json:"reply_text,omitempty"`
	ReplyName  string `json:"reply_name,omitempty"`

	// Agent name enrichment (JOINed from users table at query time)
	AgentName    string `json:"agent_name,omitempty"`
	CustomerName string `json:"customer_name,omitempty"`

	// Template definition (JOINed from templates table at query time for type=template)
	TemplateDefinition interface{} `json:"template_definition,omitempty"`
}

type Conversation struct {
	ID                 string     `json:"id"`
	PhoneNumberID      string     `json:"phone_number_id"`
	WaID               string     `json:"wa_id"`
	ProfileName        string     `json:"profile_name"`
	CompanyCustomName  *string    `json:"company_custom_name,omitempty"`
	IsBlocked          bool       `json:"is_blocked"`
	LastMessageAt      *time.Time `json:"last_message_at,omitempty"`
	LastMessagePreview string     `json:"last_message_preview,omitempty"`
	UnreadCount        int        `json:"unread_count"`
	DisplayName        string     `json:"display_name"`
	DisplayPhoneNumber string     `json:"display_phone_number,omitempty"`
	IsTemplateRequired bool       `json:"is_template_required"`
}
