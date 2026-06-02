
import { ExternalLink, Phone } from 'lucide-react';
import type { ChatMessage, ErrorDetails } from '../../types/chat';

export const parseErrorDetails = (msg: ChatMessage): ErrorDetails | null => {
    if (!msg.raw_payload) return null;
    try {
        const payload = JSON.parse(msg.raw_payload);
        return payload.error_details || null;
    } catch (e) {
        return null;
    }
};
import { Button } from '@/components/ui/button';

/**
 * Opens a URL/file using the OS default application when running inside
 * the WaMeta Desktop client (WebView2 bridge). Falls back to window.open
 * in regular browser / dev mode.
 */
// const openExternal = (url: string) => {
//     if (!url) return;
//     if ((window as any).chrome?.webview) {
//         (window as any).chrome.webview.postMessage({ type: 'OPEN_EXTERNAL_URL', url });
//     } else {
//         window.open(url, '_blank');
//     }
// };

export const renderTemplateMessage = (msg: ChatMessage) => {
    try {
        const payload = typeof msg.raw_payload === 'string' ? JSON.parse(msg.raw_payload) : msg.raw_payload;
        const template = payload.template_definition;
        if (!template) return <div className="italic text-slate-400">Template data missing</div>;

        // Extract parameters from payload (outbound format)
        const bodyParams = payload.body_params || (payload.template?.components?.find((c: any) => c.type?.toLowerCase() === 'body')?.parameters?.map((p: any) => p.text)) || [];
        const headerParams = payload.header_params || (payload.template?.components?.find((c: any) => c.type?.toLowerCase() === 'header')?.parameters?.map((p: any) => p.text)) || [];

        const bodyComponent = template.find((c: any) => c.type === 'BODY');
        const headerComponent = template.find((c: any) => c.type === 'HEADER');
        const footerComponent = template.find((c: any) => c.type === 'FOOTER');
        const buttonComponent = template.find((c: any) => c.type === 'BUTTONS');

        const replaceParams = (text: string, params: string[]) => {
            if (!text) return "";
            return text.replace(/{{\d+}}/g, (match) => {
                const idx = parseInt(match.match(/\d+/)?.[0] || "1") - 1;
                return params[idx] || match;
            });
        };

        return (
            <div className="space-y-2 py-1">
                {headerComponent && headerComponent.format === 'TEXT' && (
                    <div className="font-bold text-sm mb-1 leading-tight tracking-tight">
                        {replaceParams(headerComponent.text, headerParams)}
                    </div>
                )}
                {headerComponent && headerComponent.format === 'IMAGE' && (
                    <img src={headerComponent.image?.link} alt="Header" className="rounded-lg w-full mb-2 shadow-sm border border-slate-100" />
                )}

                <div className="text-sm leading-relaxed whitespace-pre-wrap">
                    {replaceParams(bodyComponent?.text || '', bodyParams)}
                </div>

                {footerComponent && (
                    <div className="text-[10px] opacity-60 mt-1 tracking-wider">
                        {footerComponent.text}
                    </div>
                )}

                {buttonComponent && (
                    <div className="border-t border-slate-100/20 pt-2 mt-2 flex flex-col gap-1.5">
                        {buttonComponent.buttons?.map((btn: any, idx: number) => (
                            <Button
                                key={idx}
                                variant="outline"
                                size="sm"
                                className="w-full bg-white/10 hover:bg-white/20 border-white/20 text-xs h-8 gap-2 font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
                            >
                                {btn.type === 'URL' && <ExternalLink className="w-3 h-3" />}
                                {btn.type === 'PHONE_NUMBER' && <Phone className="w-3 h-3" />}
                                {btn.text}
                            </Button>
                        ))}
                    </div>
                )}
            </div>
        );
    } catch (e) {
        return <div className="text-sm italic opacity-50">{msg.message_text}</div>;
    }
};

