
import React, { useState, useEffect, useRef } from 'react';
import { type EmojiClickData } from 'emoji-picker-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from '@/lib/utils';

const EmojiPicker = React.lazy(() => import('emoji-picker-react'));
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Edit2, Send, Smile } from "lucide-react";

import type { Conversation, ChatMessage, ApplicationSummary, WaChannel } from '../types/chat';
import { getApplicationSummary, getChannels, getPingInfo } from '../services/chatService';
import { normalizeTo62 } from '../lib/chatUtils';

import TemplatePickerDialog from './TemplatePickerDialog';
import NewChatDialog from './NewChatDialog';

// Modular Components
import ChatSidebar from './Chat/ChatSidebar';
import ConversationSidebar from './Chat/ConversationSidebar';
import ChatWindow from './Chat/ChatWindow';
import ConnectionBanner from './Chat/ConnectionBanner';
import ImageViewer from './Chat/ImageViewer';
import ContactSidebar from './ContactSidebar';


// Custom Hooks
import { useChatConnection } from './Chat/hooks/useChatConnection';
import { useConversations } from './Chat/hooks/useConversations';
import { useMessages } from './Chat/hooks/useMessages';
import { useChatActions } from './Chat/hooks/useChatActions';
import { renderMessageContent, renderTemplateMessage } from './Chat/MessageRenderer';

interface ChatLayoutProps {
    user?: any;
    enableLogin?: boolean;
}

