package service

import (
	"context"
	"fmt"
	"time"

	"github.com/ferdinandanggris/wa-backend/internal/repository"
)

type WindowService struct {
	contacts *repository.ContactRepository
}

func NewWindowService(contacts *repository.ContactRepository) *WindowService {
	return &WindowService{contacts: contacts}
}

func (s *WindowService) CanSendText(ctx context.Context, phoneNumberID, waID string) (bool, error) {
	contact, err := s.contacts.GetByID(ctx, waID, phoneNumberID)
	if err != nil {
		return false, fmt.Errorf("check window: %w", err)
	}
	if contact == nil || contact.LastCustomerMessageAt == nil {
		return false, nil
	}
	return time.Since(*contact.LastCustomerMessageAt) < 24*time.Hour, nil
}
