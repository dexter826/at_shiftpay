import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import Button from '../ui/Button';
import { FileDown, CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { useThemeStyles } from '../../hooks/useThemeStyles';

interface ExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onExport: (month: number, year: number, onlyDebt: boolean) => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, onExport }) => {
    const {
        theme,
        textPrimaryClass,
        textSecondaryClass,
        borderClass,
        hoverBgClass
    } = useThemeStyles();
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [onlyDebt, setOnlyDebt] = useState(false);

    const handleExport = () => {
        onExport(selectedMonth, selectedYear, onlyDebt);
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
                        variant="primary"
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
                <div className={`flex justify-between items-center px-2 py-2 ${isAllSelected ? 'opacity-50 pointer-events-none' : ''}`}>
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

                {/* Chỉ xuất công nợ */}
                <div
                    onClick={() => setOnlyDebt(!onlyDebt)}
                    className={`
                        flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all
                        ${onlyDebt
                            ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                            : `${borderClass} ${theme === 'dark' ? 'bg-slate-800/30' : 'bg-slate-50'}`
                        }
                    `}
                >
                    <div className="flex items-center gap-3">
                        <div className={`
                            p-2 rounded-lg border transition-colors
                            ${onlyDebt
                                ? 'bg-primary/10 border-primary/30 text-primary'
                                : `${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} text-slate-400`
                            }
                        `}>
                            <CalendarDays size={18} />
                        </div>
                        <div>
                            <p className={`text-sm font-bold ${onlyDebt ? 'text-primary' : textPrimaryClass}`}>Chỉ xuất sự kiện còn nợ</p>
                            <p className="text-xs text-slate-500">Lọc các sự kiện chưa thanh toán hết</p>
                        </div>
                    </div>
                    <div className={`
                        w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all
                        ${onlyDebt ? 'border-primary bg-primary' : 'border-slate-300'}
                    `}>
                        {onlyDebt && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
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
                        Tất cả thời gian
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
