export interface ApiResponse<T> {
    status_code: number;
    status: boolean;
    message: string;
    data: T;
}

export interface PagedResponse<T> {
    items: T[];
    limit: number;
    next_cursor_updated_at?: string;
    next_cursor_id?: string | number;
    has_more: boolean;
}

export interface Conversation {
    id: string | number;
    wa_channel_id: string | number;
    app_id: string | number;
    waba_id: string;
    customer_wa_id: string;
    customer_name: string;
    kode_reseller: string;
    nama_reseller: string;
    display_number?: string;
    app_name?: string;
    wa_channel_display_name?: string;
    is_template_required: boolean;
    last_message_timestamp?: number;
    platform: string;
    last_message_preview: string;
    unread_count: number;
    status: string;
    updated_at: string;
}

export interface ErrorDetails {
    code: number;
    failed_at: string;
    message_local: string;
    message_original: string;
}

export interface ChatMessage {
    id: string | number;
    conversation_id: string | number;
    app_id: string | number;
    wa_message_id: string;
    sender_name: string;
    message_text: string;
    message_type: string;
    media_id?: string;
    file_path?: string;
    file_type?: string;
    file_name?: string;
    direction: 'INBOUND' | 'OUTBOUND';
    status: string;
    platform: string;
    raw_payload?: string;
    context_message_id?: string;
    reply_wamid?: string;
    reply_name?: string;
    reply_text?: string;
    emoji?: string;
    message_timestamp?: number;
    created_at: string;
    reactions?: string[];
    reactionData?: { emojis: string[], total: number } | null;
    error_details?: ErrorDetails;
}

export interface ApplicationSummary {
    id: string | number;
    app_name: string;
    unread_count: number;
}

export interface WaChannel {
    id: string | number;
    app_id: string | number;
    phone_number_id: string;
    waba_id: string;
    display_name: string;
    display_number: string;
    is_active: boolean;
    type: 'CENTER' | 'CS';
}
