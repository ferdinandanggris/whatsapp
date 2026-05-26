package model

import "time"

type User struct {
	ID           string    `json:"id"`
	Role         string    `json:"role"`
	CompanyID    *int64    `json:"company_id,omitempty"`
	Email        string    `json:"email"`
	PasswordHash string    `json:"-"`
	DisplayName  string    `json:"display_name"`
	IsActive     bool      `json:"is_active"`
	CreatedAt    time.Time `json:"created_at"`
}
