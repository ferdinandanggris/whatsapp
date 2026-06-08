
import { useState, useEffect, useRef } from 'react';
import { getConversations, getApplicationSummary } from '../../../services/chatService';
import type { Conversation, ChatMessage, ApplicationSummary } from '../../../types/chat';

interface UseConversationsProps {
    activeAppId: string | number | null;
    debouncedSearchTerm: string;
    convFilter: 'all' | 'unread' | 'read';
    connection: any;
    activeConversation: Conversation | null;
    setActiveConversation: (conv: Conversation | null) => void;
    setApplications: (apps: ApplicationSummary[]) => void;
}

export const useConversations = ({
    activeAppId,
    debouncedSearchTerm,
    convFilter,
    connection, 
    activeConversation,
    setActiveConversation,
    setApplications,
}: UseConversationsProps) => {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasMoreConvs, setHasMoreConvs] = useState(false);
    const [nextConvCursorId, setNextConvCursorId] = useState<string | number | null>(null);
    const [nextConvCursorUpdatedAt, setNextConvCursorUpdatedAt] = useState<string | null>(null);
    const [isFetchingMoreConvs, setIsFetchingMoreConvs] = useState(false);

    const activeAppIdRef = useRef(activeAppId);
    const activeConversationRef = useRef(activeConversation);

    useEffect(() => { activeAppIdRef.current = activeAppId; }, [activeAppId]);
    useEffect(() => { activeConversationRef.current = activeConversation; }, [activeConversation]);

    const fetchConvs = async (silent = false) => {
        if (!silent) setIsLoading(true);
        try {
            const response = await getConversations(
                50,
                undefined,
                undefined,
                activeAppId || undefined,
                debouncedSearchTerm || undefined,
                convFilter === 'all' ? undefined : convFilter
            );
            if (response.status) {
                setConversations(response.data.items);
                setHasMoreConvs(response.data.has_more);
                setNextConvCursorId(response.data.next_cursor_id || null);
                setNextConvCursorUpdatedAt(response.data.next_cursor_updated_at || null);

                if (activeConversation && !response.data.items.some(c => c.id === activeConversation.id)) {
                    setActiveConversation(null);
                }
            }
        } catch (error) {
            console.error("Failed to fetch conversations", error);
        } finally {
            if (!silent) setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchConvs();
    }, [activeAppId, debouncedSearchTerm, convFilter]);

    const handleLoadMoreConversations = async () => {
        if (!hasMoreConvs || isFetchingMoreConvs) return;

        setIsFetchingMoreConvs(true);
        try {
            const response = await getConversations(
                50,
                nextConvCursorUpdatedAt || undefined,
                nextConvCursorId || undefined,
                activeAppId || undefined,
                debouncedSearchTerm || undefined,
                convFilter === 'all' ? undefined : convFilter
            );

            if (response.status) {
                setConversations(prev => {
                    const newItems = response.data.items.filter(item => !prev.some(p => p.id === item.id));
                    return [...prev, ...newItems];
                });
                setHasMoreConvs(response.data.has_more);
                setNextConvCursorId(response.data.next_cursor_id || null);
                setNextConvCursorUpdatedAt(response.data.next_cursor_updated_at || null);
            }
        } catch (error) {
            console.error("Failed to fetch more conversations", error);
        } finally {
            setIsFetchingMoreConvs(false);
        }
    };

    useEffect(() => {
        if (!connection) return;

        const handleUpdateConversation = (conv: Conversation) => {
            getApplicationSummary().then(res => {
                if (res.status) setApplications(res.data);
            });

            if (activeConversationRef.current && activeConversationRef.current.id === conv.id) {
                setActiveConversation({
                    ...conv,
                    unread_count: activeConversationRef.current.unread_count === 0 ? 0 : conv.unread_count
                });
            }

            if (activeAppIdRef.current !== null && conv.app_id !== activeAppIdRef.current) return;

            setConversations(prev => {
                const index = prev.findIndex(c => c.id === conv.id);
                if (index !== -1) {
                    const updated = [...prev];
                    updated[index] = conv;
                    const item = updated.splice(index, 1)[0];
                    return [item, ...updated];
                } else {
                    return [conv, ...prev];
                }
            });
        };

        const templatePreview = (msg: ChatMessage) => {
            const payload = typeof msg.raw_payload === 'string' ? JSON.parse(msg.raw_payload) : msg.raw_payload;

        // Template definition from backend JOIN (uppercase types: BODY, HEADER, BUTTONS)
        const definition: any[] = payload.template_definition;

        // Template message components from stored content (lowercase types: body, header, button)
        const msgComponents: any[] = payload.template?.components || [];

        if (!definition || !Array.isArray(definition)) {
            const tplName = payload.template?.name || payload.body || '';
            return `Template: ${tplName}`;
        }

        // Build param map: lowercase type → array of text values
        const paramMap: Record<string, string[]> = {};
        for (const comp of msgComponents) {
            const type = comp.type?.toLowerCase();
            const values = (comp.parameters || []).map((p: any) => p.text || '');
            if (type) paramMap[type] = values;
        }

        const getParams = (defType: string): string[] => {
            const lower = defType.toLowerCase();
            // For buttons, params may be in 'button' entries too
            if (lower === 'buttons') {
                return paramMap['button'] || paramMap['buttons'] || [];
            }
            return paramMap[lower] || [];
        };

        const replaceParams = (text: string, params: string[]) => {
            if (!text) return '';
            let idx = 0;
            return text.replace(/{{\d+}}/g, () => params[idx] || '');
        };

        const bodyDef = definition.find((c: any) => c.type === 'BODY');

        return replaceParams(bodyDef?.text || '', getParams('body'))

        }

        const handleReceiveMessage = (message: any) => {
            const chatMsg = message as ChatMessage;
            if (activeAppIdRef.current !== null && chatMsg.app_id !== activeAppIdRef.current) return;

            setConversations(prev => {
                const index = prev.findIndex(c =>
                    c.id === chatMsg.conversation_id ||
                    `${c.wa_channel_id}_${c.customer_wa_id}` === chatMsg.conversation_id
                );
                if (index !== -1) {

                    // check convFilter
                    console.log(`convFilter: ${convFilter}, message direction: ${chatMsg.direction}`);
                    if (convFilter === 'unread' && chatMsg.direction === 'OUTBOUND') {
                        return prev;
                    }

                    const updated = [...prev];
                    const conv = { ...updated[index] };

                    let preview = chatMsg.message_text;
                    if (chatMsg.message_type === 'image') preview = (chatMsg.message_text == "") ? "📷 Foto" : `📷 ${chatMsg.message_text}`;
                    else if (chatMsg.message_type === 'video') preview = (chatMsg.message_text == "") ? "🎥 Video" : `🎥 ${chatMsg.message_text}`;
                    else if (chatMsg.message_type === 'audio') preview = (chatMsg.message_text == "") ? "🎵 Audio" : `🎵 ${chatMsg.message_text}`;
                    else if (chatMsg.message_type === 'document') preview = (chatMsg.message_text == "") ? "📄 Dokumen" : `📄 ${chatMsg.message_text}`;
                    else if (chatMsg.message_type === 'sticker') preview = `${chatMsg.direction === 'INBOUND' ? conv.customer_name : 'Me'} sent a sticker`;
                    else if (chatMsg.message_type === 'reaction') preview = `${chatMsg.direction === 'INBOUND' ? conv.customer_name : 'Me'} reacted to a message`;
                    else if (chatMsg.message_type === 'location') preview = `${chatMsg.direction === 'INBOUND' ? conv.customer_name : 'Me'} shared a location`;
                    else if (chatMsg.message_type === 'template') preview =  templatePreview(chatMsg) || 'Template Message';

                    conv.last_message_preview = preview;
                    conv.last_message_timestamp = chatMsg.message_timestamp;
                    conv.updated_at = chatMsg.created_at;

                    if (chatMsg.direction === 'INBOUND') {

                        // Bridge to WinForms for desktop notification
                        if ((window as any).chrome?.webview) {
                            (window as any).chrome.webview.postMessage({
                                type: 'SHOW_NOTIFICATION',
                                title: conv.customer_name || "Pesan Baru",
                                message: preview
                            });
                        }

                        // Refresh app badges in sidebar
                        getApplicationSummary().then(res => {
                            if (res.status) setApplications(res.data);
                        });
                    }

                    // const activeConv = activeConversationRef.current;
                    // const activeComposite = activeConv
                    //     ? `${activeConv.wa_channel_id}_${activeConv.customer_wa_id}`
                    //     : '';
                    // if (activeConv && (activeConv.id === chatMsg.conversation_id || activeComposite === chatMsg.conversation_id)) {
                    //     setActiveConversation({
                    //         ...activeConv,
                    //         unread_count: activeConv.unread_count + 1
                    //     });
                    // }

                    updated[index] = conv;
                    const item = updated.splice(index, 1)[0];
                    return [item, ...updated];
                }
                return prev;
            });


        };

        connection.on("UpdateConversation", handleUpdateConversation);
        connection.on("ReceiveMessage", handleReceiveMessage);

        return () => {
            connection.off("UpdateConversation", handleUpdateConversation);
            connection.off("ReceiveMessage", handleReceiveMessage);
        };
    }, [connection]);

    return {
        conversations,
        setConversations,
        isLoading,
        hasMoreConvs,
        isFetchingMoreConvs,
        handleLoadMoreConversations,
        fetchConvs
    };
};
