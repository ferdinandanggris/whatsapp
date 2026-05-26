package service

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"

	"github.com/ferdinandanggris/wa-backend/internal/config"
	"github.com/ferdinandanggris/wa-backend/internal/model"
	"github.com/ferdinandanggris/wa-backend/internal/repository"
)

var (
	ErrInvalidCredentials = errors.New("invalid email or password")
	ErrUserInactive       = errors.New("user is inactive")
	ErrNotAuthenticated   = errors.New("not authenticated")
)

type Claims struct {
	UserID    string `json:"user_id"`
	Email     string `json:"email"`
	Role      string `json:"role"`
	CompanyID *int64 `json:"company_id"`
	jwt.RegisteredClaims
}

type AuthService struct {
	users  *repository.UserRepository
	secret string
}

func NewAuthService(users *repository.UserRepository, cfg *config.Config) *AuthService {
	return &AuthService{
		users:  users,
		secret: cfg.JWTSecret,
	}
}

func (s *AuthService) Login(ctx context.Context, email, password string) (*model.User, string, error) {
	user, err := s.users.FindByEmail(ctx, email)
	if err != nil {
		return nil, "", fmt.Errorf("login: %w", err)
	}
	if user == nil {
		return nil, "", ErrInvalidCredentials
	}
	if !user.IsActive {
		return nil, "", ErrUserInactive
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		return nil, "", ErrInvalidCredentials
	}

	token, err := s.generateToken(user)
	if err != nil {
		return nil, "", fmt.Errorf("generate token: %w", err)
	}

	return user, token, nil
}

func (s *AuthService) ValidateToken(tokenString string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
		}
		return []byte(s.secret), nil
	})
	if err != nil {
		return nil, fmt.Errorf("parse token: %w", err)
	}

	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, ErrNotAuthenticated
	}

	return claims, nil
}

func (s *AuthService) generateToken(user *model.User) (string, error) {
	claims := &Claims{
		UserID:    user.ID,
		Email:     user.Email,
		Role:      user.Role,
		CompanyID: user.CompanyID,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(15 * time.Minute)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "wa-center",
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(s.secret))
}

func HashPassword(password string) (string, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", fmt.Errorf("hash password: %w", err)
	}
	return string(hash), nil
}
