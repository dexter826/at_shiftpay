import React, { useState, useMemo, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import Button from '../ui/Button';
import { useToast } from '../ui/Toast';
import { useTheme } from '../../contexts/ThemeContext';
import { Shift, PayrollSummary, Event, Employee } from '../../types';
import { formatCurrency } from '../../constants';
import { dbService } from '../../services/firebase';
import { vietQRService } from '../../services/vietqr';
import { Banknote, AlertTriangle, Check, QrCode, Building2, IdCard, User } from 'lucide-react';

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    employeeSummary: PayrollSummary | null;
    shifts: Shift[];
    selectedShiftIds: string[];
    onShiftSelect: (shiftId: string) => void;
    onSelectAll: () => void;
    events: Event[];
    employees: Employee[];
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
    isOpen,
    onClose,
    employeeSummary,
    shifts,
    selectedShiftIds,
    onShiftSelect,
    onSelectAll,
    events,
    employees
}) => {
    const [paymentType, setPaymentType] = useState<'regular' | 'advance'>('regular');
    const [isProcessing, setIsProcessing] = useState(false);
    const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
    const [qrError, setQrError] = useState<string | null>(null);
    const { theme } = useTheme();
    const { showToast } = useToast();

    const selectedShifts = useMemo(() => {
        return shifts.filter(s => selectedShiftIds.includes(s.id));
    }, [shifts, selectedShiftIds]);

    const selectedTotal = selectedShifts.reduce((sum, shift) => sum + shift.amount, 0);

    const currentEmployee = useMemo(() => {
        if (!employeeSummary) return null;
        return employees.find(e => e.id === employeeSummary.employeeId);
    }, [employees, employeeSummary]);

    useEffect(() => {
        const generateQR = async () => {
            if (!currentEmployee?.bankAccount || selectedTotal === 0) {
                setQrCodeUrl(null);
                setQrError(null);
                return;
            }

            try {
                setQrError(null);
                const transferContent = `THANH TOAN TIEN LUONG ${selectedShiftIds.length} CONG`;
                const qrUrl = await vietQRService.generateQRCode({
                    accountNo: currentEmployee.bankAccount.accountNumber,
                    accountName: currentEmployee.bankAccount.accountName,
                    acqId: currentEmployee.bankAccount.bankId,
                    amount: selectedTotal,
                    addInfo: transferContent,
                    template: 'compact'
                });
                setQrCodeUrl(qrUrl);
            } catch (error) {
                console.error('Generate QR error:', error);
                setQrError('Không thể tạo mã QR');
                setQrCodeUrl(null);
            }
        };

        generateQR();
    }, [currentEmployee, selectedTotal, selectedShiftIds.length]);

    const unpaidShifts = useMemo(() => {
        if (!employeeSummary) return [];
        return shifts.filter(s =>
            s.employeeId === employeeSummary.employeeId &&
            s.status === 'unpaid'
        );
    }, [shifts, employeeSummary]);

    // Helper function để tính toán lương và phụ phí riêng biệt
    const getShiftBreakdown = (shift: Shift) => {
        const event = events.find(e => e.id === shift.eventId);
        if (!event || !event.surcharge || event.surcharge === 0) {
            return {
                baseSalary: shift.amount,
                surcharge: 0
            };
        }

        const baseSalary = event.amount || 0;
        const surchargePerPerson = shift.amount - baseSalary;

        return {
            baseSalary: baseSalary,
            surcharge: surchargePerPerson
        };
    };

    // Helper function để format ngày tháng
    const formatShiftDate = (dateStr: string, session: 'morning' | 'afternoon') => {
        const date = new Date(dateStr);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        const sessionText = session === 'morning' ? 'Tiệc sáng' : 'Tiệc chiều';
        return `${sessionText} - ${day}/${month}/${year}`;
    };

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
            title="Thanh toán lương"
            isOpen={isOpen}
            onClose={onClose}
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
                            <p className={`font-bold text-lg ${employeeSummary.netAmount >= 0 ? 'text-primary' : 'text-red-500'}`}>
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
                            className={`p-3 rounded-lg border-2 transition-colors text-center ${paymentType === 'regular'
                                ? 'border-primary bg-primary dark:bg-primary/20'
                                : `border-slate-300 dark:border-slate-600 ${cardBg}`
                                }`}
                        >
                            <div className="flex items-center justify-center gap-2">
                                <Banknote size={16} className="text-primary" />
                                <span className={`font-medium ${paymentType === 'regular' ? 'text-primary' : textPrimary}`}>Thanh toán thường</span>
                            </div>
                            <p className={`text-xs mt-1 ${paymentType === 'regular' ? 'text-primary' : textSecondary}`}>
                                Trả từ nguồn tiền tiệc
                            </p>
                        </button>

                        <button
                            onClick={() => setPaymentType('advance')}
                            className={`p-3 rounded-lg border-2 transition-colors text-center ${paymentType === 'advance'
                                ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                                : `border-slate-300 dark:border-slate-600 ${cardBg}`
                                }`}
                        >
                            <div className="flex items-center justify-center gap-2">
                                <AlertTriangle size={16} className="text-orange-500" />
                                <span className={`font-medium ${paymentType === 'advance' ? 'text-orange-500' : textPrimary}`}>Ứng tiền</span>
                            </div>
                            <p className={`text-xs mt-1 ${paymentType === 'advance' ? 'text-orange-500' : textSecondary}`}>
                                Trả từ nguồn tiền cá nhân
                            </p>
                        </button>
                    </div>
                </div>

                {/* QR Code Section */}
                {currentEmployee?.bankAccount && selectedTotal > 0 && (
                    <div className={`p-4 ${cardBg} border-2 border-primary/30 rounded-lg space-y-3`}>
                        <div className="flex items-center gap-2 mb-3">
                            <QrCode size={18} className="text-primary" />
                            <h4 className={`font-semibold ${textPrimary}`}>Thông tin chuyển khoản</h4>
                        </div>

                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-shrink-0 flex justify-center">
                                {qrCodeUrl && !qrError ? (
                                    <div className="bg-white p-3 rounded-lg">
                                        <img 
                                            src={qrCodeUrl} 
                                            alt="Mã QR chuyển khoản" 
                                            className="w-48 h-48 object-contain"
                                        />
                                    </div>
                                ) : (
                                    <div className={`w-48 h-48 flex items-center justify-center ${cardBg} border ${border} rounded-lg`}>
                                        <div className="text-center p-4">
                                            {qrError ? (
                                                <>
                                                    <AlertTriangle size={32} className="mx-auto mb-2 text-orange-500" />
                                                    <p className={`text-xs ${textSecondary}`}>{qrError}</p>
                                                </>
                                            ) : (
                                                <>
                                                    <QrCode size={32} className="mx-auto mb-2 text-slate-400" />
                                                    <p className={`text-xs ${textSecondary}`}>Đang tạo mã QR...</p>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 space-y-2.5 text-sm text-center md:text-left">
                                <div>
                                    <div className="flex items-center justify-center md:justify-start gap-1">
                                        <Building2 size={14} className={textSecondary} />
                                        <span className={textSecondary}>Ngân hàng:</span>
                                    </div>
                                    <p className={`font-medium ${textPrimary}`}>{currentEmployee.bankAccount.bankName}</p>
                                </div>

                                <div>
                                    <div className="flex items-center justify-center md:justify-start gap-1">
                                        <IdCard size={14} className={textSecondary} />
                                        <span className={textSecondary}>Số tài khoản:</span>
                                    </div>
                                    <p className={`font-medium ${textPrimary}`}>{currentEmployee.bankAccount.accountNumber}</p>
                                </div>

                                <div>
                                    <div className="flex items-center justify-center md:justify-start gap-1">
                                        <User size={14} className={textSecondary} />
                                        <span className={textSecondary}>Tên chủ TK:</span>
                                    </div>
                                    <p className={`font-medium ${textPrimary}`}>{currentEmployee.bankAccount.accountName}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Cảnh báo thiếu thông tin ngân hàng */}
                {!currentEmployee?.bankAccount && selectedTotal > 0 && (
                    <div className={`p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center justify-center`}>
                        <div className="flex items-center gap-2">
                            <Building2 size={16} className="text-red-500 flex-shrink-0" />
                            <p className={`text-sm font-medium ${theme === 'dark' ? 'text-red-300' : 'text-red-700'}`}>
                                Nhân viên không có thông tin ngân hàng
                            </p>
                        </div>
                    </div>
                )}

                {/* Danh sách ca được chọn */}
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <h4 className={`font-medium ${textPrimary}`}>
                            Ca được chọn ({selectedShiftIds.length})
                        </h4>
                        <button
                            onClick={onSelectAll}
                            className="text-sm text-primary hover:text-primary/80"
                        >
                            {selectedShiftIds.length === unpaidShifts.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                        </button>
                    </div>

                    <div className={`max-h-40 overflow-y-auto border ${border} rounded-lg`}>
                        {unpaidShifts.map(shift => {
                            const breakdown = getShiftBreakdown(shift);
                            return (
                                <div
                                    key={shift.id}
                                    onClick={() => onShiftSelect(shift.id)}
                                    className={`flex items-center gap-3 p-3 border-b ${border} last:border-b-0 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50`}
                                >
                                    <div
                                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${selectedShiftIds.includes(shift.id)
                                            ? 'bg-primary border-primary'
                                            : theme === 'dark' ? 'border-slate-600' : 'border-slate-300'
                                            }`}
                                    >
                                        {selectedShiftIds.includes(shift.id) && <Check size={12} className="text-white" />}
                                    </div>
                                    <div className="flex-1">
                                        <p className={`text-sm ${textPrimary}`}>
                                            {formatShiftDate(shift.eventDate, shift.session)}
                                        </p>
                                        <div className={`text-xs ${textSecondary}`}>
                                            {breakdown.surcharge > 0 ? (
                                                <span>
                                                    {formatCurrency(breakdown.baseSalary)} + {formatCurrency(breakdown.surcharge)} (Phụ phí)
                                                </span>
                                            ) : (
                                                <span>{formatCurrency(shift.amount)}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
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