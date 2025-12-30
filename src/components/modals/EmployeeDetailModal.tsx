import React, { useMemo } from 'react';
import { Modal } from '../ui/Modal';
import Button from '../ui/Button';
import { useToast } from '../ui/Toast';
import { Employee, Shift } from '../../types';
import { formatCurrency } from '../../constants';
import { Phone, Building2, DollarSign, Briefcase, Wallet, AlertCircle, Edit2 } from 'lucide-react';
import { useThemeStyles } from '../../hooks/useThemeStyles';

interface EmployeeDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    employee: Employee | null;
    shifts: Shift[];
    onEditClick: (employee: Employee) => void;
}

export const EmployeeDetailModal: React.FC<EmployeeDetailModalProps> = ({
    isOpen,
    onClose,
    employee,
    shifts,
    onEditClick
}) => {
    const { showToast } = useToast();
    const {
        theme,
        cardBgClass,
        borderClass,
        textPrimaryClass,
        textSecondaryClass,
        textMutedClass,
        highlightBgClass
    } = useThemeStyles();

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const employeeStats = useMemo(() => {
        if (!employee) return null;

        const empShifts = shifts.filter(s => s.employeeId === employee.id);
        const currentMonthShifts = empShifts.filter(s => {
            const d = new Date(s.date);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });

        const unpaidShifts = currentMonthShifts.filter(s => s.status === 'unpaid');
        const advancedShifts = currentMonthShifts.filter(s => s.status === 'advanced');

        const totalUnpaid = unpaidShifts.reduce((sum, s) => sum + s.amount, 0);
        const totalAdvanced = advancedShifts.reduce((sum, s) => sum + s.amount, 0);

        return {
            totalShifts: currentMonthShifts.length,
            unpaidCount: unpaidShifts.length,
            advancedCount: advancedShifts.length,
            totalUnpaid,
            totalAdvanced,
            netAmount: totalUnpaid - totalAdvanced
        };
    }, [employee, shifts, currentMonth, currentYear]);

    if (!employee || !employeeStats) return null;

    return (
        <Modal
            title="Thông tin nhân viên"
            isOpen={isOpen}
            onClose={onClose}
            footer={
                <div className="flex gap-2">
                    <Button
                        variant="secondary"
                        onClick={() => {
                            onClose();
                            onEditClick(employee);
                        }}
                        className="flex-1"
                    >
                        <Edit2 size={16} />
                        Sửa thông tin
                    </Button>
                    {employeeStats.unpaidCount > 0 && (
                        <Button
                            onClick={() => {
                                onClose();
                                showToast('Chuyển đến trang Lương để thanh toán', 'success');
                            }}
                            className="flex-1"
                        >
                            <Wallet size={16} />
                            Thanh toán
                        </Button>
                    )}
                </div>
            }
        >
            <div className="space-y-4">
                {/* Ảnh và thông tin cơ bản */}
                <div className="flex flex-col items-center gap-3">
                    {employee.imageUrl ? (
                        <img
                            src={employee.imageUrl}
                            alt={employee.name}
                            className="w-24 h-24 rounded-full object-cover border-4 border-primary/20"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.name)}&background=random&color=fff&size=256`;
                            }}
                        />
                    ) : (
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-3xl font-bold text-white border-4 border-primary/20">
                            {employee.name.charAt(0).toUpperCase()}
                        </div>
                    )}
                    <div className="text-center">
                        <h3 className={`text-xl font-bold ${textPrimaryClass}`}>{employee.name}</h3>
                        {employee.phone && (
                            <div className="flex items-center justify-center gap-1.5 mt-1">
                                <Phone size={14} className={textMutedClass} />
                                <p className={textSecondaryClass}>{employee.phone}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Thông tin ngân hàng */}
                {employee.bankAccount && (
                    <div className={`p-3 ${cardBgClass} border ${borderClass} rounded-lg`}>
                        <div className="flex items-center gap-2 mb-2">
                            <Building2 size={16} className="text-primary" />
                            <h4 className={`font-medium ${textPrimaryClass}`}>Thông tin ngân hàng</h4>
                        </div>
                        <div className="space-y-1.5 text-sm">
                            <div className="flex justify-between">
                                <span className={textMutedClass}>Ngân hàng:</span>
                                <span className={`font-medium ${textSecondaryClass}`}>{employee.bankAccount.bankName}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className={textMutedClass}>Số TK:</span>
                                <span className={`font-medium ${textSecondaryClass}`}>{employee.bankAccount.accountNumber}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className={textMutedClass}>Chủ TK:</span>
                                <span className={`font-medium ${textSecondaryClass}`}>{employee.bankAccount.accountName}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Thống kê tháng này */}
                <div className={`p-3 ${cardBgClass} border ${borderClass} rounded-lg`}>
                    <div className="flex items-center gap-2 mb-3">
                        <DollarSign size={16} className="text-primary" />
                        <h4 className={`font-medium ${textPrimaryClass}`}>Thống kê tháng {currentMonth + 1}/{currentYear}</h4>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className={`text-center p-3 ${highlightBgClass} rounded-lg`}>
                            <div className="flex items-center justify-center gap-1 mb-1">
                                <Briefcase size={14} className="text-primary" />
                                <p className={`text-xs ${textMutedClass}`}>Tổng công</p>
                            </div>
                            <p className={`text-2xl font-bold ${textPrimaryClass}`}>{employeeStats.totalShifts}</p>
                        </div>

                        <div className={`text-center p-3 ${highlightBgClass} rounded-lg`}>
                            <div className="flex items-center justify-center gap-1 mb-1">
                                <AlertCircle size={14} className="text-blue-500" />
                                <p className={`text-xs ${textMutedClass}`}>Chưa trả</p>
                            </div>
                            <p className="text-2xl font-bold text-blue-500">{employeeStats.unpaidCount}</p>
                        </div>

                        <div className={`text-center p-3 ${highlightBgClass} rounded-lg`}>
                            <div className="flex items-center justify-center gap-1 mb-1">
                                <Wallet size={14} className="text-orange-500" />
                                <p className={`text-xs ${textMutedClass}`}>Đã ứng</p>
                            </div>
                            <p className="text-2xl font-bold text-orange-500">{employeeStats.advancedCount}</p>
                        </div>

                        <div className={`text-center p-3 ${highlightBgClass} rounded-lg`}>
                            <div className="flex items-center justify-center gap-1 mb-1">
                                <DollarSign size={14} className="text-green-500" />
                                <p className={`text-xs ${textMutedClass}`}>Thực nhận</p>
                            </div>
                            <p className={`text-lg font-bold ${employeeStats.netAmount >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {formatCurrency(Math.abs(employeeStats.netAmount))}
                            </p>
                        </div>
                    </div>

                    <div className={`mt-3 p-2.5 ${cardBgClass} border ${borderClass} rounded text-xs ${textMutedClass} space-y-1`}>
                        <div className="flex justify-between">
                            <span>Tổng chưa thanh toán:</span>
                            <span className="font-medium text-blue-500">{formatCurrency(employeeStats.totalUnpaid)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Tổng đã ứng:</span>
                            <span className="font-medium text-orange-500">{formatCurrency(employeeStats.totalAdvanced)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
};
