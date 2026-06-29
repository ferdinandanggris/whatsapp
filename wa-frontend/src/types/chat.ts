export interface ApiResponse<T> {
    status_code: number;
    status: boolean;
    message: string;
    data: T;
}

export interface PagedResponse<T> {
    items: T[];
    limit: number;
    page: number;
    has_more: boolean;
}

export interface Conversation {
    id : string;
    phone_number_id:string;
    wa_id: string;
    profile_name: string;
    custom_name: string;
    last_message_at: string;
    conversation_timestamp: number;
    last_message_preview: string;
    unread_count: number;
    display_name: string;
    display_phone_number: string;
    is_template_required: boolean;
}

export interface ErrorDetails {
    code?: string | number;
    failed_at?: string;
    message_local?: string;
    message_original?: string;
}

export interface ChatMessage {
    id: string;
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
    content?: MessageContent;
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

export interface Bubble{
    id: string;
    conversation_id: string | number;
    phone_number_id: string;
    wa_message_id: string;
    wa_id: string;
    direction: 'INBOUND' | 'OUTBOUND';
    created_at: string;
    message_timestamp?: number;
    timestamp?: Date;
    message_type: string;
    status : string;
    sender_name : string;
    error_message?: string;
    agent_name?: string;

    raw_message? : string;
    content? : MessageContent;
    context? : ContextMsg;
}

export interface ContentMsg {
    format?: string;
    text?: string;
    url?: string;
    filename?: string;
}

export interface ButtonMsg {
    format: string;
    text: string;
    url?: string;
    phone_number?: string;
}

export interface ContextMsg {
    context_id: string;
    name: string;
    text: string;
}

export interface MessageContent {
    header?: ContentMsg;
    body?: ContentMsg;
    footer?: ContentMsg;
    buttons?: ButtonMsg[];
    context?: ContextMsg;
}

export interface MessageResponse{
    agent_id : string;
    agent_name : string,
    content : MessageContent,
    direction : string,
    id : string,
    phone_number_id : string,
    raw_message : string | null,
    status : string,
    wa_id : string
    wamid : string
    type : string
    timestamp : string
    conversation_id : string,
    error_details : ErrorDetails    
}

export interface PhoneNumber {
    id: string ;
    display_name: string;
    unread_count: number;
}

export interface WaChannel {
    id: string;
    app_id: string ;
    phone_number_id: string;
    waba_id: string;
    display_name: string;
    display_phone_number: string;
    is_active: boolean;
    type: 'CENTER' | 'CS';
}
