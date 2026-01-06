import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '../ui/Skeleton';
import { Event, Shift, Employee, UserSettings, Location } from '../../types';
import { formatDate } from '../../constants';
import { ChevronLeft, ChevronRight, Plus, MapPin, Edit2, Trash2, Calendar, ThumbsUp, ThumbsDown } from 'lucide-react';
import { EventModal } from '../modals/EventModal';
import { EventDetailModal } from '../modals/EventDetailModal';
import { dbService } from '../../services';
import { useToast } from '../ui/Toast';
import { Modal } from '../ui/Modal';
import Button from '../ui/Button';
import { useThemeStyles } from '../../hooks/useThemeStyles';

interface CalendarViewProps {
  events: Event[];
  shifts: Shift[];
  employees: Employee[];
  locations: Location[];
  totalDebt: number;
  settings: UserSettings;
  currentDate?: Date;
  onDateChange?: (date: Date) => void;
  onNavigateToReviews?: () => void;
  loading?: boolean;
}

const CalendarView: React.FC<CalendarViewProps> = ({
  events,
  shifts,
  employees,
  locations,
  settings,
  currentDate: propDate,
  onDateChange,
  onNavigateToReviews,
  loading = false
}) => {
  const { showToast } = useToast();
  const {
    bgClass,
    cardBgClass,
    borderClass,
    textPrimaryClass,
    textMutedClass,
    hoverBgClass,
    theme
  } = useThemeStyles();

  const [localDate, setLocalDate] = useState(new Date());
  const displayDate = propDate || localDate;

  // Đồng bộ localDate khi propDate thay đổi
  React.useEffect(() => {
    if (propDate) setLocalDate(propDate);
  }, [propDate]);

  const monthLabel = new Intl.DateTimeFormat('vi-VN', { month: 'long', year: 'numeric' }).format(displayDate);
  const showLoading = loading;

  const handleMonthChange = (newDate: Date) => {
    if (onDateChange) {
      onDateChange(newDate);
    } else {
      setLocalDate(newDate);
    }
  };

  const [selectedDate, setSelectedDate] = useState<string | null>(() => {
    const today = new Date();
    const offset = today.getTimezoneOffset();
    const localToday = new Date(today.getTime() - (offset * 60 * 1000));
    return localToday.toISOString().split('T')[0];
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [viewingEvent, setViewingEvent] = useState<Event | null>(null);

  const daysInMonth = useMemo(() => {
    const year = displayDate.getFullYear();
    const month = displayDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const days: Date[] = [];

    // Các ngày của tháng trước
    const prevMonthLastDay = new Date(year, month, 0);
    const prevDaysCount = firstDayOfMonth.getDay();
    for (let i = prevDaysCount - 1; i >= 0; i--) {
      days.push(new Date(year, month - 1, prevMonthLastDay.getDate() - i));
    }

    // Các ngày của tháng hiện tại
    const date = new Date(firstDayOfMonth);
    while (date.getMonth() === month) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }

    // Các ngày của tháng sau để lấp đầy lưới (6 hàng * 7 ngày = 42 ô)
    const nextDaysCount = 42 - days.length;
    for (let i = 1; i <= nextDaysCount; i++) {
      days.push(new Date(year, month + 1, i));
    }
    return days;
  }, [displayDate]);

  const prevMonth = () => handleMonthChange(new Date(displayDate.getFullYear(), displayDate.getMonth() - 1, 1));
  const nextMonth = () => handleMonthChange(new Date(displayDate.getFullYear(), displayDate.getMonth() + 1, 1));
  const goToToday = () => {
    const today = new Date();
    const todayStr = new Date(today.getTime() - (today.getTimezoneOffset() * 60 * 1000)).toISOString().split('T')[0];

    const isSameMonth = displayDate.getFullYear() === today.getFullYear() &&
      displayDate.getMonth() === today.getMonth();

    if (isSameMonth && selectedDate === todayStr) return;

    handleMonthChange(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(todayStr);
  };

  const eventsByDate = useMemo(() => {
    const map: Record<string, Event[]> = {};
    events.forEach((e: Event) => {
      if (!map[e.date]) map[e.date] = [];
      map[e.date].push(e);
    });
    return map;
  }, [events]);

  const handleDateClick = (date: Date) => {
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - (offset * 60 * 1000));
    const dateStr = localDate.toISOString().split('T')[0];
    setSelectedDate(dateStr);

    if (date.getMonth() !== displayDate.getMonth()) {
      handleMonthChange(new Date(date.getFullYear(), date.getMonth(), 1));
    }
  };

  const handleAddEvent = () => {
    setShiftsForEditing([]);
    setEditingEvent(null);
    setIsModalOpen(true);
  };

  const handleEditEvent = (evt: Event) => {
    const eventShifts = shifts.filter((s: Shift) => s.eventId === evt.id);
    setShiftsForEditing(eventShifts);
    setEditingEvent(evt);
    setIsModalOpen(true);
  };

  const handleDeleteEvent = (id: string) => {
    setDeleteConfirm(id);
  };

  const confirmDeleteEvent = async () => {
    if (deleteConfirm) {
      const eventShifts = shifts.filter((s: Shift) => s.eventId === deleteConfirm);
      await dbService.deleteEventWithShifts(deleteConfirm, eventShifts.map((s: Shift) => s.id));
      showToast('Đã xóa sự kiện', 'success');
      setDeleteConfirm(null);
    }
  };

  const handleViewEvent = (evt: Event) => {
    setViewingEvent(evt);
  };

  const selectedEvents = selectedDate ? eventsByDate[selectedDate] || [] : [];

  const [shiftsForEditing, setShiftsForEditing] = useState<Shift[]>([]);

  const shiftsForDisplay = useMemo(() => {
    if (!selectedDate) return [];
    return shifts.filter((s: Shift) => s.date === selectedDate);
  }, [selectedDate, shifts]);

  return (
    <div className={`pb-16 md:pb-0 ${bgClass} min-h-screen relative`}>
      <div className="p-4 md:p-6 flex flex-col lg:flex-row gap-4 lg:gap-6 lg:h-[calc(100vh-3rem)]">
        {/* Calendar */}
        <div className="flex-1">
          <div className={`${cardBgClass} border ${borderClass} rounded-lg lg:h-full flex flex-col`}>
            <div className={`flex items-center justify-between px-4 py-3 border-b ${borderClass}`}>
              <div className="flex items-center gap-1">
                <button
                  onClick={goToToday}
                  className={`px-2 py-1 text-[10px] font-medium rounded border ${borderClass} ${hoverBgClass} transition-colors mr-1`}
                >
                  Hôm nay
                </button>
                <button onClick={prevMonth} className={`p-1.5 ${textMutedClass} ${hoverBgClass} rounded transition-colors`}>
                  <ChevronLeft size={18} />
                </button>
                <button onClick={nextMonth} className={`p-1.5 ${textMutedClass} ${hoverBgClass} rounded transition-colors`}>
                  <ChevronRight size={18} />
                </button>
              </div>
              <h3 className={`text-sm font-medium ${textPrimaryClass} capitalize`}>{monthLabel}</h3>
              <div className="flex items-center gap-1">
                {onNavigateToReviews && (
                  <button
                    onClick={onNavigateToReviews}
                    title="Quản lý địa điểm"
                    className={`p-1.5 ${hoverBgClass} rounded transition-colors text-primary`}
                  >
                    <MapPin size={18} />
                  </button>
                )}
              </div>
            </div>

            <div className={`grid grid-cols-7 border-b ${borderClass}`}>
              {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map(d => (
                <div key={d} className={`py-2 text-center text-[11px] font-medium ${textMutedClass}`}>{d}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 p-2 gap-1 lg:flex-1 lg:auto-rows-fr overflow-hidden relative">
              <AnimatePresence mode="popLayout">
                {showLoading ? (
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
                    key={monthLabel}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="grid grid-cols-7 gap-1 col-span-7 h-full w-full"
                  >
                    {daysInMonth.map((date, idx) => {
                      const offset = date.getTimezoneOffset();
                      const localDate = new Date(date.getTime() - (offset * 60 * 1000));
                      const dateStr = localDate.toISOString().split('T')[0];

                      const dayEvents = eventsByDate[dateStr] || [];
                      const isSelected = selectedDate === dateStr;
                      const isToday = new Date().toISOString().split('T')[0] === dateStr;
                      const isCurrentMonth = date.getMonth() === displayDate.getMonth();

                      return (
                        <motion.button
                          key={dateStr}
                          onClick={() => handleDateClick(date)}
                          whileHover={{ zIndex: 10 }}
                          whileTap={{ scale: 0.95 }}
                          className={`aspect-square lg:aspect-auto flex flex-col items-center justify-center rounded-xl text-sm transition-all duration-200 relative overflow-hidden ${isSelected
                            ? 'bg-primary text-white shadow-lg shadow-primary/30'
                            : isToday
                              ? `${theme === 'dark' ? 'bg-slate-800' : 'bg-primary/10'} text-primary font-bold ring-2 ring-primary/20`
                              : `${isCurrentMonth ? textPrimaryClass : textMutedClass + ' opacity-40'} ${hoverBgClass}`
                            }`}
                        >
                          <span className="relative z-10">{date.getDate()}</span>

                          {dayEvents.length > 0 && (
                            <div className="absolute top-1 right-1 flex flex-col gap-0.5 pointer-events-none">
                              {dayEvents.length > 1 && (
                                <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold ${isSelected ? 'bg-white text-primary' : 'bg-primary text-white shadow-sm'}`}>
                                  {dayEvents.length}
                                </div>
                              )}
                            </div>
                          )}

                          {dayEvents.length > 0 && (
                            <div className="flex flex-wrap justify-center gap-1 mt-1 px-1">
                              {dayEvents.slice(0, 3).map((evt, i) => {
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
                              {dayEvents.length > 3 && <div className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white/40' : 'bg-slate-400'}`} />}
                            </div>
                          )}
                        </motion.button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Chi tiết bên phải */}
        <div className="w-full lg:w-72">
          <div className={`${cardBgClass} border ${borderClass} rounded-lg lg:h-full flex flex-col`}>
            {selectedDate ? (
              <div className="flex flex-col h-full">
                <div className={`px-4 py-3 border-b ${borderClass} flex justify-between items-center`}>
                  <div>
                    <p className={`text-[11px] ${textMutedClass} uppercase tracking-wide`}>Ngày chọn</p>
                    <h3 className={`text-sm font-medium ${textPrimaryClass} mt-0.5`}>{formatDate(selectedDate)}</h3>
                  </div>
                  <button onClick={handleAddEvent} className="p-2 bg-primary text-white rounded-lg hover:bg-yellow-600 transition-colors">
                    <Plus size={16} />
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
                    ) : selectedEvents.length === 0 ? (
                      <motion.div key="empty-sidebar" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className={`flex flex-col items-center justify-center py-12 ${textMutedClass} text-sm`}>
                        <p>Chưa có sự kiện</p>
                        <button onClick={handleAddEvent} className="text-primary mt-1 hover:underline text-xs">Tạo mới</button>
                      </motion.div>
                    ) : (
                      <motion.div key="content-sidebar" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="space-y-2">
                        {selectedEvents.map(evt => {
                          const loc = locations.find(l => l.id === evt.locationId);
                          return (
                            <div
                              key={evt.id}
                              onClick={() => handleViewEvent(evt)}
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
                                        <MapPin size={12} className="flex-shrink-0" />
                                        <span className="truncate">{loc.name}</span>
                                      </p>
                                    )}
                                    {evt.note && <p className={`text-xs ${textMutedClass} mt-1 line-clamp-2`}>{evt.note}</p>}
                                  </div>
                                </div>
                                <div className="flex gap-1 flex-shrink-0" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                                  <button onClick={() => handleEditEvent(evt)} className={`p-1 ${textMutedClass} hover:text-primary transition-colors`}>
                                    <Edit2 size={14} />
                                  </button>
                                  <button onClick={() => handleDeleteEvent(evt.id)} className={`p-1 ${textMutedClass} hover:text-red-500 transition-colors`}>
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>
                              <div className="flex gap-2 mt-2 ml-5">
                                {(['morning', 'afternoon'] as const).map(session => {
                                  const count = shiftsForDisplay.filter((s: Shift) => s.eventId === evt.id && s.session === session).length;
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
        </div>
      </div>

      <EventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        date={selectedDate || new Date().toISOString().split('T')[0]}
        existingEvent={editingEvent}
        existingShifts={shiftsForEditing}
        employees={employees}
        locations={locations}
        settings={settings}
        onSuccess={() => setIsModalOpen(false)}
      />

      <Modal
        title="Xác nhận xóa"
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        footer={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setDeleteConfirm(null)} className="flex-1">Hủy</Button>
            <Button variant="danger" onClick={confirmDeleteEvent} className="flex-1">Xóa</Button>
          </div>
        }
      >
        <p className={`text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>Bạn có chắc muốn xóa sự kiện này?</p>
      </Modal>

      <EventDetailModal
        event={viewingEvent}
        shifts={shifts}
        locations={locations}
        isOpen={!!viewingEvent}
        onClose={() => setViewingEvent(null)}
        onEdit={handleEditEvent}
        onDelete={handleDeleteEvent}
        settings={settings}
      />
    </div>
  );
};

export default CalendarView;
