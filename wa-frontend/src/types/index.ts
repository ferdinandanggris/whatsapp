export interface Conversation {
  id: string
  phone_number_id: string
  wa_id: string
  profile_name: string
  company_custom_name?: string
  is_blocked: boolean
  last_message_at?: string
  last_message_preview: string
  unread_count: number
  display_name: string
}

export interface Message {
  wamid: string
  phone_number_id: string
  wa_id: string
  direction: "inbound" | "outbound"
  type: string
  content: Record<string, unknown>
  status: string
  timestamp: string
  agent_id?: string
}

export interface User {
  id: string
  email: string
  role: string
  display_name: string
  is_active: boolean
}

export interface Contact {
  wa_id: string
  phone_number_id: string
  profile_name: string
  company_custom_name?: string
  assigned_agent_id?: string
  is_blocked: boolean
  blocked_at?: string
  last_customer_message_at?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
}

export interface StatsOverview {
  total_contacts: number
  total_conversations: number
  blocked_contacts: number
  unread_conversations: number
  messages_today: number
  messages_this_week: number
}

export interface WSMessageSent {
  type: "message_sent"
  data: { message: Message }
}

export interface WSNewMessage {
  type: "new_message"
  data: { message: Message }
}

export interface WSMessageStatus {
  type: "message_status"
  data: { message: Message }
}

export type WSEvent = WSMessageSent | WSNewMessage | WSMessageStatus
