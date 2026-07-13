import { getPhoneNumbers } from "@/services/chatService";
import { PhoneNumber } from "@/types/chat";
import { useEffect, useState } from "react";

interface PhoneNumberProps {
    
}

export const usePhoneNumber = () => {
      const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([]); 
      const [totalUnread, setTotalUnread] = useState(0);


    const fetchPhoneNumbers = async () => {
        try {
            const phoneNumbers = await getPhoneNumbers();
            setPhoneNumbers(phoneNumbers.data);

        } catch (error) { console.error("Initial fetch failed", error); }
    };
    
    useEffect(() => {
        phoneNumbers.reduce((acc, app) => acc + (app.unread_count || 0), 0);
        setTotalUnread(totalUnread);
    }, [phoneNumbers]);

    return {
        phoneNumbers,
        fetchPhoneNumbers,
        totalUnread
    }
}