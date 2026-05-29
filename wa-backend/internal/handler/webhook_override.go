package handler

import (
	"encoding/json"
	"net/http"

	wapi "github.com/ferdinandanggris/wapi"
)

type WebhookOverrideHandler struct {
	client  wapi.Client
	wabaID  string
	verifyToken string
}

func NewWebhookOverrideHandler(client wapi.Client, wabaID, verifyToken string) *WebhookOverrideHandler {
	return &WebhookOverrideHandler{client: client, wabaID: wabaID, verifyToken: verifyToken}
}

type webhookOverrideRequest struct {
	CallbackURL string `json:"callback_url"`
}

func (h *WebhookOverrideHandler) Get(w http.ResponseWriter, r *http.Request) {
	sub, err := h.client.GetWebhookSubscription(r.Context(), h.wabaID)
	if err != nil {
		writeError(w, http.StatusBadGateway, "failed to get webhook subscription: "+err.Error())
		return
	}
	writeJSON(w, http.StatusOK, sub)
}

func (h *WebhookOverrideHandler) Set(w http.ResponseWriter, r *http.Request) {
	var req webhookOverrideRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if req.CallbackURL == "" {
		writeError(w, http.StatusBadRequest, "callback_url required")
		return
	}

	sub, err := h.client.SetWebhookOverride(r.Context(), h.wabaID, req.CallbackURL, h.verifyToken)
	if err != nil {
		writeError(w, http.StatusBadGateway, "failed to set webhook override: "+err.Error())
		return
	}

	writeJSON(w, http.StatusOK, sub)
}

func (h *WebhookOverrideHandler) Remove(w http.ResponseWriter, r *http.Request) {
	sub, err := h.client.SubscribeToWebhooks(r.Context(), h.wabaID)
	if err != nil {
		writeError(w, http.StatusBadGateway, "failed to remove webhook override: "+err.Error())
		return
	}
	writeJSON(w, http.StatusOK, sub)
}
