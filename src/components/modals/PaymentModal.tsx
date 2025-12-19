import React, { useState, useMemo } from 'react';
import { Modal } from '../ui/Modal';
import Button from '../ui/Button';
import { useToast } from '../ui/Toast';
import { useTheme } from '../../contexts/ThemeContext';
import { Shift, PayrollSummary } from '../../types';
import { formatCurrency } from '../../constants';
import { dbService } from '../../services/firebase';
import { Banknote, AlertTriangle, Info, Check } from 'lucide-react';

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    employeeSummary: PayrollSummary | null;
    shifts: Shift[];
    selectedShiftIds: string[];
    onShiftSelect: (shiftId: string) => void;
    onSelectAll: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
    isOpen,
    onClose,
    employeeSummary,
    shifts,
    selectedShiftIds,
    onShiftSelect,
    onSelectAll
}) => {
    const [paymentType, setPaymentType] = useState<'regular' | 'advance'>('regular');
    const [isProcessing, setIsProcessing] = useState(false);
    const { theme } = useTheme();
    const { showToast } = useToast();

    const selectedShifts = useMemo(() => {
        return shifts.filter(s => selectedShiftIds.includes(s.id));
    }, [shifts, selectedShiftIds]);

    const selectedTotal = selectedShifts.reduce((sum, shift) => sum + shift.amount, 0);

    const unpaidShifts = useMemo(() => {
        if (!employeeSummary) return [];
        return shifts.filter(s =>
            s.employeeId === employeeSummary.employeeId &&
            s.status === 'unpaid'
        );
    }, [shifts, employeeSummary]);

    const handlePayment = async () => {
        if (!employeeSummary || selectedShiftIds.length === 0) return;

        setIsProcessing(true);
        try {
            const paymentData = {
                employeeId: employeeSummary.employeeId,
                employeeName: employeeSummary.employeeName,
                amount: selectedTotal,
                date: Date.now(),
                shiftIds: selectedShiftIds,
                type: paymentType as 'regular' | 'advance',
                note: paymentType === 'advance'
                    ? `Ứng tiền ${selectedShiftIds.length} ca làm việc`
                    : `Thanh toán ${selectedShiftIds.length} ca làm việc`
            };

            if (paymentType === 'advance') {
                await dbService.createAdvancePayment(paymentData, selectedShiftIds);
                showToast('Đã ứng tiền thành công', 'success');
            } else {
                await dbService.createPaymentTransaction(paymentData, selectedShiftIds);
                showToast('Đã thanh toán thành công', 'success');
            }

            onClose();
        } catch (error) {
            console.error('Payment error:', error);
            showToast('Có lỗi xảy ra khi xử lý thanh toán', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    if (!employeeSummary) return null;

    const cardBg = theme === 'dark' ? 'bg-slate-800' : 'bg-white';
    const border = theme === 'dark' ? 'border-slate-700' : 'border-slate-200';
    const textPrimary = theme === 'dark' ? 'text-slate-100' : 'text-slate-900';
    const textSecondary = theme === 'dark' ? 'text-slate-300' : 'text-slate-600';

    return (
        <Modal
            title="Thanh toán / Ứng tiền"
            isOpen={isOpen}
            onClose={onClose}
            size="lg"
        >
            <div className="space-y-6">
                {/* Thông tin nhân viên */}
                <div className={`p-4 ${cardBg} border ${border} rounded-lg`}>
                    <h3 className={`font-medium ${textPrimary} mb-2`}>
                        {employeeSummary.employeeName}
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className={textSecondary}>Chưa thanh toán:</span>
                            <p className={`font-medium ${textPrimary}`}>
                                {formatCurrency(employeeSummary.totalUnpaid)} ({employeeSummary.unpaidCount} ca)
                            </p>
                        </div>
                        <div>
                            <span className={textSecondary}>Đã ứng:</span>
                            <p className={`font-medium text-orange-500`}>
                                {formatCurrency(employeeSummary.totalAdvanced)} ({employeeSummary.advancedCount} ca)
                            </p>
                        </div>
                        <div className="col-span-2">
                            <span className={textSecondary}>Số tiền thực tế cần trả:</span>
                            <p className={`font-bold text-lg ${employeeSummary.netAmount >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {formatCurrency(Math.abs(employeeSummary.netAmount))}
                                {employeeSummary.netAmount < 0 && ' (Đã ứng thừa)'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Chọn loại thanh toán */}
                <div className="space-y-3">
                    <h4 className={`font-medium ${textPrimary}`}>Loại thanh toán:</h4>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => setPaymentType('regular')}
                            className={`p-3 rounded-lg border-2 transition-colors ${paymentType === 'regular'
                                ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                                : `border-slate-300 dark:border-slate-600 ${cardBg}`
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <Banknote size={16} className="text-green-500" />
                                <span className={textPrimary}>Thanh toán thường</span>
                            </div>
                            <p className={`text-xs ${textSecondary} mt-1`}>
                                Trả từ nguồn tiền tiệc
                            </p>
                        </button>

                        <button
                            onClick={() => setPaymentType('advance')}
                            className={`p-3 rounded-lg border-2 transition-colors ${paymentType === 'advance'
                                ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                                : `border-slate-300 dark:border-slate-600 ${cardBg}`
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <AlertTriangle size={16} className="text-orange-500" />
                                <span className={textPrimary}>Ứng tiền</span>
                            </div>
                            <p className={`text-xs ${textSecondary} mt-1`}>
                                Trả từ nguồn tiền cá nhân
                            </p>
                        </button>
                    </div>
                </div>

                {/* Danh sách ca được chọn */}
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <h4 className={`font-medium ${textPrimary}`}>
                            Ca được chọn ({selectedShiftIds.length})
                        </h4>
                        <button
                            onClick={onSelectAll}
                            className="text-sm text-blue-500 hover:text-blue-600"
                        >
                            {selectedShiftIds.length === unpaidShifts.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                        </button>
                    </div>

                    <div className={`max-h-40 overflow-y-auto border ${border} rounded-lg`}>
                        {unpaidShifts.map(shift => (
                            <div
                                key={shift.id}
                                onClick={() => onShiftSelect(shift.id)}
                                className={`flex items-center gap-3 p-3 border-b ${border} last:border-b-0 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50`}
                            >
                                <div
                                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${selectedShiftIds.includes(shift.id)
                                        ? 'bg-green-500 border-green-500'
                                        : theme === 'dark' ? 'border-slate-600' : 'border-slate-300'
                                        }`}
                                >
                                    {selectedShiftIds.includes(shift.id) && <Check size={12} className="text-white" />}
                                </div>
                                <div className="flex-1">
                                    <p className={`text-sm ${textPrimary}`}>
                                        {shift.eventDate} - {shift.session === 'morning' ? 'Sáng' : 'Chiều'}
                                    </p>
                                    <p className={`text-xs ${textSecondary}`}>
                                        {formatCurrency(shift.amount)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Tổng tiền */}
                <div className={`p-4 ${cardBg} border ${border} rounded-lg`}>
                    <div className="flex justify-between items-center">
                        <span className={`font-medium ${textPrimary}`}>Tổng tiền:</span>
                        <span className={`text-lg font-bold ${textPrimary}`}>
                            {formatCurrency(selectedTotal)}
                        </span>
                    </div>
                </div>

                {/* Thao tác */}
                <div className="flex gap-3">
                    <Button
                        variant="secondary"
                        onClick={onClose}
                        className="flex-1"
                        disabled={isProcessing}
                    >
                        Hủy
                    </Button>
                    <Button
                        onClick={handlePayment}
                        className="flex-1"
                        disabled={selectedShiftIds.length === 0 || isProcessing}
                    >
                        {isProcessing ? 'Đang xử lý...' : (
                            paymentType === 'advance' ? 'Ứng tiền' : 'Thanh toán'
                        )}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};