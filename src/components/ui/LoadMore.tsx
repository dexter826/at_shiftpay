import React, { useRef } from 'react';
import PlusIcon from './icons/plus-icon';
import { AnimatedIconHandle } from './icons/types';
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

    const plusIconRef = useRef<AnimatedIconHandle>(null);

    return (
        <div className={`col-span-full flex flex-col items-center justify-center gap-2 ${className}`}>
            <button
                onClick={onLoadMore}
                onMouseEnter={() => plusIconRef.current?.startAnimation()}
                onMouseLeave={() => plusIconRef.current?.stopAnimation()}
                className={`
          flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all
          border ${borderClass} ${cardBgClass}
          hover:border-primary/50 hover:text-primary active:scale-95
          ${textPrimaryClass}
        `}
            >
                <span>Xem thêm</span>
                <PlusIcon ref={plusIconRef} size={14} />
            </button>
            <div className={`text-[11px] ${textMutedClass} tracking-wide uppercase font-medium`}>
                {Math.min(currentCount, totalCount)} / {totalCount} {unit}
            </div>
        </div>
    );
};
