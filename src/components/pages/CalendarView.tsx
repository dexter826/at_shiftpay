import React, { useState, useMemo, memo } from 'react';
import { Event, Shift, Employee, UserSettings, Location } from '../../types';
import { dbService } from '../../services';
import { useToast } from '../ui/Toast';
import { Modal } from '../ui/Modal';
import Button from '../ui/Button';
import XIcon from '../ui/icons/x-icon';
import TrashIcon from '../ui/icons/trash-icon';

// Modals
import { EventModal } from './calendar/EventModal';
import { EventDetailModal } from './calendar/EventDetailModal';

// New Components
import CalendarHeader from './calendar/CalendarHeader';
import CalendarGrid from './calendar/CalendarGrid';
import CalendarSidebar from './calendar/CalendarSidebar';

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

  const [localDate, setLocalDate] = useState(new Date());
  const displayDate = propDate || localDate;

  // Đồng bộ localDate khi propDate thay đổi
  React.useEffect(() => {
    if (propDate) setLocalDate(propDate);
  }, [propDate]);

  const handleMonthChange = (newDate: Date) => {
    if (onDateChange) {
      onDateChange(newDate);
    } else {
      setLocalDate(newDate);
    }
  };

  const [selectedDate, setSelectedDate] = useState<string | null>(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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

    // Lấp đầy lưới 42 ô
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
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;

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
    // Chống lệch ngày do múi giờ
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - (offset * 60 * 1000));
    const dateStr = localDate.toISOString().split('T')[0];
    setSelectedDate(dateStr);

    if (date.getMonth() !== displayDate.getMonth()) {
      handleMonthChange(new Date(date.getFullYear(), date.getMonth(), 1));
    }
  };

  const [shiftsForEditing, setShiftsForEditing] = useState<Shift[]>([]);

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
  
  // Shifts for sidebar display logic (only needed if logic was complex, but Sidebar does it simply)
  // Sidebar takes "shifts" (all shifts) and filters mainly by eventId, 
  // but originally CalendarView calculated "shiftsForDisplay" just for day count in sidebar. 
  // `CalendarSidebar` now receives full `shifts` array and filters by eventId/session inside map.
  // Wait, `CalendarSidebar` loops through `selectedEvents`, then for each event filters `shifts`.
  // So passing `shifts` (all shifts) is fine, but maybe inefficient if `shifts` is huge.
  // Or I can filter `shiftsForDisplay` here and pass it.
  // Original `CalendarView`: `shiftsForDisplay` = `shifts.filter(s => s.date === selectedDate)`.
  // Sidebar logic: `shiftsForDisplay.filter(...)`
  // So I should pass `shiftsForDisplay` to `CalendarSidebar` as `shifts`.
  
  const shiftsForDisplay = useMemo(() => {
    if (!selectedDate) return [];
    return shifts.filter((s: Shift) => s.date === selectedDate);
  }, [selectedDate, shifts]);

  return (
    <div className={`pb-28 md:pb-0 bg-[var(--bg-primary)] min-h-screen relative`}>
      <div className="px-4 pt-5 pb-4 md:px-6 md:pt-6 md:pb-6 flex flex-col lg:flex-row gap-4 lg:gap-6 lg:h-[calc(100vh-3rem)]">
        {/* Calendar Main */}
        <div className="flex-1">
          <div className={`bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg lg:h-full flex flex-col`}>
             <CalendarHeader 
                displayDate={displayDate}
                onPrevMonth={prevMonth}
                onNextMonth={nextMonth}
                onGoToToday={goToToday}
                onNavigateToReviews={onNavigateToReviews}
             />

             <CalendarGrid 
                daysInMonth={daysInMonth}
                displayDate={displayDate}
                eventsByDate={eventsByDate}
                selectedDate={selectedDate}
                locations={locations}
                loading={loading}
                onDateClick={handleDateClick}
             />
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-72">
           <CalendarSidebar 
              selectedDate={selectedDate}
              events={selectedEvents}
              shifts={shiftsForDisplay}
              locations={locations}
              loading={loading}
              onAddEvent={handleAddEvent}
              onEditEvent={handleEditEvent}
              onDeleteEvent={handleDeleteEvent}
              onViewEvent={handleViewEvent}
           />
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
            <Button variant="secondary" onClick={() => setDeleteConfirm(null)} className="flex-1" icon={<XIcon size={16} />}>Hủy</Button>
            <Button variant="danger" onClick={confirmDeleteEvent} className="flex-1" icon={<TrashIcon size={16} />}>Xóa</Button>
          </div>
        }
      >
        <p className="text-sm text-[var(--text-secondary)]">Bạn có chắc muốn xóa sự kiện này?</p>
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

export default memo(CalendarView);
