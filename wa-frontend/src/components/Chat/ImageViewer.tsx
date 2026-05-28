import React, { useState, useEffect, useRef } from 'react';
import { X, ZoomIn, ZoomOut, Maximize, Copy, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ChatMessage } from '../../types/chat';

interface ImageViewerProps {
    message: ChatMessage | null;
    onClose: () => void;
}

const ImageViewer: React.FC<ImageViewerProps> = ({ message, onClose }) => {
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);

    // Reset view when image changes
    useEffect(() => {
        if (message) {
            setScale(1);
            setPosition({ x: 0, y: 0 });
        }
    }, [message]);

    // Handle ESC key to close
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === '+' || e.key === '=') handleZoom(0.2);
            if (e.key === '-' || e.key === '_') handleZoom(-0.2);
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    const handleZoom = (delta: number) => {
        setScale(prev => Math.max(0.1, Math.min(prev + delta, 5)));
    };

    const handleReset = () => {
        setScale(1);
        setPosition({ x: 0, y: 0 });
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (scale > 1) {
            setIsDragging(true);
            setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging) {
            setPosition({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleCopy = () => {
        if (!message?.file_path) return;
        if ((window as any).chrome?.webview) {
            (window as any).chrome.webview.postMessage({
                type: 'COPY_IMAGE',
                url: message.file_path,
            });
        }
    };

    const handleSave = () => {
        if (!message?.file_path) return;
        if ((window as any).chrome?.webview) {
            (window as any).chrome.webview.postMessage({
                type: 'SAVE_IMAGE',
                url: message.file_path,
            });
        }
    };

    if (!message) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex flex-col bg-black/95 backdrop-blur-md animate-in fade-in duration-300"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
        >
            {/* Header / Toolbar */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-b from-black/50 to-transparent absolute top-0 inset-x-0 z-10 transition-opacity hover:opacity-100 opacity-70">
                <div className="flex items-center gap-3">
                    <div className="text-white/90">
                        <p className="text-sm font-bold">{message.sender_name || (message.message_type === 'document' ? 'Document Preview' : 'Image Preview')}</p>
                        <p className="text-[10px] opacity-60">{new Date(message.message_timestamp ? message.message_timestamp * 1000 : message.created_at).toLocaleString()}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {message.message_type === 'image' && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleCopy}
                            className="text-white hover:bg-white/10 rounded-full h-10 w-10"
                            title="Copy to Clipboard"
                        >
                            <Copy className="h-5 w-5" />
                        </Button>
                    )}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleSave}
                        className="text-white hover:bg-white/10 rounded-full h-10 w-10"
                        title="Save As"
                    >
                        <Download className="h-5 w-5" />
                    </Button>
                    <div className="w-px h-6 bg-white/10 mx-1" />
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="text-white hover:bg-white/10 rounded-full h-10 w-10"
                    >
                        <X className="h-6 w-6" />
                    </Button>
                </div>
            </div>

            {/* Main Canvas */}
            <div
                ref={containerRef}
                className={cn(
                    "flex-1 relative overflow-hidden flex items-center justify-center select-none",
                    (message.message_type === 'image' && scale > 1) ? "cursor-grab active:cursor-grabbing" : "cursor-default"
                )}
                onMouseDown={handleMouseDown}
                onWheel={(e) => {
                    if (message.message_type !== 'image') return;
                    const delta = e.deltaY > 0 ? -0.1 : 0.1;
                    handleZoom(delta);
                }}
            >
                {message.message_type === 'document' && (message.file_type?.includes('pdf') || message.file_path?.toLowerCase().endsWith('.pdf')) ? (
                    <div className="w-full h-full pt-16 pb-4 px-4 flex items-center justify-center">
                        <iframe
                            // src={`${message.file_path}#toolbar=0`}
                            src={`${message.file_path}`}
                            className="w-full h-full max-w-5xl rounded-lg shadow-2xl bg-white"
                            title={message.file_name || 'Document'}
                        />
                    </div>
                ) : (
                    <img
                        src={message.file_path || ''}
                        alt="Current media"
                        className="max-w-full max-h-full transition-transform duration-75 ease-out shadow-2xl"
                        style={{
                            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                            pointerEvents: message.message_type === 'image' ? 'none' : 'auto'
                        }}
                    />
                )}
            </div>

            {/* Bottom Controls - Only for images */}
            {message.message_type === 'image' && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/40 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-2xl shadow-2xl transition-opacity hover:opacity-100 opacity-60">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleZoom(-0.2)}
                        className="text-white hover:bg-white/10 h-8 w-8 rounded-lg"
                    >
                        <ZoomOut className="h-4 w-4" />
                    </Button>
                    <div className="text-white/80 text-[10px] font-mono min-w-[40px] text-center">
                        {Math.round(scale * 100)}%
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleZoom(0.2)}
                        className="text-white hover:bg-white/10 h-8 w-8 rounded-lg"
                    >
                        <ZoomIn className="h-4 w-4" />
                    </Button>
                    <div className="w-px h-4 bg-white/10 mx-1" />
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleReset}
                        className="text-white hover:bg-white/10 h-8 w-8 rounded-lg"
                        title="Fit to Screen"
                    >
                        <Maximize className="h-4 w-4" />
                    </Button>
                </div>
            )}
        </div>
    );
};

export default ImageViewer;
