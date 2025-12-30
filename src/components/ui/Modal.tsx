import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useThemeStyles } from '../../hooks/useThemeStyles';

interface ModalProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

// Global counter để theo dõi số lượng modals đang mở
let openModalCount = 0;

export const Modal: React.FC<ModalProps> = ({ title, isOpen, onClose, children, footer }) => {
  const {
    theme,
    bgClass,
    borderClass,
    textPrimaryClass: textClass,
    textSecondaryClass,
    textMutedClass,
    hoverBgClass
  } = useThemeStyles();

  useEffect(() => {
    if (!isOpen) return;

    openModalCount++;
    document.body.style.overflow = 'hidden';

    return () => {
      openModalCount--;
      if (openModalCount === 0) {
        document.body.style.overflow = '';
      }
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 p-0 md:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div 
            className={`${bgClass} w-full md:max-w-md md:rounded-xl rounded-t-xl max-h-[85vh] flex flex-col border ${borderClass}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.2 }}
          >
        {/* Tiêu đề */}
        <div className={`px-4 py-3 border-b ${borderClass} flex justify-between items-center flex-shrink-0`}>
          <h3 className={`text-base font-semibold ${textClass}`}>{title}</h3>
          <button
            onClick={onClose}
            className={`p-1.5 ${textMutedClass} hover:${textSecondaryClass} rounded-md ${hoverBgClass} transition-colors`}
          >
            <X size={18} />
          </button>
        </div>

        {/* Nội dung */}
        <div className="overflow-y-auto p-4 flex-1">
          {children}
        </div>

        {/* Chân trang */}
        {footer && (
          <div className={`px-4 py-3 border-t ${borderClass} flex-shrink-0`}>
            {footer}
          </div>
        )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
