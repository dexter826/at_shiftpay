import React, { memo } from 'react';
import SearchInput from '../../ui/SearchInput';
import { Dropdown } from '../../ui/Dropdown';

interface LocationToolbarProps {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    onClearSearch: () => void;
    filterType: 'all' | 'high' | 'low';
    onFilterChange: (value: 'all' | 'high' | 'low') => void;
    sortBy: 'name' | 'count' | 'newest';
    onSortChange: (value: 'name' | 'count' | 'newest') => void;
}

const LocationToolbar: React.FC<LocationToolbarProps> = ({
    searchTerm,
    onSearchChange,
    onClearSearch,
    filterType,
    onFilterChange,
    sortBy,
    onSortChange
}) => {
    return (
        <div className="flex flex-col md:flex-row gap-3 mb-6">
            <SearchInput
                placeholder="Tìm tên địa điểm..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                onClear={onClearSearch}
                containerClassName="flex-1"
            />
            <div className="flex gap-2">
                <Dropdown
                    options={[
                        { value: 'all', label: 'Tất cả' },
                        { value: 'high', label: 'Tốt' },
                        { value: 'low', label: 'Kém' }
                    ]}
                    value={filterType}
                    onChange={(value) => onFilterChange(value as any)}
                    className="flex-1 md:min-w-[120px] h-[42px]"
                />
                <Dropdown
                    options={[
                        { value: 'newest', label: 'Mới nhất' },
                        { value: 'name', label: 'Tên A-Z' },
                        { value: 'count', label: 'Làm nhiều nhất' }
                    ]}
                    value={sortBy}
                    onChange={(value) => onSortChange(value as any)}
                    className="flex-1 md:min-w-[150px] h-[42px]"
                />
            </div>
        </div>
    );
};

export default memo(LocationToolbar);
