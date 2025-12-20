import React, { useState, useMemo } from 'react';
import { Skeleton } from '../ui/Skeleton';
import { Event, Shift, Employee, UserSettings, DEFAULT_SETTINGS } from '../../types';
import { formatDate, formatCurrency } from '../../constants';
import { ChevronLeft, ChevronRight, Plus, MapPin, Edit2, Trash2, Clock, Banknote, Calendar, DollarSign } from 'lucide-react';
import { EventModal } from '../modals/EventModal';
import { dbService } from '../../services/firebase';
import { useToast } from '../ui/Toast';
import { Modal } from '../ui/Modal';
import Button from '../ui/Button';
import { useThemeStyles } from '../../hooks/useThemeStyles';

interface CalendarViewProps {
  events: Event[];
  shifts: Shift[];
  employees: Employee[];
  totalDebt: number;
  settings: UserSettings;
  currentDate?: Date;
  onDateChange?: (date: Date) => void;
  loading?: boolean;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  events,
  shifts,
  employees,
  totalDebt,
  settings,
  currentDate: propDate,
  onDateChange,
  loading = false
}) => {
  const { showToast } = useToast();
  const { theme } = useThemeStyles();

  const {
    bgClass,
    cardBgClass,
    borderClass,
    textPrimaryClass,
    textMutedClass,
    hoverBgClass
  } = useThemeStyles();

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
            {/* Tiêu đề lịch */}
            <div className={`flex items-center justify-between px-4 py-3 border-b ${borderClass}`}>
              <button onClick={prevMonth} className={`p-1.5 ${textMutedClass} ${hoverBgClass} rounded transition-colors`}>
                <ChevronLeft size={18} />
              </button>
              <h3 className={`text-sm font-medium ${textPrimaryClass} capitalize`}>{monthLabel}</h3>
              <button onClick={nextMonth} className={`p-1.5 ${textMutedClass} ${hoverBgClass} rounded transition-colors`}>
                <ChevronRight size={18} />
              </button>
            </div>

            {/* Tiêu đề ngày tháng */}
            <div className={`grid grid-cols-7 border-b ${borderClass}`}>
              {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map(d => (
                <div key={d} className={`py-2 text-center text-[11px] font-medium ${textMutedClass}`}>{d}</div>
              ))}
            </div>

            {/* Lưới lịch */}
            <div className="grid grid-cols-7 p-2 gap-1 lg:flex-1 lg:auto-rows-fr">
              {loading ? (
                Array.from({ length: 35 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-square lg:aspect-auto rounded" height="100%" />
                ))
              ) : (
                daysInMonth.map((date, idx) => {
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
                        ? 'bg-primary text-white'
                        : isToday
                          ? `${theme === 'dark' ? 'bg-slate-800' : 'bg-primary/10'} text-primary font-medium`
                          : `${textPrimaryClass} ${hoverBgClass}`
                        }`}
                    >
                      <span>{date.getDate()}</span>
                      {dayEvents.length > 0 && (
                        <div className="flex flex-wrap justify-center gap-0.5 mt-0.5 max-w-[80%]">
                          {dayEvents.map((_, i) => (
                            <span key={i} className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white/60' : 'bg-primary'}`} />
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })
              )}
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
                  <button
                    onClick={handleAddEvent}
                    className="p-2 bg-primary text-white rounded-lg hover:bg-yellow-600 transition-colors"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                <div className="flex-1 p-3 space-y-2 overflow-y-auto">
                  {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
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
                    ))
                  ) : selectedEvents.length === 0 ? (
                    <div className={`flex flex-col items-center justify-center py-12 ${textMutedClass} text-sm`}>
                      <p>Chưa có sự kiện</p>
                      <button onClick={handleAddEvent} className="text-primary mt-1 hover:underline text-xs">
                        Tạo mới
                      </button>
                    </div>
                  ) : (
                    selectedEvents.map(evt => (
                      <div
                        key={evt.id}
                        onClick={() => handleViewEvent(evt)}
                        className={`group p-3 ${theme === 'dark' ? 'bg-slate-800/50' : 'bg-slate-50'} border ${borderClass} rounded-lg hover:border-primary/50 transition-colors cursor-pointer`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex items-start gap-2 flex-1 min-w-0">
                            <MapPin size={14} className="text-primary mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <h4 className={`text-sm font-medium ${textPrimaryClass} truncate`}>{evt.title}</h4>
                              {evt.note && <p className={`text-xs ${textMutedClass} mt-1 line-clamp-2`}>{evt.note}</p>}
                            </div>
                          </div>
                          <div className="flex gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                            <button onClick={() => handleEditEvent(evt)} className={`p-1 ${textMutedClass} hover:text-primary transition-colors`}>
                              <Edit2 size={14} />
                            </button>
                            <button onClick={() => handleDeleteEvent(evt.id)} className={`p-1 ${textMutedClass} hover:text-red-500 transition-colors`}>
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                        {/* Thông tin ca */}
                        <div className="flex gap-2 mt-2 ml-5">
                          {['morning', 'afternoon'].map(session => {
                            const count = shiftsForDisplay.filter(s => s.eventId === evt.id && s.session === session).length;
                            if (count === 0) return null;
                            return (
                              <span key={session} className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${session === 'morning' ? 'bg-orange-500/10 text-orange-500' : 'bg-primary/10 text-primary'
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

      {/* Modal xác nhận xóa */}
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

      {/* Modal chi tiết sự kiện */}
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
              className="flex-1"
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
              className="flex-1"
            >
              <Trash2 size={14} />
              Xóa
            </Button>
          </div>
        }
      >
        {viewingEvent && (
          <div className="space-y-3">
            {/* Thông tin cơ bản - 1 hàng với icon */}
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-1.5">
                <Calendar size={14} className={textMutedClass} />
                <span className={`text-sm ${textPrimaryClass}`}>{formatDate(viewingEvent.date)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock size={14} className="text-primary" />
                <span className={`text-sm ${textPrimaryClass}`}>{viewingEvent.time || '--:--'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Banknote size={14} className="text-green-500" />
                <span className={`text-sm font-medium ${textPrimaryClass}`}>
                  {viewingEvent.amount ? formatCurrency(viewingEvent.amount) : formatCurrency(settings.shiftRate)}
                </span>
              </div>
              {viewingEvent.surcharge > 0 && (
                <div className="flex items-center gap-1.5">
                  <DollarSign size={14} className="text-blue-500" />
                  <span className={`text-sm font-medium text-blue-500`}>
                    {formatCurrency(viewingEvent.surcharge)}
                  </span>
                </div>
              )}
            </div>

            {/* Tổng tiền */}
            {viewingEventShifts.length > 0 && (
              <div className={`p-2.5 ${theme === 'dark' ? 'bg-slate-800/50' : 'bg-slate-100'} rounded-lg flex items-center justify-between`}>
                <div>
                  <p className={`text-xs ${textMutedClass} mb-0.5`}>Tổng tiền sự kiện</p>
                  <p className={`text-lg font-bold text-primary`}>
                    {formatCurrency(
                      viewingEventShifts.reduce((sum, shift) => sum + shift.amount, 0)
                    )}
                  </p>
                </div>
                <div className={`text-xs ${textMutedClass} text-right space-y-0.5`}>
                  <p>Lương: {formatCurrency((viewingEvent.amount || settings.shiftRate) * viewingEventShifts.length)}</p>
                  {viewingEvent.surcharge > 0 && (
                    <p>
                      Phụ phí: {formatCurrency(viewingEvent.surcharge)}
                      {viewingEvent.surchargeDistribution && (
                        <span className="italic">
                          {' '}({viewingEvent.surchargeDistribution.type === 'equal'
                            ? 'Chia đều'
                            : `Chia cho ${viewingEvent.surchargeDistribution.selectedEmployeeIds?.length || 0} người`})
                        </span>
                      )}
                    </p>
                  )}
                </div>
              </div>
            )}

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
                        : 'bg-primary/10 text-primary'
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
