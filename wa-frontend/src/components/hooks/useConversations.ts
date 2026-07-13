
import { useState, useEffect, useRef } from 'react';
import { getConversations, getPhoneNumbers } from '../../services/chatService';
import type { Conversation, PhoneNumber, Bubble } from '../../types/chat';
import { PayloadConversationUpdate } from '@/types/wsEvent';

interface UseConversationsProps {
    activeAppId: string | null;
    debouncedSearchTerm: string;
    convFilter: 'all' | 'unread' | 'read';
    connection: any;
    activeConversation: Conversation | null;
    setActiveConversation: (conv: Conversation | null) => void;
    fetchPhoneNumbers: () => Promise<void>;
}

export const useConversations = ({
    activeAppId,
    debouncedSearchTerm,
    convFilter,
    connection, 
    activeConversation,
    setActiveConversation,
    fetchPhoneNumbers
}: UseConversationsProps) => {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [messageConversations, setMessageConversations] = useState<Conversation[]>([]);
    const [messageHasMore, setMessageHasMore] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [hasMoreConvs, setHasMoreConvs] = useState(false);
    const [isFetchingMoreConvs, setIsFetchingMoreConvs] = useState(false);
    const [convPage, setConvPage] = useState(1);

    const activeAppIdRef = useRef(activeAppId);
    const activeConversationRef = useRef(activeConversation);
    const convFilterRef = useRef(convFilter);

    useEffect(() => { activeAppIdRef.current = activeAppId; }, [activeAppId]);
    useEffect(() => { activeConversationRef.current = activeConversation; }, [activeConversation]);
    useEffect(() => { convFilterRef.current = convFilter; }, [convFilter]);


    const fetchConvs = async (silent = false) => {
        if (!silent) setIsLoading(true);
        setConvPage(1);
        try {
            const response = await getConversations(
                50,
                1,
                activeAppId,
                debouncedSearchTerm || undefined,
                convFilter === 'all' ? undefined : convFilter,
            );
            if (response.success) {
                setConversations(response.data.conversations || []);
                setMessageConversations(response.data.message_conversations || []);
                setMessageHasMore(response.data.message_has_more || false);
                setHasMoreConvs(response.data.has_more);

                if (activeConversation && !response?.data?.conversations.some(c => c.id === activeConversation.id)) {
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
        const nextPage = convPage + 1;
        try {
            const response = await getConversations(
                50,
                nextPage,
                activeAppId,
                debouncedSearchTerm || undefined,
                convFilter === 'all' ? undefined : convFilter
            );

            if (response.success) {
                setConvPage(nextPage);
                setConversations(prev => [...prev, ...response.data.conversations || []]);
                setHasMoreConvs(response.data.has_more);
            }
        } catch (error) {
            console.error("Failed to fetch more conversations", error);
        } finally {
            setIsFetchingMoreConvs(false);
        }
    };

    useEffect(() => {
        if (!connection) return;

        const handleUpdateConversation = (conv: any) => {
            console.log(`[WS] UpdateConversation`, conv);   
            var res: Conversation = conv;
            fetchPhoneNumbers();

            // if (activeAppIdRef.current !== null && conv.app_id !== activeAppIdRef.current) return;

            if (convFilterRef.current === 'read' && res.unread_count > 0) return;

            if (activeConversationRef.current && activeConversationRef.current.id === conv.id) {
                setActiveConversation({
                    ...conv,
                    unread_count: activeConversationRef.current.unread_count === 0 ? 0 : conv.unread_count
                });
            }


            setConversations(prev => {
                const index = prev.findIndex(c => c.id === conv.id || (c.wa_id === conv.wa_id && c.phone_number_id === conv.phone_number_id));
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


        const handleReceiveMessage = (message: any) => {
            const chatMsg = message as Bubble;
            if (activeAppIdRef.current !== null && chatMsg.phone_number_id !== activeAppIdRef.current) return;

             // Cek INBOUND + kirim notification DI LUAR setConversations
            let shouldNotify = false;
            
            setConversations(prev => {
                const index = prev.findIndex(c =>
                    c.id === chatMsg.conversation_id ||
                    (c.wa_id === chatMsg.wa_id && c.phone_number_id === chatMsg.phone_number_id)
                );
                if (index !== -1) {

                    // check convFilter
                    console.log(`convFilter: ${convFilter}, message direction: ${chatMsg.direction}`);
                    if (convFilter === 'unread' && chatMsg.direction === 'outbound') {
                        return prev;
                    }

                    const updated = [...prev];
                    const conv = { ...updated[index] };

                    let preview = chatMsg.content?.body?.text;
                    if (chatMsg.message_type === 'image') preview = (chatMsg.content?.body?.text == "") ? "📷 Foto" : `📷 ${chatMsg.content?.body?.text}`;
                    else if (chatMsg.message_type === 'video') preview = (chatMsg.content?.body?.text == "") ? "🎥 Video" : `🎥 ${chatMsg.content?.body?.text}`;
                    else if (chatMsg.message_type === 'audio') preview = (chatMsg.content?.body?.text == "") ? "🎵 Audio" : `🎵 ${chatMsg.content?.body?.text}`;
                    else if (chatMsg.message_type === 'document') preview = (chatMsg.content?.body?.text == "") ? "📄 Dokumen" : `📄 ${chatMsg.content?.body?.text}`;
                    else if (chatMsg.message_type === 'sticker') preview = `${chatMsg.direction === 'inbound' ? conv.custom_name : 'Me'} sent a sticker`;
                    else if (chatMsg.message_type === 'reaction') preview = `${chatMsg.direction === 'inbound' ? conv.custom_name : 'Me'} reacted to a message`;
                    else if (chatMsg.message_type === 'location') preview = `${chatMsg.direction === 'inbound' ? conv.custom_name : 'Me'} shared a location`;
                    else if (chatMsg.message_type === 'template') preview =  chatMsg.content?.body?.text || 'Template Message';

                    conv.last_message_preview = preview;
                    // conv.last_message_timestamp = chatMsg.message_timestamp;
                    // conv.updated_at = chatMsg.created_at;

                    if (chatMsg.direction === 'inbound') {

                        // Simpan info buat notif, jangan postMessage di sini
                        if (!shouldNotify && (window as any).chrome?.webview) {
                            (window as any).chrome.webview.postMessage({
                                type: 'SHOW_NOTIFICATION',
                                title: conv.custom_name,
                                message: preview || 'Pesan baru'
                            });
                        }
                        shouldNotify = true;
                        

                        // Refresh app badges in sidebar
                        fetchPhoneNumbers();
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

             // Bridge to WinForms for desktop notification

             // Notification DI LUAR updater function — panggil sekali aja
            // console.log(`shouldNotify: ${shouldNotify}, title: ${notifyTitle}, message: ${notifyMessage}`);
            // if (shouldNotify && (window as any).chrome?.webview) {
            //     (window as any).chrome.webview.postMessage({
            //         type: 'SHOW_NOTIFICATION',
            //         title: notifyTitle,
            //         message: notifyMessage
            //     });
            // }

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
        messageConversations,
        messageHasMore,
        setConversations,
        isLoading,
        hasMoreConvs,
        isFetchingMoreConvs,
        handleLoadMoreConversations,
        fetchConvs
    };
};
