package repository

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/ferdinandanggris/wa-backend/internal/model"
)

type UserRepository struct {
	pool *pgxpool.Pool
}

func NewUserRepository(pool *pgxpool.Pool) *UserRepository {
	return &UserRepository{pool: pool}
}

func (r *UserRepository) FindByEmail(ctx context.Context, email string) (*model.User, error) {
	query := `SELECT id, role, company_id, email, password_hash, display_name, is_active, created_at
		FROM users WHERE email = $1`

	var u model.User
	err := r.pool.QueryRow(ctx, query, email).Scan(
		&u.ID, &u.Role, &u.CompanyID, &u.Email,
		&u.PasswordHash, &u.DisplayName, &u.IsActive, &u.CreatedAt,
	)
	if err == pgx.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("find user by email: %w", err)
	}
	return &u, nil
}

func (r *UserRepository) FindByID(ctx context.Context, id string) (*model.User, error) {
	query := `SELECT id, role, company_id, email, password_hash, display_name, is_active, created_at
		FROM users WHERE id = $1`

	var u model.User
	err := r.pool.QueryRow(ctx, query, id).Scan(
		&u.ID, &u.Role, &u.CompanyID, &u.Email,
		&u.PasswordHash, &u.DisplayName, &u.IsActive, &u.CreatedAt,
	)
	if err == pgx.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("find user by id: %w", err)
	}
	return &u, nil
}

func (r *UserRepository) Create(ctx context.Context, u *model.User) error {
	query := `INSERT INTO users (role, company_id, email, password_hash, display_name)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, is_active, created_at`

	err := r.pool.QueryRow(ctx, query,
		u.Role, u.CompanyID, u.Email, u.PasswordHash, u.DisplayName,
	).Scan(&u.ID, &u.IsActive, &u.CreatedAt)
	if err != nil {
		return fmt.Errorf("create user: %w", err)
	}
	return nil
}

func (r *UserRepository) List(ctx context.Context, companyID *int64) ([]*model.User, error) {
	var rows pgx.Rows
	var err error

	if companyID != nil {
		rows, err = r.pool.Query(ctx,
			`SELECT id, role, company_id, email, password_hash, display_name, is_active, created_at
			FROM users WHERE company_id = $1 ORDER BY created_at DESC`, *companyID)
	} else {
		rows, err = r.pool.Query(ctx,
			`SELECT id, role, company_id, email, password_hash, display_name, is_active, created_at
			FROM users ORDER BY created_at DESC`)
	}
	if err != nil {
		return nil, fmt.Errorf("list users: %w", err)
	}
	defer rows.Close()

	var users []*model.User
	for rows.Next() {
		var u model.User
		if err := rows.Scan(&u.ID, &u.Role, &u.CompanyID, &u.Email,
			&u.PasswordHash, &u.DisplayName, &u.IsActive, &u.CreatedAt); err != nil {
			return nil, fmt.Errorf("scan user: %w", err)
		}
		users = append(users, &u)
	}
	return users, nil
}

func (r *UserRepository) CountAll(ctx context.Context) (int, error) {
	var n int
	err := r.pool.QueryRow(ctx, "SELECT COUNT(*) FROM users").Scan(&n)
	if err != nil {
		return 0, fmt.Errorf("count users: %w", err)
	}
	return n, nil
}

func (r *UserRepository) Deactivate(ctx context.Context, id string) error {
	_, err := r.pool.Exec(ctx, "UPDATE users SET is_active = false WHERE id = $1", id)
	if err != nil {
		return fmt.Errorf("deactivate user: %w", err)
	}
	return nil
}

func (r *UserRepository) UpdatePassword(ctx context.Context, id, hash string) error {
	_, err := r.pool.Exec(ctx, "UPDATE users SET password_hash = $1 WHERE id = $2", hash, id)
	if err != nil {
		return fmt.Errorf("update password: %w", err)
	}
	return nil
}

func (r *UserRepository) HasUsers(ctx context.Context) (bool, error) {
	var exists bool
	err := r.pool.QueryRow(ctx, "SELECT EXISTS(SELECT 1 FROM users)").Scan(&exists)
	if err != nil {
		return false, fmt.Errorf("check has users: %w", err)
	}
	return exists, nil
}

type TemplateUser struct {
	ID          string `json:"id"`
	DisplayName string `json:"display_name"`
}

// CreateInitialSuperAdmin creates the first super admin (only when no users exist).
func (r *UserRepository) CreateInitialSuperAdmin(ctx context.Context, email, hash, name string) (*TemplateUser, error) {
	var u TemplateUser
	err := r.pool.QueryRow(ctx,
		`INSERT INTO users (role, email, password_hash, display_name)
		VALUES ('super_admin', $1, $2, $3)
		ON CONFLICT DO NOTHING
		RETURNING id, display_name`,
		email, hash, name,
	).Scan(&u.ID, &u.DisplayName)
	if err != nil {
		return nil, fmt.Errorf("create initial super admin: %w", err)
	}
	return &u, nil
}

// UpdateUser updates display_name, role, company_id, and optionally is_active for a user.
func (r *UserRepository) UpdateUser(ctx context.Context, id, role, displayName string, companyID *int64, isActive *bool) error {
	if isActive != nil {
		_, err := r.pool.Exec(ctx,
			`UPDATE users SET role = $1, display_name = $2, company_id = $3, is_active = $4 WHERE id = $5`,
			role, displayName, companyID, *isActive, id)
		if err != nil {
			return fmt.Errorf("update user: %w", err)
		}
		return nil
	}
	_, err := r.pool.Exec(ctx,
		`UPDATE users SET role = $1, display_name = $2, company_id = $3 WHERE id = $4`,
		role, displayName, companyID, id)
	if err != nil {
		return fmt.Errorf("update user: %w", err)
	}
	return nil
}

