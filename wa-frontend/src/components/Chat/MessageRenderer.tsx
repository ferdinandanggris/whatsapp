
import { ExternalLink, Phone } from 'lucide-react';
import type { Bubble, ButtonMsg,  ContextMsg } from '../../types/chat';
import { Button, Button as ButtonComp } from '@/components/ui/button';
import { JSX } from 'react';

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


export const renderDocumentMessage = (msg: Bubble, onImageClick?: (msg: Bubble) => void) => (
    <>
        <a
            target='_blank' href={msg.content?.body?.url || '#'}
            onClick={(e) => {
                e.preventDefault();
                if (onImageClick) {
                    onImageClick(msg);
                } else {
                    window.open(msg.content?.body?.url || '#', '_blank');
                }
            }}
            className="flex items-center gap-3 p-3 bg-black/5 hover:bg-black/10 rounded-xl border border-black/5 transition-all group/doc cursor-pointer"
        >
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm group-hover/doc:text-indigo-600 transition-colors">
                {msg.content?.body?.url?.includes('pdf') ? 'PDF' : 'DOC'}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{msg.content?.body?.file_name || 'Document'}</p>
                <p className="text-[10px] opacity-50 uppercase font-bold">{msg.content?.body?.url?.split('.').pop()}</p>
            </div>
        </a>
    </>
);

export const renderImageMessage = (msg: Bubble, handleContextMenuImage: (e: React.MouseEvent, msg: Bubble) => void, onImageClick?: (msg: Bubble) => void) => (
    <div
        className="relative group/img overflow-hidden rounded-lg shadow-sm cursor-pointer"
        onContextMenu={(e) => handleContextMenuImage(e, msg)}
        onClick={() => onImageClick?.(msg)}
    >
        <img
            src={msg.content?.body.url || ''}
            alt="Media"
            className="mx-auto max-w-full min-w-[300px] min-h-[100px] max-h-[400px] rounded-lg transition-transform duration-500 group-hover/img:scale-105 object-cover"
            loading="lazy"
        />
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center p-4">
            <Button variant="secondary" size="sm" className="rounded-full shadow-lg" onClick={(e) => { e.stopPropagation(); onImageClick?.(msg); }}>Buka</Button>
        </div>
    </div>
)

export const renderVideoMessage = (msg: Bubble) => (
    <video src={msg.content?.body?.url} controls className="max-w-full rounded-lg shadow-sm w-full max-h-[400px] " />
)

export const renderAudioMessage = (msg: Bubble) => (
    <audio src={msg.content?.body?.url} controls className="max-w-[240px] h-8" />
)

export const renderStickerMessage = (msg: Bubble) => (
    <div className="relative group/sticker p-2 hover:bg-black/5 rounded-2xl transition-colors">
        <img src={msg.content?.body?.url} alt="Sticker" className="w-32 h-32 object-contain transition-transform group-hover/sticker:scale-110 duration-500" />
    </div>
)

export const renderMessageContent = (msg: Bubble, handleContextMenuImage: (e: React.MouseEvent, msg: Bubble) => void, onImageClick?: (msg: Bubble) => void) => {
    const renderQuotedMessage = (context?: ContextMsg) => {
        // find messages with the contextMessageId
        if (!context) return null;
        return (
            <div className="mb-2 p-2 bg-black/5 hover:bg-black/10 rounded-lg border-l-4 border-indigo-500/50 cursor-pointer transition-colors group/quote"
                onClick={() => {
                    const el = document.getElementById(`msg-${context.context_id}`);
                    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    el?.classList.add('animate-pulse-glow');
                    setTimeout(() => el?.classList.remove('animate-pulse-glow'), 2000);
                }}
            >
                <div className="flex items-center gap-1.5 mb-0.5">
                    <div className="w-0.5 h-3 bg-indigo-500/50 rounded-full" />
                    <span className="text-[10px] font-bold text-indigo-600/70 uppercase tracking-widest">{context?.name || 'Whatsapp User'}</span>
                </div>
                <p className="text-[11px] opacity-60 truncate">
                    {context?.text || 'Quoted message'}
                </p>
            </div>
        );
    };

    return (
        <div className="space-y-2 py-1">
            {renderQuotedMessage(msg.content?.context)}
            {msg.content?.header && msg.content?.header.format === 'text' && (
                <div className="font-bold text-sm mb-1 leading-tight tracking-tight">
                    {msg.content?.header.text}
                </div>
            )}
            {msg.content?.header && msg.content?.header.format === 'image' && (
                <img src={msg.content?.header.url} alt="Header" className="rounded-lg w-full mb-2 shadow-sm border border-slate-100" />
            )}

            {/* BODY */}
            {msg.content?.body && (
                <>
                    {msg.content?.body?.format === 'image' && renderImageMessage(msg, handleContextMenuImage, onImageClick)}
                    {msg.content?.body?.format === 'document' && renderDocumentMessage(msg)}
                    {msg.content?.body?.format === 'video' && renderVideoMessage(msg)}
                    {msg.content?.body?.format === 'audio' && renderAudioMessage(msg)}
                    {msg.content?.body?.format === 'sticker' && renderStickerMessage(msg)}

                    {msg.content?.body?.format != 'audio' ? (
                        <div className="text-sm leading-relaxed whitespace-pre-wrap">
                            {msg.content?.body?.text}
                        </div>
                    ): <></>}
                </>
            )}

            {msg.content?.footer && (
                <div className="text-[10px] opacity-60 mt-1 tracking-wider">
                    {msg.content?.footer.text}
                </div>
            )}

            {msg.content?.buttons && msg.content?.buttons.length > 0 && (
                <div className="border-t border-slate-100/20 pt-2 mt-2 flex flex-col gap-1.5">
                    {msg.content?.buttons.map((btn: ButtonMsg, idx: number) => (
                        <ButtonComp
                            key={idx}
                            variant="outline"
                            size="sm"
                            className="w-full bg-white/10 hover:bg-white/20 border-white/20 text-xs h-8 gap-2 font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            {btn.format === 'url' && <ExternalLink className="w-3 h-3" />}
                            {btn.format === 'phone_number' && <Phone className="w-3 h-3" />}
                            {btn.text}
                        </ButtonComp>
                    ))}
                </div>
            )}
        </div>
    );
};
