import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import WifiIcon from '../ui/icons/wifi-icon';
import PlugConnectedIcon from '../ui/icons/plug-connected-icon';
import { motion, AnimatePresence } from 'framer-motion';
import { useThemeStyles } from '../../hooks/useThemeStyles';

export const OfflineIndicator: React.FC = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [showNotification, setShowNotification] = useState(false);
    const { highlightBgClass, textSecondaryClass, borderClass } = useThemeStyles();

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

    return (
        <AnimatePresence>
            {(showNotification || !isOnline) && (
                <motion.div
                    className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2 text-sm font-medium ${isOnline
                            ? 'bg-primary text-white'
                            : `${highlightBgClass} ${textSecondaryClass} border ${borderClass}`
                        }`}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2 }}
                >
                    {isOnline ? (
                        <>
                            <WifiIcon size={16} />
                            <span>Đã kết nối internet</span>
                        </>
                    ) : (
                        <>
                            <PlugConnectedIcon size={16} />
                            <span>Không có kết nối - Chế độ offline</span>
                        </>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
};
