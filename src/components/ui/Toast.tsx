import React, { useEffect, useState, createContext, useContext, useCallback } from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type ToastType = 'success' | 'error' | 'warning';

interface Toast {
    id: number;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used within ToastProvider');
    return context;
};

const ToastItem: React.FC<{ toast: Toast; onRemove: (id: number) => void }> = ({ toast, onRemove }) => {
    useEffect(() => {
        const timer = setTimeout(() => onRemove(toast.id), 3000);
        return () => clearTimeout(timer);
    }, [toast.id, onRemove]);

    const icons = {
        success: <CheckCircle size={18} className="text-primary" />,
        error: <XCircle size={18} className="text-red-500" />,
        warning: <AlertCircle size={18} className="text-amber-500" />
    };

    const bgColors = {
        success: 'bg-primary/10 border-primary/30',
        error: 'bg-red-500/10 border-red-500/30',
        warning: 'bg-amber-500/10 border-amber-500/30'
    };

    return (
        <motion.div 
            className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${bgColors[toast.type]} shadow-lg bg-[var(--bg-card)]/90`}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            layout
        >
            {icons[toast.type]}
            <span className={`text-sm text-[var(--text-primary)] flex-1`}>{toast.message}</span>
            <button 
                onClick={() => onRemove(toast.id)} 
                className={`text-[var(--text-muted)] hover:text-primary transition-colors`}
            >
                <X size={16} />
            </button>
        </motion.div>
    );
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
    }, []);

    const removeToast = useCallback((id: number) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-[90%] max-w-sm">
                <AnimatePresence mode="popLayout">
                    {toasts.map(toast => (
                        <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
};
