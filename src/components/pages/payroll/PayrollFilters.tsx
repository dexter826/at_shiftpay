import React, { memo } from 'react';
import { ArrowUpDown, CalendarDays } from 'lucide-react';
import SearchInput from '../../ui/SearchInput';
import { Dropdown, DropdownOption } from '../../ui/Dropdown';


interface PayrollFiltersProps {
  activeTab: 'payroll' | 'history';
  payrollSearchTerm: string;
  setPayrollSearchTerm: (value: string) => void;
  payrollSortBy: 'amount' | 'shifts' | 'name';
  setPayrollSortBy: (value: 'amount' | 'shifts' | 'name') => void;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  filterDate: string;
  onOpenFilterModal: () => void;
  setViewYear: (year: number) => void;
  currentYear: number;
}

const PayrollFilters: React.FC<PayrollFiltersProps> = ({
  activeTab,
  payrollSearchTerm,
  setPayrollSearchTerm,
  payrollSortBy,
  setPayrollSortBy,
  searchTerm,
  setSearchTerm,
  filterDate,
  onOpenFilterModal,
  setViewYear,
}) => {
  

  const payrollSortOptions: DropdownOption[] = [
    { value: 'amount', label: 'Số tiền cao' },
    { value: 'shifts', label: 'Nhiều công' },
    { value: 'name', label: 'Tên A-Z' }
  ];

  if (activeTab === 'payroll') {
    return (
      <div className="px-4 md:px-6 pb-2 flex gap-2">
        <SearchInput
          placeholder="Nhập tên nhân viên"
          value={payrollSearchTerm}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPayrollSearchTerm(e.target.value)}
          onClear={() => setPayrollSearchTerm('')}
          containerClassName="flex-1"
        />

        <Dropdown
          options={payrollSortOptions}
          value={payrollSortBy}
          onChange={(value) => setPayrollSortBy(value as 'amount' | 'shifts' | 'name')}
          icon={<ArrowUpDown size={16} />}
          className="h-10"
        />
      </div>
    );
  }

  // History tab
  return (
    <div className="px-4 md:px-6 pb-2 flex gap-2">
      <SearchInput
        placeholder="Nhập tên nhân viên"
        value={searchTerm}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
        onClear={() => setSearchTerm('')}
        containerClassName="flex-1"
      />
      <button
        onClick={() => {
          setViewYear(filterDate ? parseInt(filterDate.split('-')[0]) : new Date().getFullYear());
          onOpenFilterModal();
        }}
        className="flex items-center gap-2 px-3 h-10 border border-[var(--border-color)] rounded-lg bg-[var(--bg-card)] text-sm text-[var(--text-primary)]"
      >
        <CalendarDays size={16} className={filterDate ? 'text-primary' : 'text-[var(--text-muted)]'} />
        <span className={filterDate ? 'text-primary font-medium' : 'text-[var(--text-muted)]'}>
          {filterDate ? `Tháng ${filterDate.split('-')[1]}/${filterDate.split('-')[0]}` : 'Tất cả thời gian'}
        </span>
      </button>
    </div>
  );
};

export default memo(PayrollFilters);
