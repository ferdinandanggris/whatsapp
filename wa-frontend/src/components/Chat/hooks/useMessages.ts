import { useState, useEffect, useRef, useMemo } from 'react';
import { getMessages, markAsRead } from '../../../services/chatService';
import type { Bubble,  Conversation } from '../../../types/chat';
import { StatusUpdatePayload, WebsocketEvent } from '@/types/wsEvent';

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
    const [messages, setMessages] = useState<Bubble[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const [messagePage, setMessagePage] = useState(1);

    const activeConversationRef = useRef(activeConversation);
    useEffect(() => { activeConversationRef.current = activeConversation; }, [activeConversation]);

    const searchTerm = debouncedMessageSearchTerm;

    // Fetch messages on conversation switch or search change
    useEffect(() => {
        if (!activeConversation || activeConversation.id == "") {
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
        setMessagePage(1);
        getMessages(activeConversation.id, 50, 1, searchTerm || undefined)
            .then(res => {
                if (res.status) {
                    // Backend returns newest-first; reverse for display (oldest-first)
                    setMessages([...res.data.items].reverse());
                    setHasMore(res.data.has_more);
                }
            })
            .catch(console.error)
            .finally(() => setIsLoading(false));
    }, [activeConversation?.id, searchTerm]);

    // const processedMessages = useMemo(() => {
    //     const reactionsMap: Record<string, Record<string, string>> = {};
    //     messages.forEach(msg => {
    //         if (msg.message_type === 'reaction' && msg.context_message_id) {
    //             if (!reactionsMap[msg.context_message_id]) reactionsMap[msg.context_message_id] = {};
    //             const sideKey = msg.direction;
    //             if (msg.message_text && msg.message_text.trim()) {
    //                 reactionsMap[msg.context_message_id][sideKey] = msg.message_text;
    //             } else {
    //                 delete reactionsMap[msg.context_message_id][sideKey];
    //             }
    //         }
    //     });

    //     return [...new Map(messages.map((item) => [item.id, item])).values()]
    //         .filter(msg => msg.message_type !== 'reaction')
    //         .map(msg => {
    //             const senderMap = reactionsMap[msg.wa_message_id] || {};
    //             const activeReactions = Object.values(senderMap);
    //             const uniqueEmojis = Array.from(new Set(activeReactions));

    //             if (activeReactions.length === 0 && !msg.reactionData) {
    //                 return msg;
    //             }

    //             return {
    //                 ...msg,
    //                 reactions: activeReactions,
    //                 reactionData: activeReactions.length > 0 ? {
    //                     emojis: uniqueEmojis,
    //                     total: activeReactions.length
    //                 } : null
    //             };
    //         });
    // }, [messages]);

    const handleLoadMore = async (scrollViewport: HTMLDivElement | null) => {
        if (!activeConversation || !hasMore || isFetchingMore) return;
        const convIdAtStart = activeConversation.id;
        setIsFetchingMore(true);
        const nextPage = messagePage + 1;
        try {
            const previousScrollHeight = scrollViewport?.scrollHeight || 0;
            const res = await getMessages(activeConversation.id, 50, nextPage, searchTerm || undefined);
            if (activeConversationRef.current?.id !== convIdAtStart) return;
            if (res.status) {
                // Backend returns newest-first; older messages get reversed + prepended
                const olderItems = [...res.data.items].reverse();
                setMessages(prev => [...olderItems, ...prev]);
                setMessagePage(nextPage);
                setHasMore(res.data.has_more);
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
            const chatMsg = message as Bubble;
            const conv = activeConversationRef.current;
            if (!conv || (chatMsg.wa_id !== conv.wa_id && chatMsg.phone_number_id !== conv.phone_number_id)) return;

            setMessages(prev => {
                const existing = prev.find(m => m.id === chatMsg.id);

                if (existing) {
                    console.log(`is existing`, existing, chatMsg);
                    return prev.map(m => m.id === chatMsg.id ? {
                        ...existing, ...chatMsg,
                    } : m);
                }

                // New inbound message: append and sort by timestamp
                return [...prev, chatMsg].sort((a, b) => (a.message_timestamp ?? 0) - (b.message_timestamp ?? 0));
            });
        };

        const handleMessageStatusUpdated = (res : StatusUpdatePayload) => {
            const conv = activeConversationRef.current;
            if (!conv) return;
            setMessages(prev => prev.map(m => {
                if (m.id === res.message_id) {
                    console.log('Status update', m, res);
                    return { ...m, status : res.status };
                }
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
                    const oldParsedPayload = JSON.parse(m.raw_message || '{}');
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
        setMessages,
        isLoading,
        hasMore,
        isFetchingMore,
        handleLoadMore
    };
};
