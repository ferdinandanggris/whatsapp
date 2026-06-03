package service

import (
	"context"
	"encoding/json"
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
		return nil, fmt.Errorf("send text: %w", err)
	}
	if len(resp.Messages) == 0 {
		return nil, fmt.Errorf("send text: no message id returned")
	}

	out := s.storeOutboundMessage(ctx, msg, resp.Messages[0].ID, phoneNumberID, to, agentID)
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
	//s.convRepo.Upsert(ctx, phoneNumberID, to, previewForType(msg, phoneNumberID, to))

	strAgent := "Agent"
	contact := &model.Contact{CompanyCustomName: &strAgent}

	s.convRepo.Upsert(ctx, phoneNumberID, to, previewText(msg.Type, contact, out.Content), false)
	s.broadcastSent(phoneNumberID, out)
	return out
}

func previewText(msgType string, contact *model.Contact, content json.RawMessage) string {
	switch msgType {
	case "text":
		var t struct {
			Text *struct {
				Body string `json:"body"`
			} `json:"text"`
		}
		if json.Unmarshal(content, &t) == nil && t.Text != nil && t.Text.Body != "" {
			return truncate(t.Text.Body, 100)
		}
	case "image":
		var i struct {
			Image *struct {
				Caption string `json:"caption"`
			} `json:"image"`
		}
		if json.Unmarshal(content, &i) == nil && i.Image != nil && i.Image.Caption != "" {
			return "📷 " + truncate(i.Image.Caption, 100)
		}
		return "📷 Photo"
	case "video":
		var v struct {
			Video *struct {
				Caption string `json:"caption"`
			} `json:"video"`
		}
		if json.Unmarshal(content, &v) == nil && v.Video != nil && v.Video.Caption != "" {
			return "🎥 " + truncate(v.Video.Caption, 100)
		}
		return "🎥 Video"
	case "audio":
		var a struct {
			Audio *struct {
				Caption string `json:"caption"`
			} `json:"audio"`
		}
		if json.Unmarshal(content, &a) == nil && a.Audio != nil && a.Audio.Caption != "" {
			return "🎵 " + truncate(a.Audio.Caption, 100)
		}
		return "🎵 Audio"
	case "document":
		var d struct {
			Document *struct {
				Filename string `json:"filename"`
			} `json:"document"`
		}
		if json.Unmarshal(content, &d) == nil && d.Document != nil && d.Document.Filename != "" {
			return "📄 " + truncate(d.Document.Filename, 100)
		}
		return "📄 Document"
	case "location":
		return "📍 Location"
	case "interactive":
		return "🔄 Reply"
	case "reaction":
		var r struct {
			Reaction *struct {
				Emoji string `json:"emoji"`
			} `json:"reaction"`
		}
		if json.Unmarshal(content, &r) == nil && r.Reaction != nil {
			if r.Reaction.Emoji != "" {
				return fmt.Sprintf("%s reacted %s", *contact.CompanyCustomName, r.Reaction.Emoji)
			}
			return fmt.Sprintf("%s removed reaction", *contact.CompanyCustomName)
		}
		return "👍 Reaction"
	}
	return "[unknown]"
}

func truncate(s string, n int) string {
	runes := []rune(s)
	if len(runes) <= n {
		return s
	}
	return string(runes[:n]) + "..."
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
		return nil, fmt.Errorf("send %s: %w", mediaType, err)
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
		return nil, fmt.Errorf("send reaction: %w", err)
	}
	if len(resp.Messages) == 0 {
		return nil, fmt.Errorf("send reaction: no message id returned")
	}

	out := s.storeOutboundMessage(ctx, msg, resp.Messages[0].ID, phoneNumberID, to, "")
	return out, nil
}

func truncateStr(s string, n int) string {
	runes := []rune(s)
	if len(runes) <= n {
		return s
	}
	return string(runes[:n]) + "..."
}
