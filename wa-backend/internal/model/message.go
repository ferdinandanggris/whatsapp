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
	AssignedAgentID       *string    `json:"assigned_agent_id,omitempty"`
	IsBlocked             bool       `json:"is_blocked"`
	BlockedAt             *time.Time `json:"blocked_at,omitempty"`
	LastCustomerMessageAt *time.Time `json:"last_customer_message_at,omitempty"`
}

type Message struct {
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
}
