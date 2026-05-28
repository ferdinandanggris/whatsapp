package service

import (
	"context"
	"fmt"
	"log/slog"
	"sort"
	"time"

	wapi "github.com/ferdinandanggris/wapi"
	"github.com/ferdinandanggris/wapi/types"

	"github.com/ferdinandanggris/wa-backend/internal/model"
	"github.com/ferdinandanggris/wa-backend/internal/repository"
	"github.com/ferdinandanggris/wa-backend/internal/ws"
)

type WhatsAppService struct {
	client    wapi.Client
	msgs      *repository.MessageRepository
	convRepo  *repository.ConversationRepository
	contacts  *repository.ContactRepository
	windowSvc *WindowService
	hub       *ws.Hub
}

func NewWhatsAppService(client wapi.Client, msgs *repository.MessageRepository, convRepo *repository.ConversationRepository, contacts *repository.ContactRepository, windowSvc *WindowService, hub *ws.Hub) *WhatsAppService {
	return &WhatsAppService{client: client, msgs: msgs, convRepo: convRepo, contacts: contacts, windowSvc: windowSvc, hub: hub}
}

func (s *WhatsAppService) SendText(ctx context.Context, phoneNumberID, to, body, agentID string) (*model.Message, error) {
	if err := s.contacts.EnsureOutboundContact(ctx, to, phoneNumberID); err != nil {
		slog.Error("ensure outbound contact failed", "error", err)
	}

	ok, err := s.windowSvc.CanSendText(ctx, phoneNumberID, to)
	if err != nil {
		return nil, fmt.Errorf("send text: check window: %w", err)
	}
	if !ok {
		return nil, fmt.Errorf("send text: 24h window closed; use template")
	}

	msg := types.NewTextMessage(to, body, false)
	resp, err := s.client.SendMessage(ctx, phoneNumberID, msg)
	if err != nil {
		return nil, fmt.Errorf("send text: %w", err)
	}
	if len(resp.Messages) == 0 {
		return nil, fmt.Errorf("send text: no message id returned")
	}

	out := s.buildOutbound(resp.Messages[0].ID, phoneNumberID, to, "text", body, agentID)
	if err := s.msgs.Save(ctx, out); err != nil {
		slog.Error("save outbound message", "error", err)
	}

	s.convRepo.Upsert(ctx, phoneNumberID, to, truncateStr(body, 100))

	s.broadcastSent(phoneNumberID, out)
	return out, nil
}

type TemplateButtonSpec struct {
	Index   int    `json:"index"`
	SubType string `json:"sub_type"`
}

func (s *WhatsAppService) SendTemplate(ctx context.Context, phoneNumberID, to, templateName, lang string, params map[string]string, buttons []TemplateButtonSpec, agentID string) (*model.Message, error) {
	if err := s.contacts.EnsureOutboundContact(ctx, to, phoneNumberID); err != nil {
		slog.Error("ensure outbound contact failed for template", "error", err)
	}

	components := buildTemplateComponents(params, buttons)

	msg := &types.Message{
		To:   to,
		Type: "template",
		Template: &types.TemplateMessage{
			Name:       templateName,
			Language:   &types.TemplateLanguage{Code: lang},
			Components: components,
		},
	}

	resp, err := s.client.SendMessage(ctx, phoneNumberID, msg)
	if err != nil {
		return nil, fmt.Errorf("send template: %w", err)
	}
	if len(resp.Messages) == 0 {
		return nil, fmt.Errorf("send template: no message id returned")
	}

	content := map[string]interface{}{
		"name":     templateName,
		"language": lang,
	}
	if len(params) > 0 {
		content["params"] = params
	}
	if len(buttons) > 0 {
		content["buttons"] = buttons
	}

	out := &model.Message{
		WamID:         resp.Messages[0].ID,
		PhoneNumberID: phoneNumberID,
		WaID:          to,
		Direction:     "outbound",
		Type:          "template",
		Content:       repository.MustJSON(content),
		Status:        "sent",
		Timestamp:     time.Now(),
		AgentID:       &agentID,
	}
	if err := s.msgs.Save(ctx, out); err != nil {
		slog.Error("save outbound template", "error", err)
	}

	s.convRepo.Upsert(ctx, phoneNumberID, to, "📋 "+templateName)

	s.broadcastSent(phoneNumberID, out)
	return out, nil
}

