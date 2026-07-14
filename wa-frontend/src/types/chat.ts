export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

export interface ConversationResponse{
    conversations : Conversation[],
    has_more : boolean,
    message_conversations : Conversation[],
    message_has_more : boolean
}

export interface MessageResponse{
    conversation : Conversation,
    has_more : boolean,
    messages : Bubble[]
}

export interface PagedResponse<T> {
    success : boolean;
    message : string;
    data: T[];
    limit: number;
    page: number;
    has_more: boolean;
}

export interface SendTextResponse {
    id : string;
}

export interface SendTextRequest {
    to : string;
    body : string;
    phone_number_id : string;
    context_message_id ?: string;
}

export interface SendReactionRequest {
    to : string;
    reaction : string;
    phone_number_id : string;
    context_message_id ?: string;
    message_id ?: string;
}

export interface SendMediaRequest {
    to : string;
    file : File;
    body : string;
    phone_number_id : string;
    type : string;
    context_message_id ?: string;
}

export interface SendTemplateRequest {
    to : string;
    phone_number_id : string;
    template_name : string;
    template_lang : string;
    template_params : { [key: string]: any; };
}

export interface SendMediaResponse {
    id : string;
    media_url : string;
}

export interface SendTemplateResponse {
    id : string;
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
    matched_message_id?: string;
}

export interface Contact{
    wa_id: string;
    phone_number_id: string;
    profile_name : string;
    custom_name : string;
    last_customer_message_at : string;
}

export interface Bubble{
    id?: string;
    conversation_id: string ;
    phone_number_id: string;
    wamid?: string;
    wa_id: string;
    direction: 'inbound' | 'outbound';
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
    file_name?: string;
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

export interface ReactionMsg {
    emoji: string;
    wamid: string;
    wa_id: string;
}

export interface MessageContent {
    header?: ContentMsg;
    body?: ContentMsg;
    footer?: ContentMsg;
    buttons?: ButtonMsg[];
    reactions?: ReactionMsg[];
    context?: ContextMsg;
}

export interface PhoneNumber {
    id: string ;
    display_name: string;
    display_phone_number: string;
    unread_count: number;
}

