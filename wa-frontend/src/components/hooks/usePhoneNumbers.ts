import { getPhoneNumbers } from "@/services/chatService";
import { Conversation, PhoneNumber } from "@/types/chat";
import { useEffect, useState } from "react";

interface PhoneNumberProps {
    conversations : Conversation[]
}

export const usePhoneNumber = ({
    conversations
}: PhoneNumberProps) => {
      const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([]); 
      const [totalUnread, setTotalUnread] = useState(0);


    const fetchPhoneNumbers = async () => {
        try {
            const phoneNumbers = await getPhoneNumbers();
            setPhoneNumbers(phoneNumbers.data);

        } catch (error) { console.error("Initial fetch failed", error); }
    };
    
    useEffect(() => {
        phoneNumbers.map((phone) => {
            const conversationUnreadCount = conversations.filter((c) => c.phone_number_id === phone.id).reduce((acc, c) => acc + (c.unread_count || 0), 0);
            phone.unread_count = conversationUnreadCount;
        })

        const totalUnread = phoneNumbers.reduce((acc, app) => acc + (app.unread_count || 0), 0);
        setTotalUnread(totalUnread);
    }, [phoneNumbers,fetchPhoneNumbers]);

    return {
        phoneNumbers,
        fetchPhoneNumbers,
        totalUnread
    }
}