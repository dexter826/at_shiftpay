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
        textPrimaryClass,
        textSecondaryClass,
        textMutedClass,
        highlightBgClass
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
            <div className="space-y-6 pt-2">
                {/* Minimal Header */}
                <div className="flex flex-col items-center">
                    <div className="relative mb-3">
                        {employee.imageUrl ? (
                            <img
                                src={employee.imageUrl}
                                alt={employee.name}
                                className={`w-24 h-24 rounded-full object-cover border-4 ${theme === 'dark' ? 'border-primary' : 'border-primary'} shadow-sm`}
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.name)}&background=random&color=fff&size=256`;
                                }}
                            />
                        ) : (
                            <div className={`w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-3xl font-bold text-primary border-4 ${theme === 'dark' ? 'border-primary' : 'border-primary'} shadow-sm`}>
                                {employee.name.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>
                    
                    <div className="text-center">
                        <h3 className={`text-2xl font-bold ${textPrimaryClass} mb-1`}>{employee.name}</h3>
                        <div className={`flex items-center justify-center gap-1.5 text-sm ${textMutedClass}`}>
                            <Calendar size={14} />
                            <span>Ngày gia nhập: {joinedDate}</span>
                        </div>
                    </div>
                </div>

                <div className={`border-t ${borderClass}`} />

                {/* Info List */}
                <div className="space-y-5 px-1">
                    {/* Phone Row */}
                    <div className="flex gap-4">
                        <div className={`mt-1 bg-slate-100 dark:bg-slate-800 p-2 rounded-full h-fit text-primary`}>
                            <Phone size={18} />
                        </div>
                        <div className="flex-1">
                            <p className={`text-sm font-medium ${textMutedClass} mb-1`}>Số điện thoại</p>
                            {employee.phone ? (
                                <p className={`text-lg font-medium ${textSecondaryClass}`}>{employee.phone}</p>
                            ) : (
                                <p className="text-base italic text-slate-400">Chưa cập nhật</p>
                            )}
                        </div>
                    </div>

                    {/* Bank Row */}
                    <div className="flex gap-4">
                        <div className={`mt-1 bg-slate-100 dark:bg-slate-800 p-2 rounded-full h-fit text-primary`}>
                            <CreditCard size={18} />
                        </div>
                        <div className="flex-1">
                            <p className={`text-sm font-medium ${textMutedClass} mb-1`}>Tài khoản ngân hàng</p>
                            {employee.bankAccount ? (
                                <div className="space-y-1">
                                    <p className={`text-lg font-bold ${textPrimaryClass}`}>{employee.bankAccount.bankName}</p>
                                    <p className={`font-mono text-base ${textSecondaryClass} tracking-wide`}>{employee.bankAccount.accountNumber}</p>
                                    <p className={`text-sm ${textMutedClass} uppercase`}>{employee.bankAccount.accountName}</p>
                                </div>
                            ) : (
                                <p className="text-base italic text-slate-400">Chưa cập nhật</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default memo(EmployeeDetailModal);
