import React, { useState, useMemo } from 'react';
import { Modal } from '../ui/Modal';
import Button from '../ui/Button';
import { useToast } from '../ui/Toast';
import { useThemeStyles } from '../../hooks/useThemeStyles';
import { Shift, PaymentTransaction, AdvanceBalance, Event, Location } from '../../types';
import { formatCurrency, formatDate } from '../../constants';
import { dbService } from '../../services';
import { Calculator, AlertCircle, CheckCircle2, Calendar, MapPin } from 'lucide-react';

interface SettlementModalProps {
    isOpen: boolean;
    onClose: () => void;
    employeeId: string;
    employeeName: string;
    shifts: Shift[];
    paymentHistory: PaymentTransaction[];
    events: Event[];
    locations: Location[];
    onSuccess?: () => void;
}

export const SettlementModal: React.FC<SettlementModalProps> = ({
    isOpen,
    onClose,
    employeeId,
    employeeName,
    shifts,
    paymentHistory,
    events,
    locations,
    onSuccess
}) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const { showToast } = useToast();
    const {
        theme,
        cardBgClass,
        borderClass,
        textPrimaryClass,
        textSecondaryClass
    } = useThemeStyles();

    // Tính số dư nợ
    const advanceBalance = useMemo((): AdvanceBalance => {
        const employeeShifts = shifts.filter(s => s.employeeId === employeeId);
        const employeePayments = paymentHistory.filter(p => p.employeeId === employeeId);

        const totalAdvanced = employeePayments
            .filter(p => p.type === 'advance' && !p.settledAt)
            .reduce((sum, p) => sum + p.amount, 0);

        const totalEarned = employeeShifts
            .filter(s => s.status === 'unpaid' || s.status === 'advanced')
            .reduce((sum, s) => sum + s.amount, 0);

        const balance = totalEarned - totalAdvanced;

        return {
            employeeId,
            employeeName,
            totalAdvanced,
            totalEarned,
            balance
        };
    }, [employeeId, employeeName, shifts, paymentHistory]);

    // Tiền ứng chưa chốt
    const unsettledAdvances = useMemo(() => {
        return paymentHistory.filter(p =>
            p.employeeId === employeeId &&
            p.type === 'advance' &&
            !p.settledAt
        );
    }, [paymentHistory, employeeId]);

    // Ca đã ứng
    const advancedShifts = useMemo(() => {
        return shifts.filter(s =>
            s.employeeId === employeeId &&
            s.status === 'advanced'
        );
    }, [shifts, employeeId]);

    const handleSettlement = async () => {
        if (unsettledAdvances.length === 0 || advancedShifts.length === 0) {
            showToast('Không có tiền ứng nào cần quyết toán', 'warning');
            return;
        }

        setIsProcessing(true);
        try {
            const totalAmount = advancedShifts.reduce((sum, shift) => sum + shift.amount, 0);

            await dbService.settleAdvancePayment(
                employeeId,
                employeeName,
                unsettledAdvances.map(p => p.id),
                advancedShifts.map(s => s.id),
                totalAmount
            );

            showToast('Quyết toán tiền ứng thành công', 'success');
            onSuccess?.();
            onClose();
        } catch (error) {
            console.error('Settlement error:', error);
            showToast('Có lỗi xảy ra khi quyết toán', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <Modal
            title="Quyết toán tiền ứng"
            isOpen={isOpen}
            onClose={onClose}
        >
            <div className="space-y-6">
                {/* Tổng quan */}
                <div className={`p-4 ${cardBgClass} border ${borderClass} rounded-lg`}>
                    <div className="flex items-center gap-2 mb-3">
                        <Calculator size={20} className="text-blue-500" />
                        <h3 className={`font-medium ${textPrimaryClass}`}>
                            Tình hình tiền ứng - {employeeName}
                        </h3>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className={textSecondaryClass}>Tổng tiền đã ứng:</span>
                            <p className={`font-medium text-orange-500`}>
                                {formatCurrency(advanceBalance.totalAdvanced)}
                            </p>
                        </div>
                        <div>
                            <span className={textSecondaryClass}>Tổng tiền đã làm:</span>
                            <p className={`font-medium text-green-500`}>
                                {formatCurrency(advanceBalance.totalEarned)}
                            </p>
                        </div>
                        <div className={`col-span-2 pt-2 border-t ${borderClass}`}>
                            <span className={textSecondaryClass}>Số dư:</span>
                            <p className={`font-bold text-lg ${advanceBalance.balance >= 0 ? 'text-green-500' : 'text-red-500'
                                }`}>
                                {formatCurrency(Math.abs(advanceBalance.balance))}
                                {advanceBalance.balance < 0 ? ' (Ứng thừa)' : ' (Cần trả thêm)'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Trạng thái quyết toán */}
                <div className={`p-4 rounded-lg ${advanceBalance.balance === 0
                    ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                    : 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
                    }`}>
                    <div className="flex items-start gap-3">
                        {advanceBalance.balance === 0 ? (
                            <CheckCircle2 size={20} className="text-green-500 mt-0.5" />
                        ) : (
                            <AlertCircle size={20} className="text-yellow-500 mt-0.5" />
                        )}
                        <div>
                            <p className={`font-medium ${textPrimaryClass} mb-1`}>
                                {advanceBalance.balance === 0 ? 'Đã cân bằng' : 'Chưa cân bằng'}
                            </p>
                            <p className={`text-sm ${textSecondaryClass}`}>
                                {advanceBalance.balance === 0
                                    ? 'Tiền ứng và tiền công đã cân bằng, có thể quyết toán.'
                                    : advanceBalance.balance > 0
                                        ? 'Còn thiếu tiền cần trả cho nhân viên.'
                                        : 'Đã ứng thừa tiền cho nhân viên.'
                                }
                            </p>
                        </div>
                    </div>
                </div>

                {/* Lịch sử ứng */}
                {unsettledAdvances.length > 0 && (
                    <div className="space-y-3">
                        <h4 className={`font-medium ${textPrimaryClass}`}>
                            Các lần ứng tiền chưa quyết toán ({unsettledAdvances.length})
                        </h4>
                        <div className={`max-h-40 overflow-y-auto border ${borderClass} rounded-lg`}>
                            {unsettledAdvances.map(payment => (
                                <div
                                    key={payment.id}
                                    className={`p-3 border-b ${borderClass} last:border-b-0`}
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className={`text-sm ${textPrimaryClass}`}>
                                                {formatDate(new Date(payment.date).toISOString())}
                                            </p>
                                            <p className={`text-xs ${textSecondaryClass}`}>
                                                {payment.note}
                                            </p>
                                        </div>
                                        <span className={`font-medium text-orange-500`}>
                                            {formatCurrency(payment.amount)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Các ca đã ứng */}
                {advancedShifts.length > 0 && (
                    <div className="space-y-3">
                        <h4 className={`font-medium ${textPrimaryClass}`}>
                            Các ca đã được ứng tiền ({advancedShifts.length})
                        </h4>
                        <div className={`max-h-40 overflow-y-auto border ${borderClass} rounded-lg`}>
                            {advancedShifts.map(shift => {
                                const event = events.find(e => e.id === shift.eventId);
                                return (
                                    <div
                                        key={shift.id}
                                        className={`p-3 border-b ${borderClass} last:border-b-0`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-start gap-3">
                                                <Calendar size={16} className={`${textSecondaryClass} mt-1`} />
                                                <div>
                                                    <p className={`text-sm font-medium ${textPrimaryClass}`}>
                                                        {event?.title || 'Không rõ sự kiện'}
                                                    </p>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-[10px] font-medium ${shift.session === 'morning' ? 'text-orange-500' : 'text-primary'
                                                            }`}>
                                                            {shift.session === 'morning' ? 'Tiệc Sáng' : 'Tiệc Chiều'}
                                                        </span>
                                                        <span className={`text-[10px] ${textSecondaryClass}`}>•</span>
                                                        <span className={`text-[10px] ${textSecondaryClass}`}>{formatDate(shift.date)}</span>
                                                    </div>
                                                    {event?.locationId && (
                                                        <p className={`text-[10px] ${textSecondaryClass} mt-0.5 flex items-center gap-1`}>
                                                            <MapPin size={10} />
                                                            {locations.find(l => l.id === event.locationId)?.name || 'Không rõ địa điểm'}
                                                        </p>
                                                    )}
                                                    <p className={`text-[10px] ${textSecondaryClass} mt-1`}>
                                                        Đã ứng lúc: {shift.paidAt ? formatDate(new Date(shift.paidAt).toISOString()) : 'N/A'}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className={`font-medium text-green-500`}>
                                                {formatCurrency(shift.amount)}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Thao tác */}
                <div className="flex gap-3">
                    <Button
                        variant="secondary"
                        onClick={onClose}
                        className="flex-1"
                        disabled={isProcessing}
                    >
                        Đóng
                    </Button>
                    {unsettledAdvances.length > 0 && (
                        <Button
                            onClick={handleSettlement}
                            className="flex-1"
                            disabled={isProcessing}
                        >
                            {isProcessing ? 'Đang quyết toán...' : 'Quyết toán'}
                        </Button>
                    )}
                </div>
            </div>
        </Modal>
    );
};