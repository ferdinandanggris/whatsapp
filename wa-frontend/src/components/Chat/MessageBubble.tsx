
import React from 'react';
import { Check, CheckCheck, AlertCircle, Clock, Reply, Smile, Info, RotateCw } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { ChatMessage, Conversation } from '../../types/chat';
import { formatTime, formatDividerDate, isSameDay, getInitials } from '../../lib/chatUtils';
import { cn } from '@/lib/utils';
import { parseErrorDetails } from './MessageRenderer';

interface MessageBubbleProps {
    msg: ChatMessage;
    prevMsg?: ChatMessage;
    onReply: (msg: ChatMessage) => void;
    onReaction: (msg: ChatMessage) => void;
    onResend: (msg: ChatMessage) => void;
    renderTemplateMessage: (msg: ChatMessage) => React.ReactNode;
    renderMessageContent: (msg: ChatMessage, handleContextMenuImage: (e: React.MouseEvent, msg: ChatMessage) => void) => React.ReactNode;
    handleContextMenuImage: (e: React.MouseEvent, msg: ChatMessage) => void;
    conversation: Conversation;
    isTemplateRequired: boolean;
}

const MessageBubble = React.memo(function MessageBubble({
    msg,
    prevMsg,
    onReply,
    onReaction,
    onResend,
    renderTemplateMessage,
    renderMessageContent,
    handleContextMenuImage,
    isTemplateRequired,
    conversation,
}: MessageBubbleProps) {
    const [showErrorInfo, setShowErrorInfo] = React.useState(false);
    const isOutbound = msg.direction === 'OUTBOUND';
    const isFailed = msg.status === 'failed';
    const errorDetails = isFailed ? parseErrorDetails(msg) : null;
    const showDateDivider = !prevMsg || !isSameDay(new Date(msg.message_timestamp ? msg.message_timestamp * 1000 : msg.created_at), new Date(prevMsg.message_timestamp ? prevMsg.message_timestamp * 1000 : prevMsg.created_at));

    const renderStatusIcon = (status?: string) => {
        switch (status?.toLowerCase()) {
            case 'pending': return <Clock className="w-3 h-3 text-slate-100" />;
            case 'sent': return <Check className="w-3 h-3 text-slate-100" />;
            case 'delivered': return <CheckCheck className="w-3 h-3 text-slate-100" />;
            case 'read': return <CheckCheck className="w-3 h-3 text-blue-500" />;
            case 'failed': return <AlertCircle className="w-3 h-3 text-red-500" />;
            default: return null;
        }
    };

    return (
        <div className="flex flex-col mb-1 group/bubble"
            key={msg.id}
            id={`msg-${msg.wa_message_id}`}
        >
            {showDateDivider && (
                <div className="flex justify-center my-6 sticky top-2 z-10">
                    <span className="bg-slate-100/80 backdrop-blur-sm text-slate-500 text-[10px] uppercase tracking-wider font-bold px-3 py-1 rounded-full shadow-sm border border-slate-200/50 transition-all">
                        {formatDividerDate(msg.created_at, msg.message_timestamp)}
                    </span>
                </div>
            )}

            <div className={cn(
                "flex group relative px-4 py-0.5 ",
                isOutbound ? "justify-end" : "justify-start"
            )}>
                {!isOutbound && (
                    <Avatar className="w-8 h-8 mr-2 mt-1 shrink-0 shadow-sm border-2 border-white">
                        <AvatarFallback className="bg-slate-200 text-slate-600 text-[10px] font-bold uppercase">
                            {/* {getInitials(msg.sender_name || 'C')} */}
                            {getInitials(conversation?.customer_name || 'C')}
                        </AvatarFallback>
                    </Avatar>
                )}

                <div className={cn(
                    "relative max-w-[85%]  transition-all",
                    isOutbound ? "items-end" : "items-start"
                )}>
                    <div className={cn(
                        "rounded-2xl px-4 py-2 shadow-sm border min-w-[80px] ",
                        isOutbound
                            ? "bg-[#00a884] text-white border-r rounded-tr-none"
                            : "bg-white text-slate-800 border-slate-200 rounded-tl-none"
                    )}>
                        {(
                            <div className={cn("text-[10px] font-bold mb-1 flex items-center gap-1.5", isOutbound ? "text-slate-200" : "text-[#00a884]")}>
                                {/* {msg.sender_name} */}
                                {isOutbound ? msg.sender_name : conversation?.customer_name}
                                {/* {msg.platform === 'whatsapp' && <span className="w-1 h-1 bg-slate-300 rounded-full" />} */}
                                {/* {msg.platform === 'whatsapp' && <span className="font-normal text-slate-400 capitalize">{msg.platform}</span>} */}
                            </div>
                        )}

                        {msg.message_type === 'template' ? renderTemplateMessage(msg) : renderMessageContent(msg, handleContextMenuImage)}

                        {isFailed && errorDetails && showErrorInfo && (
                            <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded-lg animate-in fade-in slide-in-from-top-1 duration-200">
                                <p className="text-[10px] text-red-100 font-medium">
                                    {errorDetails.message_local || "Gagal mengirim pesan."}
                                    {errorDetails.code && <span className="ml-1 opacity-60">({errorDetails.code})</span>}
                                </p>
                            </div>
                        )}

                        <div className={cn(
                            "flex items-center gap-1.5 mt-1",
                            isOutbound ? "justify-end" : "justify-start"
                        )}>
                            <span className={cn(
                                "text-[9px] font-medium tracking-tight opacity-70",
                                isOutbound ? "text-indigo-100" : "text-slate-400"
                            )}>
                                {formatTime(msg.created_at, msg.message_timestamp)}
                            </span>
                            {isOutbound && renderStatusIcon(msg.status)}
                        </div>
                    </div>

                    {msg.reactionData && (() => {console.log(`Log Message Reactions: ${JSON.stringify(msg.reactionData)}`); return true;}) && (
                        <div className={cn(
                            "absolute -bottom-2 flex items-center bg-white border border-slate-100 rounded-full px-1.5 py-0.5 shadow-md scale-90 origin-center transition-transform hover:scale-100 select-none z-20",
                            isOutbound ? "right-2" : "left-2"
                        )}>
                            <div className="flex -space-x-1 hover:space-x-0.5 transition-all">
                                {msg.reactionData.emojis.map((emoji: string, idx: number) => (
                                    <span key={idx} className="text-[12px] drop-shadow-sm transition-transform active:scale-125 hover:z-10">{emoji}</span>
                                ))}
                            </div>
                            {msg.reactionData.total > 1 && (
                                <span className="ml-1 text-[9px] font-bold text-slate-500 border-l pl-1 border-slate-100">{msg.reactionData.total}</span>
                            )}
                        </div>
                    )}

                    <div className={cn(
                        "absolute top-0 opacity-0 group-hover/bubble:opacity-100 transition-all duration-200 flex items-center gap-1 px-2 pointer-events-none group-hover/bubble:pointer-events-auto",
                        isOutbound ? "right-full mr-2 flex-row-reverse" : "left-full ml-2"
                    )}>
                        {!isFailed ? (
                            <>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="w-7 h-7 rounded-full bg-white/80 backdrop-blur-sm shadow-sm border border-slate-200 hover:bg-slate-50 transition-colors"
                                    onClick={() => onReply({...msg, reply_name: conversation?.customer_name || msg.sender_name || 'Contact'})}
                                    title="Balas"
                                    disabled={isTemplateRequired}
                                >
                                    <Reply className="w-3.5 h-3.5 text-slate-500" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="w-7 h-7 rounded-full bg-white/80 backdrop-blur-sm shadow-sm border border-slate-200 hover:bg-slate-50 transition-colors"
                                    onClick={() => onReaction(msg)}
                                    disabled={isTemplateRequired}
                                    title="Reaksi"
                                >
                                    <Smile className="w-3.5 h-3.5 text-slate-500" />
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className={cn(
                                        "w-7 h-7 rounded-full bg-white/80 backdrop-blur-sm shadow-sm border transition-colors",
                                        showErrorInfo ? "border-red-500 bg-red-50 hover:bg-red-100" : "border-slate-200 hover:bg-slate-50"
                                    )}
                                    onClick={() => setShowErrorInfo(!showErrorInfo)}
                                    title="Info Gagal"
                                >
                                    <Info className={cn("w-3.5 h-3.5", showErrorInfo ? "text-red-500" : "text-slate-500")} />
                                </Button>
                                {msg.message_type !== 'template' && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="w-7 h-7 rounded-full bg-white/80 backdrop-blur-sm shadow-sm border border-slate-200 hover:bg-slate-50 transition-colors"
                                        onClick={() => onResend(msg)}
                                        title="Kirim Ulang"
                                    >
                                        <RotateCw className="w-3.5 h-3.5 text-slate-500" />
                                    </Button>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
});

export default MessageBubble;
