import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const OfflineIndicator: React.FC = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [showOnline, setShowOnline] = useState(false);

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            setShowOnline(true);
            setTimeout(() => setShowOnline(false), 3000);
        };

        const handleOffline = () => {
            setIsOnline(false);
            setShowOnline(true);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const show = !isOnline || showOnline;

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    className={`fixed top-0 left-0 right-0 z-50 pt-safe ${
                        isOnline ? 'bg-emerald-600' : 'bg-red-600'
                    }`}
                    initial={{ y: -40 }}
                    animate={{ y: 0 }}
                    exit={{ y: -40 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                >
                    <div className="flex items-center justify-center gap-2 px-4 py-1.5 text-white text-xs font-medium">
                        {isOnline ? (
                            <>
                                <Wifi size={14} />
                                <span>Đã kết nối lại</span>
                            </>
                        ) : (
                            <>
                                <WifiOff size={14} />
                                <span>Đang ngoại tuyến — dữ liệu có thể chưa được cập nhật</span>
                            </>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
