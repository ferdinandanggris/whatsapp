import { PhoneNumber } from "@/types/chat";
import { useState } from "react";

interface UseGlobalProps {
    fetchConversations: (bool) => Promise<void>;
    fetchPhoneNumbers: () => Promise<void>;
    setIsRefreshing: (isRefreshing: boolean) => void;
}

export const useGlobal = ({
    fetchConversations,
    fetchPhoneNumbers,
    setIsRefreshing
} : UseGlobalProps

) => {
    

    const handleGlobalRefresh = async () => {
        setIsRefreshing(true);
        try {
            await fetchPhoneNumbers();
            await fetchConversations(true);
        } finally { setTimeout(() => setIsRefreshing(false), 500); }
    };

    return {
        handleGlobalRefresh
    }
}

 