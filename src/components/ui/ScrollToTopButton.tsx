import React, { useState, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp } from 'lucide-react';

interface ScrollToTopButtonProps {
    activeTab: string;
}

const ScrollToTopButton: React.FC<ScrollToTopButtonProps> = ({ activeTab }) => {
    const [isVisible, setIsVisible] = useState(false);
    const enabledTabs = ['dashboard', 'employees', 'payroll', 'locations'];

    useEffect(() => {
        const toggleVisibility = () => {
            if (window.scrollY > 400 && enabledTabs.includes(activeTab)) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        if (!enabledTabs.includes(activeTab)) {
            setIsVisible(false);
        } else {
            toggleVisibility();
        }

        window.addEventListener('scroll', toggleVisibility);
        return () => window.removeEventListener('scroll', toggleVisibility);
    }, [activeTab]);

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
