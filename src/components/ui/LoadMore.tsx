import React from 'react';
import { Plus } from 'lucide-react';
import { useThemeStyles } from '../../hooks/useThemeStyles';

interface LoadMoreProps {
    currentCount: number;
    totalCount: number;
    onLoadMore: () => void;
    unit: string;
    className?: string;
}

/**
 * Component hiển thị nút "Xem thêm" cùng với thông tin số lượng item.
 * Được thiết kế để dùng chung cho các danh sách (Địa điểm, Nhân viên, Giao dịch...).
 */
export const LoadMore: React.FC<LoadMoreProps> = ({
    currentCount,
    totalCount,
    onLoadMore,
    unit,
    className = ""
}) => {
    const {
        cardBgClass,
        borderClass,
        textPrimaryClass,
        textMutedClass
    } = useThemeStyles();

    if (currentCount >= totalCount) return null;

    return (
        <div className={`col-span-full flex flex-col items-center justify-center gap-2 ${className}`}>
            <button
                onClick={onLoadMore}
                className={`
          flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all
          border ${borderClass} ${cardBgClass}
          hover:border-primary/50 hover:text-primary active:scale-95
          ${textPrimaryClass}
        `}
            >
                <span>Xem thêm</span>
                <Plus size={14} />
            </button>
            <div className={`text-[11px] ${textMutedClass} tracking-wide uppercase font-medium`}>
                {Math.min(currentCount, totalCount)} / {totalCount} {unit}
            </div>
        </div>
    );
};
