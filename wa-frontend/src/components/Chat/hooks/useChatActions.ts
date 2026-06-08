
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
                    setMessages(prev => prev.map(m => m.wa_message_id === tempId ? { ...m, status: 'failed', raw_payload: JSON.stringify({ error_message: res.message }) } : m));
                }
            }).catch((err: any) => {
                const errMsg = err?.response?.data?.error || err?.message || '';
                setMessages(prev => prev.map(m => m.wa_message_id === tempId ? { ...m, status: 'failed', raw_payload: JSON.stringify({ error_message: errMsg }) } : m));
            });
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

        // Extract button types from template definition
        const buttonsComp = template.components?.find((c: any) => c.type === 'BUTTONS');
        const buttonTypes: string[] = buttonsComp?.buttons?.map((b: any) => b.type || 'QUICK_REPLY') || [];
        const mapSubType = (t: string) => {
            switch (t) {
                case 'URL': return 'url';
                case 'PHONE_NUMBER': return 'phone_number';
                case 'QUICK_REPLY': return 'quick_reply';
                case 'COPY_CODE': return 'copy_code';
                default: return 'quick_reply';
            }
        };

        // Build optimistic raw_payload with template_definition from selected template
        const msgComponents: any[] = [];
        if (params.header.length) msgComponents.push({ type: 'header', parameters: params.header.map((t: string) => ({ type: 'text', text: t })) });
        if (params.body.length) msgComponents.push({ type: 'body', parameters: params.body.map((t: string) => ({ type: 'text', text: t })) });

        // Optimistic buttons — distribute flat params to buttons based on template definition
        if (params.buttons.length && buttonsComp?.buttons) {
            let pi = 0;
            buttonsComp.buttons.forEach((btn: any, bi: number) => {
                const btnMatch = btn.text?.match(/{{\d+}}/g);
                const count = btnMatch ? new Set(btnMatch).size : 0;
                if (count === 0) return;
                const btnParams = [];
                for (let j = 0; j < count; j++) {
                    btnParams.push({ type: 'text', text: params.buttons[pi++] || '' });
                }
                msgComponents.push({ type: 'button', sub_type: mapSubType(btn.type), index: bi, parameters: btnParams });
            });
        }

        const newMessage: ChatMessage = {
            id: Date.now(),
            conversation_id: currentConv.id,
            app_id: currentConv.app_id,
            wa_message_id: tempId,
            sender_name: user?.display_name || 'Me',
            message_text: '',
            message_type: 'template',
            direction: 'OUTBOUND',
            status: 'pending',
            platform: 'whatsapp',
            created_at: new Date().toISOString(),
            raw_payload: JSON.stringify({
                template: { name: template.name, language: { code: template.language }, components: msgComponents },
                template_definition: template.components,
            }),
        };

        setMessages(prev => [...prev, newMessage]);

        sendTemplate(currentConv.wa_channel_id, currentConv.id, currentConv.customer_wa_id, template.name, template.language, params.body, params.buttons, buttonTypes, params.header, user?.display_name, tempId)
            .then((res: any) => {
                if (res.status) {
                    setMessages(prev => prev.map(m => m.wa_message_id === tempId ? { ...m, ...res.data } : m));
                } else {
                    setMessages(prev => prev.map(m => m.wa_message_id === tempId ? { ...m, status: 'failed', raw_payload: JSON.stringify({ error_message: res.message }) } : m));
                }
            }).catch((err: any) => {
                const errMsg = err?.response?.data?.error || err?.message || '';
                setMessages(prev => prev.map(m => m.wa_message_id === tempId ? { ...m, status: 'failed', raw_payload: JSON.stringify({ error_message: errMsg }) } : m));
            });
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
                setMessages(prev => prev.map(m => m.wa_message_id === tempId ? { ...m, status: 'failed', raw_payload: JSON.stringify({ error_message: resp.message }) } : m));
                return;
            }

            sendMessage(currentConv.wa_channel_id, currentConv.id, currentConv.customer_wa_id, caption, type, resp.data.media_id, file.name, user?.display_name, tempId, context_id)
            .then((res: any) => {
                if (res.status) {
                    setMessages(prev => prev.map(m => m.wa_message_id === tempId ? { ...m, ...res.data, reply_wamid: res.data.reply_wamid || m.reply_wamid, reply_text: res.data.reply_text || m.reply_text, reply_name: res.data.reply_name || m.reply_name } : m));
                } else {
                    setMessages(prev => prev.map(m => m.wa_message_id === tempId ? { ...m, status: 'failed', raw_payload: JSON.stringify({ error_message: res.message }) } : m));
                }
            }).catch((err: any) => {
                const errMsg = err?.response?.data?.error || err?.message || '';
                setMessages(prev => prev.map(m => m.wa_message_id === tempId ? { ...m, status: 'failed', raw_payload: JSON.stringify({ error_message: errMsg }) } : m));
            });
        } catch (error: any) {
            const errMsg = error?.message || '';
            setMessages(prev => prev.map(m => m.wa_message_id === tempId ? { ...m, status: 'failed', raw_payload: JSON.stringify({ error_message: errMsg }) } : m));
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
