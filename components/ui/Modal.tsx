import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ title, isOpen, onClose, children, footer }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/70 backdrop-blur-sm p-0 md:p-4 animate-fade-in">
      <div className="bg-slate-800 w-full md:max-w-lg md:rounded-2xl rounded-t-2xl max-h-[90vh] md:max-h-[85vh] flex flex-col shadow-2xl animate-slide-up border border-slate-700">
        {/* Header */}
        <div className="p-3 md:p-4 border-b border-slate-700 flex justify-between items-center sticky top-0 bg-slate-800 md:rounded-t-2xl z-10 flex-shrink-0">
          <h3 className="text-lg md:text-xl font-bold text-slate-100">{title}</h3>
          <button
            onClick={onClose}
            className="p-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-full transition-colors active:scale-95"
          >
            <X size={18} className="md:w-5 md:h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-3 md:p-4 flex-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="p-3 md:p-4 border-t border-slate-700 bg-slate-900 md:rounded-b-2xl flex-shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};