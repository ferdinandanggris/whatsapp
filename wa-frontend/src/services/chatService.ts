import { get, post, patch } from '../api/client';
import type { ApiResponse, PagedResponse, Conversation, ChatMessage, PhoneNumber, WaChannel, MessageResponse, Bubble } from '../types/chat';

function qs(params: Record<string, string | number | undefined>): string {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== '') sp.set(k, String(v));
    }
    return sp.toString();
}

export const getConversations = async (
    limit = 50,
    page = 1,
    phone_number_id?: string,
    search?: string,
    filter?: string
): Promise<ApiResponse<PagedResponse<Conversation>>> => {
    try {
        const res = await get<ApiResponse<{conversations: Conversation[], has_more: boolean}>>(
            `/api/v1/conversations?${qs({ page, limit, phone_number_id, q: search, filter })}`
        );
        const data = res.data;
        return {
            status_code: 200,
            status: true,
            message: 'Success',
            data: { items: data.conversations || [], limit, page, has_more: data.has_more }
        };
    } catch {
        return {
            status_code: 500, status: false,
            message: 'Gagal mengambil data percakapan',
            data: { items: [], limit, has_more: false, page: 1 }
        };
    }
};

export const getPingInfo = async () => {
    try {
        await get('/health');
        return { status: true, allowSendTemplate: true };
    } catch {
        return { status: false, allowSendTemplate: false };
    }
};

export const getPhoneNumbers = async (): Promise<ApiResponse<PhoneNumber[]>> => {
    try {
        const res = await get<ApiResponse<any[]>>('/api/v1/phone-numbers');
        const items: PhoneNumber[] = (res.data || []).map(p => ({
            id: p.phone_number_id,
            display_name: p.display_name || p.display_phone_number || 'WA Number',
            unread_count: p.unread_count || 0
        }));
        return { status_code: 200, status: true, message: 'Success', data: items };
    } catch {
        return { status_code: 500, status: false, message: 'Gagal mengambil ringkasan aplikasi', data: [] };
    }
};

export const getChannels = async (): Promise<ApiResponse<WaChannel[]>> => {
    try {
        const res = await get<ApiResponse<any[]>>('/api/v1/phone-numbers');
        const items: WaChannel[] = (res.data || []).map(p => ({
            id: p.phone_number_id,
            app_id: p.phone_number_id,
            phone_number_id: p.phone_number_id,
            waba_id: '',
            display_name: p.display_name || p.display_phone_number || 'WA Number',
            display_phone_number: p.display_phone_number || '',
            is_active: true,
            type: 'CENTER'
        }));
        return { status_code: 200, status: true, message: 'Success', data: items };
    } catch {
        return { status_code: 500, status: false, message: 'Gagal mengambil channel', data: [] };
    }
};

export const getMessages = async (
    conversation_id: string | number,
    limit = 30,
    page = 1,
    search?: string,
    message_type?: string,
    direction?: string
): Promise<ApiResponse<PagedResponse<Bubble>>> => {
    try {
        const res = await get<ApiResponse<{ messages: any[], has_more: boolean}>>(
            `/api/v1/conversations/${conversation_id}/messages?${qs({ limit, page, q: search, type: message_type, direction })}`
        );
        const body = res.data;
        return {
            status_code: 200, status: true, message: 'Success',
            data: { items: body.messages || [], limit, page, has_more: body.has_more ?? false }
        };
    } catch {
        return { status_code: 500, status: false, message: 'Gagal mengambil pesan', data: { items: [], limit, has_more: false, page } };
    }
};

export const ensureConversation = async (
    display_phone_number: string,
    phone_number_id: string,
    customer_wa_id: string,
    customer_name?: string
): Promise<ApiResponse<Conversation>> => {
    try {
        let contactData: any = null;
        try {
            const res = await get<ApiResponse<any>>(`/api/v1/contacts/${customer_wa_id}?phone_number_id=${phone_number_id}`);
            contactData = res.data;
        } catch { /* ignore */ }

        const conv: Conversation = {
            id: `${phone_number_id}_${customer_wa_id}`,
            phone_number_id,
            wa_id: customer_wa_id,
            custom_name: customer_name || contactData?.company_custom_name || contactData?.profile_name || customer_wa_id,
            display_phone_number: display_phone_number,
            is_template_required: true,
            last_message_preview: '',
            conversation_timestamp: Date.now(),
            unread_count: 0,
            display_name: contactData?.display_name || contactData?.display_phone_number || customer_wa_id,
            last_message_at: new Date().toISOString(),
            profile_name: contactData?.profile_name
        };

        try {
            const listRes = await get<ApiResponse<{ conversations: any[] }>>(`/api/v1/conversations?${qs({ phone_number_id, limit: 100 })}`);
            const existing = (listRes.data?.conversations || []).find((c: any) => c.wa_id === customer_wa_id);
            if (existing) return { status_code: 200, status: true, message: 'Success', data: existing };
        } catch { /* ignore */ }

        return { status_code: 200, status: true, message: 'Success', data: conv };
    } catch {
        return { status_code: 500, status: false, message: 'Gagal membuat percakapan', data: null as any };
    }
};

