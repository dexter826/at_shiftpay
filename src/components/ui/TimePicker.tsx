import React, { useState, useRef, useEffect } from 'react';
import { Clock, ChevronUp, ChevronDown } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface TimePickerProps {
    value: string; // Định dạng HH:mm
    onChange: (value: string) => void;
    className?: string;
}

export const TimePicker: React.FC<TimePickerProps> = ({ value, onChange, className = '' }) => {
    const { theme } = useTheme();
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Phân tích giá trị
    const [hours, minutes] = value ? value.split(':').map(Number) : [7, 30];

    const formatNumber = (n: number) => n.toString().padStart(2, '0');

    const updateTime = (newHours: number, newMinutes: number) => {
        // Giới hạn giá trị
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

    // Đóng khi click ngoài
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
            {/* Nút hiển thị */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full p-2.5 border rounded-lg text-sm focus:outline-none flex items-center justify-between ${theme === 'dark'
                    ? 'bg-slate-800 border-slate-700 text-slate-200 focus:border-slate-600'
                    : 'bg-white border-slate-300 text-slate-700 focus:border-slate-400'
                    }`}
            >
                <span className="flex items-center gap-2">
                    <Clock size={14} className={theme === 'dark' ? 'text-slate-500' : 'text-slate-400'} />
                    {formatNumber(hours)}:{formatNumber(minutes)}
                </span>
                <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''} ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`} />
            </button>

            {/* Menu thả xuống */}
            {isOpen && (
                <div className={`absolute top-full left-0 right-0 mt-1 border rounded-lg p-3 z-50 shadow-lg ${theme === 'dark'
                    ? 'bg-slate-800 border-slate-700'
                    : 'bg-white border-slate-200 shadow-xl'
                    }`}>
                    <div className="flex items-center justify-center gap-4">
                        {/* Giờ */}
                        <div className="flex flex-col items-center">
                            <button
                                type="button"
                                onClick={incrementHours}
                                className={`p-1 transition-colors ${theme === 'dark' ? 'text-slate-400 hover:text-primary' : 'text-slate-500 hover:text-primary'}`}
                            >
                                <ChevronUp size={18} />
                            </button>
                            <div className={`w-12 h-10 flex items-center justify-center rounded-lg text-lg font-medium ${theme === 'dark'
                                ? 'bg-slate-700 text-slate-200'
                                : 'bg-slate-100 text-slate-800'
                                }`}>
                                {formatNumber(hours)}
                            </div>
                            <button
                                type="button"
                                onClick={decrementHours}
                                className={`p-1 transition-colors ${theme === 'dark' ? 'text-slate-400 hover:text-primary' : 'text-slate-500 hover:text-primary'}`}
                            >
                                <ChevronDown size={18} />
                            </button>
                            <span className={`text-[10px] mt-1 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>Giờ</span>
                        </div>

                        <span className={`text-xl font-medium ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>:</span>

                        {/* Phút */}
                        <div className="flex flex-col items-center">
                            <button
                                type="button"
                                onClick={incrementMinutes}
                                className={`p-1 transition-colors ${theme === 'dark' ? 'text-slate-400 hover:text-primary' : 'text-slate-500 hover:text-primary'}`}
                            >
                                <ChevronUp size={18} />
                            </button>
                            <div className={`w-12 h-10 flex items-center justify-center rounded-lg text-lg font-medium ${theme === 'dark'
                                ? 'bg-slate-700 text-slate-200'
                                : 'bg-slate-100 text-slate-800'
                                }`}>
                                {formatNumber(minutes)}
                            </div>
                            <button
                                type="button"
                                onClick={decrementMinutes}
                                className={`p-1 transition-colors ${theme === 'dark' ? 'text-slate-400 hover:text-primary' : 'text-slate-500 hover:text-primary'}`}
                            >
                                <ChevronDown size={18} />
                            </button>
                            <span className={`text-[10px] mt-1 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>Phút</span>
                        </div>
                    </div>

                    {/* Chọn nhanh */}
                    <div className={`flex gap-2 mt-3 pt-3 border-t ${theme === 'dark' ? 'border-slate-700' : 'border-slate-100'}`}>
                        <button
                            type="button"
                            onClick={() => { onChange('07:30'); setIsOpen(false); }}
                            className="flex-1 py-1.5 text-xs bg-orange-500/10 text-orange-500 rounded hover:bg-orange-500/20 transition-colors border border-transparent"
                        >
                            7:30
                        </button>
                        <button
                            type="button"
                            onClick={() => { onChange('13:30'); setIsOpen(false); }}
                            className="flex-1 py-1.5 text-xs bg-primary/10 text-primary rounded hover:bg-primary/20 transition-colors border border-transparent"
                        >
                            13:30
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
