package service

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"

	wapi "github.com/ferdinandanggris/wapi"
	"github.com/ferdinandanggris/wapi/types"

	"github.com/ferdinandanggris/wa-backend/internal/model"
	"github.com/ferdinandanggris/wa-backend/internal/repository"
)

type TemplateService struct {
	repo   *repository.TemplateRepository
	wapi   wapi.Client
	http   *http.Client
	token  string
	wabaID string
}

func NewTemplateService(repo *repository.TemplateRepository, wapiClient wapi.Client, token, wabaID string) *TemplateService {
	return &TemplateService{repo: repo, wapi: wapiClient, http: &http.Client{}, token: token, wabaID: wabaID}
}

type SyncResult struct {
	Synced  int `json:"synced"`
	Created int `json:"created"`
	Updated int `json:"updated"`
}

func (s *TemplateService) Sync(ctx context.Context, wabaID string) (*SyncResult, error) {
	list, err := s.wapi.ListTemplates(ctx, wabaID)
	if err != nil {
		return nil, fmt.Errorf("sync: list templates: %w", err)
	}

	res := &SyncResult{Synced: len(list.Data)}
	for _, t := range list.Data {
		compJSON, _ := json.Marshal(t.Components)
		mtID := t.ID

		mt := &model.Template{
			Name:           t.Name,
			Category:       t.Category,
			Language:       t.Language,
			Status:         t.Status,
			Components:     compJSON,
			MetaTemplateID: &mtID,
		}

		created, err := s.repo.Upsert(ctx, mt)
		if err != nil {
			slog.Error("sync: upsert template", "name", t.Name, "lang", t.Language, "error", err)
			continue
		}
		if created {
			res.Created++
		} else {
			res.Updated++
		}
	}
	return res, nil
}

type CreateTemplateRequest struct {
	Name       string                     `json:"name"`
	Category   string                     `json:"category"`
	Language   string                     `json:"language"`
	Components []*types.TemplateComponent `json:"components"`
}

func (s *TemplateService) Create(ctx context.Context, wabaID string, req CreateTemplateRequest) (*model.Template, error) {
	tpl := &types.Template{
		Name:       req.Name,
		Category:   req.Category,
		Language:   req.Language,
		Components: req.Components,
	}

	created, err := s.wapi.CreateTemplate(ctx, wabaID, tpl)
	if err != nil {
		return nil, fmt.Errorf("create template on meta: %w", err)
	}

	compJSON, _ := json.Marshal(req.Components)
	mtID := created.ID

	mt := &model.Template{
		Name:           req.Name,
		Category:       req.Category,
		Language:       req.Language,
		Status:         created.Status,
		Components:     compJSON,
		MetaTemplateID: &mtID,
	}

	if err := s.repo.Create(ctx, mt); err != nil {
		slog.Error("create template: save to db", "error", err)
	}
	return mt, nil
}

type UpdateTemplateRequest struct {
	Category   string                     `json:"category,omitempty"`
	Language   string                     `json:"language,omitempty"`
	Components []*types.TemplateComponent `json:"components,omitempty"`
}

func (s *TemplateService) Update(ctx context.Context, id string, req UpdateTemplateRequest) (*model.Template, error) {
	existing, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("update: get template: %w", err)
	}
	if existing == nil {
		return nil, fmt.Errorf("template not found")
	}

	metaID := ""
	if existing.MetaTemplateID != nil {
		metaID = *existing.MetaTemplateID
	}

	if metaID != "" {
		if err := s.editTemplateDirect(ctx, metaID, req.Category, req.Components); err != nil {
			return nil, fmt.Errorf("update template on meta: %w", err)
		}
	}

	if req.Category != "" {
		existing.Category = req.Category
	}
	if req.Components != nil {
		compJSON, _ := json.Marshal(req.Components)
		existing.Components = compJSON
	}
	existing.Status = "PENDING"

	if err := s.repo.Update(ctx, existing); err != nil {
		slog.Error("update template: save to db", "error", err)
	}
	return existing, nil
}

func (s *TemplateService) editTemplateDirect(ctx context.Context, metaID, category string, components []*types.TemplateComponent) error {
	bodyMap := map[string]interface{}{"components": components}
	if category != "" {
		bodyMap["category"] = category
	}
	body, _ := json.Marshal(bodyMap)

	url := fmt.Sprintf("https://graph.facebook.com/v21.0/%s", metaID)
	req, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("create request: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+s.token)
	req.Header.Set("Content-Type", "application/json")

	resp, err := s.http.Do(req)
	if err != nil {
		return fmt.Errorf("send: %w", err)
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	if resp.StatusCode >= 400 {
		var merr struct{ Error struct{ Message string } }
		json.Unmarshal(respBody, &merr)
		msg := merr.Error.Message
		if msg == "" {
			msg = string(respBody)
		}
		return fmt.Errorf("HTTP %d: %s", resp.StatusCode, msg)
	}
	return nil
}

func (s *TemplateService) Delete(ctx context.Context, id string) error {
	existing, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return fmt.Errorf("delete: get template: %w", err)
	}
	if existing == nil {
		return fmt.Errorf("template not found")
	}

	if err := s.wapi.DeleteTemplate(ctx, s.wabaID, existing.Name); err != nil {
		slog.Error("delete template from meta", "name", existing.Name, "error", err)
	}

	return s.repo.Delete(ctx, id)
}
