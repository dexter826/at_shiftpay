import React, { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users } from 'lucide-react';
import { Skeleton } from '../../ui/Skeleton';
import { LoadMore } from '../../ui/LoadMore';
import { useThemeStyles } from '../../../hooks/useThemeStyles';
import { Employee } from '../../../types';
import EmployeeCard from './EmployeeCard';

interface EmployeeListProps {
  employees: Employee[];
  loading: boolean;
  visibleCount: number;
  onLoadMore: () => void;
  shiftCounts: Record<string, number>;
  onEdit: (emp: Employee) => void;
  onDelete: (empId: string) => void;
  onDetail: (emp: Employee) => void;
  searchTerm: string;
}

const EmployeeList: React.FC<EmployeeListProps> = ({
  employees,
  loading,
  visibleCount,
  onLoadMore,
  shiftCounts,
  onEdit,
  onDelete,
  onDetail,
  searchTerm,
}) => {
  const { cardBgClass, borderClass, textMutedClass } = useThemeStyles();

  return (
    <div className="px-4 pt-5 pb-4 md:px-6 md:pt-6 md:pb-6">
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
              <div key={i} className={`flex flex-col ${cardBgClass} border ${borderClass} rounded-xl overflow-hidden relative aspect-square`}>
                <div className="absolute inset-0 p-4 flex flex-col items-center justify-center gap-2">
                  <Skeleton variant="circular" width={64} height={64} />
                  <Skeleton width={80} height={16} />
                  <Skeleton width={60} height={12} />
                </div>
              </div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
          >
            {employees.slice(0, visibleCount).map((emp) => (
              <EmployeeCard
                key={emp.id}
                employee={emp}
                shiftCount={shiftCounts[emp.id] || 0}
                onClick={onDetail}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}

            <LoadMore
              currentCount={visibleCount}
              totalCount={employees.length}
              onLoadMore={onLoadMore}
              unit="nhân viên"
              className="pt-2 pb-4 col-span-full"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {!loading && employees.length === 0 && (
        <div className={`text-center py-12 ${textMutedClass}`}>
          <Users size={24} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm">
            {searchTerm ? 'Không tìm thấy nhân viên nào' : 'Chưa có nhân viên nào'}
          </p>
        </div>
      )}
    </div>
  );
};

export default memo(EmployeeList);
