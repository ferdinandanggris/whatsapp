package model

import (
	"encoding/json"
	"time"
)

type Template struct {
	ID             string          `json:"id"`
	Name           string          `json:"name"`
	Category       string          `json:"category"`
	Language       string          `json:"language"`
	Status         string          `json:"status"`
	Components     json.RawMessage `json:"components"`
	MetaTemplateID *string         `json:"meta_template_id,omitempty"`
	CreatedAt      time.Time       `json:"created_at"`
	UpdatedAt      time.Time       `json:"updated_at"`
}
