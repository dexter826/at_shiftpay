import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Check, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useThemeStyles } from '../../hooks/useThemeStyles';

export interface DropdownOption {
    value: string;
    label: string;
    icon?: React.ReactNode;
}

interface DropdownProps {
    options: DropdownOption[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    icon?: React.ReactNode;
    className?: string;
    minWidth?: string;
    searchable?: boolean;
    searchPlaceholder?: string;
}

export const Dropdown: React.FC<DropdownProps> = ({
    options,
    value,
    onChange,
    placeholder = 'Chọn...',
    disabled = false,
    icon,
    className = '',
    minWidth = 'min-w-[120px]',
    searchable = false,
    searchPlaceholder = 'Tìm kiếm...'
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const {
        cardBgClass,
        borderClass,
        textSecondaryClass,
        inputBgClass,
        inputBorderClass,
        textMutedClass
    } = useThemeStyles();

    // Đóng khi click ra ngoài
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    // Focus vào ô tìm kiếm khi mở
    useEffect(() => {
        if (isOpen && searchable && searchInputRef.current) {
            setTimeout(() => {
                searchInputRef.current?.focus();
            }, 100);
        }
        if (!isOpen) {
            setSearchTerm('');
        }
    }, [isOpen, searchable]);

    // Đóng khi nhấn Esc
    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen]);

    const filteredOptions = useMemo(() => {
        if (!searchable || !searchTerm) return options;
        return options.filter(option =>
            option.label.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [options, searchTerm, searchable]);

    const selectedOption = options.find(option => option.value === value);

    const handleSelect = (optionValue: string) => {
        onChange(optionValue);
        setIsOpen(false);
    };

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                disabled={disabled}
                className={`w-full h-full flex items-center gap-2 px-3 py-2 ${cardBgClass} border ${borderClass} rounded-xl text-sm ${textSecondaryClass} hover:border-primary/50 focus:outline-none focus:border-primary disabled:opacity-50 transition-colors ${minWidth}`}
            >
                {icon && <span className={textMutedClass}>{icon}</span>}
                <span className="flex-1 text-left truncate">
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <ChevronDown size={16} className={textMutedClass} />
                </motion.div>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        className={`absolute top-full left-0 right-0 mt-1 ${cardBgClass} border ${borderClass} rounded-lg shadow-lg z-50 flex flex-col overflow-hidden`}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                    >
                        {searchable && (
                            <div className={`p-2 border-b ${borderClass}`}>
                                <div className="relative">
                                    <Search size={14} className={`absolute left-2.5 top-1/2 -translate-y-1/2 ${textMutedClass}`} />
                                    <input
                                        ref={searchInputRef}
                                        type="text"
                                        placeholder={searchPlaceholder}
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className={`w-full pl-8 pr-3 py-1.5 ${inputBgClass} border ${inputBorderClass} rounded-md text-xs ${textSecondaryClass} focus:outline-none focus:border-primary`}
                                    />
                                </div>
                            </div>
                        )}
                        
                        <div className="max-h-60 overflow-y-auto scrollbar-thin">
                            {filteredOptions.length > 0 ? (
                                filteredOptions.map((option) => (
                                    <button
                                        type="button"
                                        key={option.value}
                                        onClick={() => handleSelect(option.value)}
                                        className={`w-full px-3 py-2.5 text-left text-sm transition-colors hover:bg-primary/10 ${value === option.value ? `bg-primary/10 text-primary font-medium` : textSecondaryClass}`}
                                    >
                                        <div className="flex items-center gap-2">
                                            {option.icon && <span className="text-current">{option.icon}</span>}
                                            <span className="flex-1 truncate">{option.label}</span>
                                            {value === option.value && <Check size={14} className="text-primary" />}
                                        </div>
                                    </button>
                                ))
                            ) : (
                                <div className={`px-3 py-4 text-center text-xs ${textMutedClass}`}>
                                    Không tìm thấy kết quả
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};