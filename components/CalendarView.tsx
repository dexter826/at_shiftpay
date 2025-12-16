import React, { useState, useMemo } from 'react';
import { Event, Shift, Employee } from '../types';
import { formatDate } from '../constants';
import { ChevronLeft, ChevronRight, Plus, MapPin, Edit2, Trash2 } from 'lucide-react';
import { EventModal } from './EventModal';
import { dbService } from '../services/firebase';
import { useToast } from './ui/Toast';
import { Modal } from './ui/Modal';

interface CalendarViewProps {
  events: Event[];
  shifts: Shift[];
  employees: Employee[];
  totalDebt: number;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ events, shifts, employees }) => {
  const { showToast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
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
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
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
  }, [currentDate]);

  const monthLabel = new Intl.DateTimeFormat('vi-VN', { month: 'long', year: 'numeric' }).format(currentDate);

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

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
    <div className="pb-16 md:pb-0 md:ml-60 bg-slate-900 min-h-screen">
      <div className="p-4 md:p-6 flex flex-col lg:flex-row gap-4 lg:gap-6 lg:h-[calc(100vh-3rem)]">

        {/* Calendar */}
        <div className="flex-1">
          <div className="bg-slate-900 border border-slate-800 rounded-lg lg:h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
              <button onClick={prevMonth} className="p-1.5 text-slate-400 hover:text-slate-200 rounded hover:bg-slate-800 transition-colors">
                <ChevronLeft size={18} />
              </button>
              <h3 className="text-sm font-medium text-slate-200 capitalize">{monthLabel}</h3>
              <button onClick={nextMonth} className="p-1.5 text-slate-400 hover:text-slate-200 rounded hover:bg-slate-800 transition-colors">
                <ChevronRight size={18} />
              </button>
            </div>

            {/* Days Header */}
            <div className="grid grid-cols-7 border-b border-slate-800">
              {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map(d => (
                <div key={d} className="py-2 text-center text-[11px] font-medium text-slate-500">{d}</div>
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
                      ? 'bg-emerald-500 text-white'
                      : isToday
                        ? 'bg-slate-800 text-emerald-500 font-medium'
                        : 'text-slate-300 hover:bg-slate-800'
                      }`}
                  >
                    <span>{date.getDate()}</span>
                    {dayEvents.length > 0 && (
                      <div className="flex flex-wrap justify-center gap-0.5 mt-0.5 max-w-[80%]">
                        {dayEvents.map((_, i) => (
                          <span key={i} className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white/60' : 'bg-emerald-500'}`} />
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
          <div className="bg-slate-900 border border-slate-800 rounded-lg lg:h-full flex flex-col">
            {selectedDate ? (
              <div className="flex flex-col h-full">
                <div className="px-4 py-3 border-b border-slate-800 flex justify-between items-center">
                  <div>
                    <p className="text-[11px] text-slate-500 uppercase tracking-wide">Ngày chọn</p>
                    <h3 className="text-sm font-medium text-slate-200 mt-0.5">{formatDate(selectedDate)}</h3>
                  </div>
                  <button
                    onClick={handleAddEvent}
                    className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                <div className="flex-1 p-3 space-y-2 overflow-y-auto">
                  {selectedEvents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-500 text-sm">
                      <p>Chưa có sự kiện</p>
                      <button onClick={handleAddEvent} className="text-emerald-500 mt-1 hover:underline text-xs">
                        Tạo mới
                      </button>
                    </div>
                  ) : (
                    selectedEvents.map(evt => (
                      <div
                        key={evt.id}
                        onClick={() => handleViewEvent(evt)}
                        className="group p-3 bg-slate-800/50 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors cursor-pointer"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex items-start gap-2 flex-1 min-w-0">
                            <MapPin size={14} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium text-slate-200 truncate">{evt.title}</h4>
                              {evt.note && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{evt.note}</p>}
                            </div>
                          </div>
                          <div className="flex gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                            <button onClick={() => handleEditEvent(evt)} className="p-1 text-slate-500 hover:text-emerald-500 transition-colors">
                              <Edit2 size={14} />
                            </button>
                            <button onClick={() => handleDeleteEvent(evt.id)} className="p-1 text-slate-500 hover:text-red-500 transition-colors">
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
                              <span key={session} className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${session === 'morning' ? 'bg-orange-500/10 text-orange-500' : 'bg-emerald-500/10 text-emerald-500'
                                }`}>
                                {session === 'morning' ? 'Sáng' : 'Chiều'}: {count}
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
              <div className="flex flex-col items-center justify-center h-64 text-slate-500 text-sm">
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
            <button
              onClick={() => setDeleteConfirm(null)}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={confirmDeleteEvent}
              className="flex-1 bg-red-500 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
            >
              Xóa
            </button>
          </div>
        }
      >
        <p className="text-sm text-slate-300">Bạn có chắc muốn xóa sự kiện này?</p>
      </Modal>

      {/* Event Detail Modal */}
      <Modal
        title={viewingEvent?.title || "Chi tiết sự kiện"}
        isOpen={!!viewingEvent}
        onClose={() => setViewingEvent(null)}
        footer={
          <div className="flex gap-2">
            <button
              onClick={() => {
                if (viewingEvent) {
                  handleEditEvent(viewingEvent);
                  setViewingEvent(null);
                }
              }}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
            >
              <Edit2 size={14} />
              Sửa
            </button>
            <button
              onClick={() => {
                if (viewingEvent) {
                  handleDeleteEvent(viewingEvent.id);
                  setViewingEvent(null);
                }
              }}
              className="flex-1 bg-red-500 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
            >
              <Trash2 size={14} />
              Xóa
            </button>
          </div>
        }
      >
        {viewingEvent && (
          <div className="space-y-4">
            <div>
              <p className="text-xs text-slate-500 mb-1">Ngày</p>
              <p className="text-sm text-slate-200">{formatDate(viewingEvent.date)}</p>
            </div>

            {viewingEvent.note && (
              <div>
                <p className="text-xs text-slate-500 mb-1">Ghi chú</p>
                <p className="text-sm text-slate-300">{viewingEvent.note}</p>
              </div>
            )}

            {viewingEventShifts.length > 0 && (
              <div>
                <p className="text-xs text-slate-500 mb-2">Nhân viên ({viewingEventShifts.length})</p>
                <div className="space-y-1.5">
                  {viewingEventShifts.map(shift => (
                    <div key={shift.id} className="flex items-center justify-between p-2 bg-slate-800/50 rounded-lg">
                      <span className="text-sm text-slate-300">{shift.employeeName}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${shift.session === 'morning'
                        ? 'bg-orange-500/10 text-orange-500'
                        : 'bg-emerald-500/10 text-emerald-500'
                        }`}>
                        {shift.session === 'morning' ? 'Ca Sáng' : 'Ca Chiều'}
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
