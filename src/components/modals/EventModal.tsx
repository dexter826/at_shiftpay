import React, { useState, useEffect } from 'react';
import { Employee, Shift, ShiftSession, Event, UserSettings, DEFAULT_SETTINGS } from '../../types';
import { dbService } from '../../services/firebase';
import { Sun, Moon, Check, AlertCircle, Banknote } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { Modal } from '../ui/Modal';
import Button from '../ui/Button';
import { TimePicker } from '../ui/TimePicker';
import { useToast } from '../ui/Toast';

interface EventModalProps {
  date: string;
  existingEvent: Event | null;
  existingShifts: Shift[];
  employees: Employee[];
  settings: UserSettings;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const EventModal: React.FC<EventModalProps> = ({
  date,
  existingEvent,
  existingShifts,
  employees,
  settings,
  isOpen,
  onClose,
  onSuccess
}) => {
  const { theme } = useTheme();
  const { showToast } = useToast();
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [time, setTime] = useState('');
  const [amount, setAmount] = useState<number>(settings.shiftRate);
  const [selectedSession, setSelectedSession] = useState<ShiftSession | null>(null);
  const [assignments, setAssignments] = useState<Record<string, boolean>>({});
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (existingEvent) {
        setTitle(existingEvent.title);
        setNote(existingEvent.note || '');
        setTime(existingEvent.time || '');

        const newAssignments: Record<string, boolean> = {};
        let detectedSession: ShiftSession | null = null;

        // Ưu tiên: Event > Shift cũ > Mặc định
        let detectedAmount = existingEvent.amount;
        if (!detectedAmount && existingShifts.length > 0) {
          const firstShift = existingShifts[0];
          if (firstShift.amount) detectedAmount = firstShift.amount;
        }
        if (!detectedAmount) {
          detectedAmount = settings.shiftRate;
        }

        existingShifts.forEach(s => {
          newAssignments[s.employeeId] = true;
          if (!detectedSession) detectedSession = s.session;
        });

        setAssignments(newAssignments);
        setSelectedSession(detectedSession);
        setAmount(detectedAmount);

        // Đặt giờ mặc định theo ca
        if (!existingEvent.time && detectedSession) {
          setTime(detectedSession === 'morning' ? settings.morningTime : settings.afternoonTime);
        }
      } else {
        setTitle('');
        setNote('');
        setTime('');
        setAmount(settings.shiftRate);
        setSelectedSession(null);
        setAssignments({});
      }
      setError('');
    }
  }, [isOpen, existingEvent, existingShifts, settings]);

  const selectSession = (session: ShiftSession) => {
    if (selectedSession === session) {
      setSelectedSession(null);
      setAssignments({});
      setTime('');
    } else {
      setSelectedSession(session);
      setAssignments({});
      // Đặt giờ mặc định theo cài đặt
      setTime(session === 'morning' ? settings.morningTime : settings.afternoonTime);
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

    // Chuẩn bị dữ liệu
    const isEditing = !!existingEvent;

    // Phân loại: Thêm, Sửa, Xóa
    const shiftsToCreate: Omit<Shift, 'id'>[] = [];
    const shiftsToUpdate: { id: string, data: Partial<Shift> }[] = [];
    const shiftIdsToDelete: string[] = [];

    // 1. Xác định Thêm & Sửa
    Object.entries(assignments).forEach(([empId, isAssigned]) => {
      if (!isAssigned) return;
      const emp = employees.find(e => e.id === empId);
      if (!emp) return;

      const prevShift = existingShifts.find(
        s => s.employeeId === empId && s.session === selectedSession
      );

      if (prevShift) {
        // Chỉ cập nhật số tiền
        shiftsToUpdate.push({
          id: prevShift.id,
          data: {
            amount: amount,
            // session is same (filtered above)
            // employeeId/Name is same
          }
        });
      } else {
        // Tạo ca mới
        const shiftData: Omit<Shift, 'id'> = {
          eventId: '', // Will be set after event creation (or known if editing)
          eventDate: date,
          employeeId: empId,
          employeeName: emp.name,
          session: selectedSession!,
          amount: amount,
          status: 'unpaid',
        };
        shiftsToCreate.push(shiftData);
      }
    });

    // 2. Xác định Xóa (ca không còn được chọn)

    existingShifts.forEach(s => {
      const kept = shiftsToUpdate.find(upd => upd.id === s.id);
      if (!kept) {
        shiftIdsToDelete.push(s.id);
      }
    });

    // Đóng nhanh để UX mượt
    onSuccess();

    try {
      const eventData = { date, title, note, time, amount };

      if (isEditing && existingEvent) {
        // Cập nhật thông minh
        await dbService.batchUpdateEvent(
          existingEvent.id,
          eventData,
          {
            create: shiftsToCreate,
            update: shiftsToUpdate,
            delete: shiftIdsToDelete
          }
        );
      } else {
        // Tạo mới (Atomic)
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
        <Button
          onClick={handleSubmit}
          className=""
          fullWidth
        >
          <Check size={16} className="text-white" />
          {existingEvent ? "Cập nhật" : "Lưu"}
        </Button>
      }
    >
      <div className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-2.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs">
            <AlertCircle size={14} />
            <span>{error}</span>
          </div>
        )}

        {/* Thông tin sự kiện */}
        <div>
          <label className={`block text-xs mb-1.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Tên sự kiện</label>
          <input
            type="text"
            placeholder="Nhập tên sự kiện"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={`w-full p-2.5 border rounded-lg text-sm focus:outline-none ${theme === 'dark'
              ? 'bg-slate-800 border-slate-700 text-slate-200 placeholder-slate-500 focus:border-slate-600'
              : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-slate-400'
              }`}
          />
        </div>

        <div>
          <label className={`block text-xs mb-1.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Ghi chú</label>
          <textarea
            placeholder="Nhập ghi chú"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className={`w-full p-2.5 border rounded-lg text-sm focus:outline-none h-16 resize-none ${theme === 'dark'
              ? 'bg-slate-800 border-slate-700 text-slate-200 placeholder-slate-500 focus:border-slate-600'
              : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-slate-400'
              }`}
          />
        </div>

        {/* Chọn ca (Radio) */}
        <div>
          <label className={`block text-xs mb-1.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Ca làm việc</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => selectSession('morning')}
              className={`p-2.5 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 transition-colors ${selectedSession === 'morning'
                ? 'border-orange-500/50 bg-orange-500/10 text-orange-500'
                : theme === 'dark'
                  ? 'border-slate-700 text-slate-500 hover:border-slate-600'
                  : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                }`}
            >
              <Sun size={16} />
              Tiệc Sáng
            </button>
            <button
              type="button"
              onClick={() => selectSession('afternoon')}
              className={`p-2.5 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 transition-colors ${selectedSession === 'afternoon'
                ? 'border-[#ecb52d]/50 bg-[#ecb52d]/10 text-[#ecb52d]'
                : theme === 'dark'
                  ? 'border-slate-700 text-slate-500 hover:border-slate-600'
                  : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                }`}
            >
              <Moon size={16} />
              Tiệc Chiều
            </button>
          </div>
        </div>

        {/* Thời gian & Lương */}
        {selectedSession && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-xs mb-1.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Thời gian bắt đầu</label>
              <TimePicker value={time} onChange={setTime} />
            </div>
            <div>
              <label className={`block text-xs mb-1.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Lương</label>
              <div className="relative">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className={`w-full p-2.5 pl-9 border rounded-lg text-sm focus:outline-none ${theme === 'dark'
                    ? 'bg-slate-800 border-slate-700 text-slate-200 placeholder-slate-500 focus:border-slate-600'
                    : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-slate-400'
                    }`}
                />
                <Banknote size={16} className={`absolute left-3 top-2.5 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`} />
              </div>
            </div>
          </div>
        )}

        {/* Danh sách nhân viên */}
        {selectedSession && (
          <div>
            <label className={`block text-xs mb-1.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Chọn người làm</label>
            <div className={`border rounded-lg divide-y max-h-48 overflow-y-auto ${theme === 'dark'
              ? 'border-slate-700 divide-slate-700'
              : 'border-slate-200 divide-slate-100'
              }`}>
              {employees.length === 0 ? (
                <div className="p-3 text-center text-slate-500 text-xs">Chưa có nhân viên</div>
              ) : (
                employees.map(emp => (
                  <div
                    key={emp.id}
                    onClick={() => toggleAssignment(emp.id)}
                    className={`p-2.5 flex items-center justify-between cursor-pointer transition-colors ${theme === 'dark'
                      ? 'hover:bg-slate-800/50'
                      : 'hover:bg-slate-50'
                      }`}
                  >
                    <span className={`text-sm truncate flex-1 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>{emp.name}</span>
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${assignments[emp.id]
                        ? 'bg-[#ecb52d] border-[#ecb52d]'
                        : theme === 'dark' ? 'border-slate-600' : 'border-slate-300'
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
