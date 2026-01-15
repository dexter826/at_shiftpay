import React, { memo } from 'react';
import { ArrowUpDown } from 'lucide-react';
import PlusIcon from '../../ui/icons/plus-icon';
import Button from '../../ui/Button';
import SearchInput from '../../ui/SearchInput';
import { Dropdown } from '../../ui/Dropdown';
import { Skeleton } from '../../ui/Skeleton';
import { useThemeStyles } from '../../../hooks/useThemeStyles';

interface EmployeeToolbarProps {
  employeeCount: number;
  loading: boolean;
  onAdd: () => void;
  searchTerm: string;
  onSearchChange: (val: string) => void;
  onClearSearch: () => void;
  sortBy: 'name' | 'shifts' | 'recent';
  onSortChange: (val: 'name' | 'shifts' | 'recent') => void;
}

const EmployeeToolbar: React.FC<EmployeeToolbarProps> = ({
  employeeCount,
  loading,
  onAdd,
  searchTerm,
  onSearchChange,
  onClearSearch,
  sortBy,
  onSortChange,
}) => {
  const { borderClass, textPrimaryClass } = useThemeStyles();

  const sortOptions = [
    { value: 'name', label: 'Tên A-Z' },
    { value: 'shifts', label: 'Nhiều công' },
    { value: 'recent', label: 'Mới nhất' }
  ];

  return (
    <div className={`py-4 px-4 md:px-6 border-b ${borderClass}`}>
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-lg font-semibold ${textPrimaryClass}`}>
            {loading ? <Skeleton width={120} height={24} /> : `${employeeCount} nhân viên`}
          </h1>
        </div>
        <Button
          onClick={onAdd}
          disabled={loading}
          className=""
          icon={<PlusIcon size={18} />}
        >
          <span className="hidden sm:inline">Thêm mới</span>
        </Button>
      </div>

      <div className="mt-4 flex gap-2">
        <SearchInput
          placeholder="Nhập từ khóa tìm kiếm"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          onClear={onClearSearch}
          disabled={loading}
          containerClassName="flex-1"
        />

        <Dropdown
          options={sortOptions}
          value={sortBy}
          onChange={(value) => onSortChange(value as any)}
          icon={<ArrowUpDown size={16} />}
          disabled={loading}
          className="h-[42px]"
        />
      </div>
    </div>
  );
};

export default memo(EmployeeToolbar);
