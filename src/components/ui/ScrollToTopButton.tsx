import React, { useState, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp } from 'lucide-react';
import { useThemeStyles } from '../../hooks/useThemeStyles';

const ScrollToTopButton: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);
    const { cardBgClass, borderClass, textPrimaryClass } = useThemeStyles();

    useEffect(() => {
        const toggleVisibility = () => {
            if (window.pageYOffset > 400) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener('scroll', toggleVisibility);
        return () => window.removeEventListener('scroll', toggleVisibility);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.button
                    initial={{ opacity: 0, scale: 0.5, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.5, y: 20 }}
                    onClick={scrollToTop}
                    className={`fixed bottom-24 right-6 md:bottom-8 md:right-8 z-40 p-3 rounded-full shadow-2xl border border-primary/20 transition-all active:scale-90 bg-primary text-white hover:bg-primary/90 hover:shadow-primary/40`}
                    title="Cuộn lên đầu trang"
                >
                    <ArrowUp size={24} />
                </motion.button>
            )}
        </AnimatePresence>
    );
};

export default memo(ScrollToTopButton);
