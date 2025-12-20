import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
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
}

export const Dropdown: React.FC<DropdownProps> = ({
    options,
    value,
    onChange,
    placeholder = 'Chọn...',
    disabled = false,
    icon,
    className = '',
    minWidth = 'min-w-[120px]'
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const { theme } = useThemeStyles();
    const dropdownRef = useRef<HTMLDivElement>(null);

    const {
        cardBgClass,
        borderClass,
        textSecondaryClass
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
                className={`flex items-center gap-2 px-3 py-2 ${cardBgClass} border ${borderClass} rounded-lg text-sm ${textSecondaryClass} hover:border-primary/50 focus:outline-none focus:border-primary disabled:opacity-50 transition-colors ${minWidth}`}
            >
                {icon && <span className="text-slate-500">{icon}</span>}
                <span className="flex-1 text-left">
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown
                    size={16}
                    className={`text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            {isOpen && (
                <div className={`absolute top-full left-0 right-0 mt-1 ${cardBgClass} border ${borderClass} rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto`}>
                    {options.map((option) => (
                        <button
                            type="button"
                            key={option.value}
                            onClick={() => handleSelect(option.value)}
                            className={`w-full px-3 py-2.5 text-left text-sm transition-colors hover:bg-primary/10 ${value === option.value ? `bg-primary/10 text-primary font-medium` : textSecondaryClass
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                {option.icon && <span className="text-current">{option.icon}</span>}
                                <span className="flex-1">{option.label}</span>
                                {value === option.value && <Check size={14} className="text-primary" />}
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};