func (s *WhatsAppService) buildOutbound(wamid, phoneNumberID, to, msgType, content, agentID string) *model.Message {
	return &model.Message{
		WamID:         wamid,
		PhoneNumberID: phoneNumberID,
		WaID:          to,
		Direction:     "outbound",
		Type:          msgType,
		Content:       repository.MustJSON(map[string]string{"body": content}),
		Status:        "sent",
		Timestamp:     time.Now(),
		AgentID:       &agentID,
	}
}

func (s *WhatsAppService) broadcastSent(phoneNumberID string, msg *model.Message) {
	if s.hub == nil {
		return
	}
	s.hub.BroadcastEventToAll(ws.Event{
		Type: "message_sent",
		Data: map[string]interface{}{"message": msg},
	})
}

func buildTemplateComponents(params map[string]string, buttons []TemplateButtonSpec) []*types.TemplateMsgComponent {
	if len(params) == 0 && len(buttons) == 0 {
		return nil
	}
	var comps []*types.TemplateMsgComponent

	if len(params) > 0 {
		keys := make([]string, 0, len(params))
		for k := range params {
			keys = append(keys, k)
		}
		sort.Strings(keys)
		paramsList := make([]*types.TemplateParameter, len(keys))
		for i, k := range keys {
			paramsList[i] = &types.TemplateParameter{Type: "text", Text: params[k]}
		}
		comps = append(comps, &types.TemplateMsgComponent{
			Type: "body", Parameters: paramsList,
		})
	}

	for _, btn := range buttons {
		paramsList := make([]*types.TemplateParameter, 0, len(params))
		for _, k := range sortedKeys(params) {
			paramsList = append(paramsList, &types.TemplateParameter{Type: "text", Text: params[k]})
		}
		comps = append(comps, &types.TemplateMsgComponent{
			Type: "button", SubType: btn.SubType, Index: btn.Index,
			Parameters: paramsList,
		})
	}
	return comps
}

func sortedKeys(m map[string]string) []string {
	keys := make([]string, 0, len(m))
	for k := range m {
		keys = append(keys, k)
	}
	sort.Strings(keys)
	return keys
}

func (s *WhatsAppService) SendMedia(ctx context.Context, phoneNumberID, to, mediaType, mediaID, caption, agentID string) (*model.Message, error) {
	if err := s.contacts.EnsureOutboundContact(ctx, to, phoneNumberID); err != nil {
		slog.Error("ensure outbound contact failed for media", "error", err)
	}

	ok, err := s.windowSvc.CanSendText(ctx, phoneNumberID, to)
	if err != nil {
		return nil, fmt.Errorf("send media: check window: %w", err)
	}
	if !ok {
		return nil, fmt.Errorf("send media: 24h window closed; use template")
	}

	var msg *types.Message
	switch mediaType {
	case "image":
		msg = types.NewImageMessage(to, mediaID, caption)
	case "video":
		msg = types.NewVideoMessage(to, mediaID, caption)
	case "audio":
		msg = types.NewAudioMessage(to, mediaID)
	case "document":
		msg = types.NewDocumentMessage(to, mediaID, "", caption)
	default:
		return nil, fmt.Errorf("unsupported media type: %s", mediaType)
	}

	resp, err := s.client.SendMessage(ctx, phoneNumberID, msg)
	if err != nil {
		return nil, fmt.Errorf("send %s: %w", mediaType, err)
	}
	if len(resp.Messages) == 0 {
		return nil, fmt.Errorf("send %s: no message id returned", mediaType)
	}

	out := &model.Message{
		WamID:         resp.Messages[0].ID,
		PhoneNumberID: phoneNumberID,
		WaID:          to,
		Direction:     "outbound",
		Type:          mediaType,
		Content:       repository.MustJSON(map[string]string{"id": mediaID, "caption": caption}),
		Status:        "sent",
		Timestamp:     time.Now(),
		AgentID:       &agentID,
	}
	if err := s.msgs.Save(ctx, out); err != nil {
		slog.Error("save outbound media", "error", err)
	}

	s.convRepo.Upsert(ctx, phoneNumberID, to, previewEmoji(mediaType))
	s.broadcastSent(phoneNumberID, out)
	return out, nil
}

func previewEmoji(t string) string {
	switch t {
	case "image":
		return "📷 Photo"
	case "video":
		return "🎥 Video"
	case "audio":
		return "🎵 Audio"
	case "document":
		return "📄 Document"
	}
	return "📎 Media"
}

func truncateStr(s string, n int) string {
	runes := []rune(s)
	if len(runes) <= n {
		return s
	}
	return string(runes[:n]) + "..."
}
