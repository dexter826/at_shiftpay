import React from 'react';
import { Plus } from 'lucide-react';

interface LoadMoreProps {
    currentCount: number;
    totalCount: number;
    onLoadMore: () => void;
    unit: string;
    className?: string;
}

export const LoadMore: React.FC<LoadMoreProps> = ({
    currentCount,
    totalCount,
    onLoadMore,
    unit,
    className = ""
}) => {
    if (currentCount >= totalCount) return null;

    return (
        <div className={`col-span-full flex flex-col items-center justify-center gap-2 ${className}`}>
            <button
                onClick={onLoadMore}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-primary)] hover:border-primary/50 hover:text-primary active:scale-95"
            >
                <span>Xem thêm</span>
                <Plus size={14} />
            </button>
            <div className="text-[11px] text-[var(--text-muted)] tracking-wide uppercase font-medium">
                {Math.min(currentCount, totalCount)} / {totalCount} {unit}
            </div>
        </div>
    );
};