const ChatLayout: React.FC<ChatLayoutProps> = ({ user, enableLogin }) => {
    // --- Global Data State ---
    const [applications, setApplications] = useState<ApplicationSummary[]>([]);
    const [channels, setChannels] = useState<WaChannel[]>([]);
    const [activeAppId, setActiveAppId] = useState<string | number | null>(null);
    const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
    const [allowSendTemplate, setAllowSendTemplate] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // --- UI States ---
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [convFilter, setConvFilter] = useState<'all' | 'unread' | 'read'>('all');
    const [inputText, setInputText] = useState('');
    const [typingAgents, setTypingAgents] = useState<Record<string | number, { name: string, timeout: any }>>({});

    // Dialog States
    const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
    const [isNewChatDialogOpen, setIsNewChatDialogOpen] = useState(false);
    const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
    const [renameName, setRenameName] = useState('');
    const [renamingConv, setRenamingConv] = useState<Conversation | null>(null);
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, conversation: Conversation | null }>({ x: 0, y: 0, conversation: null });

    const [contextMenuImage, setContextMenuImage] = useState<{ x: number, y: number, chatMsg: ChatMessage | null }>({ x: 0, y: 0, chatMsg: null });

    // Chat Window Filter/Search
    const [isMessageSearchOpen, setIsMessageSearchOpen] = useState(false);
    const [messageSearchTerm, setMessageSearchTerm] = useState('');
    const [debouncedMessageSearchTerm, setDebouncedMessageSearchTerm] = useState('');
    const [showTemplateQuickAction, setShowTemplateQuickAction] = useState(true);

    // Media Preview State
    const [pendingMedia, setPendingMedia] = useState<{ file: File; previewUrl: string; type: 'image' | 'video' | 'audio' | 'document' } | null>(null);

    // Emoji/Reaction State
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [emojiTarget, setEmojiTarget] = useState<'input' | 'media' | 'reaction'>('input');
    const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
    const [reactionTargetMsg, setReactionTargetMsg] = useState<ChatMessage | null>(null);
    const [viewingMedia, setViewingMedia] = useState<ChatMessage | null>(null);
    const [showContactSidebar, setShowContactSidebar] = useState(false);


    // --- Refs ---
    const emojiPickerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const mediaCaptionRef = useRef<HTMLTextAreaElement>(null);

    // --- Hooks Integration ---
    const { connectionStatus, connection, handleRetryConnection, handleFindServer } = useChatConnection({ setApplications });

    const { conversations, setConversations, isLoading: isConvLoading, hasMoreConvs, isFetchingMoreConvs, handleLoadMoreConversations, fetchConvs } = useConversations({
        activeAppId, debouncedSearchTerm, convFilter, connection, activeConversation, setActiveConversation, setApplications
    });

    const { messages, processedMessages, setMessages, isLoading, hasMore: hasMoreMsg, isFetchingMore: isFetchingMoreMsg, handleLoadMore } = useMessages({
        activeConversation, debouncedMessageSearchTerm, connection, setConversations, setActiveConversation
    });

    const {
        handleSend: onSend,
        handleSendTemplate,
        handleSendMedia: executeSendMedia,
        handleSendReaction,
        handleRenameSubmit: onRename,
        sendTyping
    } = useChatActions({
        user,
        enableLogin,
        activeConversation,
        setActiveConversation,
        setConversations,
        setMessages
    });

    const totalUnread = applications.reduce((acc, app) => acc + (app.unread_count || 0), 0);

    // --- Side Effects ---
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [appResp, channelResp, pingResp] = await Promise.all([getApplicationSummary(), getChannels(), getPingInfo()]);
                if (appResp.status) setApplications(appResp.data);
                if (channelResp.status) setChannels(channelResp.data);
                const canSendTemplate = pingResp.allowSendTemplate;
                if (canSendTemplate !== undefined) setAllowSendTemplate(canSendTemplate);
            } catch (error) { console.error("Initial fetch failed", error); }
        };
        fetchData();
    }, []);

    // Debounce search terms
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearchTerm(searchTerm), 800);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedMessageSearchTerm(messageSearchTerm), 800);
        return () => clearTimeout(timer);
    }, [messageSearchTerm]);

    // Media caption auto-resize
    useEffect(() => {
        if (mediaCaptionRef.current) {
            mediaCaptionRef.current.style.height = 'auto';
            mediaCaptionRef.current.style.height = `${Math.min(mediaCaptionRef.current.scrollHeight, 128)}px`;
        }
    }, [inputText]);

    // Handle typing indicator from SignalR
    useEffect(() => {
        if (!connection) return;
        const handleAgentTyping = (data: { conversation_id: number, sender_name: string }) => {
            if (data.sender_name === user?.display_name) return;
            setTypingAgents(prev => {
                if (prev[data.conversation_id]) clearTimeout(prev[data.conversation_id].timeout);
                const timeout = setTimeout(() => {
                    setTypingAgents(curr => {
                        const updated = { ...curr };
                        delete updated[data.conversation_id];
                        return updated;
                    });
                }, 10000);
                return { ...prev, [data.conversation_id]: { name: data.sender_name, timeout } };
            });
        };
        const handleUpdateAllowSendTemplate = (allow: boolean) => setAllowSendTemplate(allow);

        connection.on("AgentTyping", handleAgentTyping);
        connection.on("UpdateAllowSendTemplate", handleUpdateAllowSendTemplate);
        return () => {
            connection.off("AgentTyping", handleAgentTyping);
            connection.off("UpdateAllowSendTemplate", handleUpdateAllowSendTemplate);
        };
    }, [connection, user?.display_name]);

    // Fix for emoji-picker-react crash: ensure suggested history is not null in localStorage
    useEffect(() => {
        try {
            const history = localStorage.getItem('epr_suggested');
            if (history === 'null' || !history) {
                localStorage.setItem('epr_suggested', '[]');
            }
        } catch (e) {
            // Ignore storage errors
        }
    }, []);

    // Listen for messages from WinForms bridge
    useEffect(() => {
        if (!(window as any).chrome?.webview) return;

        const handleMessage = (event: any) => {
            const msg = event.data;
            if (msg.type === 'RESEND_MEDIA_DATA') {
                const { base64, message_type, file_name, content_type } = msg;

                // Base64 to Blob
                const byteCharacters = atob(base64);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], { type: content_type });

                // Blob to File
                const file = new File([blob], file_name, { type: content_type });
                const previewUrl = URL.createObjectURL(file);

                setPendingMedia({
                    file,
                    previewUrl,
                    type: message_type
                });
            }
        };

        (window as any).chrome.webview.addEventListener('message', handleMessage);
        return () => (window as any).chrome.webview.removeEventListener('message', handleMessage);
    }, []);

    // Typing Indicator
    useEffect(() => {
        sendTyping(inputText);
    }, [inputText, activeConversation?.id, sendTyping]);

    // Close contact sidebar on conversation change
    useEffect(() => {
        setShowContactSidebar(false);
    }, [activeConversation?.id]);


    // Taskbar Badge Update
    useEffect(() => {
        if ((window as any).chrome?.webview) {
            (window as any).chrome.webview.postMessage({
                type: 'SET_BADGE',
                count: totalUnread
            });
        }
    }, [totalUnread]);

    // Global Handlers
    const handleLogout = () => { localStorage.removeItem('wm_user'); window.location.reload(); };
    const handleGlobalRefresh = async () => {
        setIsRefreshing(true);
        try {
            const [appResp, channelResp] = await Promise.all([getApplicationSummary(), getChannels()]);
            if (appResp.status) setApplications(appResp.data);
            if (channelResp.status) setChannels(channelResp.data);
            await fetchConvs(true);
        } finally { setTimeout(() => setIsRefreshing(false), 500); }
    };

    const handleConversationUpdated = (updatedConv: Conversation) => {
        setConversations(prev => prev.map(c => c.id === updatedConv.id ? updatedConv : c));
        if (activeConversation && activeConversation.id === updatedConv.id) {
            setActiveConversation(updatedConv);
        }
    };

    const handleEmojiClick = (emojiData: EmojiClickData) => {

        setInputText(prev => prev + emojiData.emoji);
        if (emojiTarget === 'reaction' && reactionTargetMsg) {
            handleSendReaction(emojiData.emoji, reactionTargetMsg);
            setShowEmojiPicker(false);
        }
    };

    // Fungsi Copy Gambar
    const handleCopy = async () => {
        try {
            // Bridge to WinForms for desktop notification
            if (!contextMenuImage.chatMsg?.file_path) return;
            if ((window as any).chrome?.webview) {
                (window as any).chrome.webview.postMessage({
                    type: 'COPY_IMAGE',
                    url: contextMenuImage.chatMsg?.file_path,
                });
            } else {
                // Fallback jika dibuka di browser biasa (Chrome/Edge biasa)
                console.log("Tidak berada di WinForms. Fallback copy URL...");
                navigator.clipboard.writeText(contextMenuImage.chatMsg?.file_path);
            }
        } catch (error) {
            console.error('Gagal menyalin gambar. Menyalin URL sebagai gantinya.', error);
            navigator.clipboard.writeText(contextMenuImage.chatMsg?.file_path || ''); // Fallback copy URL
        }
    };

    // Fungsi Download Gambar
    const handleDownload = async () => {
        try {
            // Bridge to WinForms for desktop notification
            if (!contextMenuImage.chatMsg?.file_path) return;
            if ((window as any).chrome?.webview) {
                (window as any).chrome.webview.postMessage({
                    type: 'SAVE_IMAGE',
                    url: contextMenuImage.chatMsg?.file_path,
                });
            } else {
                // Fallback jika dibuka di browser biasa (Chrome/Edge biasa)
                console.log("Tidak berada di WinForms. Fallback copy URL...");
                navigator.clipboard.writeText(contextMenuImage.chatMsg?.file_path);
            }
        } catch (error) {
            console.error('Gagal menyalin gambar. Menyalin URL sebagai gantinya.', error);
            navigator.clipboard.writeText(contextMenuImage.chatMsg?.file_path || ''); // Fallback copy URL
        }

    };

    // Media Handlers
    const handleResendMessage = async (msg: ChatMessage) => {
        if (!msg) return;

        // Populate Input Text
        setInputText(msg.message_text || '');

        // Handle Media Resending
        if (msg.file_path && ['image', 'video', 'audio', 'document'].includes(msg.message_type)) {
            if ((window as any).chrome?.webview) {
                // Use WinForms bridge to bypass CORS/SSL issues
                (window as any).chrome.webview.postMessage({
                    type: 'FETCH_MEDIA_FOR_RESEND',
                    url: msg.file_path,
                    message_type: msg.message_type,
                    file_name: msg.file_name || 'file'
                });
            } else {
                // Fallback for browser (might fail due to CORS)
                try {
                    const response = await fetch(msg.file_path);
                    const blob = await response.blob();
                    const fileName = msg.file_name || msg.file_path.split('/').pop() || 'file';
                    const file = new File([blob], fileName, { type: msg.file_type || blob.type });

                    const previewUrl = URL.createObjectURL(file);
                    setPendingMedia({
                        file,
                        previewUrl,
                        type: msg.message_type as any
                    });
                } catch (error) {
                    console.error("Failed to fetch media for resend:", error);
                }
            }
        }
    };

    const handleFiles = (files: FileList | File[] | null) => {
        const file = files?.[0];
        if (!file) return;
        const type = file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : file.type.startsWith('audio/') ? 'audio' : 'document';
        setPendingMedia({ file, previewUrl: URL.createObjectURL(file), type });
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleFiles(e.target.files);
    };

    const handleSendMedia = async () => {
        if (!pendingMedia) return;
        const { file, previewUrl, type } = pendingMedia;
        setPendingMedia(null);
        const caption = inputText;
        setInputText('');
        const reply = replyingTo;
        setReplyingTo(null);

        await executeSendMedia(file, previewUrl, type, caption, reply);
    };

    return (
        <div className="flex h-screen w-screen bg-[#f0f2f5] overflow-hidden fixed inset-0 font-sans" onClick={() => { if (contextMenu.conversation) setContextMenu({ ...contextMenu, conversation: null }); if (contextMenuImage.chatMsg) setContextMenuImage({ ...contextMenuImage, chatMsg: null }) }}>
            <ConnectionBanner status={connectionStatus} onRetry={handleRetryConnection} onFindServer={handleFindServer} />

            <ChatSidebar
                applications={applications}
                totalUnread={totalUnread}
                activeAppId={activeAppId}
                setActiveAppId={setActiveAppId}
                user={user}
                enableLogin={enableLogin}
                handleLogout={handleLogout}
                isRefreshing={isRefreshing}
                handleGlobalRefresh={handleGlobalRefresh}
            />

            <ConversationSidebar
                conversations={conversations}
                activeConversation={activeConversation}
                setActiveConversation={setActiveConversation}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                convFilter={convFilter}
                setConvFilter={setConvFilter}
                handleContextMenu={(e, conv) => {
                    e.preventDefault();
                    setContextMenu({ x: e.pageX, y: e.pageY, conversation: conv });
                }}
                setIsNewChatDialogOpen={setIsNewChatDialogOpen}
                typingAgents={typingAgents}
                isLoading={isConvLoading}
                isFetchingMore={isFetchingMoreConvs}
                hasMore={hasMoreConvs}
                onLoadMore={handleLoadMoreConversations}
            />

            <ChatWindow
                activeConversation={activeConversation}
                messages={messages}
                processedMessages={processedMessages}
                hasMore={hasMoreMsg}
                isFetchingMore={isFetchingMoreMsg}
                isLoading={isLoading}
                handleLoadMore={handleLoadMore}
                handleSend={() => onSend(inputText, replyingTo, () => setInputText(''))}
                inputText={inputText}
                setInputText={setInputText}
                handleKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend(inputText, replyingTo, () => setInputText('')); } }}
                isMessageSearchOpen={isMessageSearchOpen}
                setIsMessageSearchOpen={setIsMessageSearchOpen}
                messageSearchTerm={messageSearchTerm}
                setMessageSearchTerm={setMessageSearchTerm}
                showTemplateQuickAction={showTemplateQuickAction}
                setShowTemplateQuickAction={setShowTemplateQuickAction}
                isTemplateRequired={!!activeConversation?.is_template_required}
                allowSendTemplate={allowSendTemplate}
                setIsTemplateDialogOpen={setIsTemplateDialogOpen}
                fileInputRef={fileInputRef}
                handleFileSelect={handleFileSelect}
                setShowEmojiPicker={setShowEmojiPicker}
                showEmojiPicker={showEmojiPicker}
                setEmojiTarget={setEmojiTarget}
                replyingTo={replyingTo}
                setReplyingTo={setReplyingTo}
                onReaction={(msg) => {
                    setEmojiTarget('reaction');
                    setReactionTargetMsg(msg);
                    setShowEmojiPicker(true);
                }}
                onResend={handleResendMessage}
                handleContextMenuImage={(e, chatMsg) => {
                    e.preventDefault();
                    setContextMenuImage({ x: e.pageX, y: e.pageY, chatMsg: chatMsg });
                }}
                renderTemplateMessage={renderTemplateMessage}
                renderMessageContent={(msg, handler) => renderMessageContent(msg, handler, (m) => setViewingMedia(m))}
                typingAgents={typingAgents}
                handleFiles={handleFiles}
                onToggleSidebar={() => setShowContactSidebar(prev => !prev)}
            />

            {activeConversation && showContactSidebar && (
                <ContactSidebar
                    conversation={activeConversation}
                    onClose={() => setShowContactSidebar(false)}
                    onConversationUpdated={handleConversationUpdated}
                />
            )}


            {/* Modals */}
            <TemplatePickerDialog
                isOpen={isTemplateDialogOpen}
                onClose={() => setIsTemplateDialogOpen(false)}
                onSelect={handleSendTemplate}
                wabaId={activeConversation?.waba_id || ''}
                conversation={activeConversation}
            />

            <NewChatDialog
                open={isNewChatDialogOpen}
                onOpenChange={setIsNewChatDialogOpen}
                onStartChat={(waId, name, channelId) => {
                    const normalizedWaId = normalizeTo62(waId.trim());
                    const existing = conversations.find(c => c.customer_wa_id === normalizedWaId && c.wa_channel_id === channelId);
                    if (existing) {
                        setActiveConversation(existing);
                        setShowTemplateQuickAction(true);
                    } else {
                        const selectedChannel = channels.find(c => c.id === channelId);
                        const tempConv: Conversation = {
                            id: 0,
                            wa_channel_id: channelId,
                            app_id: selectedChannel?.app_id || (activeAppId || applications[0]?.id || ""),
                            waba_id: selectedChannel?.waba_id || '',
                            customer_wa_id: normalizedWaId,
                            customer_name: name || normalizedWaId,
                            kode_reseller: '', nama_reseller: '', display_number: selectedChannel?.display_number || '',
                            last_message_preview: '', unread_count: 0, status: 'NEW', is_template_required: true, platform: 'whatsapp',
                            updated_at: new Date().toISOString()
                        };
                        setActiveConversation(tempConv);
                        setMessages([]);
                        setShowTemplateQuickAction(true);
                    }
                }}
                channels={channels}
                defaultChannelId={channels.find(c => c.app_id === activeAppId)?.id}
            />

            <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
                <DialogContent className="sm:max-w-[500px] p-4 gap-0">
                    <DialogHeader className="mb-2 flex flex-row items-center justify-between space-y-0">
                        <DialogTitle className="text-lg font-bold text-[#111b21]">Ubah Nama Customer</DialogTitle>
                        <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 text-[#54656f] hover:bg-slate-100" onClick={() => setIsRenameDialogOpen(false)}>
                            <X className="h-4 w-4" />
                        </Button>
                    </DialogHeader>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-[#54656f] ml-1">Nama Baru</label>
                        <div className="flex gap-3">
                            <Input
                                value={renameName}
                                onChange={(e) => setRenameName(e.target.value)}
                                className="h-10 text-sm bg-[#f0f2f5] border-none focus-visible:ring-1 focus-visible:ring-[#00a884] flex-1"
                                autoFocus
                                onKeyDown={(e) => { if (e.key === 'Enter' && renamingConv) onRename(renamingConv, renameName).then(ok => ok && setIsRenameDialogOpen(false)); }}
                            />
                            <Button className="bg-[#00a884] hover:bg-[#06cf9c] text-white h-10 px-6 text-sm font-bold rounded-lg shadow-sm shrink-0" onClick={() => renamingConv && onRename(renamingConv, renameName).then(ok => ok && setIsRenameDialogOpen(false))}>Simpan</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Context Menu Overlay */}
            {contextMenu.conversation && (
                <div
                    className="fixed z-[100] bg-white shadow-xl rounded-lg border border-slate-100 py-1 min-w-[160px] animate-in fade-in zoom-in duration-100"
                    style={{ left: contextMenu.x, top: contextMenu.y }}
                >
                    <button
                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-[#f5f6f6] flex items-center gap-2 transition-colors"
                        onClick={(e) => {
                            e.stopPropagation();
                            setRenamingConv(contextMenu.conversation);
                            setRenameName(contextMenu.conversation?.customer_name || '');
                            setIsRenameDialogOpen(true);
                            setContextMenu({ ...contextMenu, conversation: null });
                        }}
                    >
                        <Edit2 className="h-4 w-4 text-[#00a884]" />
                        <span>Ubah Nama</span>
                    </button>
                </div>
            )}

            {/* Custom Context Menu */}
            {contextMenuImage.chatMsg && (
                <div
                    className="fixed z-50 bg-white border border-gray-200 shadow-lg rounded-md py-1 min-w-[150px] text-sm text-gray-700"
                    style={{ top: contextMenuImage.y, left: contextMenuImage.x }}
                >
                    <button
                        onClick={handleCopy}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors"
                    >
                        Copy Image
                    </button>
                    <button
                        onClick={handleDownload}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors"
                    >
                        Download Image
                    </button>
                </div>
            )}

            {/* Media Preview Overlay */}
            {pendingMedia && (
                <div className="absolute inset-0 z-[60] bg-[#f0f2f5] flex flex-col animate-in fade-in duration-300">
                    <div className="h-[60px] bg-white flex items-center px-4 gap-4 shadow-sm">
                        <Button variant="ghost" size="icon" onClick={() => setPendingMedia(null)} className="text-[#54656f]">
                            <X className="h-4 w-4" />
                        </Button>
                        <h3 className="text-[#111b21] font-medium">Preview Media</h3>
                    </div>
                    <div className="flex-1 flex items-center justify-center p-8 overflow-hidden">
                        {pendingMedia.type === 'image' && <img src={pendingMedia.previewUrl} alt="Preview" className="max-w-full max-h-full object-contain rounded-lg shadow-lg" />}
                        {pendingMedia.type === 'video' && <video src={pendingMedia.previewUrl} controls className="max-w-full max-h-full rounded-lg shadow-lg" />}
                        {pendingMedia.type === 'audio' && <audio src={pendingMedia.previewUrl} controls className="w-full max-w-md" />}
                        {pendingMedia.type === 'document' && (
                            <div className="bg-white p-8 rounded-2xl shadow-lg flex flex-col items-center gap-4 w-full max-w-md">
                                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">FILE</div>
                                <p className="font-semibold text-slate-800 text-center">{pendingMedia.file.name}</p>
                            </div>
                        )}
                    </div>
                    <div className="p-4 bg-white border-t flex items-end justify-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-xl h-10 w-10 hover:bg-slate-100 transition-colors mb-1"
                            onClick={() => {
                                setEmojiTarget('media');
                                setShowEmojiPicker(!showEmojiPicker);
                            }}
                            title="Emoji"
                        >
                            <Smile className="w-5 h-5 text-slate-500" />
                        </Button>
                        <div className="flex-1 max-w-2xl relative">
                            <textarea
                                ref={mediaCaptionRef}
                                rows={1}
                                placeholder="Add a caption..."
                                className="w-full bg-[#f0f2f5] rounded-2xl px-4 py-3 text-sm resize-none max-h-[128px] transition-all scrollbar-thin outline-none focus:bg-white ring-1 ring-transparent focus:ring-[#00a884]/30"
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                            />
                        </div>
                        <Button size="icon" className="bg-[#00a884] hover:bg-[#06cf9c] text-white rounded-full h-12 w-12 shadow-lg shrink-0 flex items-center justify-center font-bold mb-0.5" onClick={handleSendMedia}>
                            <Send className="w-5 h-5 translate-x-0.5" style={{ marginLeft: "-.4em" }} />
                        </Button>
                    </div>
                </div>
            )}

            {/* Global Emoji Picker Overlay */}
            {showEmojiPicker && (
                <div
                    className="fixed inset-0 z-[70] bg-transparent"
                    onClick={() => setShowEmojiPicker(false)}
                >
                    <div
                        ref={emojiPickerRef}
                        className={cn(
                            "absolute z-[80] shadow-2xl rounded-2xl overflow-hidden animate-in zoom-in-95 duration-200",
                            emojiTarget === 'reaction' ? "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" : "bottom-20 left-4"
                        )}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <React.Suspense fallback={<div className="w-[350px] h-[450px] bg-white flex items-center justify-center rounded-2xl border shadow-xl"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00a884]"></div></div>}>
                            <EmojiPicker
                                onEmojiClick={handleEmojiClick}
                                autoFocusSearch={false}
                                theme={"light" as any}
                                width={350}
                                height={450}
                                emojiStyle={"native" as any}
                                lazyLoadEmojis={true}
                                suggestedEmojisMode={"recent" as any}
                                previewConfig={{ showPreview: false }}
                                categories={[
                                    { category: "suggested" as any, name: "Recently Used" },
                                    { category: "smileys_people" as any, name: "Smileys & People" },
                                    { category: "animals_nature" as any, name: "Animals & Nature" },
                                    { category: "food_drink" as any, name: "Food & Drink" },
                                    { category: "travel_places" as any, name: "Travel & Places" },
                                    { category: "activities" as any, name: "Activities" },
                                    { category: "objects" as any, name: "Objects" },
                                    { category: "symbols" as any, name: "Symbols" },
                                    { category: "flags" as any, name: "Flags" }
                                ]}
                            />
                        </React.Suspense>
                    </div>
                </div>
            )}
            {/* Image Viewer Overlay */}
            <ImageViewer
                message={viewingMedia}
                onClose={() => setViewingMedia(null)}
            />
        </div>
    );
};

export default ChatLayout;
