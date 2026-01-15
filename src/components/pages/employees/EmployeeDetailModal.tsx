import React, { memo } from 'react';
import { Modal } from '../../ui/Modal';
import Button from '../../ui/Button';
import { Employee } from '../../../types';
import { Phone, Calendar, CreditCard } from 'lucide-react';
import PenIcon from '../../ui/icons/pen-icon';
import { AnimatedIconHandle } from '../../ui/icons/types';
import { useThemeStyles } from '../../../hooks/useThemeStyles';
import BankCard from './BankCard';

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
            <div className="space-y-6">
                <div className="flex flex-col items-center pt-2">
                    <div className="relative mb-4">
                        {employee.imageUrl ? (
                            <img
                                src={employee.imageUrl}
                                alt={employee.name}
                                className={`w-28 h-28 rounded-3xl object-cover border-4 ${theme === 'dark' ? 'border-slate-800' : 'border-white'} shadow-2xl`}
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.name)}&background=random&color=fff&size=256`;
                                }}
                            />
                        ) : (
                            <div className={`w-28 h-28 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-4xl font-black text-primary border-4 ${theme === 'dark' ? 'border-slate-800' : 'border-white'} shadow-2xl`}>
                                {employee.name.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>
                    
                    <div className="text-center space-y-3">
                        <h3 className={`text-2xl font-black tracking-tight ${textPrimaryClass}`}>{employee.name}</h3>
                        
                        <div className="flex flex-wrap justify-center gap-2">
                            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${theme === 'dark' ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                                <Calendar size={14} className="text-primary" />
                                <span>Tham gia {joinedDate}</span>
                            </div>
                            
                            {employee.phone && (
                                <a 
                                    href={`tel:${employee.phone}`}
                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${theme === 'dark' ? 'bg-primary/10 text-primary hover:bg-primary/20' : 'bg-primary/10 text-primary hover:bg-primary/20'}`}
                                >
                                    <Phone size={14} />
                                    <span>{employee.phone}</span>
                                </a>
                            )}
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center gap-3 px-1">
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent opacity-50" />
                        <h4 className={`text-[10px] font-black uppercase tracking-[0.2em] ${textMutedClass}`}>Thông tin thanh toán</h4>
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent opacity-50" />
                    </div>
                    
                    <div className="flex flex-col items-center">
                        {employee.bankAccount ? (
                            <BankCard 
                                bankName={employee.bankAccount.bankName}
                                accountNumber={employee.bankAccount.accountNumber}
                                accountName={employee.bankAccount.accountName}
                            />
                        ) : (
                            <div className={`w-full max-w-[320px] aspect-[1.586/1] rounded-2xl border-2 border-dashed ${borderClass} flex flex-col items-center justify-center p-6 text-center space-y-2 opacity-60`}>
                                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                    <CreditCard size={24} /> 
                                </div>
                                <p className={`text-sm font-medium ${textMutedClass}`}>Chưa cập nhật thông tin ngân hàng</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default memo(EmployeeDetailModal);
