
import { ExternalLink, Phone } from 'lucide-react';
import type { Bubble, ButtonMsg,  ContextMsg, ErrorDetails } from '../../types/chat';
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

export const renderTemplateMessage = (msg: Bubble) => {
    // try {
    //     const payload = typeof msg.content?.raw_payload === 'string' ? JSON.parse(msg.content?.raw_payload) : msg.content?.raw_payload;

    //     // Template definition from backend JOIN (uppercase types: BODY, HEADER, BUTTONS)
    //     const definition: any[] = payload.template_definition;

    //     // Template message components from stored content (lowercase types: body, header, button)
    //     const msgComponents: any[] = payload.template?.components || [];

    //     if (!definition || !Array.isArray(definition)) {
    //         // Fallback: no definition available — show template name
    //         const tplName = payload.template?.name || payload.body || '';
    //         return <div className="text-sm italic opacity-60">Template: {tplName}</div>;
    //     }

    //     // Build param map: lowercase type → array of text values
    //     const paramMap: Record<string, string[]> = {};
    //     for (const comp of msgComponents) {
    //         const type = comp.type?.toLowerCase();
    //         const values = (comp.parameters || []).map((p: any) => p.text || '');
    //         if (type) paramMap[type] = values;
    //     }

    //     const getParams = (defType: string): string[] => {
    //         const lower = defType.toLowerCase();
    //         // For buttons, params may be in 'button' entries too
    //         if (lower === 'buttons') {
    //             return paramMap['button'] || paramMap['buttons'] || [];
    //         }
    //         return paramMap[lower] || [];
    //     };

    //     const replaceParams = (text: string, params: string[]) => {
    //         if (!text) return '';
    //         let idx = 0;
    //         return text.replace(/{{\d+}}/g, () => params[idx] || '');
    //     };

    //     const headerDef = definition.find((c: any) => c.type === 'HEADER');
    //     const bodyDef = definition.find((c: any) => c.type === 'BODY');
    //     const footerDef = definition.find((c: any) => c.type === 'FOOTER');
    //     const buttonsDef = definition.find((c: any) => c.type === 'BUTTONS');

    //     return (
    //         <div className="space-y-2 py-1">
    //             {headerDef && headerDef.format === 'TEXT' && (
    //                 <div className="font-bold text-sm mb-1 leading-tight tracking-tight">
    //                     {replaceParams(headerDef.text, getParams('header'))}
    //                 </div>
    //             )}
    //             {headerDef && headerDef.format === 'IMAGE' && (
    //                 <img src={headerDef.image?.link} alt="Header" className="rounded-lg w-full mb-2 shadow-sm border border-slate-100" />
    //             )}

    //             <div className="text-sm leading-relaxed whitespace-pre-wrap">
    //                 {replaceParams(bodyDef?.text || '', getParams('body'))}
    //             </div>

    //             {footerDef && (
    //                 <div className="text-[10px] opacity-60 mt-1 tracking-wider">
    //                     {footerDef.text}
    //                 </div>
    //             )}

    //             {buttonsDef && buttonsDef.buttons && (
    //                 <div className="border-t border-slate-100/20 pt-2 mt-2 flex flex-col gap-1.5">
    //                     {buttonsDef.buttons.map((btn: any, idx: number) => (
    //                         <Button
    //                             key={idx}
    //                             variant="outline"
    //                             size="sm"
    //                             className="w-full bg-white/10 hover:bg-white/20 border-white/20 text-xs h-8 gap-2 font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
    //                         >
    //                             {btn.type === 'URL' && <ExternalLink className="w-3 h-3" />}
    //                             {btn.type === 'PHONE_NUMBER' && <Phone className="w-3 h-3" />}
    //                             {btn.text}
    //                         </Button>
    //                     ))}
    //                 </div>
    //             )}
    //         </div>
    //     );
    // } catch (e) {
    //     return <div className="text-sm italic opacity-50">{msg.content?.message_text || 'Template'}</div>;
    // }
    return <></>
};

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
                <p className="text-sm font-semibold truncate">{msg.content?.body?.filename || 'Document'}</p>
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


    // switch (msg.content?.message_type) {
    //     case 'image':
    //         return (
    //             <div className="space-y-2 max-w-[330px] ">
    //                 {renderQuotedMessage(msg.content?.context_message_id)}
    //                 <div
    //                     className="relative group/img overflow-hidden rounded-lg shadow-sm cursor-pointer"
    //                     onContextMenu={(e) => handleContextMenuImage(e, msg)}
    //                     onClick={() => onImageClick?.(msg)}
    //                 >
    //                     <img
    //                         src={msg.content?.file_path || ''}
    //                         alt="Media"
    //                         className="mx-auto max-w-full min-w-[300px] min-h-[100px] max-h-[400px] rounded-lg transition-transform duration-500 group-hover/img:scale-105 object-cover"
    //                         loading="lazy"
    //                     />
    //                     <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center p-4">
    //                         <Button variant="secondary" size="sm" className="rounded-full shadow-lg" onClick={(e) => { e.stopPropagation(); onImageClick?.(msg); }}>Buka</Button>
    //                     </div>
    //                 </div>
    //                 {msg.content?.message_text && <p className="text-sm leading-relaxed px-1 whitespace-pre-wrap">{msg.content?.message_text}</p>}
    //             </div>
    //         );
    //     case 'video':
    //         return (
    //             <div className="space-y-2 w-full max-w-[330px]">
    //                 {renderQuotedMessage(msg.content?.context_message_id)}
    //                 <video src={msg.content?.file_path} controls className="max-w-full rounded-lg shadow-sm w-full max-h-[400px] " />
    //                 {msg.content?.message_text && <p className="text-sm px-1 whitespace-pre-wrap">{msg.content?.message_text}</p>}
    //             </div>
    //         );
    //     case 'audio':
    //         return (
    //             <div className="space-y-2 py-1">
    //                 {renderQuotedMessage(msg.content?.context_message_id)}
    //                 <audio src={msg.content?.file_path} controls className="max-w-[240px] h-8" />
    //             </div>
    //         );
    //     case 'document':
    //         return (
    //             <div className="space-y-2">
    //                 {renderQuotedMessage(msg.content?.context_message_id)}
    //                 <a
    //                     target='_blank' href={msg.content?.file_path || '#'}
    //                     onClick={(e) => {
    //                         e.preventDefault();
    //                         if (onImageClick) {
    //                             onImageClick(msg);
    //                         } else {
    //                             window.open(msg.content?.file_path || '#', '_blank');
    //                         }
    //                     }}
    //                     className="flex items-center gap-3 p-3 bg-black/5 hover:bg-black/10 rounded-xl border border-black/5 transition-all group/doc cursor-pointer"
    //                 >
    //                     <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm group-hover/doc:text-indigo-600 transition-colors">
    //                         {msg.content?.file_type?.includes('pdf') ? 'PDF' : 'DOC'}
    //                     </div>
    //                     <div className="flex-1 min-w-0">
    //                         <p className="text-sm font-semibold truncate">{msg.content?.file_name || 'Document'}</p>
    //                         <p className="text-[10px] opacity-50 uppercase font-bold">{msg.content?.file_type}</p>
    //                     </div>
    //                 </a>
    //                 {msg.content?.message_text && <p className="text-sm px-1 whitespace-pre-wrap">{msg.content?.message_text}</p>}
    //             </div>
    //         );
    //     case 'sticker':
    //         return (
    //             <div className="relative group/sticker p-2 hover:bg-black/5 rounded-2xl transition-colors">
    //                 <img src={msg.content?.file_path} alt="Sticker" className="w-32 h-32 object-contain transition-transform group-hover/sticker:scale-110 duration-500" />
    //             </div>
    //         );
    //     case 'contacts':
    //         try {
    //             const payload = JSON.parse(msg.content?.raw_payload || '[]');
    //             // Extract contact from either standard payload or webhook structure
    //             let contacts = [];
    //             if (payload.contacts && Array.isArray(payload.contacts)) {
    //                 contacts = payload.contacts;
    //             } else if (payload.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.contacts) {
    //                 contacts = payload.entry[0].changes[0].value.messages[0].contacts;
    //             }

    //             if (contacts.length === 0) {
    //                 return <p className="text-slate-800 pr-10 font-medium">{msg.content?.message_text || "[Kontak]"}</p>;
    //             }
    //             return (
    //                 <div className="space-y-2 p-1">
    //                     {contacts.map((c: any, i: number) => (
    //                         <div key={i} className="bg-white/40 backdrop-blur-sm border border-white/20 p-4 rounded-2xl shadow-sm space-y-3 min-w-[200px]">
    //                             <div className="flex items-center gap-3">
    //                                 <div className="w-10 h-10 bg-[#00a884] rounded-full flex items-center justify-center text-white text-sm font-bold">
    //                                     {c.name?.formatted_name?.charAt(0) || 'C'}
    //                                 </div>
    //                                 <div>
    //                                     <p className="text-sm font-bold text-slate-800 leading-none">{c.name?.formatted_name}</p>
    //                                     <p className="text-[10px] text-slate-500 mt-1">{c.phones?.[0]?.phone}</p>
    //                                 </div>
    //                             </div>
    //                         </div>
    //                     ))}
    //                 </div>
    //             );
    //         } catch (e) { return <p className="text-sm">[Contact Message]</p>; }
    //     default:
    //         return (
    //             <div className="flex flex-col gap-1">
    //                 {renderQuotedMessage(msg.content?.context_message_id)}
    //                 <p className="text-[14px] leading-relaxed whitespace-pre-wrap select-text">
    //                     {msg.content?.message_text}
    //                 </p>
    //             </div>
    //         );
    // }
};
