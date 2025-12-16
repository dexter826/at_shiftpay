import React, { useState, useEffect } from 'react';
import { Employee, Shift, ShiftSession, Event } from '../types';
import { dbService } from '../services/firebase';
import { SHIFT_RATE } from '../constants';
import { Sun, Moon, Check, AlertCircle } from 'lucide-react';
import { Modal } from './ui/Modal';

interface EventModalProps {
  date: string;
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

  useEffect(() => {
    if (isOpen) {
      if (existingEvent) {
        setTitle(existingEvent.title);
        setNote(existingEvent.note || '');

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

      if (newMap[empId].has(session)) {
        newMap[empId].delete(session);
      } else {
        newMap[empId].add(session);
      }

      if (newMap[empId].size === 0) {
        delete newMap[empId];
      }
      return { ...newMap };
    });
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError('Nhập tên sự kiện');
      return;
    }
    if (!activeSessions.morning && !activeSessions.afternoon) {
      setError('Chọn ít nhất một ca');
      return;
    }

    try {
      const eventData = { date, title, note };
      let eventId = existingEvent?.id;

      if (existingEvent) {
        await dbService.updateEvent(existingEvent.id, eventData);
      } else {
        await dbService.addEvent(eventData);
        onSuccess();
        return;
      }

      if (!eventId) return;

      for (const shift of existingShifts) {
        await dbService.deleteShift(shift.id);
      }

      const shiftsToCreate: Omit<Shift, 'id'>[] = [];
      Object.entries(assignments).forEach(([empId, rawSessions]) => {
        const emp = employees.find(e => e.id === empId);
        if (!emp) return;

        const sessions = rawSessions as Set<ShiftSession>;
        sessions.forEach(session => {
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

      for (const shift of shiftsToCreate) {
        await dbService.addShift(shift);
      }

      onSuccess();
    } catch (err) {
      setError('Có lỗi xảy ra');
      console.error(err);
    }
  };

  return (
    <Modal
      title={existingEvent ? "Sửa sự kiện" : "Tạo sự kiện"}
      isOpen={isOpen}
      onClose={onClose}
      footer={
        <button
          onClick={handleSubmit}
          className="w-full bg-emerald-500 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors flex justify-center items-center gap-2"
        >
          <Check size={16} />
          {existingEvent ? "Cập nhật" : "Lưu"}
        </button>
      }
    >
      <div className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-2.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs">
            <AlertCircle size={14} />
            <span>{error}</span>
          </div>
        )}

        {/* Event Info */}
        <div>
          <label className="block text-xs text-slate-400 mb-1.5">Tên sự kiện</label>
          <input
            type="text"
            placeholder="Đám cưới Nhà A"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-600"
          />
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1.5">Ghi chú</label>
          <textarea
            placeholder="Ghi chú..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-600 h-16 resize-none"
          />
        </div>

        {/* Sessions */}
        <div>
          <label className="block text-xs text-slate-400 mb-1.5">Ca làm việc</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => toggleSession('morning')}
              className={`p-2.5 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeSessions.morning
                  ? 'border-orange-500/50 bg-orange-500/10 text-orange-500'
                  : 'border-slate-700 text-slate-500 hover:border-slate-600'
                }`}
            >
              <Sun size={16} />
              Ca Sáng
            </button>
            <button
              type="button"
              onClick={() => toggleSession('afternoon')}
              className={`p-2.5 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeSessions.afternoon
                  ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-500'
                  : 'border-slate-700 text-slate-500 hover:border-slate-600'
                }`}
            >
              <Moon size={16} />
              Ca Chiều
            </button>
          </div>
        </div>

        {/* Assignments */}
        {(activeSessions.morning || activeSessions.afternoon) && (
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Chấm công</label>
            <div className="border border-slate-700 rounded-lg divide-y divide-slate-700 max-h-48 overflow-y-auto">
              {employees.length === 0 ? (
                <div className="p-3 text-center text-slate-500 text-xs">Chưa có nhân viên</div>
              ) : (
                employees.map(emp => {
                  const empSessions = assignments[emp.id] || new Set();

                  return (
                    <div key={emp.id} className="p-2.5 flex items-center justify-between">
                      <span className="text-sm text-slate-300 truncate flex-1">{emp.name}</span>
                      <div className="flex gap-1.5">
                        {activeSessions.morning && (
                          <button
                            type="button"
                            onClick={() => toggleAssignment(emp.id, 'morning')}
                            className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${empSessions.has('morning')
                                ? 'bg-orange-500 text-white'
                                : 'bg-slate-800 text-slate-500 hover:bg-slate-700'
                              }`}
                          >
                            <Sun size={14} />
                          </button>
                        )}
                        {activeSessions.afternoon && (
                          <button
                            type="button"
                            onClick={() => toggleAssignment(emp.id, 'afternoon')}
                            className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${empSessions.has('afternoon')
                                ? 'bg-emerald-500 text-white'
                                : 'bg-slate-800 text-slate-500 hover:bg-slate-700'
                              }`}
                          >
                            <Moon size={14} />
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
