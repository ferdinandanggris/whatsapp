import { GetContact, updateConversationName } from "@/services/chatService";
import { Conversation } from "@/types/chat";
import { Contact } from "@/types/chat";
import { useEffect, useState } from "react";

interface UseContactProps {
    conversation: Conversation
}


export const useContact = ({
    conversation
}: UseContactProps) =>{
    const [customName, setCustomName] = useState(conversation.custom_name);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [contactDetails, setContactDetails] = useState<Contact>(null);


        useEffect(() => {
            setCustomName(conversation.custom_name);
    
            // Fetch deep contact details from our Go backend
            const fetchContact = async () => {
                try {
                    const response = await GetContact(conversation.wa_id, conversation.phone_number_id);
                    if (response.data) {
                        console.log("Fetched contact details:", response.data);
                        setContactDetails(response.data);
                    }
                } catch (error) {
                    console.error("Gagal mengambil detail kontak:", error);
                }
            };
    
            if (conversation.wa_id) {
                fetchContact();
            }
        }, [conversation]);


        const handleSaveName = async () => {
                if (!customName.trim()) return;
                setLoading(true);
                try {
                    const success = await updateConversationName(conversation.phone_number_id, conversation.wa_id, customName.trim());
                    if (success) {
                        setIsEditing(false);
                        const updated = { ...conversation, customer_name: customName.trim() };
                        // if (onConversationUpdated) onConversationUpdated(updated);
                    }
                } catch (error) {
                    console.error("Gagal menyimpan nama:", error);
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


    return {
        customName,
        setCustomName,
        isEditing,
        setIsEditing,
        loading,
        setLoading,
        contactDetails,
        setContactDetails,
        handleSaveName,
        formatLastActive,
        getServiceWindowStatus
    }

}