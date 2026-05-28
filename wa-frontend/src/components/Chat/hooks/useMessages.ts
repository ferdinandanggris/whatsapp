
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
    const [nextCursorId, setNextCursorId] = useState<string | number | null>(null);
    const [isFetchingMore, setIsFetchingMore] = useState(false);

    const activeConversationRef = useRef(activeConversation);
    useEffect(() => { activeConversationRef.current = activeConversation; }, [activeConversation]);

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

    useEffect(() => {
        if (!activeConversation) return;
        if (activeConversation.id === 0) {
            setMessages([]);
            setHasMore(false);
            setNextCursorId(null);
            return;
        }

        const fetchMessages = async () => {
            setIsLoading(true);
            setMessages([]);
            try {
                const response = await getMessages(activeConversation.id, 30, undefined, debouncedMessageSearchTerm || undefined);
                if (response.status) {
                    setMessages(response.data.items.reverse());
                    setHasMore(response.data.has_more);
                    setNextCursorId(response.data.next_cursor_id || null);
                }
            } catch (error) {
                console.error("Failed to fetch messages", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchMessages();

        if (activeConversation.unread_count > 0) {
            markAsRead(activeConversation.id).catch(err => console.error("Failed to mark as read", err));
            setConversations(prev => prev.map(c =>
                c.id === activeConversation.id ? { ...c, unread_count: 0 } : c
            ));
            setActiveConversation(prev => prev ? { ...prev, unread_count: 0 } : null);
        }
    }, [activeConversation?.id, debouncedMessageSearchTerm]);

    const handleLoadMore = async (scrollViewport: HTMLDivElement | null) => {
        if (!activeConversation || !hasMore || isFetchingMore || !nextCursorId) return;

        const convIdAtStart = activeConversation.id;
        setIsFetchingMore(true);
        try {
            const previousScrollHeight = scrollViewport?.scrollHeight || 0;
            const response = await getMessages(convIdAtStart, 30, nextCursorId);

            if (response.status && activeConversationRef.current?.id === convIdAtStart) {
                const newMessages = response.data.items.reverse();
                setMessages(prev => [...newMessages, ...prev]);
                setHasMore(response.data.has_more);
                setNextCursorId(response.data.next_cursor_id || null);

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

    useEffect(() => {
        if (!connection) return;

        const handleReceiveMessage = (message: any) => {
            const chatMsg = message as ChatMessage;
            if (activeConversationRef.current && chatMsg.conversation_id === activeConversationRef.current.id) {
                setMessages(prev => {
                    if (prev.some(m => m.wa_message_id === chatMsg.wa_message_id)) {
                        return prev.map(m => m.wa_message_id === chatMsg.wa_message_id ? { ...m, ...chatMsg } : m);
                    }
                    return [...prev, chatMsg].sort((a, b) => (a.message_timestamp ?? 0) - (b.message_timestamp ?? 0));
                });
            }
        };

        const handleMessageStatusUpdated = (waMessageId: string, status: string, oldId?: string) => {
            setMessages(prev => prev.map(m => {
                if (m.wa_message_id === waMessageId) return { ...m, status };
                if (oldId && m.wa_message_id === oldId) return { ...m, wa_message_id: waMessageId, status };
                return m;
            }));
        };

        const handleMessageStatusFailed = (waMessageId: string, raw_payload: any) => {
            const rawPayload = raw_payload as string;
            const parsedPayload = JSON.parse(rawPayload || '{}');
            const errorDetails = parsedPayload?.error_details;
            setMessages(prev => prev.map(m => {
                if (m.wa_message_id === waMessageId) {
                    const oldRawPayload = m.raw_payload;
                    const oldParsedPayload = JSON.parse(oldRawPayload || '{}');

                    m.raw_payload = JSON.stringify({ ...oldParsedPayload, error_details: errorDetails });
                    return { ...m, raw_payload: m.raw_payload, status: 'failed' };
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
