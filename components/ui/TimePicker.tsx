import React, { useState, useRef, useEffect } from 'react';
import { Clock, ChevronUp, ChevronDown } from 'lucide-react';

interface TimePickerProps {
    value: string; // HH:mm format
    onChange: (value: string) => void;
    className?: string;
}

export const TimePicker: React.FC<TimePickerProps> = ({ value, onChange, className = '' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Parse value
    const [hours, minutes] = value ? value.split(':').map(Number) : [7, 30];

    const formatNumber = (n: number) => n.toString().padStart(2, '0');

    const updateTime = (newHours: number, newMinutes: number) => {
        // Clamp values
        if (newHours < 0) newHours = 23;
        if (newHours > 23) newHours = 0;
        if (newMinutes < 0) newMinutes = 55;
        if (newMinutes > 59) newMinutes = 0;

        onChange(`${formatNumber(newHours)}:${formatNumber(newMinutes)}`);
    };

    const incrementHours = () => updateTime(hours + 1, minutes);
    const decrementHours = () => updateTime(hours - 1, minutes);
    const incrementMinutes = () => updateTime(hours, minutes + 5);
    const decrementMinutes = () => updateTime(hours, minutes - 5);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            {/* Display button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-slate-600 flex items-center justify-between"
            >
                <span className="flex items-center gap-2">
                    <Clock size={14} className="text-slate-500" />
                    {formatNumber(hours)}:{formatNumber(minutes)}
                </span>
                <ChevronDown size={14} className={`text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-lg p-3 z-50 shadow-lg">
                    <div className="flex items-center justify-center gap-4">
                        {/* Hours */}
                        <div className="flex flex-col items-center">
                            <button
                                type="button"
                                onClick={incrementHours}
                                className="p-1 text-slate-400 hover:text-emerald-500 transition-colors"
                            >
                                <ChevronUp size={18} />
                            </button>
                            <div className="w-12 h-10 flex items-center justify-center bg-slate-700 rounded-lg text-lg font-medium text-slate-200">
                                {formatNumber(hours)}
                            </div>
                            <button
                                type="button"
                                onClick={decrementHours}
                                className="p-1 text-slate-400 hover:text-emerald-500 transition-colors"
                            >
                                <ChevronDown size={18} />
                            </button>
                            <span className="text-[10px] text-slate-500 mt-1">Giờ</span>
                        </div>

                        <span className="text-xl text-slate-500 font-medium">:</span>

                        {/* Minutes */}
                        <div className="flex flex-col items-center">
                            <button
                                type="button"
                                onClick={incrementMinutes}
                                className="p-1 text-slate-400 hover:text-emerald-500 transition-colors"
                            >
                                <ChevronUp size={18} />
                            </button>
                            <div className="w-12 h-10 flex items-center justify-center bg-slate-700 rounded-lg text-lg font-medium text-slate-200">
                                {formatNumber(minutes)}
                            </div>
                            <button
                                type="button"
                                onClick={decrementMinutes}
                                className="p-1 text-slate-400 hover:text-emerald-500 transition-colors"
                            >
                                <ChevronDown size={18} />
                            </button>
                            <span className="text-[10px] text-slate-500 mt-1">Phút</span>
                        </div>
                    </div>

                    {/* Quick select */}
                    <div className="flex gap-2 mt-3 pt-3 border-t border-slate-700">
                        <button
                            type="button"
                            onClick={() => { onChange('07:30'); setIsOpen(false); }}
                            className="flex-1 py-1.5 text-xs bg-orange-500/10 text-orange-500 rounded hover:bg-orange-500/20 transition-colors"
                        >
                            7:30
                        </button>
                        <button
                            type="button"
                            onClick={() => { onChange('13:30'); setIsOpen(false); }}
                            className="flex-1 py-1.5 text-xs bg-emerald-500/10 text-emerald-500 rounded hover:bg-emerald-500/20 transition-colors"
                        >
                            13:30
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
