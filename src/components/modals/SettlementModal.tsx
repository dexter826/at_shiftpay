import React, { useState, useMemo, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import Button from '../ui/Button';
import { useToast } from '../ui/Toast';
import { useThemeStyles } from '../../hooks/useThemeStyles';
import { Shift, PaymentTransaction, AdvanceBalance, Event, Location } from '../../types';
import { formatCurrency, formatDate } from '../../utils/format';
import { dbService } from '../../services';
import { Calculator, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../stores';

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
    const { user } = useAuthStore();
    const userId = user?.uid || '';

    const [localAdvances, setLocalAdvances] = useState<PaymentTransaction[]>([]);
    const [isLoadingAdvances, setIsLoadingAdvances] = useState(true); // Trạng thái loading mặc định

    useEffect(() => {
        // Reset state mỗi khi mở modal
        if (isOpen) {
            setIsLoadingAdvances(true);
            setLocalAdvances([]);
            
            const fetchAdvances = async () => {
                try {
                    const data = await dbService.getUnsettledAdvances(employeeId, userId);
                    setLocalAdvances(data);
                } catch (error) {
                    console.error('Failed to fetch advances:', error);
                } finally {
                    setIsLoadingAdvances(false);
                }
            };
            fetchAdvances();
        } else {
            // Xóa data cũ khi đóng
            setIsLoadingAdvances(true);
            setLocalAdvances([]);
        }
    }, [isOpen, employeeId, userId]);

    // Tính số dư nợ
    const advanceBalance = useMemo((): AdvanceBalance => {
        const employeeShifts = shifts.filter(s => s.employeeId === employeeId);
        
        // Dùng data thực tế từ DB
        const totalAdvanced = localAdvances.reduce((sum, p) => sum + p.amount, 0);

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
    }, [employeeId, employeeName, shifts, localAdvances]);

    // Tiền ứng chưa chốt
    const unsettledAdvances = useMemo(() => {
        return localAdvances;
    }, [localAdvances]);

    // Gộp ca chưa trả để bù trừ công nợ
    const settleableShifts = useMemo(() => {
        return shifts.filter(s =>
            s.employeeId === employeeId &&
            (s.status === 'advanced' || s.status === 'unpaid')
        );
    }, [shifts, employeeId]);

    const handleSettlement = async () => {
        if (unsettledAdvances.length === 0 || settleableShifts.length === 0) {
            showToast('Không có dữ liệu công hoặc tiền ứng để quyết toán', 'warning');
            return;
        }

        setIsProcessing(true);
        try {
            // Chốt sổ theo số dư thực
            const settlementAmount = advanceBalance.balance;

            await dbService.settleAdvancePayment(
                employeeId,
                employeeName,
                unsettledAdvances.map(p => p.id),
                settleableShifts.map(s => s.id),
                settlementAmount,
                userId
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
            title="Xác nhận quyết toán"
            isOpen={isOpen}
            onClose={onClose}
        >
            <div className="space-y-6">
                <div className={`p-6 ${cardBgClass} border ${borderClass} rounded-2xl flex flex-col items-center text-center`}>
                    {isLoadingAdvances ? (
                        <div className="py-4 space-y-3">
                            <Loader2 size={32} className="animate-spin text-primary mx-auto" />
                            <p className={`text-sm ${textSecondaryClass}`}>Đang kiểm tra dữ liệu...</p>
                        </div>
                    ) : (
                        <>
                            <div className="mb-4 p-3 bg-primary/10 rounded-full">
                                <Calculator size={32} className="text-primary" />
                            </div>

                            <h3 className={`text-lg font-medium ${textPrimaryClass} mb-2`}>
                                Quyết toán cho {employeeName}?
                            </h3>

                            <div className="my-4">
                                <p className={`text-sm ${textSecondaryClass} mb-1 uppercase tracking-wide font-medium`}>
                                    Số tiền cần trả thêm
                                </p>
                                <p className={`text-3xl font-bold ${advanceBalance.balance >= 0 ? 'text-primary' : 'text-orange-500'}`}>
                                    {formatCurrency(advanceBalance.balance)}
                                </p>
                            </div>

                            <p className={`text-sm ${textSecondaryClass} max-w-xs mx-auto`}>
                                Hành động này sẽ gạch nợ tất cả các khoản ứng và xác nhận thanh toán các ca làm việc hiện tại.
                            </p>
                        </>
                    )}
                </div>

                <div className="flex gap-3">
                    <Button
                        variant="secondary"
                        onClick={onClose}
                        className="flex-1 rounded-lg"
                        disabled={isProcessing}
                    >
                        Hủy bỏ
                    </Button>
                    <Button
                        onClick={handleSettlement}
                        className="flex-1 rounded-lg font-bold"
                        disabled={isProcessing || isLoadingAdvances || settleableShifts.length === 0}
                    >
                        {isProcessing ? 'Đang xử lý...' : 'Xác nhận quyết toán'}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
