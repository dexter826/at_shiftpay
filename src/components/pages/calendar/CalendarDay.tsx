import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { Event, Location } from '../../../types';
import { useThemeStore } from '../../../stores';

interface CalendarDayProps {
    date: Date;
    events: Event[];
    locations: Location[];
    isSelected: boolean;
    isToday: boolean;
    isCurrentMonth: boolean;
    onClick: (date: Date) => void;
}

const CalendarDay: React.FC<CalendarDayProps> = ({
    date,
    events,
    locations,
    isSelected,
    isToday,
    isCurrentMonth,
    onClick
}) => {
    const theme = useThemeStore(state => state.theme);
    // Using dateStr for key prop happens in parent
    
    return (
        <motion.button
            onClick={() => onClick(date)}
            whileHover={{ zIndex: 10 }}
            whileTap={{ scale: 0.95 }}
            className={`aspect-square lg:aspect-auto flex flex-col items-center justify-center rounded-lg text-sm transition-all duration-200 relative overflow-hidden ${isSelected
                ? 'bg-primary text-white shadow-lg shadow-primary/30'
                : isToday
                    ? 'bg-primary/10 text-primary font-bold ring-2 ring-primary/20'
                    : `${isCurrentMonth ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)] opacity-40'} hover:bg-[var(--border-color)]`
                }`}
        >
            <span className="relative z-10">{date.getDate()}</span>

            {events.length > 0 && (
                <div className="absolute top-1 right-1 flex flex-col gap-0.5 pointer-events-none">
                    {events.length > 1 && (
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold ${isSelected ? 'bg-white text-primary' : 'bg-primary text-white shadow-sm'}`}>
                            {events.length}
                        </div>
                    )}
                </div>
            )}

            {events.length > 0 && (
                <div className="flex flex-wrap justify-center gap-1 mt-1 px-1">
                    {events.slice(0, 3).map((evt, i) => {
                        const loc = locations.find(l => l.id === evt.locationId);
                        return (
                            <div key={i} className="flex items-center">
                                {loc?.review === 'high' ? (
                                    <ThumbsUp size={10} className={isSelected ? 'text-white' : 'text-green-500'} />
                                ) : loc?.review === 'low' ? (
                                    <ThumbsDown size={10} className={isSelected ? 'text-white' : 'text-red-500'} />
                                ) : (
                                    <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white/60' : 'bg-primary/60'}`} />
                                )}
                            </div>
                        );
                    })}
                    {events.length > 3 && <div className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white/40' : 'bg-slate-400'}`} />}
                </div>
            )}
        </motion.button>
    );
};

export default memo(CalendarDay);
