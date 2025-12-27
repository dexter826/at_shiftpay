import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import Button from '../ui/Button';
import { FileDown, CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface ExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onExport: (month: number, year: number) => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, onExport }) => {
    const { theme } = useTheme();
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

    const textPrimaryClass = theme === 'dark' ? 'text-slate-100' : 'text-slate-800';
    const textSecondaryClass = theme === 'dark' ? 'text-slate-300' : 'text-slate-600';
    const borderClass = theme === 'dark' ? 'border-slate-800' : 'border-slate-200';
    const hoverBgClass = theme === 'dark' ? 'hover:bg-slate-800' : 'hover:bg-slate-100';

    const handleExport = () => {
        onExport(selectedMonth, selectedYear);
    };

    const isAllSelected = selectedMonth === 0;

    return (
        <Modal
            title="Xuất báo cáo chi tiết"
            isOpen={isOpen}
            onClose={onClose}
            footer={
                <div className="flex gap-2">
                    <Button
                        variant="secondary"
                        onClick={onClose}
                        className="flex-1"
                    >
                        Hủy
                    </Button>
                    <Button
                        variant="success"
                        onClick={handleExport}
                        className="flex-1"
                    >
                        <FileDown size={16} className="text-white" />
                        Xuất CSV
                    </Button>
                </div>
            }
        >
            <div className="space-y-4">
                <p className={`text-sm ${textSecondaryClass}`}>Chọn thời gian để xuất báo cáo lương và lịch tiệc.</p>

                {/* Chọn năm */}
                <div className="flex justify-between items-center px-2 py-2">
                    <button
                        onClick={() => setSelectedYear(prev => prev - 1)}
                        className={`p-1 rounded-full ${hoverBgClass}`}
                    >
                        <ChevronLeft size={20} className={textSecondaryClass} />
                    </button>
                    <span className={`text-lg font-bold ${textPrimaryClass}`}>Năm {selectedYear}</span>
                    <button
                        onClick={() => setSelectedYear(prev => prev + 1)}
                        className={`p-1 rounded-full ${hoverBgClass}`}
                    >
                        <ChevronRight size={20} className={textSecondaryClass} />
                    </button>
                </div>

                {/* Lưới chọn tháng */}
                <div className="grid grid-cols-3 gap-3">
                    <button
                        onClick={() => setSelectedMonth(0)}
                        className={`
                           col-span-3 py-3 rounded-lg text-sm font-medium transition-colors border
                           ${isAllSelected
                                ? 'bg-primary text-white border-primary'
                                : `
                                 ${theme === 'dark' ? 'bg-slate-800/50 hover:bg-slate-800' : 'bg-slate-50 hover:bg-slate-100'}
                                 ${borderClass} ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}
                              `
                            }
                        `}
                    >
                        Tất cả các tháng trong năm
                    </button>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(month => {
                        const isSelected = selectedMonth === month;
                        const isCurrentMonth = new Date().getMonth() + 1 === month && new Date().getFullYear() === selectedYear;

                        return (
                            <button
                                key={month}
                                onClick={() => setSelectedMonth(month)}
                                className={`
                           py-3 rounded-lg text-sm font-medium transition-colors border
                           ${isSelected
                                        ? 'bg-primary text-white border-primary'
                                        : `
                                 ${theme === 'dark' ? 'bg-slate-800/50 hover:bg-slate-800' : 'bg-slate-50 hover:bg-slate-100'}
                                 ${borderClass} ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}
                                 ${isCurrentMonth ? 'border-primary/50 text-primary' : ''}
                              `
                                    }
                        `}
                            >
                                Tháng {month}
                            </button>
                        );
                    })}
                </div>
            </div>
        </Modal>
    );
};
