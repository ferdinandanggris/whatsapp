
import React, { useRef, useEffect } from 'react';
import { Search, MessageSquarePlus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import type { Conversation } from '../../types/chat';
import { formatTimeConversation, truncateNameInitial, truncateText } from '../../lib/chatUtils';

interface ConversationSidebarProps {
    conversations: Conversation[];
    activeConversation: Conversation | null;
    setActiveConversation: (conv: Conversation | null) => void;
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    convFilter: 'all' | 'unread' | 'read';
    setConvFilter: (filter: 'all' | 'unread' | 'read') => void;
    handleContextMenu: (e: React.MouseEvent, conv: Conversation) => void;
    setIsNewChatDialogOpen: (open: boolean) => void;
    typingAgents: Record<number, { name: string, timeout: any }>;
    isLoading: boolean;
    isFetchingMore: boolean;
    hasMore: boolean;
    onLoadMore: () => void;
}

const ConversationSidebar: React.FC<ConversationSidebarProps> = ({
    conversations,
    activeConversation,
    setActiveConversation,
    searchTerm,
    setSearchTerm,
    convFilter,
    setConvFilter,
    handleContextMenu,
    setIsNewChatDialogOpen,
    typingAgents,
    isLoading,
    isFetchingMore,
    hasMore,
    onLoadMore
}) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const scrollViewportRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (scrollRef.current) {
            const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]') as HTMLDivElement;
            if (viewport) {
                scrollViewportRef.current = viewport;
            }
        }
    }, []);

    useEffect(() => {
        const viewport = scrollViewportRef.current;
        if (!viewport) return;

        const handleScroll = () => {
            const isBottom = Math.abs(viewport.scrollHeight - viewport.clientHeight - viewport.scrollTop) < 1.5;
            if (isBottom && hasMore && !isFetchingMore) {
                onLoadMore();
            }
        };

        viewport.addEventListener('scroll', handleScroll);
        return () => viewport.removeEventListener('scroll', handleScroll);
    }, [hasMore, isFetchingMore, onLoadMore]);

    return (
        <div className="w-[350px] flex-shrink-0 flex flex-col bg-white border-r overflow-hidden">
            <div className="h-[60px] bg-[#f0f2f5] flex items-center justify-between px-4 sticky top-0 z-20">
                <span className="text-lg font-bold text-[#111b21]">Chats</span>
                <div className="flex gap-1 text-[#54656f]">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full hover:bg-slate-200"
                        onClick={() => setIsNewChatDialogOpen(true)}
                        title="New Chat"
                    >
                        <MessageSquarePlus className="h-5 w-5" />
                    </Button>
                    {/* <Button variant="ghost" size="icon" className="rounded-full">
                        <MoreVertical className="h-5 w-5" />
                    </Button> */}
                </div>
            </div>

            <div className="p-2 bg-white">
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search or start new chat"
                        className="pl-9 bg-[#f0f2f5] border-none focus-visible:ring-0 rounded-full h-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="px-4 pb-2 flex gap-2">
                {(['all', 'unread', 'read'] as const).map((f) => (
                    <button
                        key={f}
                        onClick={() => setConvFilter(f)}
                        className={`text-xs px-3 py-1 rounded-full transition-all border ${convFilter === f ? 'bg-[#e7fce3] text-[#008069] border-[#00a884]' : 'bg-[#f0f2f5] text-[#54656f] border-transparent hover:bg-slate-200'}`}
                    >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                ))}
            </div>

            <Separator />

            <ScrollArea className="flex-1 w-full [&>div>div]:!block" ref={scrollRef}>
                <div className="flex flex-col w-full min-w-0">
                    {conversations.map(conv => (
                        <div
                            key={conv.id}
                            className={`flex flex-col gap-1 p-3 cursor-pointer hover:bg-[#f5f6f6] transition-colors border-b border-gray-50 ${activeConversation?.id === conv.id ? 'bg-[#ebebeb]' : ''}`}
                            onClick={() => setActiveConversation(conv)}
                            onContextMenu={(e) => handleContextMenu(e, conv)}
                        >
                            <div className="flex justify-end pr-1 gap-1 flex-wrap">
                                {conv.app_name && (
                                    <span className="text-[9px] px-1.5 py-0 bg-emerald-50 text-emerald-600 rounded-md font-medium border border-emerald-100 capitalize">
                                        {conv.app_name}
                                    </span>
                                )}
                                {conv.display_phone_number && (
                                    <span className="text-[9px] px-1.5 py-0 bg-slate-100 text-slate-500 rounded-md font-medium border border-slate-200 capitalize">
                                        To: {conv.display_phone_number}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-3">
                                <Avatar className="h-12 w-12 text-white border flex-shrink-0">
                                    <AvatarFallback className="bg-slate-300 text-slate-600 font-semibold">{truncateNameInitial(conv.customer_name)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0 flex flex-col justify-center">
                                    <div className="flex justify-between items-baseline gap-2">
                                        <span className="font-semibold text-[#111b21] truncate min-w-0 flex-1 ">
                                            {truncateText(conv.customer_name || 'Unknown', 22)}
                                        </span>
                                        <span className="text-[11px] text-[#667781] whitespace-nowrap flex-shrink-0">
                                            {formatTimeConversation(conv.updated_at, conv.last_message_timestamp)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center gap-2 mt-0.5">
                                        {/* add tooltip to last_message_preview */}
                                        <Tooltip>
                                            <TooltipTrigger>
                                                <p className={`text-sm truncate min-w-0 flex-1 ${typingAgents[conv.id] ? 'text-[#00a884] font-medium italic' : 'text-[#667781]'}`} style={{maxWidth : '246px'}}>
                                                    {typingAgents[conv.id] ? `${typingAgents[conv.id].name} sedang mengetik...` : truncateText(conv.last_message_preview || '', 35)}
                                                </p>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>{conv.last_message_preview}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                        {conv.unread_count > 0 && (
                                            <div className="bg-[#25d366] text-white text-[10px] rounded-full min-w-[20px] h-5 px-1 flex-shrink-0 flex items-center justify-center font-bold">
                                                {conv.unread_count}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {isFetchingMore && (
                        <div className="flex justify-center p-4">
                            <RefreshCw className="h-6 w-6 animate-spin text-[#00a884]" />
                        </div>
                    )}
                    {!isLoading && conversations.length === 0 && (
                        <div className="p-8 text-center text-gray-400 text-sm">No conversations yet</div>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
};

export default ConversationSidebar;
