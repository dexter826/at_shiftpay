import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

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
    const { theme } = useTheme();
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Theme classes
    const cardBgClass = theme === 'dark' ? 'bg-slate-900' : 'bg-white';
    const borderClass = theme === 'dark' ? 'border-slate-800' : 'border-slate-200';
    const textSecondaryClass = theme === 'dark' ? 'text-slate-200' : 'text-slate-700';

    // Close dropdown when clicking outside
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

    // Close dropdown on escape key
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
                onClick={() => setIsOpen(!isOpen)}
                disabled={disabled}
                className={`flex items-center gap-2 px-3 py-2 ${cardBgClass} border ${borderClass} rounded-lg text-sm ${textSecondaryClass} hover:border-[#ecb52d]/50 focus:outline-none focus:border-[#ecb52d] disabled:opacity-50 transition-colors ${minWidth}`}
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
                <div className={`absolute top-full left-0 right-0 mt-1 ${cardBgClass} border ${borderClass} rounded-lg shadow-lg z-50 overflow-hidden`}>
                    {options.map((option) => (
                        <button
                            key={option.value}
                            onClick={() => handleSelect(option.value)}
                            className={`w-full px-3 py-2.5 text-left text-sm transition-colors hover:bg-[#ecb52d]/10 ${value === option.value ? `bg-[#ecb52d]/10 text-[#ecb52d] font-medium` : textSecondaryClass
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                {option.icon && <span className="text-current">{option.icon}</span>}
                                <span className="flex-1">{option.label}</span>
                                {value === option.value && <Check size={14} className="text-[#ecb52d]" />}
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};