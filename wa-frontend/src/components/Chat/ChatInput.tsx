
import React, { useRef, useEffect } from 'react';
import { Smile, Paperclip, LayoutGrid, Send, X, Reply } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ChatMessage } from '../../types/chat';
import { cn } from '@/lib/utils';

interface ChatInputProps {
    inputText: string;
    setInputText: (text: string) => void;
    handleSend: () => void;
    handleKeyDown: (e: React.KeyboardEvent) => void;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
    setShowEmojiPicker: (show: boolean) => void;
    showEmojiPicker: boolean;
    setEmojiTarget: (target: 'input' | 'media' | 'reaction') => void;
    isTemplateRequired: boolean;
    allowSendTemplate: boolean;
    setIsTemplateDialogOpen: (open: boolean) => void;
    replyingTo: ChatMessage | null;
    setReplyingTo: (msg: ChatMessage | null) => void;
    handleFiles: (files: FileList | File[] | null) => void;
}

const ChatInput: React.FC<ChatInputProps> = ({
    inputText,
    setInputText,
    handleSend,
    handleKeyDown,
    fileInputRef,
    handleFileSelect,
    setShowEmojiPicker,
    showEmojiPicker,
    setEmojiTarget,
    isTemplateRequired,
    allowSendTemplate,
    setIsTemplateDialogOpen,
    replyingTo,
    setReplyingTo,
    handleFiles
}) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 128)}px`;
        }
    }, [inputText]);

    return (
        <div className="p-4 bg-white border-t border-slate-100 flex flex-col gap-2">
            {replyingTo && (
                <div className="flex items-center justify-between p-2 pl-3 bg-slate-50/80 rounded-xl border border-slate-100 border-l-4 border-l-indigo-500 animate-in slide-in-from-bottom-2 duration-200">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <Reply className="w-4 h-4 text-indigo-500 shrink-0" />
                        <div className="flex flex-col min-w-0">
                            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Balas ke {replyingTo.reply_name}</span>
                            <p className="text-xs text-slate-500 truncate">{replyingTo.message_text || (replyingTo.message_type === 'image' ? '📷 Foto' : 'Media')}</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full hover:bg-slate-200 transition-colors" onClick={() => setReplyingTo(null)}>
                        <X className="w-3 h-3 text-slate-400" />
                    </Button>
                </div>
            )}

            <div className="flex items-end gap-3">
                <div className="flex items-center gap-1 mb-1">
                    <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileSelect} />
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn("rounded-xl h-10 w-10 hover:bg-slate-100 transition-colors", isTemplateRequired && "opacity-50 pointer-events-none")}
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isTemplateRequired}
                        title="Lampirkan File"
                    >
                        <Paperclip className="w-5 h-5 text-slate-500" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn("rounded-xl h-10 w-10 hover:bg-slate-100 transition-colors", isTemplateRequired && "opacity-50 pointer-events-none")}
                        onClick={() => {
                            setEmojiTarget('input');
                            setShowEmojiPicker(!showEmojiPicker);
                        }}
                        disabled={isTemplateRequired}
                        title="Emoji"
                    >
                        <Smile className="w-5 h-5 text-slate-500" />
                    </Button>
                    {allowSendTemplate && !replyingTo && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-xl h-10 w-10 hover:bg-slate-100 transition-colors"
                            onClick={() => setIsTemplateDialogOpen(true)}
                            title="Template WhatsApp"
                        >
                            <LayoutGrid className="w-5 h-5 text-[#00a884]" />
                        </Button>
                    )}
                </div>

                <div className="flex-1 relative">
                    <textarea
                        ref={textareaRef}
                        rows={1}
                        placeholder={isTemplateRequired ? "Sesi berakhir. Kirim template untuk memulai..." : "Ketik pesan..."}
                        className={cn(
                            "w-full bg-slate-50 rounded-2xl px-4 py-2.5 text-sm ring-1 ring-slate-200 focus:ring-2 focus:ring-[#00a884] focus:bg-white resize-none max-h-[128px] transition-all scrollbar-thin outline-none",
                            isTemplateRequired && "opacity-70"
                        )}
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onPaste={(e) => {
                            if (isTemplateRequired) return;
                            if (e.clipboardData.files && e.clipboardData.files.length > 0) {
                                e.preventDefault();
                                handleFiles(e.clipboardData.files);
                            }
                        }}
                        readOnly={isTemplateRequired}
                    />
                </div>

                <Button
                    size="icon"
                    className={cn(
                        "rounded-xl h-10 w-10 transition-all mb-1",
                        inputText.trim() ? "bg-[#00a884]/80 hover:bg-[#00a884] shadow-md shadow-[#00a884]/60 scale-100" : "bg-slate-100 text-slate-400 hover:bg-slate-200 scale-95",
                        isTemplateRequired && "opacity-50 pointer-events-none"
                    )}
                    onClick={handleSend}
                    disabled={!inputText.trim() || isTemplateRequired}
                >
                    <Send className={cn("w-5 h-5", inputText.trim() ? "translate-x-0.5" : "")} style={inputText.trim() ? { marginLeft: "-.4em" } : {}} />
                </Button>
            </div>
        </div>
    );
};

export default ChatInput;
