package service

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log/slog"
	"sort"
	"strings"
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
	tplRepo   *repository.TemplateRepository
	windowSvc *WindowService
	hub       *ws.Hub
}

func NewWhatsAppService(client wapi.Client, msgs *repository.MessageRepository, convRepo *repository.ConversationRepository, contacts *repository.ContactRepository, tplRepo *repository.TemplateRepository, windowSvc *WindowService, hub *ws.Hub) *WhatsAppService {
	return &WhatsAppService{client: client, msgs: msgs, convRepo: convRepo, contacts: contacts, tplRepo: tplRepo, windowSvc: windowSvc, hub: hub}
}

func (s *WhatsAppService) SendText(ctx context.Context, phoneNumberID, to, body, agentID, contextMessageID string) (*model.Message, error) {
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
	if contextMessageID != "" {
		msg.Context = &types.Context{MessageID: contextMessageID}
	}
	resp, err := s.client.SendMessage(ctx, phoneNumberID, msg)
	if err != nil {
		return s.storeFailedMessage(ctx, msg, phoneNumberID, to, agentID, err.Error()), fmt.Errorf("send text: %w", err)
	}
	if len(resp.Messages) == 0 {
		return nil, fmt.Errorf("send text: no message id returned")
	}

	out := s.storeOutboundMessage(ctx, msg, resp.Messages[0].ID, phoneNumberID, to, agentID)
	return out, nil
}

type TemplateButtonSpec struct {
	Index   int      `json:"index"`
	SubType string   `json:"sub_type"`
	Params  []string `json:"params,omitempty"`
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
		return s.storeFailedMessage(ctx, msg, phoneNumberID, to, agentID, err.Error()), fmt.Errorf("send template: %w", err)
	}
	if len(resp.Messages) == 0 {
		return nil, fmt.Errorf("send template: no message id returned")
	}

	out := s.storeOutboundMessage(ctx, msg, resp.Messages[0].ID, phoneNumberID, to, agentID)
	return out, nil
}

func (s *WhatsAppService) storeOutboundMessage(ctx context.Context, msg *types.Message, wamid, phoneNumberID, to, agentID string) *model.Message {
	out := &model.Message{
		WamID:         wamid,
		PhoneNumberID: phoneNumberID,
		WaID:          to,
		Direction:     "outbound",
		Type:          msg.Type,
		Content:       repository.MustJSON(msg),
		Status:        "sent",
		Timestamp:     time.Now(),
	}
	if agentID != "" {
		out.AgentID = &agentID
	}
	if err := s.msgs.Save(ctx, out); err != nil {
		slog.Error("save outbound message", "error", err)
	}

	// Enrich template messages with template definition for render
	s.enrichTemplateDefinition(ctx, msg, out)

	strAgent := "Agent"
	contact := &model.Contact{CompanyCustomName: &strAgent}

	preview := repository.PreviewText(msg.Type, contact, out.Content)
	if msg.Type == "template" && out.TemplateDefinition != nil {
		if r := renderTemplatePreview(out.TemplateDefinition, out.Content); r != "" {
			preview = r
		}
	}
	s.convRepo.Upsert(ctx, phoneNumberID, to, preview, false, out.Timestamp)
	s.broadcastSent(phoneNumberID, out)
	return out
}

// renderTemplatePreview combines template definition text with message parameters.
// TemplateDefinition has BODY text like "Halo {{1}}, pesanan {{2}} sudah siap"
// Message content has parameters like ["John", "#123"]
// Result: "Halo John, pesanan #123 sudah siap"
func renderTemplatePreview(td interface{}, content json.RawMessage) string {
	// Parse template definition — find BODY text
	tdBytes, err := json.Marshal(td)
	if err != nil {
		return ""
	}
	var defs []struct {
		Type string `json:"type"`
		Text string `json:"text"`
	}
	if err := json.Unmarshal(tdBytes, &defs); err != nil {
		return ""
	}
	bodyText := ""
	for _, d := range defs {
		if d.Type == "BODY" {
			bodyText = d.Text
			break
		}
	}
	if bodyText == "" {
		return ""
	}

	// Parse message content — extract body parameter texts in order
	var msg struct {
		Template *struct {
			Components []struct {
				Type       string `json:"type"`
				Parameters []struct {
					Type string `json:"type"`
					Text string `json:"text"`
				} `json:"parameters"`
			} `json:"components"`
		} `json:"template"`
	}
	if err := json.Unmarshal(content, &msg); err != nil || msg.Template == nil {
		return ""
	}
	var params []string
	for _, c := range msg.Template.Components {
		if c.Type == "body" {
			for _, p := range c.Parameters {
				params = append(params, p.Text)
			}
			break
		}
	}

	// Replace {{1}}, {{2}} etc with actual parameter values
	result := bodyText
	for i, p := range params {
		result = strings.ReplaceAll(result, fmt.Sprintf("{{%d}}", i+1), p)
	}
	return repository.Truncate(result, 100)
}

