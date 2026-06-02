import React, { useState, useEffect } from 'react';
import { X, Edit2, Check, ShieldAlert, ShieldCheck, UserMinus, UserCheck, MessageSquare, Clock } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Avatar, AvatarFallback } from './ui/avatar';
import type { Conversation } from '../types/chat';
import { updateConversationName } from '../services/chatService';
import { getInitials } from '../lib/chatUtils';
import axios from 'axios';

interface ContactSidebarProps {
    conversation: Conversation;
    onClose: () => void;
    onConversationUpdated?: (updated: Conversation) => void;
}

const ContactSidebar: React.FC<ContactSidebarProps> = ({ conversation, onClose, onConversationUpdated }) => {
    const [customName, setCustomName] = useState(conversation.customer_name);
    const [isEditing, setIsEditing] = useState(false);
    const [isBlocked, setIsBlocked] = useState(conversation.status === 'BLOCKED');
    const [loading, setLoading] = useState(false);
    const [contactDetails, setContactDetails] = useState<any>(null);

    useEffect(() => {
        setCustomName(conversation.customer_name);
        setIsBlocked(conversation.status === 'BLOCKED');

        // Fetch deep contact details from our Go backend
        const fetchContact = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(`/api/v1/contacts/${conversation.customer_wa_id}`, {
                    params: { phone_number_id: conversation.wa_channel_id },
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (response.data) {
                    setContactDetails(response.data);
                    setIsBlocked(response.data.is_blocked);
                }
            } catch (error) {
                console.error("Gagal mengambil detail kontak:", error);
            }
        };

        if (conversation.customer_wa_id) {
            fetchContact();
        }
    }, [conversation]);

    const handleSaveName = async () => {
        if (!customName.trim()) return;
        setLoading(true);
        try {
            const success = await updateConversationName(conversation.id, customName.trim());
            if (success) {
                setIsEditing(false);
                const updated = { ...conversation, customer_name: customName.trim() };
                if (onConversationUpdated) onConversationUpdated(updated);
            }
        } catch (error) {
            console.error("Gagal menyimpan nama:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleBlock = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const action = isBlocked ? 'unblock' : 'block';
            const response = await axios.post(`/api/v1/contacts/${conversation.customer_wa_id}/${action}`, null, {
                params: { phone_number_id: conversation.wa_channel_id },
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data) {
                const newBlockedState = !isBlocked;
                setIsBlocked(newBlockedState);
                const updated = { 
                    ...conversation, 
                    status: newBlockedState ? 'BLOCKED' : 'ACTIVE' 
                };
                if (onConversationUpdated) onConversationUpdated(updated);
            }
        } catch (error) {
            console.error(`Gagal ${isBlocked ? 'membuka blokir' : 'memblokir'} kontak:`, error);
        } finally {
            setLoading(false);
        }
    };

    const formatLastActive = (dateStr?: string) => {
        if (!dateStr) return 'Tidak ada data';
        const date = new Date(dateStr);
        return date.toLocaleString('id-ID', {
            dateStyle: 'medium',
            timeStyle: 'short'
        });
    };

    // Calculate remaining service window time
    const getServiceWindowStatus = () => {
        const lastActive = contactDetails?.last_customer_message_at;
        if (!lastActive) return { text: 'Jendela Chat Tertutup', color: 'text-red-500 bg-red-50 border-red-100' };

        const diffMs = Date.now() - new Date(lastActive).getTime();
        const limitMs = 24 * 60 * 60 * 1000;

        if (diffMs < limitMs) {
            const remainingHours = Math.floor((limitMs - diffMs) / (60 * 60 * 1000));
            return {
                text: `Jendela Terbuka (~${remainingHours} jam lagi)`,
                color: 'text-green-600 bg-green-50 border-green-100'
            };
        }

        return { text: 'Jendela Chat Tertutup (>24 jam)', color: 'text-red-500 bg-red-50 border-red-100' };
    };

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
                        <p className="text-xs text-slate-500 font-medium">+{conversation.customer_wa_id}</p>
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
                        <p className="text-xs font-semibold text-slate-700">{conversation.app_name} ({conversation.display_phone_number})</p>
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

                {/* Danger Actions Section */}
                <div className="space-y-2 pt-4">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 px-1">Kontrol Kontak</span>
                    <div className="flex flex-col gap-2">
                        <Button 
                            onClick={handleToggleBlock}
                            disabled={loading}
                            variant="outline"
                            className={`w-full h-10 text-xs font-bold rounded-xl border flex items-center justify-center gap-2 shadow-sm transition-all ${isBlocked ? 'text-green-600 border-green-100 hover:bg-green-50/50' : 'text-red-500 border-red-100 hover:bg-red-50/50'}`}
                        >
                            {isBlocked ? (
                                <>
                                    <UserCheck className="w-4 h-4" />
                                    <span>Buka Blokir Kontak</span>
                                </>
                            ) : (
                                <>
                                    <UserMinus className="w-4 h-4" />
                                    <span>Blokir Kontak</span>
                                </>
                            )}
                        </Button>
                        
                        {isBlocked && (
                            <div className="p-3 bg-amber-50 border border-amber-100 text-amber-700 rounded-xl text-[10px] leading-relaxed flex gap-2">
                                <ShieldAlert className="w-4 h-4 shrink-0 text-amber-500 mt-0.5" />
                                <span>Kontak ini diblokir. Agen tidak akan dapat membalas atau mengirimkan template ke nomor ini.</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContactSidebar;
