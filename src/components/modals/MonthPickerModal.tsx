import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import Button from '../ui/Button';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { useThemeStore } from '../../stores';

interface MonthPickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedDate: Date;
    onChange: (date: Date) => void;
}

/**
 * Hộp thoại chọn tháng và năm trực quan
 */
export const MonthPickerModal: React.FC<MonthPickerModalProps> = ({
    isOpen,
    onClose,
    selectedDate,
    onChange
}) => {
    const theme = useThemeStore(state => state.theme);

    const [tempYear, setTempYear] = useState<number>(selectedDate.getFullYear());

    useEffect(() => {
        if (isOpen) {
            setTempYear(selectedDate.getFullYear());
        }
    }, [isOpen, selectedDate]);

    const handleSelectMonth = (monthIndex: number) => {
        onChange(new Date(tempYear, monthIndex, 1));
        onClose();
    };

    const handleGoToCurrentMonth = () => {
        const now = new Date();
        onChange(new Date(now.getFullYear(), now.getMonth(), 1));
        onClose();
    };

    const months = [
        'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4',
        'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8',
        'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
    ];

    return (
        <Modal
            title="Chọn thời gian hiển thị"
            isOpen={isOpen}
            onClose={onClose}
            footer={
                <div className="flex gap-2">
                    <Button
                        variant="secondary"
                        onClick={onClose}
                        className="flex-1"
                    >
                        Đóng
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleGoToCurrentMonth}
                        className="flex-1 gap-1.5"
                    >
                        <Calendar size={16} className="text-white" />
                        Tháng hiện tại
                    </Button>
                </div>
            }
        >
            <div className="space-y-6 py-2">
                {/* Chọn năm */}
                <div className="flex justify-between items-center px-4 py-2 bg-slate-500/5 rounded-lg border border-dashed border-slate-500/10">
                    <button
                        onClick={() => setTempYear(prev => prev - 1)}
                        className={`p-2 rounded-lg hover:bg-[var(--border-color)] transition-colors`}
                    >
                        <ChevronLeft size={18} className="text-[var(--text-secondary)]" />
                    </button>
                    <span className={`text-base font-bold text-[var(--text-primary)]`}>Năm {tempYear}</span>
                    <button
                        onClick={() => setTempYear(prev => prev + 1)}
                        className={`p-2 rounded-lg hover:bg-[var(--border-color)] transition-colors`}
                    >
                        <ChevronRight size={18} className="text-[var(--text-secondary)]" />
                    </button>
                </div>

                {/* Chọn tháng */}
                <div className="grid grid-cols-3 gap-2.5">
                    {months.map((monthLabel, index) => {
                        const isSelected = selectedDate.getMonth() === index && selectedDate.getFullYear() === tempYear;
                        const isCurrentMonth = new Date().getMonth() === index && new Date().getFullYear() === tempYear;

                        return (
                            <button
                                key={index}
                                onClick={() => handleSelectMonth(index)}
                                className={`
                                    py-3 rounded-lg text-xs font-semibold transition-all border
                                    ${isSelected
                                        ? 'bg-primary text-white border-primary shadow-sm shadow-primary/20 scale-[0.98]'
                                        : `
                                            ${theme === 'dark' 
                                                ? 'bg-slate-800/40 hover:bg-slate-800 border-slate-700/50 text-slate-300' 
                                                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'
                                            }
                                            ${isCurrentMonth ? 'border-primary/45 text-primary bg-primary/5' : ''}
                                        `
                                    }
                                `}
                            >
                                {monthLabel}
                            </button>
                        );
                    })}
                </div>
            </div>
        </Modal>
    );
};
