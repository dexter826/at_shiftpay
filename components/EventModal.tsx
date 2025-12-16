import React, { useState, useEffect } from 'react';
import { Employee, Shift, ShiftSession, Event } from '../types';
import { dbService } from '../services/firebase';
import { SHIFT_RATE } from '../constants';
import { Sun, Moon, Check, AlertCircle } from 'lucide-react';
import { Modal } from './ui/Modal';
import { useToast } from './ui/Toast';

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
  const { showToast } = useToast();
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [selectedSession, setSelectedSession] = useState<ShiftSession | null>(null);
  const [assignments, setAssignments] = useState<Record<string, boolean>>({});
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (existingEvent) {
        setTitle(existingEvent.title);
        setNote(existingEvent.note || '');

        const newAssignments: Record<string, boolean> = {};
        let detectedSession: ShiftSession | null = null;

        existingShifts.forEach(s => {
          newAssignments[s.employeeId] = true;
          if (!detectedSession) detectedSession = s.session;
        });

        setAssignments(newAssignments);
        setSelectedSession(detectedSession);
      } else {
        setTitle('');
        setNote('');
        setSelectedSession(null);
        setAssignments({});
      }
      setError('');
    }
  }, [isOpen, existingEvent, existingShifts]);

  const selectSession = (session: ShiftSession) => {
    if (selectedSession === session) {
      setSelectedSession(null);
      setAssignments({});
    } else {
      setSelectedSession(session);
      setAssignments({});
    }
  };

  const toggleAssignment = (empId: string) => {
    setAssignments(prev => ({
      ...prev,
      [empId]: !prev[empId]
    }));
  };

  const getSelectedCount = () => Object.values(assignments).filter(Boolean).length;

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError('Nhập tên sự kiện');
      return;
    }
    if (!selectedSession) {
      setError('Chọn một ca làm việc');
      return;
    }
    if (getSelectedCount() === 0) {
      setError('Chọn ít nhất 1 nhân viên');
      return;
    }

    // Prepare shifts data before closing modal
    const isEditing = !!existingEvent;
    const shiftsToCreate: Omit<Shift, 'id'>[] = [];

    Object.entries(assignments).forEach(([empId, isAssigned]) => {
      if (!isAssigned) return;
      const emp = employees.find(e => e.id === empId);
      if (!emp) return;

      const prevShift = existingShifts.find(
        s => s.employeeId === empId && s.session === selectedSession
      );

      const shiftData: Omit<Shift, 'id'> = {
        eventId: '', // Will be set after event creation
        eventDate: date,
        employeeId: empId,
        employeeName: emp.name,
        session: selectedSession!,
        amount: SHIFT_RATE,
        status: prevShift ? prevShift.status : 'unpaid',
      };

      if (prevShift?.paidAt) {
        shiftData.paidAt = prevShift.paidAt;
      }

      shiftsToCreate.push(shiftData);
    });

    // Close modal immediately for better UX
    onSuccess();

    try {
      const eventData = { date, title, note };

      if (isEditing && existingEvent) {
        // Set eventId for new shifts
        shiftsToCreate.forEach(s => s.eventId = existingEvent.id);

        // Update event and replace shifts in one batch operation
        await dbService.updateEventWithShifts(
          existingEvent.id,
          eventData,
          existingShifts.map(s => s.id),
          shiftsToCreate
        );
      } else {
        // Create new event with shifts in one batch operation
        await dbService.createEventWithShifts(eventData, shiftsToCreate);
      }

      showToast(isEditing ? 'Đã cập nhật sự kiện' : 'Đã tạo sự kiện mới', 'success');
    } catch (err) {
      showToast('Có lỗi xảy ra', 'error');
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

        {/* Sessions - Radio style (chỉ chọn 1) */}
        <div>
          <label className="block text-xs text-slate-400 mb-1.5">Ca làm việc</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => selectSession('morning')}
              className={`p-2.5 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 transition-colors ${selectedSession === 'morning'
                ? 'border-orange-500/50 bg-orange-500/10 text-orange-500'
                : 'border-slate-700 text-slate-500 hover:border-slate-600'
                }`}
            >
              <Sun size={16} />
              Ca Sáng
            </button>
            <button
              type="button"
              onClick={() => selectSession('afternoon')}
              className={`p-2.5 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 transition-colors ${selectedSession === 'afternoon'
                ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-500'
                : 'border-slate-700 text-slate-500 hover:border-slate-600'
                }`}
            >
              <Moon size={16} />
              Ca Chiều
            </button>
          </div>
        </div>

        {/* Assignments - Round checkbox at end */}
        {selectedSession && (
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Chấm công</label>
            <div className="border border-slate-700 rounded-lg divide-y divide-slate-700 max-h-48 overflow-y-auto">
              {employees.length === 0 ? (
                <div className="p-3 text-center text-slate-500 text-xs">Chưa có nhân viên</div>
              ) : (
                employees.map(emp => (
                  <div
                    key={emp.id}
                    onClick={() => toggleAssignment(emp.id)}
                    className="p-2.5 flex items-center justify-between cursor-pointer hover:bg-slate-800/50"
                  >
                    <span className="text-sm text-slate-300 truncate flex-1">{emp.name}</span>
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${assignments[emp.id]
                        ? 'bg-emerald-500 border-emerald-500'
                        : 'border-slate-600'
                        }`}
                    >
                      {assignments[emp.id] && <Check size={12} className="text-white" />}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
