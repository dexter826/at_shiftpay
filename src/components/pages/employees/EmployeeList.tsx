import React, { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users } from 'lucide-react';
import { Skeleton } from '../../ui/Skeleton';
import { LoadMore } from '../../ui/LoadMore';
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
  employees, loading, visibleCount, onLoadMore, shiftCounts, onEdit, onDelete, onDetail, searchTerm,
}) => {
  return (
    <div className="px-4 md:px-6 pt-2 pb-4">
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                <div key={i} className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg aspect-square p-3 flex flex-col items-center justify-center gap-2">
                  <Skeleton variant="circular" width={48} height={48} />
                  <Skeleton variant="text" width="60%" height={14} />
                  <Skeleton variant="text" width="40%" height={11} />
                </div>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {employees.slice(0, visibleCount).map((emp) => (
                <EmployeeCard key={emp.id} employee={emp} shiftCount={shiftCounts[emp.id] || 0} onClick={onDetail} onEdit={onEdit} onDelete={onDelete} />
              ))}
            </div>

            {employees.length === 0 && !loading && (
              <div className="text-center py-12 text-[var(--text-muted)]">
                <Users size={24} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">{searchTerm ? 'Không tìm thấy nhân viên nào' : 'Chưa có nhân viên nào'}</p>
              </div>
            )}

            <LoadMore currentCount={visibleCount} totalCount={employees.length} onLoadMore={onLoadMore} unit="nhân viên" className="mt-3 col-span-full" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default memo(EmployeeList);
