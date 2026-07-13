
import React from 'react';
import { X, Search } from "lucide-react";
import type { ConnectionStatus } from './hooks/useChatConnection';

interface ConnectionBannerProps {
    status: ConnectionStatus;
    onRetry: () => void;
    onFindServer: () => void;
}

const ConnectionBanner: React.FC<ConnectionBannerProps> = ({ status, onRetry, onFindServer }) => {
    if (status === 'connected' || status === 'connecting') return null;

    return (
        <div className={
            `fixed top-0 left-0 right-0 z-[100] flex items-center justify-center p-2 text-white text-sm font-medium transition-colors duration-300 ${status === 'reconnecting' ? 'bg-amber-500' : 'bg-rose-500'
            }`
        }>
            <div className="flex items-center gap-2">
                {status === 'reconnecting' ? (
                    <>
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                        <span>Menghubungkan kembali ke server...</span>
                    </>
                ) : (
                    <>
                        <X className="h-4 w-4" />
                        <span>Terputus dari server.</span>
                        <div className="flex gap-2 ml-4">
                            <button
                                onClick={onRetry}
                                className="px-2 py-0.5 bg-white/20 hover:bg-white/30 rounded border border-white/30"
                            >
                                Coba Lagi
                            </button>
                            <button
                                onClick={onFindServer}
                                className="px-2 py-0.5 bg-white/20 hover:bg-white/30 rounded border border-white/30 flex items-center gap-1"
                            >
                                <Search className="h-3 w-3" />
                                Cari IP Baru
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ConnectionBanner;
