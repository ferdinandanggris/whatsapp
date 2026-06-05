
import { useEffect, useRef, useState } from 'react';
import { ensureConversation, sendMessage, sendTemplate, updateConversationName, sendTypingIndicator, markAsRead } from '../../../services/chatService';
import type { Conversation, ChatMessage } from '../../../types/chat';
import { User } from '@/types';

interface UseChatActionsProps {
    user: User;
    enableLogin?: boolean;
    activeConversation: Conversation | null;
    connection: any;
    setActiveConversation: (conv: Conversation | null) => void;
    setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>;
    setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

export const useChatActions = ({
    user,
    enableLogin,
    activeConversation,
    connection,
    setActiveConversation,
    setConversations,
    setMessages,    
}: UseChatActionsProps) => {

    const [typingAgents, setTypingAgents] = useState<Record<string, { name: string; timeout: any }>>({});
    user.display_name = user.display_name;

    const lastTypingSentRef = useRef<Record<string | number, number>>({});

    const handleSend = async (text: string, replyingTo: ChatMessage | null, clearInput: () => void) => {
        if (!text.trim() || !activeConversation) return;

        let currentConv = activeConversation;
        if (currentConv.id === 0) {
            try {
                const response = await ensureConversation(currentConv.display_phone_number,currentConv.wa_channel_id, currentConv.customer_wa_id, currentConv.customer_name);
                if (response.status) {
                    currentConv = response.data;
                    setActiveConversation(currentConv);
                    setConversations(prev => {
                        if (prev.some(c => c.id === currentConv.id)) return prev;
                        return [currentConv, ...prev];
                    });
                } else return;
            } catch (error) { return; }
        }

        const tempId = `temp_${Date.now()}`;
        const newMessage: ChatMessage = {
            id: Date.now(),
            conversation_id: currentConv.id,
            app_id: currentConv.app_id,
            wa_message_id: tempId,
            sender_name: user?.display_name || 'Me',
            message_text: text,
            message_type: 'text',
            direction: 'OUTBOUND',
            status: 'pending',
            platform: 'whatsapp',
            message_timestamp: Math.floor(Date.now() / 1000),
            created_at: new Date().toISOString(),
            context_message_id: replyingTo?.wa_message_id || undefined,
            reply_name: replyingTo ? (currentConv.customer_name || replyingTo.sender_name || 'Contact') : undefined,
            reply_text: replyingTo ? replyingTo.message_text : undefined
        };
                
        setMessages(prev => [...prev, newMessage]);
        clearInput();
        const context_id = replyingTo?.wa_message_id;

        sendMessage(currentConv.wa_channel_id, currentConv.id, currentConv.customer_wa_id, text, "text", undefined, undefined, user?.display_name, tempId, context_id)
            .then((res: any) => {
                if (res.status) {
                    setMessages(prev => prev.map(m => m.wa_message_id === tempId ? { ...m, ...res.data, sender_name: m.sender_name, reply_wamid: res.data.reply_wamid || m.reply_wamid, reply_text: res.data.reply_text || m.reply_text, reply_name: res.data.reply_name || m.reply_name } : m));
                } else {
                    setMessages(prev => prev.map(m => m.wa_message_id === tempId ? { ...m, status: 'failed' } : m));
                }
            }).catch(() => {
                setMessages(prev => prev.map(m => m.wa_message_id === tempId ? { ...m, status: 'failed' } : m));
            });

        // if ((window as any).chrome?.webview) {
        //     (window as any).chrome.webview.postMessage({
        //         type: 'SEND_MESSAGE',
        //         conversation_id: currentConv.id,
        //         wa_channel_id: currentConv.wa_channel_id,
        //         target: currentConv.customer_wa_id,
        //         sender_name: user?.display_name,
        //         text: text,
        //         wa_message_id: tempId,
        //         context_message_id: context_id
        //     });
        // } else {
           
        // }
    };

    const handleSendTemplate = async (template: any, params: { body: string[], buttons: string[], header: string[] }) => {
        if (!activeConversation) return;
        let currentConv = activeConversation;

        if (currentConv.id === 0) {
            try {
                const response = await ensureConversation(currentConv.display_phone_number, currentConv.wa_channel_id, currentConv.customer_wa_id, currentConv.customer_name);
                if (response.status) {
                    currentConv = response.data;
                    setActiveConversation(currentConv);
                    setConversations(prev => [currentConv, ...prev]);
                } else return;
            } catch (error) { return; }
        }

        const tempId = `temp_tpl_${Date.now()}`;

        // Extract body text from components array (main backend format)
        const bodyComp = template.components?.find((c: any) => c.type === 'BODY');
        const bodyText = bodyComp?.text || '';
        let previewText = bodyText;
        params.body.forEach((val, idx) => {
            previewText = previewText.replace(`{{${idx + 1}}}`, val || `{{${idx + 1}}}`);
        });

        const newMessage: ChatMessage = {
            id: Date.now(),
            conversation_id: currentConv.id,
            app_id: currentConv.app_id,
            wa_message_id: tempId,
            sender_name: user?.display_name || 'Me',
            message_text: previewText,
            message_type: 'template',
            direction: 'OUTBOUND',
            status: 'pending',
            platform: 'whatsapp',
            created_at: new Date().toISOString()
        };

        setMessages(prev => [...prev, newMessage]);

        if ((window as any).chrome?.webview) {
            (window as any).chrome.webview.postMessage({
                type: 'SEND_TEMPLATE',
                conversation_id: currentConv.id,
                wa_channel_id: currentConv.wa_channel_id,
                target: currentConv.customer_wa_id,
                sender_name: user?.display_name,
                template_name: template.name,
                language_code: template.language,
                body_params: params.body,
                button_params: params.buttons,
                header_params: params.header,
                wa_message_id: tempId
            });
        } else {
            sendTemplate(currentConv.wa_channel_id, currentConv.id, currentConv.customer_wa_id, template.name, template.language, params.body, params.buttons, params.header, user?.display_name, tempId)
                .then((res: any) => {
                    if (res.status) {
                        setMessages(prev => prev.map(m => m.wa_message_id === tempId ? { ...m, ...res.data } : m));
                    } else {
                        setMessages(prev => prev.map(m => m.wa_message_id === tempId ? { ...m, status: 'failed' } : m));
                    }
                }).catch(() => {
                    setMessages(prev => prev.map(m => m.wa_message_id === tempId ? { ...m, status: 'failed' } : m));
                });
        }
    };

    const handleSendMedia = async (file: File, previewUrl: string, type: 'image' | 'video' | 'audio' | 'document', caption: string, replyingTo: ChatMessage | null) => {
        if (!activeConversation) return;
        const currentConv = activeConversation;
        const tempId = `temp_${Date.now()}`;
        const context_id = replyingTo?.wa_message_id;

        const newMessage: ChatMessage = {
            id: Date.now(),
            conversation_id: currentConv.id,
            app_id: currentConv.app_id,
            wa_message_id: tempId,
            sender_name: user?.display_name || 'Me',
            message_text: caption,
            message_type: type,
            file_path: previewUrl,
            file_name: file.name,
            file_type: file.type,
            direction: 'OUTBOUND',
            status: 'pending',
            platform: 'whatsapp',
            created_at: new Date().toISOString(),
            context_message_id: context_id
        };

        setMessages(prev => [...prev, newMessage]);

        try {
            const { uploadMedia } = await import('../../../services/chatService');
            const resp = await uploadMedia(file, currentConv.wa_channel_id);
            if (!resp.status) {
                setMessages(prev => prev.map(m => m.wa_message_id === tempId ? { ...m, status: 'failed' } : m));
                return;
            }

            if ((window as any).chrome?.webview) {
                (window as any).chrome.webview.postMessage({
                    type: 'SEND_MESSAGE',
                    conversation_id: currentConv.id,
                    wa_channel_id: currentConv.wa_channel_id,
                    target: currentConv.customer_wa_id,
                    sender_name: user?.display_name,
                    message_type: type,
                    media_id: resp.data.media_id,
                    file_path: resp.data.file_path,
                    file_type: resp.data.file_type,
                    text: caption,
                    file_name: file.name,
                    wa_message_id: tempId,
                    context_message_id: context_id
                });
            } else {
                    sendMessage(currentConv.wa_channel_id, currentConv.id, currentConv.customer_wa_id, caption, type, resp.data.media_id, file.name, user?.display_name, tempId, context_id)
                    .then((res: any) => {
                        if (res.status) {
                            setMessages(prev => prev.map(m => m.wa_message_id === tempId ? { ...m, ...res.data, reply_wamid: res.data.reply_wamid || m.reply_wamid, reply_text: res.data.reply_text || m.reply_text, reply_name: res.data.reply_name || m.reply_name } : m));
                        } else {
                            setMessages(prev => prev.map(m => m.wa_message_id === tempId ? { ...m, status: 'failed' } : m));
                        }
                    }).catch(() => {
                        setMessages(prev => prev.map(m => m.wa_message_id === tempId ? { ...m, status: 'failed' } : m));
                    });
            }
        } catch (error) {
            setMessages(prev => prev.map(m => m.wa_message_id === tempId ? { ...m, status: 'failed' } : m));
        }
    };

    const handleSendReaction = async (emoji: string, targetMsg: ChatMessage) => {
        if (!activeConversation) return;
        try {
            const { sendReaction } = await import('../../../services/chatService');
            await sendReaction(
                activeConversation.wa_channel_id,
                activeConversation.id,
                activeConversation.customer_wa_id,
                emoji,
                targetMsg.wa_message_id,
                user?.display_name
            );
        } catch (error) {
            console.error("Failed to send reaction", error);
        }
    };

    const handleRenameSubmit = async (conv: Conversation, newName: string) => {
        if (!conv || !newName.trim()) return false;
        try {
            const response = await updateConversationName(conv.id, newName.trim());
            return response.status;
        } catch (error) {
            console.error("Failed to rename conversation", error);
            return false;
        }
    };

    const sendTyping = (text: string) => {
        if (!text.trim() || !activeConversation || activeConversation.id === 0) return;
        const now = Date.now();
        const lastSent = lastTypingSentRef.current[activeConversation.id] || 0;

        if (now - lastSent > 20000) {
            if (activeConversation.unread_count > 0) {
                markAsRead(activeConversation.id).catch(err => console.error("Failed to mark as read", err));
                setConversations(prev => prev.map(c =>
                    c.id === activeConversation.id ? { ...c, unread_count: 0 } : c
                ));
                setActiveConversation({ ...activeConversation, unread_count: 0 });
            }

            lastTypingSentRef.current[activeConversation.id] = now;
            sendTypingIndicator(activeConversation.id, activeConversation.customer_wa_id, user?.display_name || 'System')
                .catch(err => console.error("Failed to send typing indicator", err));
        }
    };

    
        const handleAgentTyping = (conversation_id: string | number, sender_name: string) => {
            if (activeConversation && activeConversation.id === conversation_id) {
                // Optionally, you can set a "typing" state here to show typing indicators in the UI
                console.log(`${sender_name} is typing in conversation ${conversation_id}`);
            }

            if (sender_name === user?.display_name) return;
            setTypingAgents(prev => {
                if (prev[conversation_id]) clearTimeout(prev[conversation_id].timeout);
                const timeout = setTimeout(() => {
                    setTypingAgents(curr => {
                        const updated = { ...curr };
                        delete updated[conversation_id];
                        return updated;
                    });
                }, 10000);
                return { ...prev, [conversation_id]: { name: sender_name, timeout } };
            });
        }

    useEffect(() => {
        if (!connection) return;
        connection.on("AgentTyping", handleAgentTyping);

        return () => {
            connection.off("AgentTyping", handleAgentTyping);
        };
    
    }, [connection]);

    return {
        handleSend,
        handleSendTemplate,
        handleSendMedia,
        handleSendReaction,
        handleRenameSubmit,
        sendTyping,
        typingAgents
    };
};
