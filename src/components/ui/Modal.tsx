import React from 'react';
import { X } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface ModalProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ title, isOpen, onClose, children, footer }) => {
  const { theme } = useTheme();

  if (!isOpen) return null;

  const bgClass = theme === 'dark' ? 'bg-slate-900' : 'bg-white';
  const borderClass = theme === 'dark' ? 'border-slate-800' : 'border-slate-200';
  const textClass = theme === 'dark' ? 'text-slate-100' : 'text-slate-800';
  const textMutedClass = theme === 'dark' ? 'text-slate-400' : 'text-slate-500';
  const hoverBgClass = theme === 'dark' ? 'hover:bg-slate-800' : 'hover:bg-slate-100';

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 p-0 md:p-4">
      <div className={`${bgClass} w-full md:max-w-md md:rounded-xl rounded-t-xl max-h-[85vh] flex flex-col border ${borderClass}`}>
        {/* Tiêu đề */}
        <div className={`px-4 py-3 border-b ${borderClass} flex justify-between items-center flex-shrink-0`}>
          <h3 className={`text-base font-semibold ${textClass}`}>{title}</h3>
          <button
            onClick={onClose}
            className={`p-1.5 ${textMutedClass} hover:${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'} rounded-md ${hoverBgClass} transition-colors`}
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
      </div>
    </div>
  );
};
