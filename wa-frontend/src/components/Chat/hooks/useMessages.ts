import { useState, useEffect, useRef, useMemo } from 'react';
import { markAsRead } from '../../../services/chatService';
import { useMessagesInfiniteQuery, flattenMessages, updateMessageInCache, prependMessageToCache } from '../../../api/queries';
import type { ChatMessage, Conversation } from '../../../types/chat';

interface UseMessagesProps {
    activeConversation: Conversation | null;
    debouncedMessageSearchTerm: string;
    connection: any;
    setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>;
    setActiveConversation: React.Dispatch<React.SetStateAction<Conversation | null>>;
}

export const useMessages = ({
    activeConversation,
    debouncedMessageSearchTerm,
    connection,
    setConversations,
    setActiveConversation,
}: UseMessagesProps) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    const [isFetchingMore, setIsFetchingMore] = useState(false);

    const activeConversationRef = useRef(activeConversation);
    useEffect(() => { activeConversationRef.current = activeConversation; }, [activeConversation]);

    const prevConvIdRef = useRef(activeConversation?.id);
    const prevPagesLenRef = useRef(0);

    const query = useMessagesInfiniteQuery(
        debouncedMessageSearchTerm ? null : activeConversation?.id,
    );

    useEffect(() => {
        if (!activeConversation || activeConversation.id === 0) {
            setMessages([]);
            setHasMore(false);
            return;
        }
        if (activeConversation.unread_count > 0) {
            markAsRead(activeConversation.id).catch(() => {});
            setConversations(prev => prev.map(c =>
                c.id === activeConversation.id ? { ...c, unread_count: 0 } : c
            ));
            setActiveConversation(prev => prev ? { ...prev, unread_count: 0 } : null);
        }
    }, [activeConversation?.id]);

    useEffect(() => {
        if (!query.data || !activeConversation || activeConversation.id === 0) return;
        const pages = query.data.pages;
        if (pages.length === 0) return;

        const convChanged = prevConvIdRef.current !== activeConversation.id;
        const pagesLoaded = pages.length > prevPagesLenRef.current;

        if (convChanged) {
            prevConvIdRef.current = activeConversation.id;
            prevPagesLenRef.current = pages.length;
            setMessages(flattenMessages(pages));
            setHasMore(pages[pages.length - 1]?.hasMore ?? false);
            setIsLoading(false);
        } else if (pagesLoaded) {
            const newPages = pages.slice(prevPagesLenRef.current);
            const olderMsgs = newPages.flatMap(p => [...p.items].reverse());
            prevPagesLenRef.current = pages.length;
            setMessages(prev => [...olderMsgs, ...prev]);
            setHasMore(pages[pages.length - 1]?.hasMore ?? false);
            setIsFetchingMore(false);
        }
    }, [query.data, activeConversation?.id]);

    useEffect(() => {
        if (activeConversation?.id && activeConversation.id !== 0) {
            setIsLoading(query.isLoading);
        }
    }, [query.isLoading, activeConversation?.id]);

    const processedMessages = useMemo(() => {
        const reactionsMap: Record<string, Record<string, string>> = {};
        messages.forEach(msg => {
            if (msg.message_type === 'reaction' && msg.context_message_id) {
                if (!reactionsMap[msg.context_message_id]) reactionsMap[msg.context_message_id] = {};
                const sideKey = msg.direction;
                if (msg.message_text && msg.message_text.trim()) {
                    reactionsMap[msg.context_message_id][sideKey] = msg.message_text;
                } else {
                    delete reactionsMap[msg.context_message_id][sideKey];
                }
            }
        });

        return [...new Map(messages.map((item) => [item.id, item])).values()]
            .filter(msg => msg.message_type !== 'reaction')
            .map(msg => {
                const senderMap = reactionsMap[msg.wa_message_id] || {};
                const activeReactions = Object.values(senderMap);
                const uniqueEmojis = Array.from(new Set(activeReactions));

                if (activeReactions.length === 0 && !msg.reactionData) {
                    return msg;
                }

                return {
                    ...msg,
                    reactions: activeReactions,
                    reactionData: activeReactions.length > 0 ? {
                        emojis: uniqueEmojis,
                        total: activeReactions.length
                    } : null
                };
            });
    }, [messages]);

    const handleLoadMore = async (scrollViewport: HTMLDivElement | null) => {
        if (!activeConversation || !hasMore || isFetchingMore || !query.hasNextPage) return;
        const convIdAtStart = activeConversation.id;
        setIsFetchingMore(true);
        try {
            const previousScrollHeight = scrollViewport?.scrollHeight || 0;
            await query.fetchNextPage();
            if (activeConversationRef.current?.id !== convIdAtStart) return;
            if (scrollViewport) {
                setTimeout(() => {
                    scrollViewport.scrollTop = scrollViewport.scrollHeight - previousScrollHeight;
                }, 0);
            }
        } catch (error) {
            console.error("Failed to fetch older messages", error);
        } finally {
            setIsFetchingMore(false);
        }
    };

    useEffect(() => {
        if (!connection) return;

        const handleReceiveMessage = (message: any) => {
            const chatMsg = message as ChatMessage;
            const conv = activeConversationRef.current;
            const compositeId = conv ? `${conv.wa_channel_id}_${conv.customer_wa_id}` : '';
            if (!conv || (chatMsg.conversation_id !== conv.id && chatMsg.conversation_id !== compositeId)) return;

            console.log('[WS] ReceiveMessage', { type: chatMsg.message_type, wamid: chatMsg.wa_message_id, text: chatMsg.message_text?.slice(0,30), file_path: chatMsg.file_path, conv_id: conv.id, compositeId });
            const convId = conv.id;
            const tempMatch = (m: ChatMessage) =>
                typeof m.wa_message_id === 'string' &&
                m.wa_message_id.startsWith('temp_') &&
                (String(m.conversation_id) === String(convId) || String(m.conversation_id) === compositeId);

            setMessages(prev => {
                const existing = prev.find(m => m.wa_message_id === chatMsg.wa_message_id);
                if (existing) {
                    const updated = {
                        ...existing, ...chatMsg,
                        sender_name: existing.sender_name,
                        reply_wamid: chatMsg.reply_wamid || existing.reply_wamid,
                        reply_text: chatMsg.reply_text || existing.reply_text,
                        reply_name: chatMsg.reply_name || existing.reply_name,
                        emoji: chatMsg.emoji || existing.emoji,
                        file_path: chatMsg.file_path || existing.file_path,
                    };
                    updateMessageInCache(convId, m => m.wa_message_id === chatMsg.wa_message_id, () => updated);
                    return prev.map(m => m.wa_message_id === chatMsg.wa_message_id ? updated : m);
                }

                const hasPending = prev.some(tempMatch);
                if (hasPending) {
                    updateMessageInCache(convId, tempMatch, m => ({ ...m, status: chatMsg.status || m.status }));
                    return prev.map(m => tempMatch(m) ? { ...m, status: chatMsg.status || m.status } : m);
                }

                // New inbound message: update local state + RQ cache
                prependMessageToCache(convId, chatMsg);
                return [...prev, chatMsg].sort((a, b) => (a.message_timestamp ?? 0) - (b.message_timestamp ?? 0));
            });
        };

        const handleMessageStatusUpdated = (waMessageId: string, status: string, oldId?: string) => {
            const conv = activeConversationRef.current;
            if (!conv) return;
            setMessages(prev => {
                const result = prev.map(m => {
                    if (m.wa_message_id === waMessageId) return { ...m, status };
                    if (oldId && m.wa_message_id === oldId) return { ...m, wa_message_id: waMessageId, status };
                    return m;
                });
                updateMessageInCache(conv.id, m => m.wa_message_id === waMessageId || (!!oldId && m.wa_message_id === oldId), m => ({
                    ...m, status, ...(m.wa_message_id === oldId ? { wa_message_id: waMessageId } : {})
                }));
                return result;
            });
        };

        const handleMessageStatusFailed = (waMessageId: string, raw_payload: any) => {
            const conv = activeConversationRef.current;
            if (!conv) return;
            const parsedPayload = JSON.parse((raw_payload as string) || '{}');
            const errorDetails = parsedPayload?.error_details;
            setMessages(prev => {
                const result = prev.map(m => {
                    if (m.wa_message_id === waMessageId) {
                        const oldParsedPayload = JSON.parse(m.raw_payload || '{}');
                        const rawPayload = JSON.stringify({ ...oldParsedPayload, error_details: errorDetails });
                        return { ...m, raw_payload: rawPayload, status: 'failed' };
                    }
                    return m;
                });
                updateMessageInCache(conv.id, m => m.wa_message_id === waMessageId, m => ({
                    ...m, status: 'failed'
                }));
                return result;
            });
        }

        connection.on("ReceiveMessage", handleReceiveMessage);
        connection.on("MessageStatusUpdated", handleMessageStatusUpdated);
        connection.on("MessageStatusFailed", handleMessageStatusFailed);

        return () => {
            connection.off("ReceiveMessage", handleReceiveMessage);
            connection.off("MessageStatusUpdated", handleMessageStatusUpdated);
            connection.off("MessageStatusFailed", handleMessageStatusFailed);
        };
    }, [connection]);

    return {
        messages,
        processedMessages,
        setMessages,
        isLoading,
        hasMore,
        isFetchingMore,
        handleLoadMore
    };
};