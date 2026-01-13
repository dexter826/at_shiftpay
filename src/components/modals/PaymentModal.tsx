import React, { useState, useMemo, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import Button from '../ui/Button';
import { useToast } from '../ui/Toast';
import { useThemeStyles } from '../../hooks/useThemeStyles';
import { Shift, PayrollSummary, Event, Employee, Location } from '../../types';
import { formatCurrency } from '../../utils/format';
import { dbService } from '../../services';
import { vietQRService } from '../../services/vietqrService';
import { Banknote, AlertTriangle, Check, QrCode, Building2, IdCard, User, MapPin, Wallet } from 'lucide-react';
import { useAuthStore } from '../../stores';

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
    locations: Location[];
    onSuccess?: () => void;
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
    employees,
    locations,
    onSuccess
}) => {
    const [paymentType, setPaymentType] = useState<'regular' | 'advance'>('regular');
    const [isProcessing, setIsProcessing] = useState(false);
    const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
    const [qrError, setQrError] = useState<string | null>(null);
    const {
        theme,
        cardBgClass: cardBg,
        borderClass: border,
        textPrimaryClass: textPrimary,
        textSecondaryClass: textSecondary,
        inputBgClass,
        hoverBgClass,
        inputBorderClass
    } = useThemeStyles();
    const { user } = useAuthStore();
    const userId = user?.uid || '';
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

    // Tách lương cơ bản và phụ phí
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

    // Format ngày giờ ca làm
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
                    : `Thanh toán ${selectedShiftIds.length} ca làm việc`,
                userId: userId
            };

            if (paymentType === 'advance') {
                await dbService.createAdvancePayment(paymentData, selectedShiftIds);
                showToast('Đã ứng tiền thành công', 'success');
            } else {
                await dbService.createPaymentTransaction(paymentData, selectedShiftIds);
                showToast('Đã thanh toán thành công', 'success');
            }

            onSuccess?.();
            onClose();
        } catch (error) {
            console.error('Payment error:', error);
            showToast('Có lỗi xảy ra khi xử lý thanh toán', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    if (!employeeSummary) return null;

    return (
        <Modal
            title="Thanh toán lương"
            isOpen={isOpen}
            onClose={onClose}
        >
            <div className="space-y-5">
                {/* Thông tin nhân viên & Ngân hàng */}
                <div className={`p-4 ${cardBg} border ${border} rounded-2xl shadow-sm relative overflow-hidden`}>
                    <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12" />

                    <div className="flex items-center gap-4 relative">
                        <div className="relative shrink-0">
                            {currentEmployee?.imageUrl ? (
                                <img
                                    src={currentEmployee.imageUrl}
                                    alt={employeeSummary.employeeName}
                                    className="w-16 h-16 rounded-2xl object-cover border-2 border-white dark:border-slate-800 shadow-sm"
                                />
                            ) : (
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white shadow-sm">
                                    <User size={32} />
                                </div>
                            )}
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-white dark:border-slate-800 rounded-full" />
                        </div>

                        <div className="min-w-0 flex-1 space-y-0.5">
                            <h3 className={`text-lg font-black ${textPrimary} leading-tight truncate`}>
                                {employeeSummary.employeeName}
                            </h3>
                            {currentEmployee?.bankAccount ? (
                                <div className="space-y-0.5">
                                    <div className="flex items-center gap-1.5">
                                        <Building2 size={12} className="text-primary shrink-0" />
                                        <p className={`text-xs font-bold text-primary truncate`}>
                                            {currentEmployee.bankAccount.bankName}
                                        </p>
                                    </div>
                                    <p className={`text-xs font-mono font-medium ${textSecondary} tracking-wider`}>
                                        {currentEmployee.bankAccount.accountNumber}
                                    </p>
                                    <p className={`text-[10px] font-medium ${textSecondary} uppercase opacity-80 truncate`}>
                                        {currentEmployee.bankAccount.accountName}
                                    </p>
                                </div>
                            ) : (
                                <p className={`text-xs ${textSecondary} italic`}>Chưa cập nhật ngân hàng</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Loại thanh toán */}
                <div className="space-y-3">
                    <h4 className={`text-sm font-bold ${textPrimary} px-1`}>Loại thanh toán:</h4>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => setPaymentType('regular')}
                            className={`p-3 rounded-2xl border-2 transition-all relative text-center ${paymentType === 'regular'
                                ? 'border-primary bg-primary/5 dark:bg-primary/10'
                                : `${inputBorderClass} ${cardBg}`
                                }`}
                        >
                            {paymentType === 'regular' && (
                                <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                                    <Check size={12} className="text-white" />
                                </div>
                            )}
                            <div className="flex items-center justify-center gap-2 mb-1">
                                <Banknote size={16} className={paymentType === 'regular' ? 'text-primary' : textSecondary} />
                                <span className={`font-bold text-sm ${paymentType === 'regular' ? 'text-primary' : textPrimary}`}>Thanh toán</span>
                            </div>
                            <p className={`text-[10px] leading-tight ${paymentType === 'regular' ? 'text-primary/80' : textSecondary}`}>
                                Nguồn tiền tiệc
                            </p>
                        </button>

                        <button
                            onClick={() => setPaymentType('advance')}
                            className={`p-3 rounded-2xl border-2 transition-all relative text-center ${paymentType === 'advance'
                                ? 'border-orange-500 bg-orange-500/5 dark:bg-orange-500/10'
                                : `${inputBorderClass} ${cardBg}`
                                }`}
                        >
                            {paymentType === 'advance' && (
                                <div className="absolute top-2 right-2 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                                    <Check size={12} className="text-white" />
                                </div>
                            )}
                            <div className="flex items-center justify-center gap-2 mb-1">
                                <Wallet size={16} className={paymentType === 'advance' ? 'text-orange-500' : textSecondary} />
                                <span className={`font-bold text-sm ${paymentType === 'advance' ? 'text-orange-500' : textPrimary}`}>Ứng tiền</span>
                            </div>
                            <p className={`text-[10px] leading-tight ${paymentType === 'advance' ? 'text-orange-500/80' : textSecondary}`}>
                                Nguồn cá nhân
                            </p>
                        </button>
                    </div>
                </div>

                {/* Mã QR */}
                {currentEmployee?.bankAccount && selectedTotal > 0 && (
                    <div className={`p-4 ${cardBg} border-2 border-primary/30 rounded-2xl flex flex-col items-center justify-center space-y-3`}>
                        <div className="flex items-center gap-2">
                            <QrCode size={18} className="text-primary" />
                            <h4 className={`font-semibold ${textPrimary}`}>Quét mã chuyển khoản</h4>
                        </div>

                        {qrCodeUrl && !qrError ? (
                            <div className={`${inputBgClass} p-3 rounded-2xl shadow-sm`}>
                                <img
                                    src={qrCodeUrl}
                                    alt="Mã QR chuyển khoản"
                                    className="w-48 h-48 object-contain"
                                />
                            </div>
                        ) : (
                            <div className={`w-48 h-48 flex items-center justify-center ${cardBg} border ${border} rounded-2xl`}>
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

                        <p className={`text-[10px] ${textSecondary} text-center italic`}>
                            Nội dung: THANH TOAN TIEN LUONG {selectedShiftIds.length} CONG
                        </p>
                    </div>
                )}

                {/* Cảnh báo thiếu ngân hàng */}
                {!currentEmployee?.bankAccount && selectedTotal > 0 && (
                    <div className={`p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl flex items-center justify-center`}>
                        <div className="flex items-center gap-2">
                            <Building2 size={16} className="text-red-500 flex-shrink-0" />
                            <p className={`text-sm font-medium ${theme === 'dark' ? 'text-red-300' : 'text-red-700'}`}>
                                Nhân viên không có thông tin ngân hàng
                            </p>
                        </div>
                    </div>
                )}

                {/* Danh sách ca chọn */}
                <div className="space-y-3">
                    <div className="flex justify-between items-center px-1">
                        <h4 className={`text-sm font-bold ${textPrimary}`}>
                            Ca được chọn ({selectedShiftIds.length})
                        </h4>
                        <button
                            onClick={onSelectAll}
                            className="text-xs font-medium text-primary hover:text-primary/80"
                        >
                            {selectedShiftIds.length === unpaidShifts.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                        </button>
                    </div>

                    <div className={`max-h-64 overflow-y-auto border ${border} rounded-2xl`}>
                        {unpaidShifts.map(shift => {
                            const breakdown = getShiftBreakdown(shift);
                            const event = events.find(e => e.id === shift.eventId);
                            return (
                                <div
                                    key={shift.id}
                                    onClick={() => onShiftSelect(shift.id)}
                                    className={`flex items-center gap-3 p-3 border-b ${border} last:border-b-0 cursor-pointer ${hoverBgClass}`}
                                >
                                    <div
                                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0 ${selectedShiftIds.includes(shift.id)
                                            ? 'bg-primary border-primary'
                                            : inputBorderClass
                                            }`}
                                    >
                                        {selectedShiftIds.includes(shift.id) && <Check size={12} className="text-white" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-medium ${textPrimary} truncate`}>
                                            {event?.title || 'Không rõ'}
                                        </p>
                                        <div className={`text-xs ${textSecondary} flex items-center gap-1 truncate`}>
                                            <MapPin size={12} className="shrink-0" />
                                            <span className="truncate">{locations.find(l => l.id === event?.locationId)?.name || 'Không rõ địa điểm'}</span>
                                        </div>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <div className={`text-sm font-bold ${textPrimary}`}>
                                            {formatCurrency(shift.amount)}
                                        </div>
                                        <div className={`text-[10px] ${textSecondary} mt-0.5`}>
                                            {formatShiftDate(shift.date, shift.session)}
                                        </div>
                                        {breakdown.surcharge > 0 && (
                                            <div className={`text-[9px] ${textSecondary} opacity-80`}>
                                                {formatCurrency(breakdown.baseSalary)} + {formatCurrency(breakdown.surcharge)}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Tổng hợp thanh toán */}
                <div className={`p-4 ${cardBg} border ${border} rounded-2xl space-y-4`}>
                    <div className="flex justify-between items-center">
                        <div>
                            <span className={`text-xs ${textSecondary} block`}>Tổng chưa thanh toán</span>
                            <span className={`text-[10px] font-medium ${textSecondary}`}>{employeeSummary.unpaidCount} ca làm việc</span>
                        </div>
                        <span className={`font-bold ${textPrimary}`}>
                            {formatCurrency(employeeSummary.totalUnpaid)}
                        </span>
                    </div>

                    <div className="flex justify-between items-center">
                        <div>
                            <span className={`text-xs ${textSecondary} block`}>Tổng đã ứng</span>
                            <span className={`text-[10px] font-medium text-orange-500`}>{employeeSummary.advancedCount} ca làm việc</span>
                        </div>
                        <span className={`font-bold text-orange-500`}>
                            {formatCurrency(employeeSummary.totalAdvanced)}
                        </span>
                    </div>

                    <div className="pt-4 border-t border-dashed border-slate-200 dark:border-slate-700 flex justify-between items-center">
                        <div>
                            <span className={`text-sm font-bold ${textPrimary} block`}>Thanh toán đang chọn</span>
                            <span className={`text-[10px] font-bold text-primary uppercase tracking-wider`}>
                                {selectedShiftIds.length} ca làm việc
                            </span>
                        </div>
                        <span className={`text-2xl font-black text-primary`}>
                            {formatCurrency(selectedTotal)}
                        </span>
                    </div>
                </div>

                {/* Thao tác */}
                <div className="flex gap-3">
                    <Button
                        variant="secondary"
                        onClick={onClose}
                        className="flex-1 rounded-xl"
                        disabled={isProcessing}
                    >
                        Hủy
                    </Button>
                    <Button
                        onClick={handlePayment}
                        className="flex-1 rounded-xl"
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