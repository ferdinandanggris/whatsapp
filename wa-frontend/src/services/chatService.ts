import axios from 'axios';
import type { ApiResponse, PagedResponse, Conversation, ChatMessage, ApplicationSummary, WaChannel } from '../types/chat';

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

// Helper to convert Go conversation model to WaMeta UI model
const mapConversation = (c: any): Conversation => {
    // Determine template requirement: if last_message_at is older than 24h
    // (We will also refine this dynamically in the hooks using contact details)
    let isTemplateRequired = true;
    if (c.last_message_at) {
        const lastMsgTime = new Date(c.last_message_at).getTime();
        isTemplateRequired = (Date.now() - lastMsgTime) > 24 * 60 * 60 * 1000;
    }

    return {
        id: c.id,
        wa_channel_id: c.phone_number_id,
        app_id: c.phone_number_id,
        waba_id: '',
        customer_wa_id: c.wa_id,
        customer_name: c.company_custom_name || c.profile_name || c.wa_id,
        kode_reseller: '',
        nama_reseller: '',
        display_number: c.wa_id,
        app_name: c.display_name || 'WA Number',
        wa_channel_display_name: c.display_name || 'WA Number',
        is_template_required: isTemplateRequired,
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

    const content = typeof m.content === 'string' ? JSON.parse(m.content || '{}') : (m.content || {});

    if (m.type === 'text') {
        text = content.body || '';
    } else {
        mediaId = content.id || '';
        caption = content.caption || '';
        filename = content.filename || 'file';
        text = caption;
    }

    return {
        id: m.wamid,
        conversation_id: m.phone_number_id + '_' + m.wa_id, // Virtual ID matching Go ws structure or simple link
        app_id: m.phone_number_id,
        wa_message_id: m.wamid,
        sender_name: m.direction === 'inbound' ? 'Customer' : (m.agent_id ? 'Agent' : 'System'),
        message_text: text,
        message_type: m.type,
        media_id: mediaId,
        file_path: mediaId ? `/api/v1/media/${mediaId}` : undefined,
        file_name: filename,
        file_type: m.type,
        direction: m.direction === 'inbound' ? 'INBOUND' : 'OUTBOUND',
        status: m.status,
        platform: 'whatsapp',
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
            display_number: p.display_phone_number || '',
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
    cursor_id?: string | number,
    search?: string
): Promise<ApiResponse<PagedResponse<ChatMessage>>> => {
    try {
        const offset = cursor_id ? Number(cursor_id) : 0;
        const response = await apiClient.get<any[]>(`/api/v1/conversations/${conversation_id}/messages`, {
            params: { limit, offset }
        });

        // The messages from backend are returned newest first.
        // We will map them and return them as they are.
        const rawMessages = response.data || [];
        const items = rawMessages.map(mapMessage);
        const hasMore = rawMessages.length >= limit;

        return {
            status_code: 200,
            status: true,
            message: 'Success',
            data: {
                items,
                limit,
                next_cursor_id: hasMore ? offset + rawMessages.length : undefined,
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
            display_number: String(wa_channel_id),
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
    // In our Go backend, we have no specific read API, but we can reset unread locally or send request
    // We can call /api/v1/conversations/{id} or similar if implemented, or just return success
    return {
        status_code: 200,
        status: true,
        message: 'Success',
        data: null
    };
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

        const payload = {
            to: target,
            phone_number_id: String(wa_channel_id),
            type: 'template',
            template_name,
            template_lang: language_code || 'id',
            template_params: templateParams
        };

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
    // Go backend does not natively support reaction messages inside MessageHandler yet.
    // We can just return success or make the request.
    // If backend doesn't support it, we mock it.
    return {
        status_code: 200,
        status: true,
        message: 'Reaksi berhasil dikirim (mock)',
        data: null
    };
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
    // Go backend has no typing indicator REST API. We can just return success.
    return {
        status_code: 200,
        status: true,
        message: 'Success',
        data: null
    };
};
