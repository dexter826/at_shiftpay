import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [showNotification, setShowNotification] = useState(false);

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            setShowNotification(true);
            setTimeout(() => setShowNotification(false), 3000);
        };

        const handleOffline = () => {
            setIsOnline(false);
            setShowNotification(true);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    if (!showNotification && isOnline) return null;

    return (
        <div
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2 text-sm font-medium transition-all ${isOnline
                    ? 'bg-primary text-white animate-fade-in'
                    : 'bg-slate-800 text-slate-200 border border-slate-700'
                }`}
        >
            {isOnline ? (
                <>
                    <Wifi size={16} />
                    <span>Đã kết nối internet</span>
                </>
            ) : (
                <>
                    <WifiOff size={16} />
                    <span>Không có kết nối - Chế độ offline</span>
                </>
            )}
        </div>
    );
};
