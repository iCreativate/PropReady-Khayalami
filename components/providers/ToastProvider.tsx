'use client';

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextValue {
    toast: (message: string, type?: ToastType) => void;
    success: (message: string) => void;
    error: (message: string) => void;
    info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const dismiss = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const addToast = useCallback(
        (message: string, type: ToastType = 'info') => {
            const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
            setToasts((prev) => [...prev, { id, message, type }]);
            setTimeout(() => dismiss(id), 5000);
        },
        [dismiss]
    );

    const value: ToastContextValue = {
        toast: addToast,
        success: (message) => addToast(message, 'success'),
        error: (message) => addToast(message, 'error'),
        info: (message) => addToast(message, 'info'),
    };

    return (
        <ToastContext.Provider value={value}>
            {children}
            <div
                className="fixed bottom-4 right-4 z-[200] flex flex-col gap-2 max-w-sm w-full pointer-events-none"
                aria-live="polite"
            >
                {toasts.map((t) => (
                    <div
                        key={t.id}
                        className={cn(
                            'pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg backdrop-blur-md animate-in slide-in-from-right',
                            t.type === 'success' && 'bg-white border-green-200 text-charcoal',
                            t.type === 'error' && 'bg-white border-red-200 text-charcoal',
                            t.type === 'info' && 'bg-white border-gold/30 text-charcoal'
                        )}
                        role="status"
                    >
                        {t.type === 'success' && <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />}
                        {t.type === 'error' && <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />}
                        {t.type === 'info' && <Info className="w-5 h-5 text-gold shrink-0 mt-0.5" />}
                        <p className="text-sm flex-1">{t.message}</p>
                        <button
                            type="button"
                            onClick={() => dismiss(t.id)}
                            className="text-charcoal/40 hover:text-charcoal shrink-0"
                            aria-label="Dismiss notification"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return ctx;
}
