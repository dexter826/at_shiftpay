import React, { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, ChevronRightIcon } from 'lucide-react';
import { Skeleton } from '../../ui/Skeleton';
import { LoadMore } from '../../ui/LoadMore';
import { formatCurrency } from '../../../utils/format';
import { PayrollSummary } from '../../../types';

interface PayrollListProps {
  loading: boolean;
  items: PayrollSummary[];
  employees: any[];
  visibleCount: number;
  setVisibleCount: React.Dispatch<React.SetStateAction<number>>;
  onSelectEmployee: (id: string) => void;
  onPaymentClick: (id: string) => void;
  searchTerm: string;
}

const PayrollList: React.FC<PayrollListProps> = ({
  loading,
  items,
  employees,
  visibleCount,
  setVisibleCount,
  onSelectEmployee,
  onPaymentClick,
  searchTerm,
}) => {
  

  return (
    <AnimatePresence mode="wait">
      {loading ? (
        <motion.div
          key="loading-list"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-2"
        >
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={`w-full p-3 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg flex justify-between items-center`}>
              <div className="flex items-center gap-3 w-full">
                <Skeleton variant="circular" width={36} height={36} />
                <div className="flex-1 space-y-2">
                  <Skeleton width="40%" height={16} />
                  <Skeleton width="30%" height={12} />
                </div>
                <Skeleton width={80} height={20} />
              </div>
            </div>
          ))}
        </motion.div>
      ) : (
        <motion.div
          key="payroll-list"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-2"
        >
          {items.length === 0 ? (
            <div className={`text-center py-10 text-[var(--text-muted)]`}>
              <CheckCircle2 size={48} className="mx-auto mb-2 opacity-20" />
              <p>{searchTerm ? 'Không tìm thấy nhân viên nào' : 'Không có khoản nợ nào'}</p>
            </div>
          ) : (
            <>
              {items.slice(0, visibleCount).map((item) => {
                const employee = employees.find(e => e.id === item.employeeId);
                const employeeImage = employee?.imageUrl || employee?.avatar;
                const itemWithFees = item as typeof item & { totalFees?: number };

                return (
                  <button
                    key={item.employeeId}
                    onClick={() => {
                      onSelectEmployee(item.employeeId);
                      // Tự động mở thanh toán nếu sạch nợ (Moved logic to parent or handle here? Parent handles logic usually, but here we just trigger)
                      // Logic in original was: 
                      // setSelectedEmpId(item.employeeId);
                      // if (item.totalUnpaid > 0 && item.totalAdvanced === 0) {
                      //   setShowPaymentModal(true);
                      // }
                      // We will delegate to onPaymentClick which might handle the check or we pass the check result
                      if (item.totalUnpaid > 0 && item.totalAdvanced === 0) {
                        onPaymentClick(item.employeeId);
                      }
                    }}
                    className={`w-full p-3 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg hover:border-primary/50 transition-colors flex justify-between items-center group`}
                  >
                    <div className="flex items-center gap-3">
                      {employeeImage ? (
                        <img
                          src={employeeImage}
                          alt={item.employeeName}
                          decoding="async"
                          className={`w-9 h-9 rounded-full object-cover border-2 ${item.totalUnpaid > 0 ? 'border-primary' : 'border-[var(--border-color)]'}`}
                        />
                      ) : (
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium ${item.totalUnpaid > 0 ? 'bg-primary/10 text-primary' : 'hover:bg-[var(--border-color)] text-[var(--text-muted)]'
                          }`}>
                          {item.employeeName.charAt(0)}
                        </div>
                      )}
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-medium text-[var(--text-secondary)]`}>{item.employeeName}</p>
                          {itemWithFees.totalFees && itemWithFees.totalFees > 0 && (
                            <span className="px-1.5 py-0.5 text-[10px] font-medium bg-blue-500/10 text-blue-500 border border-blue-500/30 rounded">
                              Có phụ phí
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          {item.unpaidCount > 0 && (
                            <span className="text-primary">
                              {item.unpaidCount} công chưa trả
                            </span>
                          )}
                          {item.advancedCount > 0 && (
                            <span className="text-orange-500">
                              {item.advancedCount} công đã ứng
                            </span>
                          )}
                          {item.unpaidCount === 0 && item.advancedCount === 0 && (
                            <span className="text-[var(--text-muted)]">Không có công nợ</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <span className={`text-sm font-medium tabular-nums ${item.totalUnpaid > 0 ? 'text-primary' : 'text-[var(--text-muted)]'}`}>
                          {formatCurrency(item.totalUnpaid)}
                        </span>
                        {item.totalAdvanced > 0 && (
                          <p className="text-xs text-orange-500">
                            Đã ứng: {formatCurrency(item.totalAdvanced)}
                          </p>
                        )}
                      </div>
                      <ChevronRightIcon size={16} className="text-[var(--text-muted)]" />
                    </div>
                  </button>
                );
              })}
              <LoadMore
                currentCount={visibleCount}
                totalCount={items.length}
                onLoadMore={() => setVisibleCount(prev => prev + 15)}
                unit="nhân viên"
                className="pt-2 pb-4"
              />
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default memo(PayrollList);
