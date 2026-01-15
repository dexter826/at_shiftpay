import React, { memo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, ThumbsUp, ThumbsDown, MapPin, Pencil, Trash2 } from 'lucide-react';
import PlusIcon from '../../ui/icons/plus-icon';
import PenIcon from '../../ui/icons/pen-icon';
import TrashIcon from '../../ui/icons/trash-icon';
import MapPinIcon from '../../ui/icons/map-pin-icon';
import { AnimatedIconHandle } from '../../ui/icons/types';
import { CardActionButton } from '../../ui/CardActionButton';
import { Skeleton } from '../../ui/Skeleton';
import { Event, Shift, Location } from '../../../types';
import { formatDate } from '../../../utils/format';
import { useThemeStyles } from '../../../hooks/useThemeStyles';

interface CalendarSidebarProps {
    selectedDate: string | null;
    events: Event[];
    shifts: Shift[]; // Need full shifts to filter by eventId and session
    locations: Location[];
    loading?: boolean;
    onAddEvent: () => void;
    onEditEvent: (evt: Event) => void;
    onDeleteEvent: (id: string) => void;
    onViewEvent: (evt: Event) => void;
}

const CalendarSidebar: React.FC<CalendarSidebarProps> = ({
    selectedDate,
    events,
    shifts,
    locations,
    loading = false,
    onAddEvent,
    onEditEvent,
    onDeleteEvent,
    onViewEvent
}) => {
    const {
        theme,
        borderClass,
        cardBgClass,
        textPrimaryClass,
        textMutedClass
    } = useThemeStyles();

    const headerAddRef = useRef<AnimatedIconHandle>(null);
    const emptyAddRef = useRef<AnimatedIconHandle>(null);

    return (
        <div className={`${cardBgClass} border ${borderClass} rounded-lg lg:h-full flex flex-col`}>
            {selectedDate ? (
                <div className="flex flex-col h-full">
                    <div className={`px-4 py-3 border-b ${borderClass} flex justify-between items-center`}>
                        <div>
                            <p className={`text-[11px] ${textMutedClass} uppercase tracking-wide`}>Ngày chọn</p>
                            <h3 className={`text-sm font-medium ${textPrimaryClass} mt-0.5`}>{formatDate(selectedDate)}</h3>
                        </div>
                        <button
                            onClick={onAddEvent}
                            onMouseEnter={() => headerAddRef.current?.startAnimation()}
                            onMouseLeave={() => headerAddRef.current?.stopAnimation()}
                            className={`p-2 rounded-lg bg-primary hover:bg-primary/90 text-white shadow-sm shadow-primary/30 transition-all active:scale-95`}
                        >
                            <PlusIcon ref={headerAddRef} size={16} className="text-white" />
                        </button>
                    </div>

                    <div className="flex-1 p-3 space-y-2 overflow-y-auto">
                        <AnimatePresence mode="wait">
                            {loading ? (
                                <motion.div key="loading-sidebar" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="space-y-2">
                                    {Array.from({ length: 3 }).map((_, i) => (
                                        <div key={i} className={`p-3 border ${borderClass} rounded-lg ${theme === 'dark' ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
                                            <div className="flex justify-between items-start gap-2 mb-2">
                                                <Skeleton variant="circular" width={14} height={14} />
                                                <div className="flex-1">
                                                    <Skeleton width="60%" height={16} className="mb-2" />
                                                    <Skeleton width="90%" height={12} />
                                                </div>
                                            </div>
                                            <Skeleton width="30%" height={20} className="ml-5" />
                                        </div>
                                    ))}
                                </motion.div>
                            ) : events.length === 0 ? (
                                <motion.div key="empty-sidebar" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className={`flex flex-col items-center justify-center py-12 ${textMutedClass} text-sm`}>
                                    <p>Chưa có sự kiện</p>
                                    <button
                                        onClick={onAddEvent}
                                        onMouseEnter={() => emptyAddRef.current?.startAnimation()}
                                        onMouseLeave={() => emptyAddRef.current?.stopAnimation()}
                                        className="text-primary mt-1 hover:underline text-xs flex items-center justify-center gap-1"
                                    >
                                        <PlusIcon ref={emptyAddRef} size={12} />
                                        Tạo mới
                                    </button>
                                </motion.div>
                            ) : (
                                <motion.div key="content-sidebar" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="space-y-2">
                                    {events.map(evt => {
                                        const loc = locations.find(l => l.id === evt.locationId);
                                        return (
                                            <div
                                                key={evt.id}
                                                onClick={() => onViewEvent(evt)}
                                                className={`group p-3 ${theme === 'dark' ? 'bg-slate-800/50' : 'bg-slate-50'} border ${borderClass} rounded-lg hover:border-primary/50 transition-colors cursor-pointer`}
                                            >
                                                <div className="flex justify-between items-start gap-2">
                                                    <div className="flex items-start gap-2 flex-1 min-w-0">
                                                        <Calendar size={14} className="text-primary mt-0.5 flex-shrink-0" />
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-1.5 min-w-0">
                                                                <h4 className={`text-sm font-medium ${textPrimaryClass} truncate`}>{evt.title}</h4>
                                                                {loc?.review === 'high' && <ThumbsUp size={12} className="text-green-500 flex-shrink-0" />}
                                                                {loc?.review === 'low' && <ThumbsDown size={12} className="text-red-500 flex-shrink-0" />}
                                                            </div>
                                                            {loc && (
                                                                <p className={`text-[11px] text-blue-500 mt-0.5 flex items-center gap-1 min-w-0`}>
                                                                    <MapPinIcon size={12} className="flex-shrink-0" />
                                                                    <span className="truncate">{loc.name}</span>
                                                                </p>
                                                            )}
                                                            {evt.note && <p className={`text-xs ${textMutedClass} mt-1 line-clamp-2`}>{evt.note}</p>}
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2.5 flex-shrink-0" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                                                        <Pencil 
                                                            size={15} 
                                                            onClick={() => onEditEvent(evt)}
                                                            className="text-primary hover:text-primary/70 transition-colors cursor-pointer"
                                                        />
                                                        <Trash2 
                                                            size={15} 
                                                            onClick={() => onDeleteEvent(evt.id)}
                                                            className="text-red-500 hover:text-red-500/70 transition-colors cursor-pointer"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex gap-2 mt-2 ml-5">
                                                    {(['morning', 'afternoon'] as const).map(session => {
                                                        const count = shifts.filter((s: Shift) => s.eventId === evt.id && s.session === session).length;
                                                        if (count === 0) return null;
                                                        return (
                                                            <span key={session} className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${session === 'morning' ? 'bg-orange-500/10 text-orange-500' : 'bg-primary/10 text-primary'}`}>
                                                                {session === 'morning' ? 'Sáng' : 'Chiều'}: {count} công
                                                            </span>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            ) : (
                <div className={`flex flex-col items-center justify-center h-64 ${textMutedClass} text-sm`}>
                    <p>Chọn ngày để xem</p>
                </div>
            )}
        </div>
    );
};

export default memo(CalendarSidebar);