export const renderMessageContent = (msg: ChatMessage, handleContextMenuImage: (e: React.MouseEvent, msg: ChatMessage) => void, onImageClick?: (msg: ChatMessage) => void) => {
    const renderQuotedMessage = (contextMessageId?: string) => {
        // find messages with the contextMessageId
        if (!contextMessageId) return null;
        return (
            <div className="mb-2 p-2 bg-black/5 hover:bg-black/10 rounded-lg border-l-4 border-indigo-500/50 cursor-pointer transition-colors group/quote"
                onClick={() => {
                    const el = document.getElementById(`msg-${contextMessageId}`);
                    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    el?.classList.add('animate-pulse-glow');
                    setTimeout(() => el?.classList.remove('animate-pulse-glow'), 2000);
                }}
            >
                <div className="flex items-center gap-1.5 mb-0.5">
                    <div className="w-0.5 h-3 bg-indigo-500/50 rounded-full" />
                    <span className="text-[10px] font-bold text-indigo-600/70 uppercase tracking-widest">{msg?.reply_name || 'Whatsapp User'}</span>
                </div>
                <p className="text-[11px] opacity-60 truncate">
                    {msg?.reply_text || 'Quoted message'}
                </p>
            </div>
        );
    };

    switch (msg.message_type) {
        case 'image':
            return (
                <div className="space-y-2 max-w-[330px] ">
                    {renderQuotedMessage(msg.context_message_id)}
                    <div
                        className="relative group/img overflow-hidden rounded-lg shadow-sm cursor-pointer"
                        onContextMenu={(e) => handleContextMenuImage(e, msg)}
                        onClick={() => onImageClick?.(msg)}
                    >
                        <img
                            src={msg.file_path || ''}
                            alt="Media"
                            className="mx-auto max-w-full min-w-[300px] min-h-[100px] max-h-[400px] rounded-lg transition-transform duration-500 group-hover/img:scale-105 object-cover"
                            loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center p-4">
                            <Button variant="secondary" size="sm" className="rounded-full shadow-lg" onClick={(e) => { e.stopPropagation(); onImageClick?.(msg); }}>Buka</Button>
                        </div>
                    </div>
                    {msg.message_text && <p className="text-sm leading-relaxed px-1 whitespace-pre-wrap">{msg.message_text}</p>}
                </div>
            );
        case 'video':
            return (
                <div className="space-y-2 w-full max-w-[330px]">
                    {renderQuotedMessage(msg.context_message_id)}
                    <video src={msg.file_path} controls className="max-w-full rounded-lg shadow-sm w-full max-h-[400px] " />
                    {msg.message_text && <p className="text-sm px-1 whitespace-pre-wrap">{msg.message_text}</p>}
                </div>
            );
        case 'audio':
            return (
                <div className="space-y-2 py-1">
                    {renderQuotedMessage(msg.context_message_id)}
                    <audio src={msg.file_path} controls className="max-w-[240px] h-8" />
                </div>
            );
        case 'document':
            return (
                <div className="space-y-2">
                    {renderQuotedMessage(msg.context_message_id)}
                    <a
                        target='_blank' href={msg.file_path || '#'}
                        onClick={(e) => {
                            e.preventDefault();
                            if (onImageClick) {
                                onImageClick(msg);
                            } else {
                                window.open(msg.file_path || '#', '_blank');
                            }
                        }}
                        className="flex items-center gap-3 p-3 bg-black/5 hover:bg-black/10 rounded-xl border border-black/5 transition-all group/doc cursor-pointer"
                    >
                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm group-hover/doc:text-indigo-600 transition-colors">
                            {msg.file_type?.includes('pdf') ? 'PDF' : 'DOC'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate">{msg.file_name || 'Document'}</p>
                            <p className="text-[10px] opacity-50 uppercase font-bold">{msg.file_type}</p>
                        </div>
                    </a>
                    {msg.message_text && <p className="text-sm px-1 whitespace-pre-wrap">{msg.message_text}</p>}
                </div>
            );
        case 'sticker':
            return (
                <div className="relative group/sticker p-2 hover:bg-black/5 rounded-2xl transition-colors">
                    <img src={msg.file_path} alt="Sticker" className="w-32 h-32 object-contain transition-transform group-hover/sticker:scale-110 duration-500" />
                </div>
            );
        case 'contacts':
            try {
                const payload = JSON.parse(msg.raw_payload || '[]');
                // Extract contact from either standard payload or webhook structure
                let contacts = [];
                if (payload.contacts && Array.isArray(payload.contacts)) {
                    contacts = payload.contacts;
                } else if (payload.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.contacts) {
                    contacts = payload.entry[0].changes[0].value.messages[0].contacts;
                }

                if (contacts.length === 0) {
                    return <p className="text-slate-800 pr-10 font-medium">{msg.message_text || "[Kontak]"}</p>;
                }
                return (
                    <div className="space-y-2 p-1">
                        {contacts.map((c: any, i: number) => (
                            <div key={i} className="bg-white/40 backdrop-blur-sm border border-white/20 p-4 rounded-2xl shadow-sm space-y-3 min-w-[200px]">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-[#00a884] rounded-full flex items-center justify-center text-white text-sm font-bold">
                                        {c.name?.formatted_name?.charAt(0) || 'C'}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-800 leading-none">{c.name?.formatted_name}</p>
                                        <p className="text-[10px] text-slate-500 mt-1">{c.phones?.[0]?.phone}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                );
            } catch (e) { return <p className="text-sm">[Contact Message]</p>; }
        default:
            return (
                <div className="flex flex-col gap-1">
                    {renderQuotedMessage(msg.context_message_id)}
                    <p className="text-[14px] leading-relaxed whitespace-pre-wrap select-text">
                        {msg.message_text}
                    </p>
                </div>
            );
    }
};
