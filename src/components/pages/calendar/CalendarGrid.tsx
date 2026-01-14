import React, { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '../../ui/Skeleton';
import { Event, Location } from '../../../types';
import CalendarDay from './CalendarDay';
import { useThemeStyles } from '../../../hooks/useThemeStyles';

interface CalendarGridProps {
    daysInMonth: Date[];
    displayDate: Date;
    eventsByDate: Record<string, Event[]>;
    selectedDate: string | null;
    locations: Location[];
    loading?: boolean;
    onDateClick: (date: Date) => void;
}

const CalendarGrid: React.FC<CalendarGridProps> = ({
    daysInMonth,
    displayDate,
    eventsByDate,
    selectedDate,
    locations,
    loading = false,
    onDateClick
}) => {
    const { borderClass, textMutedClass } = useThemeStyles();
    
    // Key for animation based on month/year
    const monthKey = `${displayDate.getMonth()}-${displayDate.getFullYear()}`;

    return (
        <>
            <div className={`grid grid-cols-7 border-b ${borderClass}`}>
                {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map(d => (
                    <div key={d} className={`py-2 text-center text-[11px] font-medium ${textMutedClass}`}>{d}</div>
                ))}
            </div>

            <div className="grid grid-cols-7 p-2 gap-1 lg:flex-1 lg:auto-rows-fr overflow-hidden relative">
                <AnimatePresence mode="popLayout">
                    {loading ? (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="grid grid-cols-7 gap-1 col-span-7 h-full w-full"
                        >
                            {Array.from({ length: 35 }).map((_, i) => (
                                <Skeleton key={i} className="aspect-square lg:aspect-auto rounded" height="100%" />
                            ))}
                        </motion.div>
                    ) : (
                        <motion.div
                            key={monthKey}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="grid grid-cols-7 gap-1 col-span-7 h-full w-full"
                        >
                            {daysInMonth.map((date) => {
                                // Chống lệch ngày khi hiển thị (tùy vào logic gốc, ở đây giả định date chuẩn)
                                // Trong CalendarView gốc có logic xử lý offset. 
                                // Tuy nhiên daysInMonth thường đã là Date object.
                                // Logic so sánh dateStr:
                                const offset = date.getTimezoneOffset();
                                const localDate = new Date(date.getTime() - (offset * 60 * 1000));
                                const dateStr = localDate.toISOString().split('T')[0];

                                const dayEvents = eventsByDate[dateStr] || [];
                                const isSelected = selectedDate === dateStr;
                                const isToday = (() => {
                                    const now = new Date();
                                    return now.getFullYear() === date.getFullYear() &&
                                        now.getMonth() === date.getMonth() &&
                                        now.getDate() === date.getDate();
                                })();
                                const isCurrentMonth = date.getMonth() === displayDate.getMonth();

                                return (
                                    <CalendarDay
                                        key={dateStr}
                                        date={date}
                                        events={dayEvents}
                                        locations={locations}
                                        isSelected={isSelected}
                                        isToday={isToday}
                                        isCurrentMonth={isCurrentMonth}
                                        onClick={onDateClick}
                                    />
                                );
                            })}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </>
    );
};

export default memo(CalendarGrid);