func (s *WhatsAppService) storeFailedMessage(ctx context.Context, msg *types.Message, phoneNumberID, to, agentID, errorMessage string) *model.Message {
	b := make([]byte, 8)
	rand.Read(b)
	out := &model.Message{
		WamID:         "fail_" + hex.EncodeToString(b),
		PhoneNumberID: phoneNumberID,
		WaID:          to,
		Direction:     "outbound",
		Type:          msg.Type,
		Content:       repository.MustJSON(msg),
		Status:        "failed",
		Timestamp:     time.Now(),
		ErrorMessage:  &errorMessage,
	}
	if agentID != "" {
		out.AgentID = &agentID
	}
	if err := s.msgs.Save(ctx, out); err != nil {
		slog.Error("save failed message", "error", err)
	}

	// Enrich template messages with template definition for render
	s.enrichTemplateDefinition(ctx, msg, out)

	strAgent := "Agent"
	contact := &model.Contact{CompanyCustomName: &strAgent}
	preview := repository.PreviewText(msg.Type, contact, out.Content)
	if msg.Type == "template" && out.TemplateDefinition != nil {
		if r := renderTemplatePreview(out.TemplateDefinition, out.Content); r != "" {
			preview = r
		}
	}
	s.convRepo.Upsert(ctx, phoneNumberID, to, preview, false, out.Timestamp)
	s.broadcastSent(phoneNumberID, out)
	return out
}

func (s *WhatsAppService) enrichTemplateDefinition(ctx context.Context, msg *types.Message, out *model.Message) {
	if msg.Type == "template" && msg.Template != nil {
		if tpl, err := s.tplRepo.GetByName(ctx, msg.Template.Name, msg.Template.Language.Code); err == nil && tpl != nil {
			var td interface{}
			if err := json.Unmarshal(tpl.Components, &td); err == nil {
				out.TemplateDefinition = td
			}
		}
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

	// Body params (numeric keys: "1", "2" etc.)
	var bodyKeys, headerKeys []string
	for k := range params {
		if k == "" {
			continue
		}
		switch k[0] {
		case 'h': // header params: "h1", "h2"
			headerKeys = append(headerKeys, k)
		case '0', '1', '2', '3', '4', '5', '6', '7', '8', '9': // body params
			bodyKeys = append(bodyKeys, k)
		}
	}

	if len(bodyKeys) > 0 {
		sort.Strings(bodyKeys)
		pl := make([]*types.TemplateParameter, len(bodyKeys))
		for i, k := range bodyKeys {
			pl[i] = &types.TemplateParameter{Type: "text", Text: params[k]}
		}
		comps = append(comps, &types.TemplateMsgComponent{Type: "body", Parameters: pl})
	}

	if len(headerKeys) > 0 {
		sort.Strings(headerKeys)
		pl := make([]*types.TemplateParameter, len(headerKeys))
		for i, k := range headerKeys {
			pl[i] = &types.TemplateParameter{Type: "text", Text: params[k]}
		}
		comps = append(comps, &types.TemplateMsgComponent{Type: "header", Parameters: pl})
	}

	for _, btn := range buttons {
		pl := make([]*types.TemplateParameter, 0, len(btn.Params))
		for _, p := range btn.Params {
			pl = append(pl, &types.TemplateParameter{Type: "text", Text: p})
		}
		comps = append(comps, &types.TemplateMsgComponent{
			Type: "button", SubType: btn.SubType, Index: btn.Index,
			Parameters: pl,
		})
	}
	return comps
}

func (s *WhatsAppService) SendMedia(ctx context.Context, phoneNumberID, to, mediaType, mediaID, caption, agentID, contextMessageID string) (*model.Message, error) {
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

	if contextMessageID != "" {
		msg.Context = &types.Context{MessageID: contextMessageID}
	}

	resp, err := s.client.SendMessage(ctx, phoneNumberID, msg)
	if err != nil {
		return s.storeFailedMessage(ctx, msg, phoneNumberID, to, agentID, err.Error()), fmt.Errorf("send %s: %w", mediaType, err)
	}
	if len(resp.Messages) == 0 {
		return nil, fmt.Errorf("send %s: no message id returned", mediaType)
	}

	out := s.storeOutboundMessage(ctx, msg, resp.Messages[0].ID, phoneNumberID, to, agentID)
	return out, nil
}

func (s *WhatsAppService) MarkConversationRead(ctx context.Context, convID string) error {
	conv, err := s.convRepo.GetByID(ctx, convID)
	if err != nil {
		return fmt.Errorf("get conversation: %w", err)
	}
	if conv == nil {
		return fmt.Errorf("conversation not found")
	}

	if err := s.convRepo.ResetUnread(ctx, convID); err != nil {
		return fmt.Errorf("reset unread: %w", err)
	}

	msg, err := s.msgs.GetLatestInboundByConversation(ctx, conv.PhoneNumberID, conv.WaID)
	if err == nil && msg != nil {
		slog.Info("marking message as read", "wamid", msg.WamID)
		if err := s.client.MarkAsRead(ctx, conv.PhoneNumberID, msg.WamID); err != nil {
			slog.Warn("mark as read (non-fatal)", "error", err)
		}
	}

	if s.hub != nil {
		conv.UnreadCount = 0
		s.hub.BroadcastEventToAll(ws.Event{
			Type: "conversation_updated",
			Data: map[string]interface{}{"conversation": conv},
		})
	}

	return nil
}

func (s *WhatsAppService) SendReaction(ctx context.Context, phoneNumberID, to, messageID, emoji string) (*model.Message, error) {
	msg := types.NewReactionMessage(to, messageID, emoji)
	resp, err := s.client.SendMessage(ctx, phoneNumberID, msg)
	if err != nil {
		return s.storeFailedMessage(ctx, msg, phoneNumberID, to, "", err.Error()), fmt.Errorf("send reaction: %w", err)
	}
	if len(resp.Messages) == 0 {
		return nil, fmt.Errorf("send reaction: no message id returned")
	}

	out := s.storeOutboundMessage(ctx, msg, resp.Messages[0].ID, phoneNumberID, to, "")
	return out, nil
}
