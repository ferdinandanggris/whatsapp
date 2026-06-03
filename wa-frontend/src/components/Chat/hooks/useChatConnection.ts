import { useState, useEffect, useRef } from 'react';
import { useWS } from '../../../stores/ws';
import { getApplicationSummary } from '../../../services/chatService';
import type { ApplicationSummary } from '../../../types/chat';

export type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';

class WebMetaEventEmitter {
    private listeners: Record<string, Function[]> = {};

    public on(event: string, callback: Function) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    }

    public off(event: string, callback: Function) {
        if (!this.listeners[event]) return;
        this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }

    public emit(event: string, ...args: any[]) {
        if (!this.listeners[event]) return;
        this.listeners[event].forEach(cb => {
            try {
                cb(...args);
            } catch (e) {
                console.error(`Error in event listener for ${event}:`, e);
            }
        });
    }
}

// Mapper matching chatService.ts for consistency
const mapConversation = (c: any) => {
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
        display_number: c.phone_number_id,
        app_name: c.display_name || 'WA Number',
        wa_channel_display_name: c.display_name || 'WA Number',
        is_template_required: isTemplateRequired,
        display_phone_number: c.display_phone_number || '',
        platform: 'whatsapp',
        last_message_preview: c.last_message_preview || '',
        unread_count: c.unread_count || 0,
        status: c.is_blocked ? 'BLOCKED' : 'ACTIVE',
        updated_at: c.last_message_at || new Date().toISOString(),
        last_message_timestamp: c.last_message_at ? Math.floor(new Date(c.last_message_at).getTime() / 1000) : undefined
    };
};

const mapMessage = (m: any) => {
    let text = '';
    let mediaId = '';
    let caption = '';
    let filename = '';
    let contextMessageId = '';
    let emoji = '';

    const content = typeof m.content === 'string' ? JSON.parse(m.content || '{}') : (m.content || {});

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
        file_path: mediaId ? `/api/v1/media/${mediaId}` : undefined,
        file_name: filename,
        file_type: m.type,
        direction: m.direction === 'inbound' ? 'INBOUND' : 'OUTBOUND',
        status: m.status,
        platform: 'whatsapp',
        raw_payload: JSON.stringify(content),
        context_message_id: contextMessageId || undefined,
        reply_wamid: m.reply_wamid || undefined,
        reply_text: m.reply_text || undefined,
        reply_name: m.reply_name || undefined,
        emoji: emoji || undefined,
        created_at: m.timestamp,
        message_timestamp: Math.floor(new Date(m.timestamp).getTime() / 1000)
    };
};

interface UseChatConnectionProps {
    setApplications: (apps: ApplicationSummary[]) => void;
}

export const useChatConnection = ({ setApplications }: UseChatConnectionProps) => {
    const emitterRef = useRef<WebMetaEventEmitter>(new WebMetaEventEmitter());
    const { connected, connect, disconnect } = useWS();
    const [status, setStatus] = useState<ConnectionStatus>('connecting');

    useEffect(() => {
        setStatus(connected ? 'connected' : 'disconnected');
    }, [connected]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            connect(token);
        } else {
            setStatus('disconnected');
        }

        // Set the event callback for native WebSocket events
        useWS.setState({
            onEvent: (ev: any) => {
                console.log('WS Event received:', ev);
                if (ev.type === 'new_message') {
                    // Extract fields
                    const conv = ev.data.conversation;
                    const message = ev.data.message;

                    if (conv) {
                        emitterRef.current.emit('UpdateConversation', mapConversation(conv));
                    }
                    if (message) {
                        emitterRef.current.emit('ReceiveMessage', mapMessage(message));
                    }
                }
                else if (ev.type === 'conversation_updated') {
                    const conv = ev.data.conversation;
                    if (conv) {
                        emitterRef.current.emit('UpdateConversation', mapConversation(conv));
                    }
                }else if(ev.type === 'agent_typing'){
                    // conversation_id and sender_name
                    const {conversation_id, sender_name} = ev.data;
                    emitterRef.current.emit('AgentTyping', conversation_id, sender_name);
                } else if (ev.type === 'message_sent') {
                    const message = ev.data.message;
                    if (message) {
                        emitterRef.current.emit('ReceiveMessage', mapMessage(message));
                    }
                } else if (ev.type === 'message_status') {
                    const wamid = ev.data.wamid;
                    const msgStatus = ev.data.status;
                    const errorCode = ev.data.error_code;

                    if (msgStatus === 'failed') {
                        emitterRef.current.emit('MessageStatusFailed', wamid, JSON.stringify({
                            error_details: {
                                code: errorCode || 0,
                                failed_at: new Date().toISOString(),
                                message_local: 'Pesan gagal terkirim (Meta Cloud API)',
                                message_original: `Meta error code: ${errorCode || 'unknown'}`
                            }
                        }));
                    } else {
                        emitterRef.current.emit('MessageStatusUpdated', wamid, msgStatus);
                    }
                } else if (ev.type === 'service_window_opened') {
                    emitterRef.current.emit('UpdateAllowSendTemplate', true);
                }
            }
        });

        return () => {
            useWS.setState({ onEvent: null });
            disconnect();
        };
    }, []);

    const handleRetryConnection = () => {
        setStatus('reconnecting');
        const token = localStorage.getItem('token');
        if (token) {
            connect(token);
        } else {
            window.location.reload();
        }
    };

    const handleFindServer = () => {
        console.log('Finding server...');
    };

    return {
        connectionStatus: status,
        connection: emitterRef.current,
        handleRetryConnection,
        handleFindServer
    };
};
