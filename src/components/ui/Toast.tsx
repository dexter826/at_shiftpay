import React, { useEffect, useState, createContext, useContext, useCallback } from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

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
    const { theme } = useTheme();

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
        success: theme === 'dark'
            ? 'bg-primary/10 border-primary/30'
            : 'bg-primary/20 border-primary/40 shadow-lg',
        error: theme === 'dark'
            ? 'bg-red-500/10 border-red-500/30'
            : 'bg-red-500/20 border-red-500/40 shadow-lg',
        warning: theme === 'dark'
            ? 'bg-amber-500/10 border-amber-500/30'
            : 'bg-amber-500/20 border-amber-500/40 shadow-lg'
    };

    const textColor = theme === 'dark' ? 'text-slate-200' : 'text-slate-800';
    const buttonColor = theme === 'dark'
        ? 'text-slate-500 hover:text-slate-300'
        : 'text-slate-600 hover:text-slate-800';

    return (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${bgColors[toast.type]} backdrop-blur-sm animate-slide-in ${theme === 'light' ? 'bg-white/90' : ''}`}>
            {icons[toast.type]}
            <span className={`text-sm ${textColor} flex-1`}>{toast.message}</span>
            <button onClick={() => onRemove(toast.id)} className={buttonColor}>
                <X size={16} />
            </button>
        </div>
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
            <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-[90%] max-w-sm">
                {toasts.map(toast => (
                    <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
                ))}
            </div>
        </ToastContext.Provider>
    );
};
