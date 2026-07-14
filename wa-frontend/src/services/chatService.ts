import { Contact } from '@/types';
import { get, post, put } from '../api/client';
import type { ApiResponse, PagedResponse, Conversation, PhoneNumber,  Bubble, SendTextResponse, SendTextRequest, SendMediaRequest, SendMediaResponse, SendTemplateRequest, SendTemplateResponse, SendReactionRequest, ConversationResponse, MessageResponse } from '../types/chat';

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
): Promise<ApiResponse<ConversationResponse>> => {
    try {
        const res = await get<ApiResponse<any>>(
            `/api/v1/conversations?${qs({ page, limit, phone_number_id, q: search, filter })}`
        );
        return res;
    } catch {
        return { 
            success: false,
            message: 'Gagal mengambil data percakapan',
            data : {
                conversations: [],
                has_more: false,
                message_conversations: [],
                message_has_more: false
            }
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
            unread_count: p.unread_count || 0,
            display_phone_number: p.display_phone_number || '',
        }));
        return { success: true, message: 'Success', data: items };
    } catch {
        return { success: false, message: 'Gagal mengambil ringkasan aplikasi', data: [] };
    }
};

export const getMessages = async (
    conversation_id: string ,
    limit = 30,
    page = 1,
    search?: string,
    message_type?: string,
    direction?: string
): Promise<ApiResponse<MessageResponse>> => {
    try {
        const res = await get<ApiResponse<any>>(
            `/api/v1/conversations/${conversation_id}/messages?${qs({ limit, page, q: search, type: message_type, direction })}`
        );
        return res;
    } catch {
        return { success: false, message: 'Gagal mengambil pesan', data: { messages: [], conversation: null , has_more: false} };
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
            if (existing) return { success: true, message: 'Success', data: existing };
        } catch { /* ignore */ }

        return { success: true, message: 'Success', data: conv };
    } catch {
        return { success: false, message: 'Gagal membuat percakapan', data: null as any };
    }
};

export const markAsRead = async (conversationId: string | number): Promise<ApiResponse<any>> => {
    try {
        return await post<ApiResponse<any>>(`/api/v1/conversations/${conversationId}/read`, {});
    } catch {
        return { success: true, message: 'Gagal mark as read', data: null as any };
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
            success: true, message: 'Success',
            data: {
                media_id: res.data?.media_id || res.data?.id || '',
                file_path: `/api/v1/media/${res.data?.media_id || res.data?.id || ''}`,
                file_type: file.type
            }
        };
    } catch {
        return { success: false, message: 'Gagal mengunggah media', data: null as any };
    }
};

export const sendMessage = async (payload : SendTextRequest): Promise<ApiResponse<SendTextResponse>> => {
    try {
        const res = await post<ApiResponse<SendTextResponse>>('/api/v1/messages/text', payload);
        return { success: true, message: 'Success', data: res.data };
    } catch {
        return { success: false, message: 'Gagal mengirim pesan', data: null };
    }
};

export const sendMedia = async (payload : SendMediaRequest): Promise<ApiResponse<any>> => {
    try {
        const formData = new FormData();
        formData.append('to', payload.to);
        formData.append('phone_number_id', payload.phone_number_id);
        formData.append('type', payload.type);
        formData.append('file', payload.file);
        formData.append('body', payload.body);
        formData.append('context_message_id', payload.context_message_id);

        const res = await post<ApiResponse<SendMediaResponse>>('/api/v1/messages/media', formData);
        return { success: true, message: 'Success', data: res?.data };
    } catch {
        return { success: false, message: 'Gagal mengirim media', data: null };
    }
};

export const sendTemplate = async (payload : SendTemplateRequest): Promise<ApiResponse<any>> => {
    try {
        // formData
        const formData = new FormData();
        formData.append('to', payload.to);
        formData.append('phone_number_id', payload.phone_number_id);
        formData.append('type', 'template');
        formData.append('template_name', payload.template_name);
        formData.append('template_lang', payload.template_lang);
        if(payload.template_params && Object.keys(payload.template_params).length > 0) formData.append('template_params', JSON.stringify(payload.template_params));

        const res = await post<ApiResponse<SendTemplateResponse>>('/api/v1/messages/template', formData);
        return { success: true, message: res?.message, data: res?.data };
    } catch {
        return { success: false, message: 'Gagal mengirim template', data: null };
    }
};

export const sendReaction = async (payload : SendReactionRequest
): Promise<ApiResponse<any>> => {
    try {
        const res = await post<ApiResponse<any>>('/api/v1/messages/reaction', payload);
        return { success: true, message: 'Reaksi berhasil dikirim', data: res };
    } catch {
        return { success: false, message: 'Gagal mengirim reaksi', data: null };
    }
};

export const GetContact = async (
    wa_id: string ,
    phone_number_id: string 
):Promise<ApiResponse<any>> => {
    const contactRes = await get<ApiResponse<Contact>>(`/api/v1/contacts?phone_number_id=${phone_number_id}&wa_id=${wa_id}`);
    return contactRes;
}

export const updateConversationName = async (
    phone_number_id: string,
    wa_id: string,
    name: string
): Promise<ApiResponse<any>> => {
    try {
        const res = await put<ApiResponse<any>>(`/api/v1/contacts`, {
            wa_id: wa_id,
            phone_number_id: phone_number_id,
            name: name
        });
        return { success: true, message: 'Nama berhasil diubah', data: res };
    } catch {
        return { success: false, message: 'Gagal mengubah nama', data: null };
    }
};

export const sendTypingIndicator = async (
    conversation_id: string | number
): Promise<ApiResponse<any>> => {
    try {
        const res = await post<ApiResponse<any>>(`/api/v1/conversations/${conversation_id}/typing`);
        return { success: true, message: 'Success', data: res };
    } catch {
        return { success: false, message: 'Failed to send typing indicator', data: null };
    }
};
