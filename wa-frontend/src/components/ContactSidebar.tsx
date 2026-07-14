import React from 'react';
import { X, Edit2, Check,  Clock } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Avatar, AvatarFallback } from './ui/avatar';
import type { Conversation } from '../types/chat';
import { getInitials } from '../lib/chatUtils';
import { useContact } from './hooks/useContact';

interface ContactSidebarProps {
    conversation: Conversation;
    onClose: () => void;
}

const ContactSidebar: React.FC<ContactSidebarProps> = ({ conversation, onClose }) => {
    const { customName, setCustomName, isEditing, setIsEditing, loading, contactDetails,handleSaveName,formatLastActive,getServiceWindowStatus } = useContact({conversation})
    const serviceWindow = getServiceWindowStatus();

    return (
        <div className="w-[320px] flex-shrink-0 bg-white border-l border-slate-100 flex flex-col h-full animate-in slide-in-from-right duration-300 z-30 shadow-2xl relative">
            {/* Header */}
            <div className="h-[72px] border-b border-slate-100 flex items-center justify-between px-5 py-2">
                <span className="font-bold text-slate-800 text-sm">Info Kontak</span>
                <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 text-[#54656f] hover:bg-slate-50" onClick={onClose}>
                    <X className="h-4 w-4" />
                </Button>
            </div>

            {/* Content Scrollable */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
                {/* Profile Center Card */}
                <div className="flex flex-col items-center text-center space-y-4">
                    <Avatar className="w-24 h-24 border-4 border-slate-50 shadow-md ring-1 ring-slate-100">
                        <AvatarFallback className="bg-slate-100 text-[#00a884] font-bold text-2xl">
                            {getInitials(customName)}
                        </AvatarFallback>
                    </Avatar>

                    <div className="space-y-1.5 w-full">
                        {isEditing ? (
                            <div className="flex items-center gap-1.5 justify-center w-full max-w-[240px] mx-auto">
                                <Input
                                    value={customName}
                                    onChange={(e) => setCustomName(e.target.value)}
                                    className="h-8 text-xs bg-slate-50 border-none text-center"
                                    autoFocus
                                    onKeyDown={(e) => { if (e.key === 'Enter') handleSaveName(); }}
                                />
                                <Button 
                                    size="icon" 
                                    className="h-8 w-8 shrink-0 bg-[#00a884] hover:bg-[#06cf9c] rounded-lg text-white"
                                    onClick={handleSaveName}
                                    disabled={loading}
                                >
                                    <Check className="h-4.5 w-4.5" />
                                </Button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 justify-center">
                                <h3 className="text-base font-bold text-slate-900 truncate max-w-[200px]">{customName}</h3>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-6 w-6 rounded-full hover:bg-slate-50 text-slate-400"
                                    onClick={() => setIsEditing(true)}
                                >
                                    <Edit2 className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        )}
                        <p className="text-xs text-slate-500 font-medium">+{conversation.wa_id}</p>
                    </div>
                </div>

                {/* Details Section */}
                <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 space-y-4">
                    {/* Profile Name (WhatsApp Original) */}
                    <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Nama Profil WhatsApp</span>
                        <p className="text-xs font-semibold text-slate-700">{contactDetails?.profile_name || '-'}</p>
                    </div>

                    {/* Channel */}
                    <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Nomor Layanan (Channel)</span>
                        <p className="text-xs font-semibold text-slate-700">{conversation.display_name} ({conversation.display_phone_number})</p>
                    </div>
                </div>

                {/* Service Window Section */}
                <div className="space-y-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 px-1">Status Sesi 24 Jam</span>
                    <div className={`p-3.5 border rounded-2xl flex flex-col gap-1.5 ${serviceWindow.color}`}>
                        <div className="flex items-center gap-2 font-bold text-xs">
                            <Clock className="w-4 h-4" />
                            <span>{serviceWindow.text}</span>
                        </div>
                        <span className="text-[10px] opacity-80">
                            Terakhir Aktif: {formatLastActive(contactDetails?.last_customer_message_at)}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContactSidebar;
