package model

import (
	"time"
)

type Setting struct {
	ID        int64      `json:"id"`
	Name      string     `json:"name"`
	Value     string     `json:"value"`
	Notes     *string    `json:"notes,omitempty"`
	UpdatedAt time.Time  `json:"updated_at"`
	UpdatedBy *string    `json:"updated_by,omitempty"`
}
