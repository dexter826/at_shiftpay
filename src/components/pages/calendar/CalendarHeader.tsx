import React, { memo, useRef } from 'react';
import CalendarIcon from '../../ui/icons/calendar-icon';
import ChevronLeftIcon from '../../ui/icons/chevron-left-icon';
import ChevronRightIcon from '../../ui/icons/chevron-right-icon';
import MapPinIcon from '../../ui/icons/map-pin-icon';
import { AnimatedIconHandle } from '../../ui/icons/types';

interface CalendarHeaderProps {
    displayDate: Date;
    onPrevMonth: () => void;
    onNextMonth: () => void;
    onGoToToday: () => void;
    onNavigateToReviews?: () => void;
}

const CalendarHeader: React.FC<CalendarHeaderProps> = ({
    displayDate,
    onPrevMonth,
    onNextMonth,
    onGoToToday,
    onNavigateToReviews
}) => {
    const prevMonthRef = useRef<AnimatedIconHandle>(null);
    const nextMonthRef = useRef<AnimatedIconHandle>(null);
    const todayIconRef = useRef<AnimatedIconHandle>(null);
    const locationManagerRef = useRef<AnimatedIconHandle>(null);

    const monthLabel = new Intl.DateTimeFormat('vi-VN', { month: 'long', year: 'numeric' }).format(displayDate);

    return (
        <div className={`flex items-center justify-between px-4 py-3 border-b border-[var(--border-color)]`}>
            <div className="flex items-center gap-1">
                <button
                    onClick={onGoToToday}
                    onMouseEnter={() => todayIconRef.current?.startAnimation()}
                    onMouseLeave={() => todayIconRef.current?.stopAnimation()}
                    className={`px-2.5 py-1.5 text-[11px] font-medium rounded border border-[var(--border-color)] hover:bg-[var(--border-color)] transition-colors mr-1 flex items-center gap-1`}
                >
                    <CalendarIcon ref={todayIconRef} size={12} />
                    Hôm nay
                </button>
                <button
                    onClick={onPrevMonth}
                    onMouseEnter={() => prevMonthRef.current?.startAnimation()}
                    onMouseLeave={() => prevMonthRef.current?.stopAnimation()}
                    className={`p-2 text-[var(--text-muted)] hover:bg-[var(--border-color)] rounded transition-colors`}
                >
                    <ChevronLeftIcon ref={prevMonthRef} size={18} />
                </button>
                <button
                    onClick={onNextMonth}
                    onMouseEnter={() => nextMonthRef.current?.startAnimation()}
                    onMouseLeave={() => nextMonthRef.current?.stopAnimation()}
                    className={`p-2 text-[var(--text-muted)] hover:bg-[var(--border-color)] rounded transition-colors`}
                >
                    <ChevronRightIcon ref={nextMonthRef} size={18} />
                </button>
            </div>
            <h3 className={`text-sm font-medium text-[var(--text-primary)] capitalize`}>{monthLabel}</h3>
            <div className="flex items-center gap-1">
                {onNavigateToReviews && (
                    <button
                        onClick={onNavigateToReviews}
                        title="Quản lý địa điểm"
                        onMouseEnter={() => locationManagerRef.current?.startAnimation()}
                        onMouseLeave={() => locationManagerRef.current?.stopAnimation()}
                        className={`h-9 w-9 flex items-center justify-center hover:bg-[var(--border-color)] rounded transition-colors text-primary`}
                    >
                        <MapPinIcon ref={locationManagerRef} size={18} />
                    </button>
                )}
            </div>
        </div>
    );
};

export default memo(CalendarHeader);
