import React, { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '../../ui/Skeleton';
import { formatCurrency } from '../../../utils/format';
import { Wallet2 } from 'lucide-react';


interface PayrollStatsProps {
  loading: boolean;
  totalEarned: number;
  totalDebt: number;
  totalAdvanced: number;
  totalShifts: number;
  totalFees: number;
  totalUnpaidShifts: number;
  totalAdvancedShifts: number;
}

const PayrollStats: React.FC<PayrollStatsProps> = ({
  loading,
  totalEarned,
  totalDebt,
  totalAdvanced,
  totalShifts,
  totalFees,
  totalUnpaidShifts,
  totalAdvancedShifts,
}) => {
  

  return (
    <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
      {/* Mobile UI */}
      <div className="block md:hidden">
        {/* Tổng đã làm - Lên trên */}
        <div className="text-center mb-4">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Wallet2 size={20} className="text-blue-500" />
            <p className="text-xs text-blue-500 uppercase tracking-wide font-medium">Tổng đã làm</p>
          </div>
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading-total"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Skeleton width={120} height={36} className="mx-auto" />
              </motion.div>
            ) : (
              <motion.p
                key="content-total"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="text-3xl font-bold text-blue-500 tabular-nums"
              >
                {formatCurrency(totalEarned)}
              </motion.p>
            )}
          </AnimatePresence>
          <p className="text-sm text-blue-500 mt-1">
            {totalShifts} công{totalFees > 0 ? ` (+ ${formatCurrency(totalFees)} phụ phí)` : ''}
          </p>
        </div>

        {/* Tình hình lương + Đã ứng (2 cột) */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-primary/20">
          <div className="text-center flex flex-col items-center">
            <p className="text-xs text-primary uppercase tracking-wide">Tình hình lương</p>
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div
                  key="loading-debt"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="mt-1"
                >
                  <Skeleton width={80} height={24} />
                </motion.div>
              ) : (
                <motion.p
                  key="content-debt"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-lg font-bold text-primary mt-1 tabular-nums"
                >
                  {formatCurrency(totalDebt)}
                </motion.p>
              )}
            </AnimatePresence>
            <p className="text-xs text-primary">{totalUnpaidShifts} công</p>
          </div>

          <div className="text-center flex flex-col items-center">
            <p className="text-xs text-orange-500 uppercase tracking-wide">Đã ứng</p>
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div
                  key="loading-advanced"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="mt-1"
                >
                  <Skeleton width={80} height={24} />
                </motion.div>
              ) : (
                <motion.p
                  key="content-advanced"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`text-lg font-bold mt-1 tabular-nums ${totalAdvanced > 0 ? 'text-orange-500' : 'text-[var(--text-muted)]'}`}
                >
                  {formatCurrency(totalAdvanced)}
                </motion.p>
              )}
            </AnimatePresence>
            <p className={`text-xs ${totalAdvanced > 0 ? 'text-orange-500' : 'text-[var(--text-muted)]'}`}>
              {totalAdvancedShifts} công
            </p>
          </div>
        </div>
      </div>

      {/* Desktop UI */}
      <div className="hidden md:flex justify-between items-start">
        <div className="flex-1">
          <div className="grid grid-cols-3 gap-6">
            {/* Tình hình lương */}
            <div>
              <p className="text-xs text-primary uppercase tracking-wide">Tình hình lương</p>
              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.div
                    key="loading-debt-dt"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="mt-1"
                  >
                    <Skeleton width={100} height={32} />
                  </motion.div>
                ) : (
                  <motion.p
                    key="content-debt-dt"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-2xl font-bold text-primary mt-1"
                  >
                    {formatCurrency(totalDebt)}
                  </motion.p>
                )}
              </AnimatePresence>
              <p className="text-xs text-primary mt-1">{totalUnpaidShifts} công</p>
            </div>

            {/* Đã ứng */}
            <div className={totalAdvanced > 0 ? '' : 'opacity-50'}>
              <p className="text-xs text-orange-500 uppercase tracking-wide">Đã ứng</p>
              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.div
                    key="loading-advanced-dt"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="mt-1"
                  >
                    <Skeleton width={100} height={28} />
                  </motion.div>
                ) : (
                  <motion.p
                    key="content-advanced-dt"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`text-2xl font-bold mt-1 ${totalAdvanced > 0 ? 'text-orange-500' : 'text-[var(--text-muted)]'}`}
                  >
                    {formatCurrency(totalAdvanced)}
                  </motion.p>
                )}
              </AnimatePresence>
              <p className={`text-xs mt-1 ${totalAdvanced > 0 ? 'text-orange-500' : 'text-[var(--text-muted)]'}`}>
                {totalAdvancedShifts} công
              </p>
            </div>

            {/* Tổng đã làm */}
            <div>
              <p className="text-xs text-blue-500 uppercase tracking-wide">Tổng đã làm</p>
              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.div
                    key="loading-total-dt"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="mt-1"
                  >
                    <Skeleton width={100} height={28} />
                  </motion.div>
                ) : (
                  <motion.p
                    key="content-total-dt"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-2xl font-bold text-blue-500 mt-1"
                  >
                    {formatCurrency(totalEarned)}
                  </motion.p>
                )}
              </AnimatePresence>
              <p className="text-xs text-blue-500 mt-1">
                {totalShifts} công{totalFees > 0 ? ` (+ ${formatCurrency(totalFees)} phụ phí)` : ''}
              </p>
            </div>
          </div>
        </div>
        <Wallet2 size={24} className="text-primary/50" />
      </div>
    </div>
  );
};

export default memo(PayrollStats);
