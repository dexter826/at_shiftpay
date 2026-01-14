import React, { memo } from 'react';
import { Modal } from '../../ui/Modal';
import Button from '../../ui/Button';
import { Employee } from '../../../types';
import { Phone, CreditCard, Calendar } from 'lucide-react';
import PenIcon from '../../ui/icons/pen-icon';
import { AnimatedIconHandle } from '../../ui/icons/types';
import { useThemeStyles } from '../../../hooks/useThemeStyles';

interface EmployeeDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    employee: Employee | null;
    onEditClick: (employee: Employee) => void;
}

const EmployeeDetailModal: React.FC<EmployeeDetailModalProps> = ({
    isOpen,
    onClose,
    employee,
    onEditClick
}) => {
    const {
        theme,
        borderClass,
        cardBgClass,
        textPrimaryClass,
        textSecondaryClass,
        textMutedClass
    } = useThemeStyles();

    const editIconRef = React.useRef<AnimatedIconHandle>(null);

    if (!employee) return null;

    const joinedDate = employee.createdAt 
        ? new Date(employee.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
        : '---';

    return (
        <Modal
            title="Hồ sơ nhân viên"
            isOpen={isOpen}
            onClose={onClose}
            footer={
                <Button
                    variant="primary"
                    onClick={() => {
                        onClose();
                        onEditClick(employee);
                    }}
                    onMouseEnter={() => editIconRef.current?.startAnimation()}
                    onMouseLeave={() => editIconRef.current?.stopAnimation()}
                    fullWidth
                    className="flex justify-center items-center gap-2"
                >
                    <PenIcon ref={editIconRef} size={18} color="currentColor" />
                    Chỉnh sửa hồ sơ
                </Button>
            }
        >
            <div className="space-y-4">
                {/* Header với Avatar và Tên */}
                <div className="flex flex-col items-center">
                    <div className="relative mb-3">
                        {employee.imageUrl ? (
                            <img
                                src={employee.imageUrl}
                                alt={employee.name}
                                className={`w-24 h-24 rounded-2xl object-cover border-4 ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'} shadow-lg`}
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.name)}&background=random&color=fff&size=256`;
                                }}
                            />
                        ) : (
                            <div className={`w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-3xl font-bold text-primary border-4 ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'} shadow-lg`}>
                                {employee.name.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>
                    
                    <div className="text-center">
                        <h3 className={`text-xl font-bold ${textPrimaryClass} mb-2`}>{employee.name}</h3>
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${theme === 'dark' ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                            <Calendar size={12} />
                            <span>Tham gia từ {joinedDate}</span>
                        </div>
                    </div>
                </div>

                {/* Thông tin liên hệ */}
                <div className="space-y-3">
                    <h4 className={`text-xs font-semibold uppercase tracking-wide ${textMutedClass}`}>Thông tin liên hệ</h4>
                    
                    {/* Số điện thoại */}
                    <div className={`${cardBgClass} border ${borderClass} rounded-xl p-3.5`}>
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                <Phone size={18} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className={`text-xs font-medium ${textMutedClass} mb-1.5`}>Số điện thoại</p>
                                {employee.phone ? (
                                    <a 
                                        href={`tel:${employee.phone}`}
                                        className={`text-base font-semibold ${textPrimaryClass} hover:text-primary transition-colors`}
                                    >
                                        {employee.phone}
                                    </a>
                                ) : (
                                    <p className={`text-sm italic ${textMutedClass}`}>Chưa cập nhật</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Thông tin ngân hàng */}
                <div className="space-y-3">
                    <h4 className={`text-xs font-semibold uppercase tracking-wide ${textMutedClass}`}>Thông tin thanh toán</h4>
                    
                    {/* Tài khoản ngân hàng */}
                    <div className={`${cardBgClass} border ${borderClass} rounded-xl p-3.5`}>
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                <CreditCard size={18} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className={`text-xs font-medium ${textMutedClass} mb-1.5`}>Tài khoản ngân hàng</p>
                                {employee.bankAccount ? (
                                    <div className="space-y-2">
                                        <div className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold ${theme === 'dark' ? 'bg-primary/10 text-primary' : 'bg-primary/10 text-primary'}`}>
                                            {employee.bankAccount.bankName}
                                        </div>
                                        <div className="space-y-1">
                                            <p className={`font-mono text-base font-semibold ${textPrimaryClass} tracking-wider`}>
                                                {employee.bankAccount.accountNumber}
                                            </p>
                                            <p className={`text-sm ${textSecondaryClass}`}>
                                                {employee.bankAccount.accountName}
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <p className={`text-sm italic ${textMutedClass}`}>Chưa cập nhật</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default memo(EmployeeDetailModal);
