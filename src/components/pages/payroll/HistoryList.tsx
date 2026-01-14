import React, { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History, Clock, ChevronRightIcon, Loader2 } from 'lucide-react';
import { LoadMore } from '../../ui/LoadMore';
import { formatCurrency } from '../../../utils/format';
import { useThemeStyles } from '../../../hooks/useThemeStyles';
import { PaymentTransaction } from '../../../types';

interface HistoryListProps {
  loading: boolean;
  items: PaymentTransaction[];
  hasMore: boolean;
  isFetchingMore: boolean;
  loadMorePayments: () => void;
  onSelectTransaction: (id: string) => void;
}

const HistoryList: React.FC<HistoryListProps> = ({
  loading,
  items,
  hasMore,
  isFetchingMore,
  loadMorePayments,
  onSelectTransaction,
}) => {
  const {
    cardBgClass,
    borderClass,
    textSecondaryClass,
    textMutedClass,
    hoverBgClass,
  } = useThemeStyles();

  return (
    <AnimatePresence mode="wait">
      {loading ? (
        <motion.div
           key="loading-list" // Reusing same key as payroll because they are conditional
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           exit={{ opacity: 0 }}
           transition={{ duration: 0.3 }}
           className="space-y-2"
         >
           {/* Skeleton can be same or specific for history */}
         </motion.div>
      ) : (
        <motion.div
          key="history-list"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-2"
        >
          {items.length === 0 && !isFetchingMore ? (
            <div className={`text-center py-10 ${textMutedClass}`}>
              <History size={48} className="mx-auto mb-2 opacity-20" />
              <p>Không tìm thấy giao dịch nào</p>
            </div>
          ) : (
            <>
              {items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onSelectTransaction(item.id)}
                  className={`w-full p-3 ${cardBgClass} border ${borderClass} rounded-lg hover:border-primary/50 transition-colors flex justify-between items-center group`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium ${hoverBgClass} ${textMutedClass}`}>
                      <History size={16} />
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm font-medium ${textSecondaryClass}`}>{item.employeeName}</p>
                        {item.type === 'advance' && (
                          <span className="px-2 py-0.5 text-xs bg-transparent border border-orange-600 dark:border-orange-400 text-orange-600 dark:text-orange-400 rounded-full">
                            Ứng tiền
                          </span>
                        )}
                        {item.type === 'settlement' && (
                          <span className="px-2 py-0.5 text-xs bg-transparent border border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400 rounded-full">
                            Quyết toán
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock size={12} className={textMutedClass} />
                        <p className={`text-xs ${textMutedClass}`}>
                          {new Date(item.date).toLocaleDateString('vi-VN')} {new Date(item.date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${textSecondaryClass}`}>
                      {formatCurrency(item.amount)}
                    </span>
                    <ChevronRightIcon size={16} className={textMutedClass} />
                  </div>
                </button>
              ))}

              {isFetchingMore ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                </div>
              ) : hasMore && (
                <LoadMore
                  currentCount={items.length}
                  totalCount={items.length + (hasMore ? 1 : 0)} // Trick de hien nut vi hien tai k biet exact total
                  onLoadMore={loadMorePayments}
                  unit="giao dịch"
                  className="pt-2 pb-4"
                />
              )}

              {!hasMore && items.length > 0 && (
                <p className={`text-center text-[11px] ${textMutedClass} tracking-wide uppercase font-medium mt-6`}>
                  Đã hiển thị toàn bộ {items.length} giao dịch
                </p>
              )}
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default memo(HistoryList);
