import React, { useState, useMemo } from 'react';
import { Event, Shift, Employee, UserSettings, DEFAULT_SETTINGS } from '../types';
import { formatDate } from '../constants';
import { ChevronLeft, ChevronRight, Plus, MapPin, Edit2, Trash2, Clock } from 'lucide-react';
import { EventModal } from './EventModal';
import { dbService } from '../services/firebase';
import { useToast } from './ui/Toast';
import { Modal } from './ui/Modal';
import Button from './ui/Button';
import { useTheme } from '../contexts/ThemeContext';

interface CalendarViewProps {
  events: Event[];
  shifts: Shift[];
  employees: Employee[];
  totalDebt: number;
  settings: UserSettings;
  currentDate?: Date;
  onDateChange?: (date: Date) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  events,
  shifts,
  employees,
  totalDebt,
  settings,
  currentDate: propDate,
  onDateChange
}) => {
  const { showToast } = useToast();
  const { theme } = useTheme();

  // Theme classes
  const bgClass = theme === 'dark' ? 'bg-slate-900' : 'bg-slate-50';
  const cardBgClass = theme === 'dark' ? 'bg-slate-900' : 'bg-white';
  const borderClass = theme === 'dark' ? 'border-slate-800' : 'border-slate-200';
  const textPrimaryClass = theme === 'dark' ? 'text-slate-200' : 'text-slate-700';
  const textMutedClass = theme === 'dark' ? 'text-slate-500' : 'text-slate-500';
  const hoverBgClass = theme === 'dark' ? 'hover:bg-slate-800' : 'hover:bg-slate-100';

  const [localDate, setLocalDate] = useState(new Date());
  const displayDate = propDate || localDate;

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
    const localDate = new Date(today.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [viewingEvent, setViewingEvent] = useState<Event | null>(null);

  const daysInMonth = useMemo(() => {
    const year = displayDate.getFullYear();
    const month = displayDate.getMonth();
    const date = new Date(year, month, 1);
    const days = [];

    for (let i = 0; i < date.getDay(); i++) {
      days.push(null);
    }

    while (date.getMonth() === month) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    return days;
  }, [displayDate]);

  const monthLabel = new Intl.DateTimeFormat('vi-VN', { month: 'long', year: 'numeric' }).format(displayDate);

  const prevMonth = () => handleMonthChange(new Date(displayDate.getFullYear(), displayDate.getMonth() - 1, 1));
  const nextMonth = () => handleMonthChange(new Date(displayDate.getFullYear(), displayDate.getMonth() + 1, 1));

  const eventsByDate = useMemo(() => {
    const map: Record<string, Event[]> = {};
    events.forEach(e => {
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
  };

  const handleAddEvent = () => {
    setShiftsForEditing([]);
    setEditingEvent(null);
    setIsModalOpen(true);
  };

  const handleEditEvent = (evt: Event) => {
    const eventShifts = shifts.filter(s => s.eventId === evt.id);
    setShiftsForEditing(eventShifts);
    setEditingEvent(evt);
    setIsModalOpen(true);
  };

  const handleDeleteEvent = (id: string) => {
    setDeleteConfirm(id);
  };

  const confirmDeleteEvent = async () => {
    if (deleteConfirm) {
      // Delete event and its shifts together in one batch
      const eventShifts = shifts.filter(s => s.eventId === deleteConfirm);
      await dbService.deleteEventWithShifts(deleteConfirm, eventShifts.map(s => s.id));
      showToast('Đã xóa sự kiện', 'success');
      setDeleteConfirm(null);
    }
  };

  const handleViewEvent = (evt: Event) => {
    setViewingEvent(evt);
  };

  const viewingEventShifts = useMemo(() => {
    if (!viewingEvent) return [];
    return shifts.filter(s => s.eventId === viewingEvent.id);
  }, [viewingEvent, shifts]);

  const selectedEvents = selectedDate ? eventsByDate[selectedDate] || [] : [];

  const [shiftsForEditing, setShiftsForEditing] = useState<Shift[]>([]);

  const shiftsForDisplay = useMemo(() => {
    if (!selectedDate) return [];
    return shifts.filter(s => s.eventDate === selectedDate);
  }, [selectedDate, shifts]);

  return (
    <div className={`pb-16 md:pb-0 md:ml-60 ${bgClass} min-h-screen`}>
      <div className="p-4 md:p-6 flex flex-col lg:flex-row gap-4 lg:gap-6 lg:h-[calc(100vh-3rem)]">

        {/* Calendar */}
        <div className="flex-1">
          <div className={`${cardBgClass} border ${borderClass} rounded-lg lg:h-full flex flex-col`}>
            {/* Header */}
            <div className={`flex items-center justify-between px-4 py-3 border-b ${borderClass}`}>
              <button onClick={prevMonth} className={`p-1.5 ${textMutedClass} ${hoverBgClass} rounded transition-colors`}>
                <ChevronLeft size={18} />
              </button>
              <h3 className={`text-sm font-medium ${textPrimaryClass} capitalize`}>{monthLabel}</h3>
              <button onClick={nextMonth} className={`p-1.5 ${textMutedClass} ${hoverBgClass} rounded transition-colors`}>
                <ChevronRight size={18} />
              </button>
            </div>

            {/* Days Header */}
            <div className={`grid grid-cols-7 border-b ${borderClass}`}>
              {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map(d => (
                <div key={d} className={`py-2 text-center text-[11px] font-medium ${textMutedClass}`}>{d}</div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 p-2 gap-1 lg:flex-1 lg:auto-rows-fr">
              {daysInMonth.map((date, idx) => {
                if (!date) return <div key={`empty-${idx}`} className="aspect-square lg:aspect-auto" />;

                const offset = date.getTimezoneOffset();
                const localDate = new Date(date.getTime() - (offset * 60 * 1000));
                const dateStr = localDate.toISOString().split('T')[0];

                const dayEvents = eventsByDate[dateStr] || [];
                const isSelected = selectedDate === dateStr;
                const isToday = new Date().toISOString().split('T')[0] === dateStr;

                return (
                  <button
                    key={dateStr}
                    onClick={() => handleDateClick(date)}
                    className={`aspect-square lg:aspect-auto flex flex-col items-center justify-center rounded text-sm transition-colors ${isSelected
                      ? 'bg-[#ecb52d] text-white'
                      : isToday
                        ? `${theme === 'dark' ? 'bg-slate-800' : 'bg-[#fdf8e8]'} text-[#ecb52d] font-medium`
                        : `${textPrimaryClass} ${hoverBgClass}`
                      }`}
                  >
                    <span>{date.getDate()}</span>
                    {dayEvents.length > 0 && (
                      <div className="flex flex-wrap justify-center gap-0.5 mt-0.5 max-w-[80%]">
                        {dayEvents.map((_, i) => (
                          <span key={i} className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white/60' : 'bg-[#ecb52d]'}`} />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="w-full lg:w-72">
          <div className={`${cardBgClass} border ${borderClass} rounded-lg lg:h-full flex flex-col`}>
            {selectedDate ? (
              <div className="flex flex-col h-full">
                <div className={`px-4 py-3 border-b ${borderClass} flex justify-between items-center`}>
                  <div>
                    <p className={`text-[11px] ${textMutedClass} uppercase tracking-wide`}>Ngày chọn</p>
                    <h3 className={`text-sm font-medium ${textPrimaryClass} mt-0.5`}>{formatDate(selectedDate)}</h3>
                  </div>
                  <button
                    onClick={handleAddEvent}
                    className="p-2 bg-[#ecb52d] text-white rounded-lg hover:bg-[#d4a128] transition-colors"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                <div className="flex-1 p-3 space-y-2 overflow-y-auto">
                  {selectedEvents.length === 0 ? (
                    <div className={`flex flex-col items-center justify-center py-12 ${textMutedClass} text-sm`}>
                      <p>Chưa có sự kiện</p>
                      <button onClick={handleAddEvent} className="text-[#ecb52d] mt-1 hover:underline text-xs">
                        Tạo mới
                      </button>
                    </div>
                  ) : (
                    selectedEvents.map(evt => (
                      <div
                        key={evt.id}
                        onClick={() => handleViewEvent(evt)}
                        className={`group p-3 ${theme === 'dark' ? 'bg-slate-800/50' : 'bg-slate-50'} border ${borderClass} rounded-lg hover:border-[#ecb52d]/50 transition-colors cursor-pointer`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex items-start gap-2 flex-1 min-w-0">
                            <MapPin size={14} className="text-[#ecb52d] mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <h4 className={`text-sm font-medium ${textPrimaryClass} truncate`}>{evt.title}</h4>
                              {evt.note && <p className={`text-xs ${textMutedClass} mt-1 line-clamp-2`}>{evt.note}</p>}
                            </div>
                          </div>
                          <div className="flex gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                            <button onClick={() => handleEditEvent(evt)} className={`p-1 ${textMutedClass} hover:text-[#ecb52d] transition-colors`}>
                              <Edit2 size={14} />
                            </button>
                            <button onClick={() => handleDeleteEvent(evt.id)} className={`p-1 ${textMutedClass} hover:text-red-500 transition-colors`}>
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                        {/* Shifts */}
                        <div className="flex gap-2 mt-2 ml-5">
                          {['morning', 'afternoon'].map(session => {
                            const count = shiftsForDisplay.filter(s => s.eventId === evt.id && s.session === session).length;
                            if (count === 0) return null;
                            return (
                              <span key={session} className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${session === 'morning' ? 'bg-orange-500/10 text-orange-500' : 'bg-[#ecb52d]/10 text-[#ecb52d]'
                                }`}>
                                {session === 'morning' ? 'Sáng' : 'Chiều'}: {count} công
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    ))
                  )}
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
        settings={settings}
        onSuccess={() => {
          setIsModalOpen(false);
        }}
      />

      {/* Delete Confirm Modal */}
      <Modal
        title="Xác nhận xóa"
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        footer={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => setDeleteConfirm(null)}
              className="flex-1"
              hideIcon
            >
              Hủy
            </Button>
            <Button
              variant="danger"
              onClick={confirmDeleteEvent}
              className="flex-1"
            >
              Xóa
            </Button>
          </div>
        }
      >
        <p className={`text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>Bạn có chắc muốn xóa sự kiện này?</p>
      </Modal>

      {/* Event Detail Modal */}
      <Modal
        title={viewingEvent?.title || "Chi tiết sự kiện"}
        isOpen={!!viewingEvent}
        onClose={() => setViewingEvent(null)}
        footer={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                if (viewingEvent) {
                  handleEditEvent(viewingEvent);
                  setViewingEvent(null);
                }
              }}
              className="flex-1 flex items-center justify-center gap-2"
              hideIcon
            >
              <Edit2 size={14} />
              Sửa
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (viewingEvent) {
                  handleDeleteEvent(viewingEvent.id);
                  setViewingEvent(null);
                }
              }}
              className="flex-1 flex items-center justify-center gap-2"
            >
              <Trash2 size={14} />
              Xóa
            </Button>
          </div>
        }
      >
        {viewingEvent && (
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <p className={`text-xs ${textMutedClass} mb-1`}>Ngày</p>
                <p className={`text-sm ${textPrimaryClass}`}>{formatDate(viewingEvent.date)}</p>
              </div>
              {viewingEvent.time && (
                <div>
                  <p className={`text-xs ${textMutedClass} mb-1`}>Thời gian</p>
                  <p className={`text-sm ${textPrimaryClass} flex items-center gap-1`}>
                    <Clock size={12} className="text-[#ecb52d]" />
                    {viewingEvent.time}
                  </p>
                </div>
              )}
            </div>

            {viewingEvent.note && (
              <div>
                <p className={`text-xs ${textMutedClass} mb-1`}>Ghi chú</p>
                <p className={`text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>{viewingEvent.note}</p>
              </div>
            )}

            {viewingEventShifts.length > 0 && (
              <div>
                <p className={`text-xs ${textMutedClass} mb-2`}>Nhân viên ({viewingEventShifts.length})</p>
                <div className="space-y-1.5">
                  {viewingEventShifts.map(shift => (
                    <div key={shift.id} className={`flex items-center justify-between p-2 ${theme === 'dark' ? 'bg-slate-800/50' : 'bg-slate-100'} rounded-lg`}>
                      <span className={`text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>{shift.employeeName}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${shift.session === 'morning'
                        ? 'bg-orange-500/10 text-orange-500'
                        : 'bg-[#ecb52d]/10 text-[#ecb52d]'
                        }`}>
                        {shift.session === 'morning' ? 'Tiệc Sáng' : 'Tiệc Chiều'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
