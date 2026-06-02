import { useState, useEffect, useRef, useMemo } from 'react';
import { getMessages, markAsRead } from '../../../services/chatService';
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
    const [nextCursorTs, setNextCursorTs] = useState<string | undefined>(undefined);
    const [nextCursorId, setNextCursorId] = useState<number | undefined>(undefined);

    const activeConversationRef = useRef(activeConversation);
    useEffect(() => { activeConversationRef.current = activeConversation; }, [activeConversation]);

    const searchTerm = debouncedMessageSearchTerm;

    // Fetch messages on conversation switch or search change
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

        setIsLoading(true);
        getMessages(activeConversation.id, 50, undefined, undefined, searchTerm || undefined)
            .then(res => {
                if (res.status) {
                    // Backend returns newest-first; reverse for display (oldest-first)
                    setMessages([...res.data.items].reverse());
                    setHasMore(res.data.has_more);
                    setNextCursorTs(res.data.next_cursor_ts);
                    setNextCursorId(res.data.next_cursor_id as number | undefined);
                }
            })
            .catch(console.error)
            .finally(() => setIsLoading(false));
    }, [activeConversation?.id, searchTerm]);

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
        if (!activeConversation || !hasMore || isFetchingMore) return;
        const convIdAtStart = activeConversation.id;
        setIsFetchingMore(true);
        try {
            const previousScrollHeight = scrollViewport?.scrollHeight || 0;
            const res = await getMessages(activeConversation.id, 50, nextCursorTs, nextCursorId, searchTerm || undefined);
            if (activeConversationRef.current?.id !== convIdAtStart) return;
            if (res.status) {
                // Backend returns newest-first; older messages get reversed + prepended
                const olderItems = [...res.data.items].reverse();
                setMessages(prev => [...olderItems, ...prev]);
                setHasMore(res.data.has_more);
                setNextCursorTs(res.data.next_cursor_ts);
                setNextCursorId(res.data.next_cursor_id as number | undefined);
                if (scrollViewport) {
                    setTimeout(() => {
                        scrollViewport.scrollTop = scrollViewport.scrollHeight - previousScrollHeight;
                    }, 0);
                }
            }
        } catch (error) {
            console.error("Failed to fetch older messages", error);
        } finally {
            setIsFetchingMore(false);
        }
    };

    // WS event handlers — only update local state, no TanStack cache
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
                    return prev.map(m => m.wa_message_id === chatMsg.wa_message_id ? {
                        ...existing, ...chatMsg,
                        sender_name: existing.sender_name,
                        reply_wamid: chatMsg.reply_wamid || existing.reply_wamid,
                        reply_text: chatMsg.reply_text || existing.reply_text,
                        reply_name: chatMsg.reply_name || existing.reply_name,
                        emoji: chatMsg.emoji || existing.emoji,
                        file_path: chatMsg.file_path || existing.file_path,
                    } : m);
                }

                const hasPending = prev.some(tempMatch);
                if (hasPending) {
                    return prev.map(m => tempMatch(m) ? { ...m, status: chatMsg.status || m.status } : m);
                }

                // New inbound message: append and sort by timestamp
                return [...prev, chatMsg].sort((a, b) => (a.message_timestamp ?? 0) - (b.message_timestamp ?? 0));
            });
        };

        const handleMessageStatusUpdated = (waMessageId: string, status: string, oldId?: string) => {
            const conv = activeConversationRef.current;
            if (!conv) return;
            setMessages(prev => prev.map(m => {
                if (m.wa_message_id === waMessageId) return { ...m, status };
                if (oldId && m.wa_message_id === oldId) return { ...m, wa_message_id: waMessageId, status };
                return m;
            }));
        };

        const handleMessageStatusFailed = (waMessageId: string, raw_payload: any) => {
            const conv = activeConversationRef.current;
            if (!conv) return;
            const parsedPayload = JSON.parse((raw_payload as string) || '{}');
            const errorDetails = parsedPayload?.error_details;
            setMessages(prev => prev.map(m => {
                if (m.wa_message_id === waMessageId) {
                    const oldParsedPayload = JSON.parse(m.raw_payload || '{}');
                    const rawPayload = JSON.stringify({ ...oldParsedPayload, error_details: errorDetails });
                    return { ...m, raw_payload: rawPayload, status: 'failed' };
                }
                return m;
            }));
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
