import axios from 'axios';
import type { ApiResponse, PagedResponse, Conversation, ChatMessage, ApplicationSummary, WaChannel } from '../types/chat';
import { isDesktop, postToDesktop } from '../api/desktopBridge';


const getBaseUrl = () => '';

const apiClient = axios.create({
    baseURL: getBaseUrl(),
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor to add JWT token
apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Auto-refresh token on 401 (mirrors client.ts logic)
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

apiClient.interceptors.response.use(
    (res) => res,
    async (error) => {
        const originalRequest = error.config;
        if (error.response?.status !== 401 || originalRequest._retry) {
            return Promise.reject(error);
        }
        if (originalRequest.url?.includes('/auth/refresh')) {
            return Promise.reject(error);
        }

        if (isRefreshing) {
            return new Promise((resolve) => {
                refreshSubscribers.push((token: string) => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    resolve(apiClient(originalRequest));
                });
            });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
            const refreshToken = localStorage.getItem('refresh_token');
            if (!refreshToken) throw new Error('no refresh token');
            const res = await axios.post('/api/v1/auth/refresh', { refresh_token: refreshToken });
            const { access_token, refresh_token } = res.data;
            localStorage.setItem('token', access_token);
            localStorage.setItem('refresh_token', refresh_token);

            refreshSubscribers.forEach((cb) => cb(access_token));
            refreshSubscribers = [];

            originalRequest.headers.Authorization = `Bearer ${access_token}`;
            return apiClient(originalRequest);
        } catch (refreshError) {
            console.error('[auth] refresh failed, clearing session', refreshError);
            refreshSubscribers = [];
            localStorage.removeItem('token');
            localStorage.removeItem('refresh_token');
            if (isDesktop()) {
              postToDesktop({ type: 'token_expired' });
            } else {
              window.location.href = '/login';
            }
            return Promise.reject(refreshError);
        } finally {
            isRefreshing = false;
        }
    },
);

// Helper to convert Go conversation model to WaMeta UI model
// is_template_required is computed by the backend via subquery on messages table.
const mapConversation = (c: any): Conversation => {
    return {
        id: c.id,
        wa_channel_id: c.phone_number_id,
        app_id: c.phone_number_id,
        waba_id: '',
        customer_wa_id: c.wa_id,
        customer_name: c.company_custom_name || c.profile_name || c.wa_id,
        kode_reseller: '',
        nama_reseller: '',
        display_phone_number: c.display_phone_number || String(c.phone_number_id),
        app_name: c.display_name || 'WA Number',
        wa_channel_display_name: c.display_name || 'WA Number',
        is_template_required: c.is_template_required,
        platform: 'whatsapp',
        last_message_preview: c.last_message_preview || '',
        unread_count: c.unread_count || 0,
        status: c.is_blocked ? 'BLOCKED' : 'ACTIVE',
        updated_at: c.last_message_at || new Date().toISOString(),
        last_message_timestamp: c.last_message_at ? Math.floor(new Date(c.last_message_at).getTime() / 1000) : undefined
    };
};

// Helper to convert Go message model to WaMeta UI model
const mapMessage = (m: any): ChatMessage => {
    let text = '';
    let mediaId = '';
    let caption = '';
    let filename = '';
    let contextMessageId = '';
    let emoji = '';

    const content = typeof m.content === 'string' ? JSON.parse(m.content || '{}') : (m.content || {});

    // Raw Meta format (inbound): content.text, content.image, content.video, etc.
    // Old format (outbound): content.body, content.id, content.caption, etc.
    if (m.type === 'text') {
        text = content.text?.body || content.body || '';
        contextMessageId = content.context?.id || content.context?.message_id || '';
    } else if (m.type === 'image') {
        const img = content.image || content;
        mediaId = img.id || '';
        caption = img.caption || '';
        text = caption;
        contextMessageId = content.context?.id || content.context?.message_id || '';
    } else if (m.type === 'video') {
        const vid = content.video || content;
        mediaId = vid.id || '';
        caption = vid.caption || '';
        text = caption;
        contextMessageId = content.context?.id || content.context?.message_id || '';
    } else if (m.type === 'audio') {
        const aud = content.audio || content;
        mediaId = aud.id || '';
        contextMessageId = content.context?.id || content.context?.message_id || '';
    } else if (m.type === 'document') {
        const doc = content.document || content;
        mediaId = doc.id || '';
        caption = doc.caption || '';
        filename = doc.filename || 'file';
        text = caption;
        contextMessageId = content.context?.id || content.context?.message_id || '';
    } else if (m.type === 'location') {
        contextMessageId = content.context?.id || content.context?.message_id || '';
    } else if (m.type === 'reaction') {
        const react = content.reaction || content;
        emoji = react.emoji || '';
        contextMessageId = react.message_id || content.context?.id || content.context?.message_id || '';
        text = emoji ? `${emoji}` : '';
    } else {
        text = content.text?.body || content.body || '';
        mediaId = content.image?.id || content.video?.id || content.audio?.id || content.document?.id || content.id || '';
        caption = content.image?.caption || content.video?.caption || content.document?.caption || content.caption || '';
        filename = content.document?.filename || content.filename || 'file';
        text = text || caption;
        contextMessageId = content.context?.id || content.context?.message_id || '';
    }

    return {
        id: m.wamid,
        conversation_id: m.phone_number_id + '_' + m.wa_id,
        app_id: m.phone_number_id,
        wa_message_id: m.wamid,
        sender_name: m.direction === 'inbound' ? 'Customer' : (m.agent_name || (m.agent_id ? 'Agent' : 'System')),
        message_text: text,
        message_type: m.type,
        media_id: mediaId,
        file_path: mediaId ? `${import.meta.env.VITE_BASE_URL}/api/v1/media/${mediaId}` : undefined,
        file_name: filename,
        file_type: m.type,
        direction: m.direction === 'inbound' ? 'INBOUND' : 'OUTBOUND',
        status: m.status,
        platform: 'whatsapp',
        raw_payload: JSON.stringify({
            ...content,
            ...(m.template_definition ? { template_definition: m.template_definition } : {}),
            ...(m.error_message ? { error_message: m.error_message } : {}),
        }),
        context_message_id: contextMessageId || undefined,
        reply_wamid: m.reply_wamid || undefined,
        reply_text: m.reply_text || undefined,
        reply_name: m.reply_name || undefined,
        emoji: emoji || undefined,
        created_at: m.timestamp,
        message_timestamp: Math.floor(new Date(m.timestamp).getTime() / 1000)
    };
};

export const getConversations = async (
    limit = 50,
    cursor_updated_at?: string,
    cursor_id?: string | number,
    application_id?: string | number,
    search?: string,
    filter?: string
): Promise<ApiResponse<PagedResponse<Conversation>>> => {
    try {
        const page = cursor_id ? Number(cursor_id) : 1;
        const params: any = { page, limit };
        if (filter) params.filter = filter;
        if (application_id) params.phone_number_id = String(application_id);
        if (search) params.q = search; // Search queries map to contact search in List

        const response = await apiClient.get<any>('/api/v1/conversations', { params });
        const data = response.data;

        const items = (data.data || []).map(mapConversation);
        const total = data.total || 0;
        const hasMore = page * limit < total;

        return {
            status_code: 200,
            status: true,
            message: 'Success',
            data: {
                items,
                limit,
                next_cursor_id: hasMore ? page + 1 : undefined,
                has_more: hasMore
            }
        };
    } catch (error: any) {
        return {
            status_code: error.response?.status || 500,
            status: false,
            message: error.message || 'Gagal mengambil data percakapan',
            data: { items: [], limit, has_more: false }
        };
    }
};

export const getPingInfo = async () => {
    try {
        const response = await apiClient.get('/health');
        return {
            status: true,
            allowSendTemplate: true
        };
    } catch {
        return { status: false, allowSendTemplate: false };
    }
};

export const getApplicationSummary = async (): Promise<ApiResponse<ApplicationSummary[]>> => {
    try {
        const response = await apiClient.get<any[]>('/api/v1/phone-numbers');
        const items: ApplicationSummary[] = response.data.map(p => ({
            id: p.phone_number_id,
            app_name: p.display_name || p.display_phone_number || 'WA Number',
            unread_count: p.unread_count || 0
        }));

        return {
            status_code: 200,
            status: true,
            message: 'Success',
            data: items
        };
    } catch (error: any) {
        return {
            status_code: error.response?.status || 500,
            status: false,
            message: error.message || 'Gagal mengambil ringkasan aplikasi',
            data: []
        };
    }
};

export const getChannels = async (): Promise<ApiResponse<WaChannel[]>> => {
    try {
        const response = await apiClient.get<any[]>('/api/v1/phone-numbers');
        const items: WaChannel[] = response.data.map(p => ({
            id: p.phone_number_id,
            app_id: p.phone_number_id,
            phone_number_id: p.phone_number_id,
            waba_id: '',
            display_name: p.display_name || p.display_phone_number || 'WA Number',
            display_phone_number: p.display_phone_number || '',
            is_active: true,
            type: 'CENTER'
        }));

        return {
            status_code: 200,
            status: true,
            message: 'Success',
            data: items
        };
    } catch (error: any) {
        return {
            status_code: error.response?.status || 500,
            status: false,
            message: error.message || 'Gagal mengambil channel',
            data: []
        };
    }
};

export const getMessages = async (
    conversation_id: string | number,
    limit = 30,
    cursor_ts?: string,
    cursor_id?: string | number,
    search?: string,
    message_type?: string,
    direction?: string
): Promise<ApiResponse<PagedResponse<ChatMessage>>> => {
    try {
        const params: Record<string, string | number> = { limit };
        if (cursor_ts) params.cursor_ts = cursor_ts;
        if (cursor_id !== undefined && cursor_id !== null) {
            params.cursor_id = Number(cursor_id);
        }
        if (search) params.q = search;
        if (message_type) params.type = message_type;
        if (direction) params.direction = direction;
        const response = await apiClient.get<any>(`/api/v1/conversations/${conversation_id}/messages`, { params });

        // Backend returns { data: [], has_more: bool, next_cursor_ts, next_cursor_id }
        const body = response.data || {};
        const rawMessages: any[] = body.data || [];
        const items = rawMessages.map(mapMessage);
        const hasMore = body.has_more ?? false;

        return {
            status_code: 200,
            status: true,
            message: 'Success',
            data: {
                items,
                limit,
                next_cursor_ts: body.next_cursor_ts ?? undefined,
                next_cursor_id: body.next_cursor_id ?? undefined,
                has_more: hasMore
            }
        };
    } catch (error: any) {
        return {
            status_code: error.response?.status || 500,
            status: false,
            message: error.message || 'Gagal mengambil pesan',
            data: { items: [], limit, has_more: false }
        };
    }
};

export const ensureConversation = async (
    display_phone_number: string,
    wa_channel_id: string | number,
    customer_wa_id: string,
    customer_name?: string
): Promise<ApiResponse<Conversation>> => {
    try {
        // First try to check if we can get contact details
        const contactResponse = await apiClient.get(`/api/v1/contacts/${customer_wa_id}`, {
            params: { phone_number_id: String(wa_channel_id) }
        }).catch(() => null);

        // Map contact to a conversation layout
        const conv: Conversation = {
            id: `${wa_channel_id}_${customer_wa_id}`, // temporary composite ID or we can find it
            wa_channel_id,
            app_id: wa_channel_id,
            waba_id: '',
            customer_wa_id,
            customer_name: customer_name || contactResponse?.data?.company_custom_name || contactResponse?.data?.profile_name || customer_wa_id,
            kode_reseller: '',
            nama_reseller: '',
            display_phone_number: display_phone_number,
            is_template_required: true, // assume template required for new chats
            platform: 'whatsapp',
            last_message_preview: '',
            unread_count: 0,
            status: 'ACTIVE',
            updated_at: new Date().toISOString()
        };

        // Let's also check if there is an existing conversation in the backend list
        const listResponse = await apiClient.get<any>('/api/v1/conversations', {
            params: { phone_number_id: String(wa_channel_id), limit: 100 }
        }).catch(() => null);

        if (listResponse && listResponse.data && listResponse.data.data) {
            const existing = listResponse.data.data.find((c: any) => c.wa_id === customer_wa_id);
            if (existing) {
                return {
                    status_code: 200,
                    status: true,
                    message: 'Success',
                    data: mapConversation(existing)
                };
            }
        }

        return {
            status_code: 200,
            status: true,
            message: 'Success',
            data: conv
        };
    } catch (error: any) {
        return {
            status_code: 500,
            status: false,
            message: error.message || 'Gagal membuat percakapan',
            data: null as any
        };
    }
};

export const markAsRead = async (conversationId: string | number): Promise<ApiResponse<any>> => {
    try {
        const response = await apiClient.patch(`/api/v1/conversations/${conversationId}/read`);
        return response.data;
    } catch (error: any) {
        return {
            status_code: error.response?.status || 500,
            status: true,
            message: error.message || 'Gagal mark as read',
            data: null as any
        };
    }
};

export const uploadMedia = async (
    file: File,
    wa_channel_id: string | number
): Promise<ApiResponse<{ media_id: string, file_path: string, file_type: string }>> => {
    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('phone_number_id', String(wa_channel_id));

        const response = await apiClient.post<any>('/api/v1/media/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });

        // Backend returns: { media_id } or similar
        return {
            status_code: 200,
            status: true,
            message: 'Success',
            data: {
                media_id: response.data.media_id || response.data.id || '',
                file_path: `/api/v1/media/${response.data.media_id || response.data.id || ''}`,
                file_type: file.type
            }
        };
    } catch (error: any) {
        return {
            status_code: error.response?.status || 500,
            status: false,
            message: error.message || 'Gagal mengunggah media',
            data: null as any
        };
    }
};

export const sendMessage = async (
    wa_channel_id: string | number,
    conversation_id: string | number,
    target: string,
    text: string,
    message_type = 'text',
    media_id?: string,
    file_name?: string,
    sender_name?: string,
    wa_message_id?: string,
    context_message_id?: string
): Promise<ApiResponse<any>> => {
    try {
        const payload: any = {
            to: target,
            phone_number_id: String(wa_channel_id),
            type: message_type
        };

        if (message_type === 'text') {
            payload.body = text;
        } else {
            payload.media_id = media_id;
            payload.caption = text;
        }

        if (context_message_id) payload.context_message_id = context_message_id;

        const response = await apiClient.post<any>('/api/v1/messages', payload);
        return {
            status_code: 201,
            status: true,
            message: 'Success',
            data: mapMessage(response.data)
        };
    } catch (error: any) {
        const errMsg = error.response?.data?.error || error.message || 'Gagal mengirim pesan';
        return {
            status_code: error.response?.status || 500,
            status: false,
            message: errMsg,
            data: null
        };
    }
};

export const sendTemplate = async (
    wa_channel_id: string | number,
    conversation_id: string | number,
    target: string,
    template_name: string,
    language_code: string,
    body_params: string[],
    button_params: string[],
    button_types: string[],
    header_params: string[],
    sender_name?: string,
    wa_message_id?: string
): Promise<ApiResponse<any>> => {
    try {
        // Map string array to key-value record for Go backend:
        // {"1": "param1", "2": "param2"}
        const templateParams: Record<string, string> = {};
        body_params.forEach((param, index) => {
            templateParams[String(index + 1)] = param;
        });

        // Headers mapping
        header_params.forEach((param, index) => {
            templateParams[`h${index + 1}`] = param;
        });

        // Button params
        button_params.forEach((param, index) => {
            templateParams[`b${index + 1}`] = param;
        });

        // Build template_buttons array with actual button types from template definition
        const mapBtnType = (t: string): string => {
            switch (t) {
                case 'URL': return 'url';
                case 'PHONE_NUMBER': return 'phone_number';
                case 'QUICK_REPLY': return 'quick_reply';
                case 'COPY_CODE': return 'copy_code';
                default: return 'quick_reply';
            }
        };
        const templateButtons = button_params.length > 0 ? button_params.map((text, index) => ({
            index,
            sub_type: mapBtnType(button_types[index] || 'QUICK_REPLY'),
            params: [text]
        })) : [];

        const payload: any = {
            to: target,
            phone_number_id: String(wa_channel_id),
            type: 'template',
            template_name,
            template_lang: language_code || 'id',
            template_params: templateParams,
        };
        if (templateButtons.length > 0) {
            payload.template_buttons = templateButtons;
        }

        const response = await apiClient.post<any>('/api/v1/messages', payload);
        return {
            status_code: 201,
            status: true,
            message: 'Success',
            data: mapMessage(response.data)
        };
    } catch (error: any) {
        const errMsg = error.response?.data?.error || error.message || 'Gagal mengirim template';
        return {
            status_code: error.response?.status || 500,
            status: false,
            message: errMsg,
            data: null
        };
    }
};

export const sendReaction = async (
    wa_channel_id: string | number,
    conversation_id: string | number,
    target: string,
    emoji: string,
    message_id: string,
    sender_name?: string
): Promise<ApiResponse<any>> => {
    try {
        const payload = {
            to: target,
            phone_number_id: String(wa_channel_id),
            message_id,
            emoji
        };
        const response = await apiClient.post<any>('/api/v1/messages/reaction', payload);
        return {
            status_code: 201,
            status: true,
            message: 'Reaksi berhasil dikirim',
            data: mapMessage(response.data)
        };
    } catch (error: any) {
        const errMsg = error.response?.data?.error || error.message || 'Gagal mengirim reaksi';
        return {
            status_code: error.response?.status || 500,
            status: false,
            message: errMsg,
            data: null
        };
    }
};

export const updateConversationName = async (
    id: string | number,
    name: string
): Promise<ApiResponse<any>> => {
    try {
        // In our Go backend, conversation custom name is stored in contacts.
        // ID of conversation contains wa_id and phone_number_id, or we can get it from ID.
        // Let's call h.convs.GetByID to resolve wa_id and phone_number_id, or use contact patch.
        // Since we don't have direct mapping, we can fetch conversation first
        const convRes = await apiClient.get<any>(`/api/v1/conversations/${id}`);
        const conv = convRes.data;

        const response = await apiClient.patch(`/api/v1/contacts/${conv.wa_id}?phone_number_id=${conv.phone_number_id}`, {
            company_custom_name: name
        });

        return {
            status_code: 200,
            status: true,
            message: 'Nama berhasil diubah',
            data: response.data
        };
    } catch (error: any) {
        return {
            status_code: error.response?.status || 500,
            status: false,
            message: error.message || 'Gagal mengubah nama',
            data: null
        };
    }
};

export const sendTypingIndicator = async (
    conversation_id: string | number,
    target: string,
    sender_name: string
): Promise<ApiResponse<any>> => {
    try {
        const response = await apiClient.post('/api/v1/typing', {
            conversation_id,
            target,
            sender_name
        });
        return response.data;
    } catch (error: any) {
        return {
            status_code: 500,
            status: false,
            message: error.message || 'Failed to send typing indicator',
            data: null
        };
    }
};
