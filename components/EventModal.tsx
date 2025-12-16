import React, { useState, useEffect } from 'react';
import { Employee, Shift, ShiftSession, Event } from '../types';
import { dbService } from '../services/firebase';
import { generateId, SHIFT_RATE } from '../constants';
import { Sun, Moon, Check, AlertCircle } from 'lucide-react';
import { Modal } from './ui/Modal';

interface EventModalProps {
  date: string; // YYYY-MM-DD
  existingEvent: Event | null;
  existingShifts: Shift[];
  employees: Employee[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const EventModal: React.FC<EventModalProps> = ({
  date,
  existingEvent,
  existingShifts,
  employees,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [activeSessions, setActiveSessions] = useState<{ morning: boolean, afternoon: boolean }>({
    morning: false,
    afternoon: false
  });
  const [assignments, setAssignments] = useState<Record<string, Set<ShiftSession>>>({});
  const [error, setError] = useState('');

  // Initialize data when modal opens
  useEffect(() => {
    if (isOpen) {
      if (existingEvent) {
        setTitle(existingEvent.title);
        setNote(existingEvent.note || '');

        // Reconstruct assignments from existing shifts
        const newAssignments: Record<string, Set<ShiftSession>> = {};
        let hasMorning = false;
        let hasAfternoon = false;

        existingShifts.forEach(s => {
          if (!newAssignments[s.employeeId]) newAssignments[s.employeeId] = new Set();
          newAssignments[s.employeeId].add(s.session);
          if (s.session === 'morning') hasMorning = true;
          if (s.session === 'afternoon') hasAfternoon = true;
        });

        setAssignments(newAssignments);
        setActiveSessions({ morning: hasMorning, afternoon: hasAfternoon });
      } else {
        // Reset for new event
        setTitle('');
        setNote('');
        setActiveSessions({ morning: false, afternoon: false });
        setAssignments({});
      }
      setError('');
    }
  }, [isOpen, existingEvent, existingShifts]);

  const toggleSession = (session: ShiftSession) => {
    setActiveSessions(prev => {
      const newState = { ...prev, [session]: !prev[session] };
      // If turning off a session, remove all assignments for that session
      if (!newState[session]) {
        setAssignments(prevAssign => {
          const newAssign = { ...prevAssign };
          Object.keys(newAssign).forEach(empId => {
            if (newAssign[empId].has(session)) {
              newAssign[empId].delete(session);
              if (newAssign[empId].size === 0) delete newAssign[empId];
            }
          });
          return newAssign;
        });
      }
      return newState;
    });
  };

  const toggleAssignment = (empId: string, session: ShiftSession) => {
    setAssignments(prev => {
      const newMap = { ...prev };
      if (!newMap[empId]) newMap[empId] = new Set();

      const empSessions = newMap[empId]; // Reference to Set
      if (empSessions.has(session)) {
        empSessions.delete(session);
      } else {
        empSessions.add(session);
      }

      if (empSessions.size === 0) {
        delete newMap[empId];
      }
      return { ...newMap }; // Return new object to trigger re-render
    });
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError('Vui lòng nhập tên sự kiện');
      return;
    }
    if (!activeSessions.morning && !activeSessions.afternoon) {
      setError('Vui lòng chọn ít nhất một ca làm việc (Sáng hoặc Chiều)');
      return;
    }

    try {
      const eventData = { date, title, note };
      let eventId = existingEvent?.id;

      if (existingEvent) {
        // Update existing
        await dbService.updateEvent(existingEvent.id, eventData);
      } else {
        // Create new - addEvent returns void, we need to handle this differently
        await dbService.addEvent(eventData);
        // After adding, we need to get the event ID from the refresh
        // For now, we'll just refresh and let the parent handle it
        onSuccess();
        return;
      }

      if (!eventId) return;

      // Delete old shifts for this event
      for (const shift of existingShifts) {
        await dbService.deleteShift(shift.id);
      }

      // Create new shifts
      const shiftsToCreate: Omit<Shift, 'id'>[] = [];
      Object.entries(assignments).forEach(([empId, rawSessions]) => {
        const emp = employees.find(e => e.id === empId);
        if (!emp) return;

        const sessions = rawSessions as Set<ShiftSession>;
        sessions.forEach(session => {
          // Check if this shift already existed (preserve paid status)
          const prevShift = existingShifts.find(
            s => s.employeeId === empId && s.session === session
          );

          shiftsToCreate.push({
            eventId: eventId!,
            eventDate: date,
            employeeId: empId,
            employeeName: emp.name,
            session: session,
            amount: SHIFT_RATE,
            status: prevShift ? prevShift.status : 'unpaid',
            paidAt: prevShift ? prevShift.paidAt : undefined
          });
        });
      });

      // Add all new shifts
      for (const shift of shiftsToCreate) {
        await dbService.addShift(shift);
      }

      onSuccess();
    } catch (err) {
      setError('Có lỗi xảy ra, vui lòng thử lại');
      console.error(err);
    }
  };

  return (
    <Modal
      title={existingEvent ? "Chỉnh Sửa Sự Kiện" : "Tạo Sự Kiện Mới"}
      isOpen={isOpen}
      onClose={onClose}
      footer={
        <button
          onClick={handleSubmit}
          className="w-full bg-emerald-500 text-white py-2.5 md:py-3 rounded-xl font-bold text-base md:text-lg shadow-md hover:bg-emerald-600 active:scale-[0.98] transition-all flex justify-center items-center gap-2"
        >
          <Check size={18} className="md:w-5 md:h-5" />
          {existingEvent ? "Cập Nhật" : "Lưu Sự Kiện"}
        </button>
      }
    >
      <div className="flex flex-col gap-4 md:gap-6">
        {error && (
          <div className="flex items-center gap-2 p-2.5 md:p-3 bg-rose-500/10 text-rose-400 rounded-lg text-xs md:text-sm border border-rose-500/20">
            <AlertCircle size={14} className="md:w-4 md:h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 1. Event Info */}
        <div className="space-y-2 md:space-y-3">
          <label className="block text-xs md:text-sm font-bold text-slate-400 uppercase tracking-wide">Thông tin chung</label>
          <input
            type="text"
            placeholder="Tên tiệc (VD: Đám cưới Nhà A)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2.5 md:p-3 bg-slate-700 border border-slate-600 rounded-xl focus:bg-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-semibold text-sm md:text-base text-slate-100 placeholder-slate-500"
          />
          <textarea
            placeholder="Ghi chú thêm..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full p-2.5 md:p-3 bg-slate-700 border border-slate-600 rounded-xl focus:bg-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none h-16 md:h-20 resize-none text-sm md:text-base text-slate-100 placeholder-slate-500"
          />
        </div>

        {/* 2. Active Sessions */}
        <div className="space-y-2 md:space-y-3">
          <label className="block text-xs md:text-sm font-bold text-slate-400 uppercase tracking-wide">Ca làm việc</label>
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <button
              type="button"
              onClick={() => toggleSession('morning')}
              className={`p-3 md:p-4 rounded-xl border-2 flex items-center justify-center gap-2 transition-all active:scale-95 ${activeSessions.morning
                ? 'border-orange-500 bg-orange-500/20 text-orange-400 font-bold'
                : 'border-slate-700 bg-slate-700 text-slate-500 grayscale'
                }`}
            >
              <Sun size={18} className="md:w-5 md:h-5" />
              <span className="text-sm md:text-base">Ca Sáng</span>
            </button>
            <button
              type="button"
              onClick={() => toggleSession('afternoon')}
              className={`p-3 md:p-4 rounded-xl border-2 flex items-center justify-center gap-2 transition-all active:scale-95 ${activeSessions.afternoon
                ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400 font-bold'
                : 'border-slate-700 bg-slate-700 text-slate-500 grayscale'
                }`}
            >
              <Moon size={18} className="md:w-5 md:h-5" />
              <span className="text-sm md:text-base">Ca Chiều</span>
            </button>
          </div>
        </div>

        {/* 3. Assignments */}
        {(activeSessions.morning || activeSessions.afternoon) && (
          <div className="space-y-2 md:space-y-3 animate-fade-in">
            <label className="block text-xs md:text-sm font-bold text-slate-400 uppercase tracking-wide">
              Chấm công nhân viên
            </label>
            <div className="bg-slate-700 border border-slate-600 rounded-xl divide-y divide-slate-600 max-h-[200px] md:max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent">
              {employees.length === 0 ? (
                <div className="p-3 md:p-4 text-center text-slate-500 text-xs md:text-sm">Chưa có nhân viên nào</div>
              ) : (
                employees.map(emp => {
                  const empSessions = assignments[emp.id] || new Set();

                  return (
                    <div key={emp.id} className="p-2.5 md:p-3 flex items-center justify-between hover:bg-slate-600/50 gap-2">
                      <span className="font-medium text-slate-200 text-sm md:text-base flex-1 min-w-0 truncate">{emp.name}</span>
                      <div className="flex gap-1.5 md:gap-2 flex-shrink-0">
                        {activeSessions.morning && (
                          <button
                            type="button"
                            onClick={() => toggleAssignment(emp.id, 'morning')}
                            className={`w-9 h-9 md:w-10 md:h-10 rounded-lg flex items-center justify-center transition-all active:scale-95 ${empSessions.has('morning')
                              ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30'
                              : 'bg-slate-800 text-slate-500'
                              }`}
                          >
                            <Sun size={16} className="md:w-[18px] md:h-[18px]" />
                          </button>
                        )}
                        {activeSessions.afternoon && (
                          <button
                            type="button"
                            onClick={() => toggleAssignment(emp.id, 'afternoon')}
                            className={`w-9 h-9 md:w-10 md:h-10 rounded-lg flex items-center justify-center transition-all active:scale-95 ${empSessions.has('afternoon')
                              ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                              : 'bg-slate-800 text-slate-500'
                              }`}
                          >
                            <Moon size={16} className="md:w-[18px] md:h-[18px]" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};