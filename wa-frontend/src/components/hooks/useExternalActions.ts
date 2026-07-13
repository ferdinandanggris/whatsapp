import { Bubble, PhoneNumber } from "@/types/chat";
import { useEffect, useState } from "react";

interface UseExternalActionsProps {
    totalUnread: number
}

export const useExternalActions  = ({
    totalUnread
} : UseExternalActionsProps
) => {
     useEffect(() => {
        if ((window as any).chrome?.webview) {
            (window as any).chrome.webview.postMessage({
                type: 'SET_BADGE',
                count: totalUnread
            });
        }
    }, [totalUnread]);


      // Fungsi Copy Gambar
        const handleCopy = async () => {
            // try {
            //     // Bridge to WinForms for desktop notification
            //     if (!contextMenuImage.chatMsg?.file_path) return;
            //     if ((window as any).chrome?.webview) {
            //         (window as any).chrome.webview.postMessage({
            //             type: 'COPY_IMAGE',
            //             url: contextMenuImage.chatMsg?.file_path,
            //         });
            //     } else {
            //         // Fallback jika dibuka di browser biasa (Chrome/Edge biasa)
            //         console.log("Tidak berada di WinForms. Fallback copy URL...");
            //         navigator.clipboard.writeText(contextMenuImage.chatMsg?.file_path);
            //     }
            // } catch (error) {
            //     console.error('Gagal menyalin gambar. Menyalin URL sebagai gantinya.', error);
            //     navigator.clipboard.writeText(contextMenuImage.chatMsg?.file_path || ''); // Fallback copy URL
            // }
        };
    
        // Fungsi Download Gambar
        const handleDownload = async () => {
            // try {
            //     // Bridge to WinForms for desktop notification
            //     if (!contextMenuImage.chatMsg?.file_path) return;
            //     if ((window as any).chrome?.webview) {
            //         (window as any).chrome.webview.postMessage({
            //             type: 'SAVE_IMAGE',
            //             url: contextMenuImage.chatMsg?.file_path,
            //         });
            //     } else {
            //         // Fallback jika dibuka di browser biasa (Chrome/Edge biasa)
            //         console.log("Tidak berada di WinForms. Fallback copy URL...");
            //         navigator.clipboard.writeText(contextMenuImage.chatMsg?.file_path);
            //     }
            // } catch (error) {
            //     console.error('Gagal menyalin gambar. Menyalin URL sebagai gantinya.', error);
            //     navigator.clipboard.writeText(contextMenuImage.chatMsg?.file_path || ''); // Fallback copy URL
            // }
    
        };
    
        // Media Handlers
        const handleResendMessage = async (msg: Bubble) => {
            // if (!msg) return;
    
            // // Populate Input Text
            // setInputText(msg.message_text || '');
    
            // // Handle Media Resending
            // if (msg.file_path && ['image', 'video', 'audio', 'document'].includes(msg.message_type)) {
            //     if ((window as any).chrome?.webview) {
            //         // Use WinForms bridge to bypass CORS/SSL issues
            //         (window as any).chrome.webview.postMessage({
            //             type: 'FETCH_MEDIA_FOR_RESEND',
            //             url: msg.file_path,
            //             message_type: msg.message_type,
            //             file_name: msg.file_name || 'file'
            //         });
            //     } else {
            //         // Fallback for browser (might fail due to CORS)
            //         try {
            //             const response = await fetch(msg.file_path);
            //             const blob = await response.blob();
            //             const fileName = msg.file_name || msg.file_path.split('/').pop() || 'file';
            //             const file = new File([blob], fileName, { type: msg.file_type || blob.type });
    
            //             const previewUrl = URL.createObjectURL(file);
            //             setPendingMedia({
            //                 file,
            //                 previewUrl,
            //                 type: msg.message_type as any
            //             });  
            //         } catch (error) {
            //             console.error("Failed to fetch media for resend:", error);
            //         }
            //     }
            // }
        };


         return { totalUnread, handleCopy, handleDownload, handleResendMessage };
}

   