export const markAsRead = async (conversationId: string | number): Promise<ApiResponse<any>> => {
    try {
        return await post<ApiResponse<any>>(`/api/v1/conversations/${conversationId}/read`, {});
    } catch {
        return { status_code: 500, status: true, message: 'Gagal mark as read', data: null as any };
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

        const res = await post<ApiResponse<any>>('/api/v1/media/upload', formData);
        return {
            status_code: 200, status: true, message: 'Success',
            data: {
                media_id: res.data?.media_id || res.data?.id || '',
                file_path: `/api/v1/media/${res.data?.media_id || res.data?.id || ''}`,
                file_type: file.type
            }
        };
    } catch {
        return { status_code: 500, status: false, message: 'Gagal mengunggah media', data: null as any };
    }
};

export const sendMessage = async (
    phone_number_id: string,
    target: string,
    text: string,
    message_type = 'text',
    media_id?: string,
    wa_message_id?: string,
    context_message_id?: string
): Promise<ApiResponse<any>> => {
    try {
        const payload: any = { to: target, phone_number_id, type: message_type, id: wa_message_id };
        if (message_type === 'text') payload.body = text;
        else { payload.media_id = media_id; payload.caption = text; }
        if (context_message_id) payload.context_message_id = context_message_id;

        const res = await post<ApiResponse<any>>('/api/v1/messages/text', payload);
        return { status_code: 201, status: true, message: 'Success', data: res };
    } catch {
        return { status_code: 500, status: false, message: 'Gagal mengirim pesan', data: null };
    }
};

export const sendMedia = async (
    phone_number_id: string,
    target: string,
    text: string,
    message_type = 'text',
    media_file: File,
    wa_message_id?: string,
    context_message_id?: string
): Promise<ApiResponse<any>> => {
    try {
        const formData = new FormData();
        formData.append('to', target);
        formData.append('phone_number_id', phone_number_id);
        formData.append('type', message_type);
        formData.append('media_file', media_file);
        formData.append('filename', media_file.name);
        formData.append('body', text);
        if (wa_message_id) formData.append('id', wa_message_id);
        if (context_message_id) formData.append('context_message_id', context_message_id);

        const res = await post<ApiResponse<any>>('/api/v1/messages/media', formData);
        return { status_code: 201, status: true, message: 'Success', data: res };
    } catch {
        return { status_code: 500, status: false, message: 'Gagal mengirim media', data: null };
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
        const templateParams: Record<string, string> = {};
        body_params.forEach((param, index) => { templateParams[String(index + 1)] = param; });
        header_params.forEach((param, index) => { templateParams[`h${index + 1}`] = param; });
        button_params.forEach((param, index) => { templateParams[`b${index + 1}`] = param; });

        const mapBtnType = (t: string): string => {
            switch (t) {
                case 'URL': return 'url';
                case 'PHONE_NUMBER': return 'phone_number';
                case 'COPY_CODE': return 'copy_code';
                default: return 'quick_reply';
            }
        };
        const templateButtons = button_params.length > 0 ? button_params.map((text, index) => ({
            index, sub_type: mapBtnType(button_types[index] || 'QUICK_REPLY'), params: [text]
        })) : [];

        const payload: any = {
            to: target, phone_number_id: String(wa_channel_id), type: 'template',
            template_name, template_lang: language_code || 'id', template_params: templateParams
        };
        if (templateButtons.length > 0) payload.template_buttons = templateButtons;

        const res = await post<ApiResponse<any>>('/api/v1/messages', payload);
        return { status_code: 201, status: true, message: 'Success', data: res };
    } catch {
        return { status_code: 500, status: false, message: 'Gagal mengirim template', data: null };
    }
};

export const sendReaction = async (
    wa_channel_id: string | number,
    target: string,
    emoji: string,
    message_id: string,
): Promise<ApiResponse<any>> => {
    try {
        const res = await post<ApiResponse<any>>('/api/v1/messages/reaction', {
            to: target, phone_number_id: String(wa_channel_id), message_id, emoji
        });
        return { status_code: 201, status: true, message: 'Reaksi berhasil dikirim', data: res };
    } catch {
        return { status_code: 500, status: false, message: 'Gagal mengirim reaksi', data: null };
    }
};

export const updateConversationName = async (
    id: string | number,
    name: string
): Promise<ApiResponse<any>> => {
    try {
        const convRes = await get<ApiResponse<{ wa_id: string, phone_number_id: string }>>(`/api/v1/conversations/${id}`);
        const conv = convRes.data;
        const res = await patch<ApiResponse<any>>(`/api/v1/contacts/${conv.wa_id}?phone_number_id=${conv.phone_number_id}`, {
            company_custom_name: name
        });
        return { status_code: 200, status: true, message: 'Nama berhasil diubah', data: res };
    } catch {
        return { status_code: 500, status: false, message: 'Gagal mengubah nama', data: null };
    }
};

export const sendTypingIndicator = async (
    conversation_id: string | number,
    target: string,
    sender_name: string
): Promise<ApiResponse<any>> => {
    try {
        const res = await post<ApiResponse<any>>('/api/v1/typing', { conversation_id, target, sender_name });
        return { status_code: 200, status: true, message: 'Success', data: res };
    } catch {
        return { status_code: 500, status: false, message: 'Failed to send typing indicator', data: null };
    }
};
