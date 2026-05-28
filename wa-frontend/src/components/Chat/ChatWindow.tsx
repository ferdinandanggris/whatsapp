
import React, { useRef, useEffect } from 'react';
import { Search, LayoutGrid, Clock, X, RefreshCw, ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Conversation, ChatMessage } from '../../types/chat';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import { cn } from '@/lib/utils';
import { getInitials } from '../../lib/chatUtils';

interface ChatWindowProps {
    activeConversation: Conversation | null;
    messages: ChatMessage[];
    processedMessages: ChatMessage[];
    hasMore: boolean;
    isFetchingMore: boolean;
    handleLoadMore: (viewport: HTMLDivElement | null) => void;
    handleSend: () => void;
    inputText: string;
    setInputText: (text: string) => void;
    handleKeyDown: (e: React.KeyboardEvent) => void;
    isMessageSearchOpen: boolean;
    setIsMessageSearchOpen: (open: boolean) => void;
    messageSearchTerm: string;
    setMessageSearchTerm: (term: string) => void;
    showTemplateQuickAction: boolean;
    setShowTemplateQuickAction: (show: boolean) => void;
    isTemplateRequired: boolean;
    allowSendTemplate: boolean;
    setIsTemplateDialogOpen: (open: boolean) => void;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
    setShowEmojiPicker: (show: boolean) => void;
    showEmojiPicker: boolean;
    setEmojiTarget: (target: 'input' | 'media' | 'reaction') => void;
    replyingTo: ChatMessage | null;
    setReplyingTo: (msg: ChatMessage | null) => void;
    onReaction: (msg: ChatMessage) => void;
    onResend: (msg: ChatMessage) => void;
    renderTemplateMessage: (msg: ChatMessage) => React.ReactNode;
    renderMessageContent: (msg: ChatMessage, handleContextMenuImage: (e: React.MouseEvent, msg: ChatMessage) => void) => React.ReactNode;
    handleContextMenuImage: (e: React.MouseEvent, msg: ChatMessage) => void;
    typingAgents: Record<number, { name: string, timeout: any }>;
    handleFiles: (files: FileList | File[] | null) => void;
    onToggleSidebar?: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
    activeConversation,
    messages,
    processedMessages,
    hasMore,
    isFetchingMore,
    handleLoadMore,
    handleSend,
    inputText,
    setInputText,
    handleKeyDown,
    isMessageSearchOpen,
    setIsMessageSearchOpen,
    messageSearchTerm,
    setMessageSearchTerm,
    showTemplateQuickAction,
    setShowTemplateQuickAction,
    isTemplateRequired,
    allowSendTemplate,
    setIsTemplateDialogOpen,
    fileInputRef,
    handleFileSelect,
    setShowEmojiPicker,
    showEmojiPicker,
    setEmojiTarget,
    replyingTo,
    setReplyingTo,
    onReaction,
    onResend,
    renderTemplateMessage,
    renderMessageContent,
    handleContextMenuImage,
    typingAgents,
    handleFiles,
    onToggleSidebar
}) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const scrollViewportRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (scrollRef.current) {
            const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]') as HTMLDivElement;
            if (viewport) {
                scrollViewportRef.current = viewport;
                if (!isFetchingMore) {
                    viewport.scrollTop = viewport.scrollHeight;
                }
            }
        }
    }, [messages, isFetchingMore]);

    useEffect(() => {
        const viewport = scrollViewportRef.current;
        if (!viewport) return;

        const handleScroll = () => {
            if (viewport.scrollTop === 0 && hasMore && !isFetchingMore) {
                handleLoadMore(viewport);
            }
        };

        viewport.addEventListener('scroll', handleScroll);
        return () => viewport.removeEventListener('scroll', handleScroll);
    }, [hasMore, isFetchingMore, handleLoadMore]);

    if (!activeConversation) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-slate-50/30">
                <div className="text-center space-y-4">
                    <div className="w-24 h-24 bg-[#00a884]/10 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-indigo-100">
                        <Avatar className="w-16 h-16 rounded-full">
                            <AvatarFallback className="bg-white text-[#00a884] font-bold text-2xl">WC</AvatarFallback>
                        </Avatar>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800">Whatsapp Client</h2>
                    <p className="text-slate-500 max-w-sm mx-auto text-sm leading-relaxed">
                        Pilih percakapan dari daftar di sebelah kiri untuk mulai berkirim pesan dengan pelanggan Anda secara real-time.
                    </p>
                </div>
            </div>
        );
    }

    const currentTyping = typingAgents[activeConversation.id];

    return (
        <div
            className="flex-1 flex flex-col min-w-0 bg-white"
            style={{ backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')" }}
            onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
            }}
            onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (isTemplateRequired) return;
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    handleFiles(e.dataTransfer.files);
                }
            }}
        >
            <div className="h-[72px] border-b border-slate-100 flex items-center justify-between px-6 bg-white/80 backdrop-blur-md sticky top-0 z-20 shadow-sm">
                <div 
                    className="flex items-center gap-3 min-w-0 cursor-pointer hover:opacity-85 transition-opacity"
                    onClick={onToggleSidebar}
                >
                    <Avatar className="w-10 h-10 border-2 border-white shadow-sm ring-1 ring-slate-100">
                        <AvatarFallback className="bg-slate-100 text-slate-600 font-bold">
                            {getInitials(activeConversation.customer_name)}
                        </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                        <h2 className="text-sm font-bold text-slate-900 truncate">{activeConversation.customer_name}</h2>
                        <div className="flex items-center gap-2">
                            <div className={cn("w-2 h-2 rounded-full", currentTyping ? "bg-green-500 animate-pulse" : "bg-slate-200")} />
                            <span className={cn("text-[11px] font-medium transition-colors", currentTyping ? "text-green-600 italic" : "text-slate-500")}>
                                {currentTyping ? `${currentTyping.name} sedang mengetik...` : activeConversation.customer_wa_id}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-1.5">
                    <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 text-slate-500 hover:bg-slate-50" onClick={() => setIsMessageSearchOpen(!isMessageSearchOpen)}>
                        <Search className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 text-slate-500 hover:bg-slate-50" onClick={onToggleSidebar} title="Info Kontak">
                        <ChevronRight className="w-5 h-5" />
                    </Button>
                </div>

                {isMessageSearchOpen && (
                    <div className="absolute top-[72px] right-6 w-80 bg-white border border-slate-100 rounded-b-2xl shadow-2xl p-3 z-50 animate-in slide-in-from-top-2 duration-200">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                            <Input
                                placeholder="Cari pesan di chat ini..."
                                className="pl-9 h-9 text-xs bg-slate-50 border-none"
                                value={messageSearchTerm}
                                onChange={(e) => setMessageSearchTerm(e.target.value)}
                                autoFocus
                            />
                            <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full" onClick={() => { setIsMessageSearchOpen(false); setMessageSearchTerm(''); }}>
                                <X className="w-3 h-3 text-slate-400" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex-1 relative overflow-hidden bg-slate-50/30">
                <ScrollArea className="h-full w-full [&>div>div]:!block" ref={scrollRef}>
                    <div className="flex flex-col py-4 w-full min-w-0">
                        {isFetchingMore && (
                            <div className="flex justify-center py-4">
                                <RefreshCw className="w-4 h-4 text-slate-400 animate-spin" />
                            </div>
                        )}
                        {processedMessages.map((msg, idx) => (
                            <MessageBubble
                                key={msg.id || msg.wa_message_id}
                                msg={msg}
                                conversation={activeConversation}
                                prevMsg={idx > 0 ? processedMessages[idx - 1] : undefined}
                                onReply={(m) => setReplyingTo(m)}
                                onReaction={onReaction}
                                onResend={onResend}
                                renderTemplateMessage={renderTemplateMessage}
                                renderMessageContent={renderMessageContent}
                                handleContextMenuImage={handleContextMenuImage}
                            />
                        ))}
                    </div>
                </ScrollArea>

                {isTemplateRequired && showTemplateQuickAction && allowSendTemplate && (
                    <div className="absolute inset-x-0 bottom-6 flex justify-center z-30 animate-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-white/90 backdrop-blur-md border border-indigo-100 shadow-2xl rounded-2xl p-5 flex flex-col items-center gap-4 max-w-sm ring-1 ring-indigo-50/50">
                            <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center">
                                <Clock className="w-6 h-6 text-[#00a884]" />
                            </div>
                            <div className="text-center">
                                <h3 className="text-sm font-bold text-slate-900 mb-1">Jendela Melayani Berakhir</h3>
                                <p className="text-[11px] text-slate-500 leading-relaxed px-4">
                                    Batas waktu Respons telah habis. Gunakan template pesan untuk memulai kembali percakapan ini.
                                </p>
                            </div>
                            <div className="flex gap-2 w-full">
                                <Button variant="ghost" size="sm" className="flex-1 rounded-xl text-xs h-9" onClick={() => setShowTemplateQuickAction(false)}>Tutup</Button>
                                <Button size="sm" className="flex-1 bg-[#00a884]/80 hover:bg-[#00a884] shadow-lg shadow-indigo-100 rounded-xl text-xs h-9 gap-2" onClick={() => setIsTemplateDialogOpen(true)}>
                                    <LayoutGrid className="w-3.5 h-3.5" />
                                    Pilih Template
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <ChatInput
                inputText={inputText}
                setInputText={setInputText}
                handleSend={handleSend}
                handleKeyDown={handleKeyDown}
                fileInputRef={fileInputRef}
                handleFileSelect={handleFileSelect}
                setShowEmojiPicker={setShowEmojiPicker}
                showEmojiPicker={showEmojiPicker}
                setEmojiTarget={setEmojiTarget}
                isTemplateRequired={isTemplateRequired}
                allowSendTemplate={allowSendTemplate}
                setIsTemplateDialogOpen={setIsTemplateDialogOpen}
                replyingTo={replyingTo}
                setReplyingTo={setReplyingTo}
                handleFiles={handleFiles}
            />
        </div>
    );
};

export default ChatWindow;
