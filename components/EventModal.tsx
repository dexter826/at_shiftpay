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
  const [activeSessions, setActiveSessions] = useState<{morning: boolean, afternoon: boolean}>({
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

    const eventData = { date, title, note };
    let eventId = existingEvent?.id;

    if (existingEvent) {
      // Update existing
      await dbService.updateEvent(existingEvent.id, eventData);
    } else {
      // Create new
      const newEvent = await dbService.addEvent(eventData);
      eventId = newEvent.id;
    }

    if (!eventId) return;

    // Create Shift Objects
    const shiftsToSave: Shift[] = [];
    Object.entries(assignments).forEach(([empId, rawSessions]) => {
      const emp = employees.find(e => e.id === empId);
      if (!emp) return;

      const sessions = rawSessions as Set<ShiftSession>;
      sessions.forEach(session => {
        // Check if this shift already existed (preserve paid status)
        const prevShift = existingShifts.find(
          s => s.employeeId === empId && s.session === session
        );

        shiftsToSave.push({
          id: prevShift ? prevShift.id : generateId(),
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

    if (existingEvent) {
      await dbService.replaceEventShifts(eventId, shiftsToSave);
    } else {
      await dbService.addShifts(shiftsToSave);
    }

    onSuccess();
  };

  return (
    <Modal
      title={existingEvent ? "Chỉnh Sửa Sự Kiện" : "Tạo Sự Kiện Mới"}
      isOpen={isOpen}
      onClose={onClose}
      footer={
        <button
          onClick={handleSubmit}
          className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold text-lg shadow-md hover:bg-emerald-700 active:scale-[0.98] transition-all flex justify-center items-center gap-2"
        >
          <Check size={20} />
          {existingEvent ? "Cập Nhật" : "Lưu Sự Kiện"}
        </button>
      }
    >
      <div className="flex flex-col gap-6">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-rose-50 text-rose-600 rounded-lg text-sm border border-rose-100">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {/* 1. Event Info */}
        <div className="space-y-3">
          <label className="block text-sm font-bold text-slate-700 uppercase tracking-wide">Thông tin chung</label>
          <input
            type="text"
            placeholder="Tên tiệc (VD: Đám cưới Nhà A)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-semibold"
          />
          <textarea
            placeholder="Ghi chú thêm..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none h-20 resize-none"
          />
        </div>

        {/* 2. Active Sessions */}
        <div className="space-y-3">
          <label className="block text-sm font-bold text-slate-700 uppercase tracking-wide">Ca làm việc</label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => toggleSession('morning')}
              className={`p-4 rounded-xl border-2 flex items-center justify-center gap-2 transition-all ${
                activeSessions.morning 
                  ? 'border-orange-400 bg-orange-50 text-orange-700 font-bold' 
                  : 'border-slate-100 bg-white text-slate-400 grayscale'
              }`}
            >
              <Sun size={20} /> Ca Sáng
            </button>
            <button
              type="button"
              onClick={() => toggleSession('afternoon')}
              className={`p-4 rounded-xl border-2 flex items-center justify-center gap-2 transition-all ${
                activeSessions.afternoon 
                  ? 'border-indigo-400 bg-indigo-50 text-indigo-700 font-bold' 
                  : 'border-slate-100 bg-white text-slate-400 grayscale'
              }`}
            >
              <Moon size={20} /> Ca Chiều
            </button>
          </div>
        </div>

        {/* 3. Assignments */}
        {(activeSessions.morning || activeSessions.afternoon) && (
          <div className="space-y-3 animate-fade-in">
            <label className="block text-sm font-bold text-slate-700 uppercase tracking-wide">
              Chấm công nhân viên
            </label>
            <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-[300px] overflow-y-auto">
              {employees.length === 0 ? (
                 <div className="p-4 text-center text-slate-400 text-sm">Chưa có nhân viên nào</div>
              ) : (
                employees.map(emp => {
                  const empSessions = assignments[emp.id] || new Set();
                  
                  return (
                    <div key={emp.id} className="p-3 flex items-center justify-between hover:bg-slate-50">
                      <span className="font-medium text-slate-800">{emp.name}</span>
                      <div className="flex gap-2">
                        {activeSessions.morning && (
                          <button
                            type="button"
                            onClick={() => toggleAssignment(emp.id, 'morning')}
                            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                              empSessions.has('morning')
                                ? 'bg-orange-500 text-white shadow-md shadow-orange-200' 
                                : 'bg-slate-100 text-slate-300'
                            }`}
                          >
                            <Sun size={18} />
                          </button>
                        )}
                        {activeSessions.afternoon && (
                          <button
                            type="button"
                            onClick={() => toggleAssignment(emp.id, 'afternoon')}
                            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                              empSessions.has('afternoon')
                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' 
                                : 'bg-slate-100 text-slate-300'
                            }`}
                          >
                            <Moon size={18} />
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