
import { useEffect, useRef, useState } from 'react';
import { sendMessage, sendTemplate, updateConversationName, sendTypingIndicator, sendMedia, sendReaction } from '../../services/chatService';
import type { Conversation, Bubble, ApiResponse, SendTextResponse, SendTextRequest, SendMediaRequest, SendMediaResponse, SendTemplateRequest, SendTemplateResponse, SendReactionRequest, PhoneNumber } from '../../types/chat';
import { User } from '@/types';
import { Guid } from 'guid-ts';
import { ButtonComponent, TemplateComponent, WaTemplate } from '@/components/TemplatePickerDialog';
import { normalizeTo62 } from '@/lib/chatUtils';

interface UseChatActionsProps {
    user: User;
    enableLogin?: boolean;
    activeConversation: Conversation | null;
    connection: any;
    conversations: Conversation[];
    phoneNumbers: PhoneNumber[];
    setActiveConversation: (conv: Conversation | null) => void;
    setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>;
    setMessages: React.Dispatch<React.SetStateAction<Bubble[]>>;
}

export const useChatActions = ({
    user,
    enableLogin,
    activeConversation,
    connection,
    phoneNumbers,
    setActiveConversation,
    setConversations,
    conversations,
    setMessages,    
}: UseChatActionsProps) => {

    const [typingUsers, setTypingUsers] = useState<Record<string, { name: string; timeout: any }>>({});
    user.name = user.name;

    const lastTypingSentRef = useRef<Record<string | number, number>>({});

     const initialChat = async (waId : string, name : string, phoneNumberId : string) => {
        const normalizedWaId = normalizeTo62(waId.trim());
                            const existing = conversations.find(c => c.wa_id === normalizedWaId && c.phone_number_id === phoneNumberId);
                            if (existing) {
                                setActiveConversation(existing);
                                // setShowTemplateQuickAction(true);
                            } else {
                                const selectedChannel = phoneNumbers.find(c => c.id === phoneNumberId);
                                const id = Guid.newGuid().toString();
                                const tempConv: Conversation = {
                                    id: id,
                                    phone_number_id: phoneNumberId,
                                    wa_id: normalizedWaId,
                                    custom_name: name || normalizedWaId, display_phone_number: selectedChannel?.display_phone_number || '',
                                    last_message_preview: '', unread_count: 0, is_template_required: true,conversation_timestamp: Date.now(),
                                    display_name: selectedChannel?.display_name || selectedChannel?.display_phone_number || 'WA Number',last_message_at: Date(),
                                    profile_name: selectedChannel?.display_name
                                };
                                setActiveConversation(tempConv);
                                setMessages([]);
                                // setShowTemplateQuickAction(true);
                            }
    }

    const handleSend = async (text: string, replyingTo: Bubble | null, clearInput: () => void) => {
        if (!text.trim() || !activeConversation) return;

        let currentConv = activeConversation;

         const id = Guid.newGuid().toString();
        const newBubble : Bubble = {
            id : id,
            wa_id: currentConv.wa_id,
            conversation_id: currentConv.id,
            phone_number_id: currentConv.phone_number_id,
            wamid: id,
            message_type: 'text',
            direction: 'outbound',
            status: 'pending',
            message_timestamp: Math.floor(Date.now()),
            created_at: new Date().toISOString(),
            sender_name: user?.name || 'Me',
            agent_name: user?.name || 'Me',
            content: {
                body: {
                    text: text,
                }
            }
        }

        if(replyingTo) {
            newBubble.context = {
                context_id : replyingTo.id,
                name : replyingTo.sender_name,
                text : replyingTo.content?.body?.text
            }

            newBubble.content.context = {
                context_id : replyingTo.id,
                name : replyingTo.sender_name,
                text : replyingTo.content?.body?.text
            }
        }
        const context_id = replyingTo?.id;

        clearInput();

        const payload : SendTextRequest = {
            to: currentConv.wa_id,
            body: text,
            phone_number_id: currentConv.phone_number_id,
            context_message_id : context_id
        }

        sendMessage(payload)
            .then((res : ApiResponse<SendTextResponse>) => {
                if (!res.success) {
                   setMessages(prev => prev.map(m => m.id === id ? { ...m, status: 'failed', id : id, error_message: res?.message } : m));
                }else{
                    newBubble.id = res?.data?.id; 
                    setMessages(prev => [...prev, newBubble]);
                }
            }).catch((err: Error) => {
                const errMsg = err.message;
                setMessages(prev => prev.map(m => m.id === id ? { ...m, status: 'failed', id : id, error_message: errMsg } : m));
            });
    };

     const replaceParams = (text: string, paramsArr: string[], offset: number = 0) => {
                            if (!text) return "";
                            return text.replace(/{{\d+}}/g, (match) => {
                                const idx = parseInt(match.match(/\d+/)?.[0] || "1") - 1 - offset;
                                return paramsArr[idx] || match;
                            });
                            };

    const handleSendTemplate = async (template: WaTemplate, params: { body: string[], buttons: string[], header: string[] }) => {
        if (!activeConversation) return;
        let currentConv = activeConversation;

        const header = template.components.find((c) => c.type === 'HEADER');
        const body = template.components.find((c) => c.type === 'BODY');
        const footer = template.components.find((c) => c.type === 'FOOTER');

        // Extract button types from template definition
        const buttonsComp = template.components?.find((c: TemplateComponent) => c.type === 'BUTTONS');
        const mapSubType = (t: string) => {
            switch (t) {
                case 'URL': return 'url';
                case 'PHONE_NUMBER': return 'phone_number';
                case 'QUICK_REPLY': return 'quick_reply';
                case 'COPY_CODE': return 'copy_code';
                default: return 'quick_reply';
            }
        };

        const id = Guid.newGuid().toString();
        const newBubble : Bubble = {
            id: id,
            wa_id: currentConv.wa_id,
            conversation_id: currentConv.id,
            phone_number_id: currentConv.phone_number_id,
            wamid: id,
            message_type: 'template',
            direction: 'outbound',
            status: 'pending',
            message_timestamp: Math.floor(Date.now()),
            created_at: new Date().toISOString(),
            sender_name: user?.name || 'Me',
            agent_name: user?.name || 'Me',
            content: {}
            // : replyingTo?.wa_message_id || undefined
        }

        if(header?.text){
            newBubble.content.header = {
                text : replaceParams(header.text, params.header)
            };
        }

        if(body?.text){
            newBubble.content.body = {
                text : replaceParams(body.text, params.body)
            };
        }

        if(footer?.text){
            newBubble.content.footer = {
                text : footer.text
            };
        }

        if(buttonsComp?.buttons){
            newBubble.content.buttons = buttonsComp.buttons.map((b: ButtonComponent) => {
                return {
                    format : b.type,
                    text : replaceParams(b.text, params.buttons),
                    url : b.url
                }
            })
        } 
        
        let template_params : any = {};

        // HEADER — determine type from template definition
        const headerComp = template.components.find(c => c.type === 'HEADER');
        if (params.header.length && headerComp) {
        if (headerComp.format === 'TEXT') {
            template_params.header = params.header.map(t => ({ type: 'text', text: t }));
        }
        // IMAGE / VIDEO / DOCUMENT → bisa ditambah nanti
        }

        // BODY — always text
        if (params.body.length) {
        template_params.body = params.body.map(t => ({ type: 'text', text: t }));
        }

        // BUTTONS — grouped per button
        if (params.buttons.length && buttonsComp?.buttons) {
        template_params.buttons = [];
        let pi = 0;
        buttonsComp.buttons.forEach((btn, bi) => {
            const textCount = (btn.text?.match(/{{\d+}}/g)?.length || 0);
            const urlCount = (btn.url?.match(/{{\d+}}/g)?.length || 0);
            const parameters: any[] = [];

            for (let j = 0; j < textCount; j++) {
            parameters.push({ type: 'text', text: params.buttons[pi++] || '' });
            }
            for (let j = 0; j < urlCount; j++) {
            const st = mapSubType(btn.type);
            if (st === 'copy_code') {
                parameters.push({ type: 'coupon_code', coupon_code: params.buttons[pi++] || '' });
            } else {
                parameters.push({ type: 'text', text: params.buttons[pi++] || '' });
            }
            }

            if(btn.type === 'COPY_CODE' && btn){
                parameters.push({ type: 'coupon_code', coupon_code: params.buttons[pi++] || '' });
            }

            if (parameters.length) {
            template_params.buttons.push({
                sub_type: mapSubType(btn.type),
                index: bi,
                parameters,
            });
            }
        });
        }

        try{
            const payload : SendTemplateRequest = {
                to : currentConv.wa_id,
                phone_number_id : currentConv.phone_number_id,
                template_name : template.name,
                template_lang : template.language,
                template_params
            }

        sendTemplate(payload)
            .then((res: ApiResponse<SendTemplateResponse>) => {
               if (!res.success) {
                   setMessages(prev => prev.map(m => m.id === id ? { ...m, status: 'failed', id : id, error_message: res?.message } : m));
                }else{
                    newBubble.id = res?.data?.id; 
                    setMessages(prev => [...prev, newBubble]);
                }
            }).catch((err: any) => {
                
                console.log("res send template",err);
                const errMsg =  err?.message || '';
                setMessages(prev => prev.map(m => m.id === id ? { ...m, status: 'failed', error_message: errMsg } : m));
            });
        } catch (error: any) {
            const errMsg = error?.message || '';
            setMessages(prev => prev.map(m => m.id === id ? { ...m, status: 'failed', error_message: errMsg } : m));
        }
    };

    const handleSendMedia = async (file: File, previewUrl: string, type: 'image' | 'video' | 'audio' | 'document', caption: string, replyingTo: Bubble | null) => {
        if (!activeConversation) return;
        const currentConv = activeConversation;
        const tempId = `temp_${Guid.newGuid().toString()}`;
        const context_id = replyingTo ? replyingTo?.id : null;

        const id = Guid.newGuid().toString();
        const newBubble : Bubble = {
            id: id,
            wa_id: currentConv.wa_id,
            conversation_id: currentConv.id,
            phone_number_id: currentConv.phone_number_id,
            wamid: id,
            message_type: type,
            direction: 'outbound',
            status: 'pending',
            message_timestamp: Math.floor(Date.now()),
            created_at: new Date().toISOString(),
            sender_name: user?.name || 'Me',
            agent_name: user?.name || 'Me',
            content: {}
        }

         switch(type) {
             case 'image':
                 newBubble.content.body = {
                     format: type,
                     text : caption,
                     url : previewUrl,
                     file_name : file.name
                 }
             case 'video':
                 newBubble.content.body = {
                     format: type,
                     text : caption,
                     url : previewUrl,
                     file_name : file.name
                 }
             case 'audio':
                 newBubble.content.body = {
                     format: type,
                     text : caption,
                     url : previewUrl,
                     file_name : file.name
                 }
             case 'document':
                 newBubble.content.body = {
                     format: type,
                     text : caption,
                     url : previewUrl,
                     file_name : file.name
                 }
         }

          if(replyingTo) {
            newBubble.context = {
                context_id : replyingTo.id,
                name : replyingTo.sender_name,
                text : replyingTo.content?.body?.text
            }

            newBubble.content.context = {
                context_id : replyingTo.id,
                name : replyingTo.sender_name,
                text : replyingTo.content?.body?.text
            }
        }

        try {

            const payload : SendMediaRequest = {
                to: currentConv.wa_id,
                body: caption,
                phone_number_id: currentConv.phone_number_id,
                type: type,
                context_message_id: context_id,
                file: file
            } 

           sendMedia(payload)
             .then((res: ApiResponse<SendMediaResponse>) => {
                if (!res.success) {
                   setMessages(prev => prev.map(m => m.id === id ? { ...m, status: 'failed', error_message: res?.message } : m));
                } else{
                    newBubble.id = res?.data?.id; 
                    newBubble.content.body.url = res?.data?.media_url;
                    setMessages(prev => [...prev, newBubble]);
                }
            }).catch((err: Error) => {
                const errMsg =  err?.message || '';
                setMessages(prev => prev.map(m => m.id === id ? { ...m, status: 'failed', raw_payload: JSON.stringify({ error_message: errMsg }) } : m));
            });
        } catch (error: any) {
            const errMsg = error?.message || '';
            setMessages(prev => prev.map(m => m.wamid === tempId ? { ...m, status: 'failed', raw_payload: JSON.stringify({ error_message: errMsg }) } : m));
        }
    };

    const handleSendReaction = async (emoji: string, targetMsg: Bubble) => {
        if (!activeConversation) return;
        try {
            const payload : SendReactionRequest = {
                to: activeConversation.wa_id,
                reaction: emoji,
                phone_number_id: activeConversation.phone_number_id,
                context_message_id: targetMsg.wamid,
                message_id: targetMsg.id
            }

            await sendReaction(payload);
        } catch (error) {
            console.error("Failed to send reaction", error);
        }
    };

    const handleRenameSubmit = async (conv: Conversation, newName: string) => {
        if (!conv || !newName.trim()) return false;
        try {
            const response = await updateConversationName(conv.phone_number_id, conv.wa_id, newName.trim());
            return response.success;
        } catch (error) {
            console.error("Failed to rename conversation", error);
            return false;
        }
    };

    const sendTyping = (text: string) => {
        if (!text.trim() || !activeConversation || activeConversation.id == "") return;
        const now = Date.now();
        const lastSent = lastTypingSentRef.current[activeConversation.id] || 0;

        if (now - lastSent > 20000) {
            if (activeConversation.unread_count > 0) {
                // markAsRead(activeConversation.id).catch(err => console.error("Failed to mark as read", err));
                setConversations(prev => prev.map(c =>
                    c.id === activeConversation.id ? { ...c, unread_count: 0 } : c
                ));
                setActiveConversation({ ...activeConversation, unread_count: 0 });
            }

            lastTypingSentRef.current[activeConversation.id] = now;
            sendTypingIndicator(activeConversation.id)
                .catch(err => console.error("Failed to send typing indicator", err));
        }
    };
    
    const handleUserTyping = (conversation_id: string | number, sender_name: string) => {
        if (activeConversation && activeConversation.id === conversation_id) {
            // Optionally, you can set a "typing" state here to show typing indicators in the UI
            console.log(`${sender_name} is typing in conversation ${conversation_id}`);
        }

        if (sender_name === user?.name) return;
        setTypingUsers(prev => {
            if (prev[conversation_id]) clearTimeout(prev[conversation_id].timeout);
            const timeout = setTimeout(() => {
                setTypingUsers(curr => {
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
        connection.on("UserTyping", handleUserTyping);

        return () => {
            connection.off("UserTyping", handleUserTyping);
        };
    
    }, [connection]);

    return {
        handleSend,
        handleSendTemplate,
        handleSendMedia,
        handleSendReaction,
        handleRenameSubmit,
        sendTyping,
        typingUsers,
        initialChat
    };
};
