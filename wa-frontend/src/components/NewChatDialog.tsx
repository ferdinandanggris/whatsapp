import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import { Select } from "@/components/ui/select";
import type { PhoneNumber } from "@/types/chat";

interface NewChatDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onStartChat: (waId: string, name: string, phone_number_id: string) => void;
    phoneNumbers: PhoneNumber[];
    defaultPhoneNumberId?: string | null;
}

const NewChatDialog: React.FC<NewChatDialogProps> = ({ open, onOpenChange, onStartChat, phoneNumbers: phoneNumbers, defaultPhoneNumberId }) => {
    const [waId, setWaId] = useState('');
    const [name, setName] = useState('');
    const [selectedPhoneNumberId, setSelectedPhoneNumberId] = useState<string>(defaultPhoneNumberId || (phoneNumbers[0]?.id || ''));

    // Update selected channel when default changes or dialog opens
    React.useEffect(() => {
        if (open && defaultPhoneNumberId) {
            setSelectedPhoneNumberId(defaultPhoneNumberId);
        } else if (open && !selectedPhoneNumberId && phoneNumbers.length > 0) {
            setSelectedPhoneNumberId(phoneNumbers[0].id);
        }
    }, [open, defaultPhoneNumberId, phoneNumbers]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (waId.trim() && selectedPhoneNumberId) {
            onStartChat(waId.trim(), name.trim(), selectedPhoneNumberId);
            setWaId('');
            setName('');
            onOpenChange(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] p-6">
                <DialogHeader className="mb-2 flex flex-row items-center justify-between">
                    <DialogTitle className="text-xl font-bold text-[#111b21]">Start New Chat</DialogTitle>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full h-8 w-8 text-[#54656f] hover:bg-slate-100"
                        onClick={() => onOpenChange(false)}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="py-2">
                    <div className="flex flex-col gap-4">
                        <div className="flex items-end gap-3">
                            <div className="flex-1 space-y-1.5">
                                <label className="text-xs font-medium text-[#54656f] ml-1">WhatsApp Channel / Account</label>
                                <Select
                                    value={selectedPhoneNumberId}
                                    onChange={(e) => setSelectedPhoneNumberId(e.target.value)}
                                    className="h-10 text-sm bg-[#f0f2f5] border-none focus-visible:ring-1 focus-visible:ring-[#00a884]"
                                >
                                    {phoneNumbers
                                        .map(ch => (
                                            <option key={ch.id} value={ch.id}>
                                                {ch.display_name} ({ch.display_phone_number})
                                            </option>
                                        ))}
                                </Select>
                            </div>
                        </div>

                        <div className="flex items-end gap-3">
                            <div className="flex-[1.5] space-y-1.5">
                                <label className="text-xs font-medium text-[#54656f] ml-1">Customer WhatsApp ID</label>
                                <Input
                                    id="waId"
                                    placeholder="628123456789"
                                    className="h-10 text-sm bg-[#f0f2f5] border-none focus-visible:ring-1 focus-visible:ring-[#00a884]"
                                    value={waId}
                                    onChange={(e) => setWaId(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <div className="flex-1 space-y-1.5">
                                <label className="text-xs font-medium text-[#54656f] ml-1">Customer Name (Optional)</label>
                                <Input
                                    id="name"
                                    placeholder="John Doe"
                                    className="h-10 text-sm bg-[#f0f2f5] border-none focus-visible:ring-1 focus-visible:ring-[#00a884]"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>
                            <Button type="submit" className="bg-[#00a884] hover:bg-[#06cf9c] h-10 px-6 text-sm font-bold rounded-lg transition-all shadow-sm shrink-0">
                                Start Chat
                            </Button>
                        </div>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default NewChatDialog;
