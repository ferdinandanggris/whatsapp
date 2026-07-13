import { Conversation } from "./chat";

export enum EventType {
    NEW_MESSAGE   = "NEW_MESSAGE",
    UPDATE_STATUS = "UPDATE_STATUS",
    CONVERSATION_UPDATE = "CONVERSATION_UPDATE",
    USER_TYPING = "USER_TYPING"
}

export interface WebsocketEvent{
    event_type: EventType;
    company_id: string;
    data: PayloadNewMessage | StatusUpdatePayload | Conversation;
}

export interface PayloadUserTyping{
    conversation_id: string;
    sender_name: string;
}

export interface PayloadNewMessage{
    message_id: string;
    to: string;
    content: string;
    status: string;
}

export interface StatusUpdatePayload{
    message_id: string;
    wamid : string;
    status: string;
    error_message ?: string;
}

export interface PayloadConversationUpdate{
    id : string;
    phone_number_id:string;
    wa_id: string;
    profile_name: string;
    custom_name: string;
    last_message_at: string;
    last_message_preview: string;
    unread_count: number;
    display_name: string;
    display_phone_number: string;
    is_template_required: boolean;
}