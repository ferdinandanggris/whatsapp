
import React from 'react';
import { X, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { ApplicationSummary } from '../../types/chat';
import { getInitials } from '../../lib/chatUtils';

interface ChatSidebarProps {
    applications: ApplicationSummary[];
    totalUnread: number;
    activeAppId: string | number | null;
    setActiveAppId: (id: string | number | null) => void;
    user: any;
    enableLogin?: boolean;
    handleLogout: () => void;
    isRefreshing: boolean;
    handleGlobalRefresh: () => void;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({
    applications,
    totalUnread,
    activeAppId,
    setActiveAppId,
    user,
    enableLogin,
    handleLogout,
    isRefreshing,
    handleGlobalRefresh
}) => {
    return (
        <div className="w-[70px] flex-shrink-0 bg-[#f0f2f5] border-r flex flex-col items-center py-4 gap-4 z-30">
            <div className="relative group">
                <Button
                    variant="ghost"
                    size="icon"
                    className={`w-12 h-12 rounded-xl transition-all duration-200 ${activeAppId === null ? 'bg-[#00a884] text-white rounded-lg' : 'bg-white text-slate-600 hover:bg-[#00a884] hover:text-white'}`}
                    onClick={() => setActiveAppId(null)}
                    title="Semua Aplikasi"
                >
                    <Home className="w-6 h-6" />
                </Button>
                {totalUnread > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-slate-100 shadow-sm">
                        {totalUnread > 99 ? '99+' : totalUnread}
                    </span>
                )}
                {activeAppId === null && (
                    <div className="absolute left-[-15px] top-1/2 -translate-y-1/2 w-1 h-8 bg-[#00a884] rounded-r-full" />
                )}
            </div>

            <Separator className="w-10 bg-slate-200" />

            {applications.map(app => (
                <div key={app.id} className="relative group">
                    <Button
                        variant="ghost"
                        size="icon"
                        className={`w-12 h-12 rounded-xl transition-all duration-200 ${activeAppId === app.id ? 'bg-[#00a884] text-white rounded-lg' : 'bg-white text-slate-600 hover:bg-[#00a884] hover:text-white'}`}
                        onClick={() => setActiveAppId(app.id)}
                        title={app.app_name}
                    >
                        <span className="text-sm font-bold">{getInitials(app.app_name)}</span>
                    </Button>
                    {app.unread_count > 0 && (
                        <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full px-1.5 h-5 flex items-center justify-center font-bold border-2 border-[#f0f2f5] shadow-sm">
                            {app.unread_count > 99 ? '99+' : app.unread_count}
                        </div>
                    )}
                    {activeAppId === app.id && (
                        <div className="absolute left-[-15px] top-1/2 -translate-y-1/2 w-1 h-8 bg-[#00a884] rounded-r-full" />
                    )}
                </div>
            ))}

            <div className="mt-auto flex flex-col items-center gap-4 mb-4">
                <Button
                    variant="ghost"
                    size="icon"
                    className={`rounded-full hover:bg-slate-200 ${isRefreshing ? 'animate-spin' : ''}`}
                    onClick={handleGlobalRefresh}
                    disabled={isRefreshing}
                    title="Refresh Data"
                >
                    <RefreshCw className="h-4 w-4" />
                </Button>
                <Separator className="w-10 bg-slate-200" />
                <div className="relative group">
                    <Avatar className="h-10 w-10 border-2 border-white shadow-md">
                        <AvatarFallback className="bg-[#00a884] text-white font-bold text-xs">
                            {user?.display_name ? getInitials(user.display_name) : 'CS'}
                        </AvatarFallback>
                    </Avatar>
                    <div className="absolute left-14 top-1/2 -translate-y-1/2 bg-white px-3 py-1.5 rounded-lg shadow-xl border border-slate-100 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                        <p className="text-xs font-bold text-slate-800">{user?.display_name || 'Agent'}</p>
                        <p className="text-[10px] text-slate-500">{user?.username || 'default'}</p>
                    </div>
                </div>
                {enableLogin && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="w-10 h-10 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                        onClick={handleLogout}
                        title="Logout"
                    >
                        <X className="h-5 w-5" />
                    </Button>
                )}
            </div>
        </div>
    );
};

export default ChatSidebar;
