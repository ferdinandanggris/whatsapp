import { useState, useEffect, useRef } from 'react';
import { useWS } from '../../../stores/ws';
import { getPhoneNumbers } from '../../../services/chatService';
import type { PhoneNumber } from '../../../types/chat';
import { EventType, WebsocketEvent } from '@/types/wsEvent';
import { useAuth } from '@/stores/auth';

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

interface UseChatConnectionProps {
    setApplications: (apps: PhoneNumber[]) => void;
}

export const useChatConnection = ({ setApplications }: UseChatConnectionProps) => {
    const emitterRef = useRef<WebMetaEventEmitter>(new WebMetaEventEmitter());
    const { connected, connect, disconnect } = useWS();
      const { token, user} = useAuth()
    const [status, setStatus] = useState<ConnectionStatus>('connecting');

    useEffect(() => {
        setStatus(connected ? 'connected' : 'disconnected');
    }, [connected]);

    useEffect(() => {
        if (token) {
            connect(token, user?.company_id);
        } else {
            setStatus('disconnected');
        }

        // Set the event callback for native WebSocket events
        useWS.setState({
            onEvent: (ev: any) => {
                const payload: WebsocketEvent = ev;

                console.log('WS Event received:', ev);
                if (ev.event_type === EventType.NEW_MESSAGE) {
                    console.log('WS Event received [NEW_MESSAGE]:', ev);
                    emitterRef.current.emit('ReceiveMessage', payload.data);
                }else if (payload.event_type === EventType.UPDATE_STATUS) {
                    console.log('WS Event received [UPDATE_STATUS]:', ev);
                    emitterRef.current.emit('MessageStatusUpdated', payload.data);
                }
                else if (payload.event_type === EventType.CONVERSATION_UPDATE) {
                    console.log('WS Event received [CONVERSATION_UPDATE]:', ev);
                    emitterRef.current.emit('UpdateConversation', payload.data);
                }
                // }else if(ev.type === 'USER_TYPING'){
                //     // conversation_id and sender_name
                //     const {conversation_id, sender_name} = ev.data;
                //     emitterRef.current.emit('AgentTyping', conversation_id, sender_name);
                // } else if (ev.type === 'message_sent') {
                //     const message = ev.data.message;
                //     if (message) {
                //         emitterRef.current.emit('ReceiveMessage', mapMessage(message));
                //     }
                // } else if (ev.type === 'message_status') {
                //     const wamid = ev.data.wamid;
                //     const msgStatus = ev.data.status;
                //     const errorMsg = ev.data.error_message;

                //     if (msgStatus === 'failed') {
                //         emitterRef.current.emit('MessageStatusFailed', wamid, JSON.stringify({
                //             error_details: {
                //                 error_message: errorMsg || '',
                //                 failed_at: new Date().toISOString(),
                //                 message_local: errorMsg || 'Pesan gagal terkirim (Meta Cloud API)',
                //             }
                //         }));
                //     } else {
                //         emitterRef.current.emit('MessageStatusUpdated', wamid, msgStatus);
                //     }
                // } else if (ev.type === 'service_window_opened') {
                //     emitterRef.current.emit('UpdateAllowSendTemplate', true);
                // }
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
            connect(token, user?.company_id);
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
