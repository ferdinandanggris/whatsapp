import React from 'react';

interface DialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    children: React.ReactNode;
}

export const Dialog: React.FC<DialogProps> = ({ open, children }) => {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative animate-in zoom-in-95 duration-200">
                {children}
            </div>
        </div>
    );
};

export const DialogContent: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className }) => (
    <div className={`bg-white rounded-xl shadow-2xl overflow-hidden ${className}`}>
        {children}
    </div>
);

export const DialogHeader: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className }) => (
    <div className={`p-4 border-b ${className}`}>
        {children}
    </div>
);

export const DialogTitle: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className }) => (
    <h3 className={`text-lg font-bold text-slate-800 ${className}`}>
        {children}
    </h3>
);

export const DialogFooter: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className }) => (
    <div className={`p-4 border-t bg-slate-50 flex justify-end gap-2 ${className}`}>
        {children}
    </div>
);
