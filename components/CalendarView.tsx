import React, { useState, useMemo } from 'react';
import { Event, Shift, Employee } from '../types';
import { formatDate } from '../constants';
import { ChevronLeft, ChevronRight, Plus, MapPin, Edit2, Trash2 } from 'lucide-react';
import { EventModal } from './EventModal';
import { dbService } from '../services/firebase';

interface CalendarViewProps {
  events: Event[];
  shifts: Shift[];
  employees: Employee[];
  refreshData: () => void;
  totalDebt: number; // Kept in props but not shown in header per request
}

export const CalendarView: React.FC<CalendarViewProps> = ({ events, shifts, employees, refreshData }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  // Helper to get days in month
  const daysInMonth = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const date = new Date(year, month, 1);
    const days = [];
    
    // Add empty slots for days before first of month
    let startDay = date.getDay(); 
    if (startDay === 0) startDay = 7; // Convert Sun(0) to 7 for Monday-based or just keep Sunday 0 based on header
    // Current header is CN(0), T2(1)... so Sunday is 0. 
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

  // Events indexed by date string
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
    setEditingEvent(null);
    setIsModalOpen(true);
  };

  const handleEditEvent = (evt: Event) => {
    setEditingEvent(evt);
    setIsModalOpen(true);
  };

  const handleDeleteEvent = async (id: string) => {
    if (window.confirm("Bạn có chắc muốn xóa sự kiện này? Toàn bộ chấm công của sự kiện sẽ bị xóa.")) {
      await dbService.deleteEvent(id);
      refreshData();
    }
  };

  // Get data for selected date
  const selectedEvents = selectedDate ? eventsByDate[selectedDate] || [] : [];
  
  // Shifts for editing needs
  const shiftsForEditing = useMemo(() => {
    if (!editingEvent) return [];
    return shifts.filter(s => s.eventId === editingEvent.id);
  }, [editingEvent, shifts]);

  // Shifts for display
  const shiftsForDisplay = useMemo(() => {
    if (!selectedDate) return [];
    return shifts.filter(s => s.eventDate === selectedDate);
  }, [selectedDate, shifts]);

  return (
    <div className="pb-24 md:ml-64 bg-slate-50 min-h-screen">
      <div className="p-4 md:p-8 flex flex-col lg:flex-row gap-6">
        
        {/* Calendar Column */}
        <div className="flex-1">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            {/* Calendar Header */}
            <div className="flex items-center justify-between p-6">
              <button onClick={prevMonth} className="p-2 hover:bg-slate-50 rounded-full text-slate-500"><ChevronLeft /></button>
              <h3 className="font-bold text-xl capitalize text-slate-800">{monthLabel}</h3>
              <button onClick={nextMonth} className="p-2 hover:bg-slate-50 rounded-full text-slate-500"><ChevronRight /></button>
            </div>

            {/* Days Header */}
            <div className="grid grid-cols-7 border-b border-slate-50 mb-2">
              {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map(d => (
                <div key={d} className="py-2 text-center text-xs font-bold text-slate-300 uppercase">{d}</div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 px-4 pb-6 gap-y-2">
              {daysInMonth.map((date, idx) => {
                if (!date) return <div key={`empty-${idx}`} />;
                
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
                    className={`aspect-square relative flex flex-col items-center justify-center rounded-2xl transition-all duration-200 ${
                      isSelected 
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-105 z-10' 
                        : 'hover:bg-slate-50 text-slate-700'
                    } ${isToday && !isSelected ? 'bg-indigo-50 text-indigo-700 font-bold' : ''}`}
                  >
                    <span className="text-sm">{date.getDate()}</span>
                    
                    {/* Dots Indicator */}
                    <div className="flex gap-1 mt-1 h-1.5">
                      {dayEvents.slice(0, 3).map((_, i) => (
                         <span key={i} className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white/50' : 'bg-emerald-400'}`}></span>
                      ))}
                      {dayEvents.length > 3 && <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white/50' : 'bg-slate-300'}`}></span>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Details Column */}
        <div className="w-full lg:w-96">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 h-full min-h-[400px]">
            {selectedDate ? (
              <div className="animate-fade-in flex flex-col h-full">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <p className="text-xs text-slate-400 font-bold uppercase">Ngày đang chọn</p>
                    <h3 className="font-bold text-xl text-slate-800">
                      {formatDate(selectedDate)}
                    </h3>
                  </div>
                  <button
                    onClick={handleAddEvent}
                    className="bg-indigo-600 text-white w-10 h-10 rounded-full hover:bg-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-200 transition-transform active:scale-95"
                  >
                    <Plus size={20} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                  {selectedEvents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-slate-400 text-sm border-2 border-dashed border-slate-100 rounded-2xl">
                      <p>Chưa có tiệc nào</p>
                      <button onClick={handleAddEvent} className="text-indigo-600 font-bold mt-2 hover:underline">Tạo ngay</button>
                    </div>
                  ) : (
                    selectedEvents.map(evt => (
                      <div key={evt.id} className="group relative bg-slate-50 hover:bg-white border border-slate-100 hover:border-indigo-100 rounded-2xl p-4 transition-all hover:shadow-md">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                            <MapPin size={16} className="text-indigo-500" />
                            {evt.title}
                          </h4>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleEditEvent(evt)} className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-md bg-white shadow-sm">
                              <Edit2 size={14} />
                            </button>
                            <button onClick={() => handleDeleteEvent(evt.id)} className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md bg-white shadow-sm">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                        
                        {evt.note && <p className="text-sm text-slate-500 mb-3 pl-6">{evt.note}</p>}
                        
                        {/* Shifts Summary */}
                        <div className="flex gap-2 pl-6 mt-3">
                           {['morning', 'afternoon'].map(session => {
                              const count = shiftsForDisplay.filter(s => s.eventId === evt.id && s.session === session).length;
                              if (count === 0) return null;
                              return (
                                <div key={session} className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 ${
                                  session === 'morning' ? 'bg-orange-100 text-orange-700' : 'bg-indigo-100 text-indigo-700'
                                }`}>
                                  <div className={`w-2 h-2 rounded-full ${session === 'morning' ? 'bg-orange-500' : 'bg-indigo-500'}`}></div>
                                  {count} NV
                                </div>
                              )
                           })}
                           {shiftsForDisplay.filter(s => s.eventId === evt.id).length === 0 && (
                             <span className="text-xs text-slate-400 italic">Chưa gán nhân viên</span>
                           )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-300">
                <CalendarIcon className="w-16 h-16 mb-4 opacity-50" />
                <p>Chọn ngày để xem chi tiết</p>
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
          refreshData();
        }}
      />
    </div>
  );
};

const CalendarIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);