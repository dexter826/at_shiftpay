import React, { useMemo } from 'react';
import { Modal } from '../ui/Modal';
import Button from '../ui/Button';
import { Event, Shift, UserSettings } from '../../types';
import { formatDate, formatCurrency } from '../../constants';
import { useThemeStyles } from '../../hooks/useThemeStyles';
import {
    MapPin, Edit2, Trash2, Clock, Calendar,
    ThumbsUp, ThumbsDown, StickyNote
} from 'lucide-react';

interface EventDetailModalProps {
    event: Event | null;
    shifts: Shift[];
    isOpen: boolean;
    onClose: () => void;
    onEdit: (event: Event) => void;
    onDelete: (eventId: string) => void;
    settings: UserSettings;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({
    event,
    shifts,
    isOpen,
    onClose,
    onEdit,
    onDelete,
    settings
}) => {
    const { theme, borderClass, textPrimaryClass, textSecondaryClass, textMutedClass } = useThemeStyles();

    const eventShifts = useMemo(() => {
        if (!event) return [];
        return shifts.filter(s => s.eventId === event.id);
    }, [event, shifts]);

    if (!event) return null;

    return (
        <Modal
            title={event.title || "Chi tiết sự kiện"}
            isOpen={isOpen}
            onClose={onClose}
            footer={
                <div className="flex gap-2">
                    <Button
                        variant="secondary"
                        onClick={() => {
                            onEdit(event);
                            onClose();
                        }}
                        className="flex-1"
                    >
                        <Edit2 size={14} />
                        Sửa
                    </Button>
                    <Button
                        variant="danger"
                        onClick={() => {
                            onDelete(event.id);
                            onClose();
                        }}
                        className="flex-1"
                    >
                        <Trash2 size={14} />
                        Xóa
                    </Button>
                </div>
            }
        >
            <div className="space-y-4">
                {/* 1. Nhóm Thời gian & Địa điểm */}
                <div className={`p-3 rounded-xl border ${borderClass} ${theme === 'dark' ? 'bg-slate-800/30' : 'bg-slate-50/50'} space-y-3`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Calendar size={15} className="text-primary" />
                            <span className={`text-sm font-medium ${textPrimaryClass}`}>{formatDate(event.date)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock size={15} className="text-primary" />
                            <span className={`text-sm font-medium ${textPrimaryClass}`}>{event.time || '--:--'}</span>
                        </div>
                    </div>

                    {event.location && (
                        <div className="flex items-start gap-2 pt-2 border-t border-dashed border-slate-200 dark:border-slate-700">
                            <MapPin size={15} className="text-primary mt-0.5 flex-shrink-0" />
                            <span className={`text-sm font-medium ${textSecondaryClass} leading-tight`}>{event.location}</span>
                        </div>
                    )}
                </div>

                {/* 2. Nhóm Tài chính (Tổng tiền & Chi tiết) */}
                <div className={`p-3.5 ${theme === 'dark' ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-100/80 border-slate-200'} border rounded-xl flex items-center justify-between`}>
                    <div>
                        <p className={`text-[11px] ${textMutedClass} font-semibold uppercase tracking-wider mb-1`}>Tổng tiền sự kiện</p>
                        <p className={`text-2xl font-black text-primary`}>
                            {formatCurrency(
                                eventShifts.reduce((sum, shift) => sum + shift.amount, 0)
                            )}
                        </p>
                    </div>
                    <div className="text-right space-y-1">
                        <div className="flex items-center justify-end gap-1.5">
                            <span className={`text-[11px] ${textMutedClass}`}>Lương:</span>
                            <span className={`text-xs font-bold ${textPrimaryClass}`}>
                                {formatCurrency((event.amount || settings.shiftRate) * eventShifts.length)}
                            </span>
                        </div>
                        {event.surcharge > 0 && (
                            <div className="flex items-center justify-end gap-1.5 text-blue-500">
                                <span className="text-[11px] font-medium">Phụ phí:</span>
                                <span className="text-xs font-bold">+{formatCurrency(event.surcharge)}</span>
                            </div>
                        )}
                        {event.surchargeDistribution && event.surcharge > 0 && (
                            <p className={`text-[10px] ${textMutedClass} italic`}>
                                ({event.surchargeDistribution.type === 'equal'
                                    ? 'Chia đều'
                                    : `Chia cho ${event.surchargeDistribution.selectedEmployeeIds?.length || 0} người`})
                            </p>
                        )}
                    </div>
                </div>

                {/* 3. Nhóm Đánh giá & Ghi chú */}
                {(event.review || event.note) && (
                    <div className="space-y-3">
                        {event.review && (
                            <div className={`p-4 rounded-xl border ${event.review === 'high' ? 'border-green-500/20 bg-green-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
                                <div className="flex items-center gap-2 mb-2.5">
                                    {event.review === 'high' ? (
                                        <div className="flex items-center gap-2 text-green-600 font-bold text-sm">
                                            <ThumbsUp size={16} fill="currentColor" />
                                            <span>Đánh giá CAO</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 text-red-600 font-bold text-sm">
                                            <ThumbsDown size={16} fill="currentColor" />
                                            <span>Đánh giá KÉM</span>
                                        </div>
                                    )}
                                </div>
                                {event.reviewNote && (
                                    <div className={`text-xs italic leading-relaxed font-medium ${event.review === 'high' ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                                        "{event.reviewNote}"
                                    </div>
                                )}
                            </div>
                        )}

                        {event.note && (
                            <div className={`p-3 rounded-xl border ${borderClass} bg-slate-500/5`}>
                                <p className={`text-[11px] ${textMutedClass} font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5`}>
                                    <StickyNote size={12} />
                                    Ghi chú sự kiện
                                </p>
                                <p className={`text-sm ${textSecondaryClass} leading-relaxed`}>{event.note}</p>
                            </div>
                        )}
                    </div>
                )}

                {/* 4. Danh sách nhân sự */}
                {eventShifts.length > 0 && (
                    <div className="space-y-2">
                        <div className="flex justify-between items-center px-1">
                            <p className={`text-[11px] ${textMutedClass} font-bold uppercase tracking-wider`}>Nhân viên ({eventShifts.length})</p>
                        </div>
                        <div className={`grid grid-cols-2 gap-2 max-h-[180px] overflow-y-auto pr-1 custom-scrollbar`}>
                            {eventShifts.map(shift => (
                                <div key={shift.id} className={`flex flex-col gap-0.5 p-2 ${theme === 'dark' ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white border-slate-100'} border rounded-lg shadow-sm`}>
                                    <span className={`text-xs font-semibold ${textPrimaryClass} truncate`}>{shift.employeeName}</span>
                                    <div className="flex items-center gap-1.5">
                                        <span className={`w-1.5 h-1.5 rounded-full ${shift.session === 'morning' ? 'bg-orange-400' : 'bg-primary'}`}></span>
                                        <span className={`text-[9px] font-medium ${textMutedClass}`}>
                                            {shift.session === 'morning' ? 'Sáng' : 'Chiều'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
};