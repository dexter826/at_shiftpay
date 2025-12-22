import React, { useState, useEffect, useMemo } from 'react';
import { Employee, Shift, ShiftSession, Event, UserSettings, DEFAULT_SETTINGS } from '../../types';
import { dbService, deleteField } from '../../services';
import { Sun, Moon, Check, AlertCircle, Banknote, Loader2, ThumbsUp, ThumbsDown, Minus, MapPin } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { Modal } from '../ui/Modal';
import Button from '../ui/Button';
import { TimePicker } from '../ui/TimePicker';
import { useToast } from '../ui/Toast';
import { areValuesEqual } from '../../utils/compare';

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
  const [location, setLocation] = useState('');
  const [note, setNote] = useState('');
  const [time, setTime] = useState('');
  const [amount, setAmount] = useState<number>(settings.shiftRate);
  const [surcharge, setSurcharge] = useState<number>(0);
  const [surchargeDistributionType, setSurchargeDistributionType] = useState<'equal' | 'selected'>('equal');
  const [surchargeSelectedEmployees, setSurchargeSelectedEmployees] = useState<Record<string, boolean>>({});
  const [selectedSession, setSelectedSession] = useState<ShiftSession | null>(null);
  const [assignments, setAssignments] = useState<Record<string, boolean>>({});
  const [review, setReview] = useState<'high' | 'low' | undefined>(undefined);
  const [reviewNote, setReviewNote] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [titleError, setTitleError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [employeeShiftCounts, setEmployeeShiftCounts] = useState<Record<string, number>>({});
  const [initialState, setInitialState] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      if (existingEvent) {
        setTitle(existingEvent.title);
        setLocation(existingEvent.location || '');
        setNote(existingEvent.note || '');
        setTime(existingEvent.time || '');
        setReview(existingEvent.review);
        setReviewNote(existingEvent.reviewNote || '');

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
        setSurcharge(existingEvent.surcharge || 0);

        // Khôi phục phân phối phụ phí
        if (existingEvent.surchargeDistribution) {
          setSurchargeDistributionType(existingEvent.surchargeDistribution.type);
          if (existingEvent.surchargeDistribution.type === 'selected' && existingEvent.surchargeDistribution.selectedEmployeeIds) {
            const selectedSurchargeEmps: Record<string, boolean> = {};
            existingEvent.surchargeDistribution.selectedEmployeeIds.forEach(id => {
              selectedSurchargeEmps[id] = true;
            });
            setSurchargeSelectedEmployees(selectedSurchargeEmps);
          }
        } else {
          setSurchargeDistributionType('equal');
          setSurchargeSelectedEmployees({});
        }

        // Đặt giờ mặc định theo ca
        if (!existingEvent.time && detectedSession) {
          setTime(detectedSession === 'morning' ? settings.morningTime : settings.afternoonTime);
        }
      } else {
        setTitle('');
        setLocation('');
        setNote('');
        setTime('');
        setAmount(settings.shiftRate);
        setSurcharge(0);
        setSurchargeDistributionType('equal');
        setSurchargeSelectedEmployees({});
        setSelectedSession(null);
        setAssignments({});
        setReview(undefined);
        setReviewNote('');
      }
      setError('');

      loadEmployeeShiftCounts();

      // Lưu trạng thái ban đầu để so sánh
      if (existingEvent) {
        setInitialState({
          title: existingEvent.title,
          location: existingEvent.location || '',
          note: existingEvent.note || '',
          time: existingEvent.time || '',
          amount: existingEvent.amount || settings.shiftRate,
          surcharge: existingEvent.surcharge || 0,
          surchargeDistribution: existingEvent.surchargeDistribution,
          assignments: Object.fromEntries(existingShifts.map(s => [s.employeeId, true])),
          session: existingShifts[0]?.session || null,
          review: existingEvent.review,
          reviewNote: existingEvent.reviewNote || ''
        });
      } else {
        setInitialState(null);
      }
    }
  }, [isOpen, existingEvent, existingShifts, settings]);

  const loadEmployeeShiftCounts = async () => {
    try {
      const currentDate = new Date(date);
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();

      const shifts = await dbService.getShiftsByMonth(currentMonth + 1, currentYear);
      const counts: Record<string, number> = {};

      shifts.forEach(shift => {
        counts[shift.employeeId] = (counts[shift.employeeId] || 0) + 1;
      });

      setEmployeeShiftCounts(counts);
    } catch (error) {
      console.error('Error loading employee shift counts:', error);
      setEmployeeShiftCounts({});
    }
  };

  const selectSession = (session: ShiftSession) => {
    if (selectedSession === session) {
      setSelectedSession(null);
      setAssignments({});
      setTime('');
    } else {
      setSelectedSession(session);
      setAssignments({});
      setSearchTerm('');
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

  const getSurchargePerPerson = () => {
    if (!surcharge || surcharge === 0) return 0;

    if (surchargeDistributionType === 'equal') {
      const totalPeople = getSelectedCount();
      return totalPeople > 0 ? surcharge / totalPeople : 0;
    } else {
      const selectedCount = Object.values(surchargeSelectedEmployees).filter(Boolean).length;
      return selectedCount > 0 ? surcharge / selectedCount : 0;
    }
  };

  const toggleSurchargeEmployee = (empId: string) => {
    setSurchargeSelectedEmployees(prev => ({
      ...prev,
      [empId]: !prev[empId]
    }));
  };

  const formatDateTitle = (dateStr: string) => {
    const date = new Date(dateStr);
    const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    const dayOfWeek = dayNames[date.getDay()];
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${dayOfWeek}, ${day}/${month}`;
  };

  const getSortedEmployees = () => {
    const filteredEmployees = employees.filter(emp =>
      emp.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return filteredEmployees.sort((a, b) => {
      // Ưu tiên 1: Sắp xếp theo số ca (giảm dần)
      const aCount = employeeShiftCounts[a.id] || 0;
      const bCount = employeeShiftCounts[b.id] || 0;
      if (aCount !== bCount) return bCount - aCount;

      // Ưu tiên 2: Sắp xếp theo tên
      return a.name.localeCompare(b.name);
    });
  };

  const validateTitle = (value: string) => {
    // Không còn bắt buộc nhập tên sự kiện
    setTitleError('');
    return true;
  };

  const hasChanged = useMemo(() => {
    if (!existingEvent || !initialState) return true; // Luôn cho phép lưu nếu là tạo mới

    const currentSurchargeDistribution = surcharge > 0 ? {
      type: surchargeDistributionType,
      selectedEmployeeIds: surchargeDistributionType === 'selected'
        ? Object.entries(surchargeSelectedEmployees).filter(([_, selected]) => selected).map(([id]) => id)
        : undefined
    } : undefined;

    const currentState = {
      title: title.trim() || 'Tiệc',
      location: location.trim(),
      note: note.trim(),
      time,
      amount,
      surcharge,
      surchargeDistribution: currentSurchargeDistribution,
      assignments: Object.fromEntries(Object.entries(assignments).filter(([_, v]) => v)),
      session: selectedSession,
      review,
      reviewNote: reviewNote.trim()
    };

    return !areValuesEqual(currentState, initialState);
  }, [
    title, location, note, time, amount, surcharge,
    surchargeDistributionType, surchargeSelectedEmployees,
    assignments, selectedSession, review, reviewNote,
    initialState, existingEvent
  ]);

  const handleSubmit = async () => {
    // Tên sự kiện mặc định là "Tiệc" nếu để trống
    const finalTitle = title.trim() || 'Tiệc';
    if (!selectedSession) {
      setError('Chọn một ca làm việc');
      return;
    }
    if (getSelectedCount() === 0) {
      setError('Chọn ít nhất 1 nhân viên');
      return;
    }

    setIsSubmitting(true);

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

      // Tính lương bao gồm phụ phí
      let finalAmount = amount;
      if (surcharge > 0) {
        if (surchargeDistributionType === 'equal') {
          finalAmount += getSurchargePerPerson();
        } else if (surchargeDistributionType === 'selected' && surchargeSelectedEmployees[empId]) {
          finalAmount += getSurchargePerPerson();
        }
      }

      const prevShift = existingShifts.find(
        s => s.employeeId === empId && s.session === selectedSession
      );

      if (prevShift) {
        // Cập nhật số tiền và tên nhân viên (đồng bộ nếu có thay đổi)
        shiftsToUpdate.push({
          id: prevShift.id,
          data: {
            amount: finalAmount,
            employeeName: emp.name,
          }
        });
      } else {
        // Tạo ca mới
        const shiftData: Omit<Shift, 'id'> = {
          eventId: '',
          date: date,
          employeeId: empId,
          employeeName: emp.name,
          session: selectedSession!,
          amount: finalAmount,
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
      const surchargeDistribution = surcharge > 0 ? {
        type: surchargeDistributionType,
        selectedEmployeeIds: surchargeDistributionType === 'selected'
          ? Object.entries(surchargeSelectedEmployees).filter(([_, selected]) => selected).map(([id]) => id)
          : undefined
      } : undefined;

      const eventData: any = {
        date,
        title: finalTitle,
        location,
        note,
        time,
        amount,
        surcharge,
      };

      // Chỉ thêm review và reviewNote nếυ có giá trị (tránh lỗi deleteField khi tạo mới)
      if (review !== undefined) {
        eventData.review = review;
        if (reviewNote) eventData.reviewNote = reviewNote;
      } else if (isEditing) {
        // Khi edit và gỡ đánh giá, cần xóa trường trên DB
        eventData.review = deleteField();
        eventData.reviewNote = deleteField();
      }

      if (surchargeDistribution) {
        eventData.surchargeDistribution = surchargeDistribution;
      }

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
      showToast('Có lỗi xảy ra. Vui lòng thử lại.', 'error');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };


  const textSecondaryClass = theme === 'dark' ? 'text-slate-400' : 'text-slate-500';
  const borderClass = theme === 'dark' ? 'border-slate-700' : 'border-slate-300';
  const cardBgClass = theme === 'dark' ? 'bg-slate-800' : 'bg-white';
  const textPrimaryClass = theme === 'dark' ? 'text-slate-200' : 'text-slate-900';
  const textMutedClass = theme === 'dark' ? 'text-slate-500' : 'text-slate-400';
  const hoverBg = theme === 'dark' ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50';

  return (
    <Modal
      title={existingEvent ? `Sửa sự kiện ${formatDateTitle(date)}` : `Tạo sự kiện ${formatDateTitle(date)}`}
      isOpen={isOpen}
      onClose={onClose}
      footer={
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={onClose}
            className="flex-1"
            disabled={isSubmitting}
          >
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            className="flex-1"
            disabled={isSubmitting || !hasChanged}
          >
            {isSubmitting ? <Loader2 size={16} className="text-white animate-spin" /> : <Check size={16} className="text-white" />}
            {isSubmitting ? "Đang lưu..." : (existingEvent ? "Cập nhật" : "Lưu")}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-2.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs">
            <AlertCircle size={14} />
            <span>{error}</span>
          </div>
        )}

        {/* Tên sự kiện và Thời gian */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={`block text-xs font-semibold mb-1.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Tên sự kiện</label>
            <input
              type="text"
              placeholder="Nhập tên sự kiện"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (titleError) validateTitle(e.target.value);
              }}
              onBlur={() => validateTitle(title)}
              className={`w-full p-2.5 border rounded-lg text-sm focus:outline-none ${titleError
                ? 'border-red-500 focus:border-red-500'
                : theme === 'dark'
                  ? 'bg-slate-800 border-slate-700 text-slate-200 placeholder-slate-500 focus:border-slate-600'
                  : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-slate-400'
                } ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'}`}
            />
            {titleError && <p className="text-red-500 text-xs mt-1">{titleError}</p>}
          </div>
          <div>
            <label className={`block text-xs font-semibold mb-1.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Thời gian bắt đầu</label>
            <TimePicker value={time} onChange={setTime} />
          </div>
        </div>

        {/* Địa điểm */}
        <div className="space-y-2">
          <label className={`block text-xs font-semibold mb-1.5 ${textSecondaryClass}`}>Địa điểm</label>
          <div className="relative">
            <MapPin className={`absolute left-3 top-3 ${textMutedClass}`} size={18} />
            <input
              type="text"
              placeholder="Nhập địa điểm"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl border ${borderClass} ${cardBgClass} ${textPrimaryClass} focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all`}
            />
          </div>

          {/* Logic Cảnh báo Địa điểm */}
          {location.length >= 2 && !existingEvent && (() => {
            const allPastLocations = Array.from(new Set(
              ((window as any).allEvents || [])
                .map((e: any) => e.location)
                .filter((loc: string) => loc && loc.toLowerCase().includes(location.toLowerCase()))
            )) as string[];

            const matchAtLocation = (window as any).allEvents?.filter((e: any) =>
              e.location?.toLowerCase().trim() === location.toLowerCase().trim() && e.review
            ) || [];

            return (
              <div className="space-y-2">
                {/* Autocomplete Suggestions */}
                {allPastLocations.length > 0 && location !== allPastLocations[0] && (
                  <div className={`mt-1 border ${borderClass} rounded-lg overflow-hidden ${cardBgClass} shadow-sm max-h-32 overflow-y-auto`}>
                    {allPastLocations.slice(0, 5).map((loc, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setLocation(loc)}
                        className={`w-full px-3 py-2 text-left text-xs ${hoverBg} transition-colors border-b last:border-0 ${borderClass} ${textSecondaryClass}`}
                      >
                        📍 {loc}
                      </button>
                    ))}
                  </div>
                )}

                {/* Warning/Success History */}
                {(() => {
                  const exactMatches = (window as any).allEvents?.filter((e: any) =>
                    e.location?.toLowerCase().trim() === location.toLowerCase().trim()
                  ) || [];

                  if (exactMatches.length === 0) return null;

                  const lastEvent = exactMatches[exactMatches.length - 1];
                  const hasReview = lastEvent.review;

                  if (hasReview) {
                    const isLow = lastEvent.review === 'low';
                    return (
                      <div className={`p-3 rounded-lg border flex items-start gap-3 ${isLow ? 'bg-red-500/10 border-red-500/20 text-red-600' : 'bg-green-500/10 border-green-500/20 text-green-600'
                        }`}>
                        <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                        <div className="text-xs">
                          <p>Địa điểm này từng được đánh giá <strong>{isLow ? 'Kém' : 'Tốt'}</strong> vào ngày {lastEvent.date && lastEvent.date.split('-').reverse().join('/')}.</p>
                          {lastEvent.reviewNote && <p className="mt-1 italic opacity-80">"{lastEvent.reviewNote}"</p>}
                        </div>
                      </div>
                    );
                  } else {
                    return (
                      <div className={`p-3 rounded-lg border flex items-start gap-3 bg-blue-500/10 border-blue-500/20 text-blue-600`}>
                        <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                        <div className="text-xs">
                          <p>Địa điểm này đã từng tổ chức sự kiện vào ngày {lastEvent.date && lastEvent.date.split('-').reverse().join('/')} (chưa có đánh giá).</p>
                        </div>
                      </div>
                    );
                  }
                })()}
              </div>
            );
          })()}
        </div>


        <div>
          <label className={`block text-xs font-semibold mb-1.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Ghi chú</label>
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

        {/* Đánh giá sự kiện */}
        <div>
          <label className={`block text-xs font-semibold mb-1.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Đánh giá sự kiện</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setReview('high')}
              className={`p-2.5 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 transition-colors ${review === 'high'
                ? 'border-green-500/50 bg-green-500/10 text-green-500'
                : theme === 'dark'
                  ? 'border-slate-700 text-slate-500 hover:border-slate-600'
                  : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                }`}
            >
              <ThumbsUp size={16} />
              Tốt
            </button>
            <button
              type="button"
              onClick={() => setReview(undefined)}
              className={`p-2.5 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 transition-colors ${review === undefined
                ? 'border-slate-400 bg-slate-400/10 text-slate-500'
                : theme === 'dark'
                  ? 'border-slate-700 text-slate-500 hover:border-slate-600'
                  : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                }`}
            >
              <Minus size={16} />
              Thường
            </button>
            <button
              type="button"
              onClick={() => setReview('low')}
              className={`p-2.5 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 transition-colors ${review === 'low'
                ? 'border-red-500/50 bg-red-500/10 text-red-500'
                : theme === 'dark'
                  ? 'border-slate-700 text-slate-500 hover:border-slate-600'
                  : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                }`}
            >
              <ThumbsDown size={16} />
              Kém
            </button>
          </div>
        </div>

        {/* Lý do đánh giá */}
        {review && review !== undefined && (
          <div className="space-y-1.5 pt-1">
            <label className={`block text-xs font-semibold ${textSecondaryClass}`}>Lý do đánh giá ({review === 'high' ? 'Tốt' : 'Kém'})</label>
            <textarea
              placeholder="Nhập lý do hoặc nhận xét cụ thể..."
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              className={`w-full p-2.5 border rounded-lg text-sm focus:outline-none h-16 resize-none ${theme === 'dark'
                ? 'bg-slate-800 border-slate-700 text-slate-200 placeholder-slate-500 focus:border-slate-600'
                : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-slate-400'
                } ${review === 'high' ? 'focus:border-green-500/50' : 'focus:border-red-500/50'}`}
            />
          </div>
        )}

        {/* Chọn ca (Radio) */}
        <div>
          <label className={`block text-xs font-semibold mb-1.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Ca làm việc</label>
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
                ? 'border-primary/50 bg-primary/10 text-primary'
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

        {/* Lương/người và Phụ phí */}
        {selectedSession && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-xs font-semibold mb-1.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Lương/người</label>
              <div className="relative">
                <input
                  type="number"
                  value={amount || ''}
                  onChange={(e) => setAmount(e.target.value === '' ? 0 : Number(e.target.value))}
                  className={`w-full p-2.5 pl-9 border rounded-lg text-sm focus:outline-none ${theme === 'dark'
                    ? 'bg-slate-800 border-slate-700 text-slate-200 placeholder-slate-500 focus:border-slate-600'
                    : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-slate-400'
                    }`}
                />
                <Banknote size={16} className={`absolute left-3 top-2.5 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`} />
              </div>
            </div>
            <div>
              <label className={`block text-xs font-semibold mb-1.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Phụ phí</label>
              <div className="relative">
                <input
                  type="number"
                  value={surcharge || ''}
                  onChange={(e) => setSurcharge(e.target.value === '' ? 0 : Number(e.target.value))}
                  placeholder="0"
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

        {/* Phân phối phụ phí */}
        {selectedSession && surcharge > 0 && (
          <div>
            <label className={`block text-xs mb-1.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Phân phối phụ phí</label>

            {/* Radio buttons */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="surchargeDistribution"
                  value="equal"
                  checked={surchargeDistributionType === 'equal'}
                  onChange={() => setSurchargeDistributionType('equal')}
                  className="accent-primary"
                />
                <span className={`text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                  Chia đều cho tất cả
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="surchargeDistribution"
                  value="selected"
                  checked={surchargeDistributionType === 'selected'}
                  onChange={() => {
                    setSurchargeDistributionType('selected');
                    // Tự động chọn tất cả nhân viên đang tham gia khi chuyển sang chế độ "chọn người nhận"
                    if (Object.keys(surchargeSelectedEmployees).length === 0) {
                      const allSelected: Record<string, boolean> = {};
                      Object.entries(assignments).forEach(([empId, isAssigned]) => {
                        if (isAssigned) allSelected[empId] = true;
                      });
                      setSurchargeSelectedEmployees(allSelected);
                    }
                  }}
                  className="accent-primary"
                />
                <span className={`text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                  Chọn người nhận
                </span>
              </label>
            </div>

            {/* Danh sách chọn người nhận phụ phí */}
            {surchargeDistributionType === 'selected' && (
              <div className={`border rounded-lg divide-y max-h-32 overflow-y-auto ${theme === 'dark'
                ? 'border-slate-700 divide-slate-700'
                : 'border-slate-200 divide-slate-100'
                }`}>
                {Object.entries(assignments).filter(([_, isAssigned]) => isAssigned).map(([empId]) => {
                  const emp = employees.find(e => e.id === empId);
                  if (!emp) return null;

                  const isSelected = surchargeSelectedEmployees[empId] || false;

                  return (
                    <div
                      key={empId}
                      onClick={() => toggleSurchargeEmployee(empId)}
                      className={`p-2.5 flex items-center justify-between cursor-pointer transition-colors ${theme === 'dark'
                        ? 'hover:bg-slate-800/50'
                        : 'hover:bg-slate-50'
                        } ${isSelected ? (theme === 'dark' ? 'bg-slate-800/30' : 'bg-blue-50/50') : ''}`}
                    >
                      <span className={`text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'} ${isSelected ? 'font-medium' : ''}`}>
                        {emp.name}
                      </span>
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected
                          ? 'bg-primary border-primary'
                          : theme === 'dark' ? 'border-slate-600' : 'border-slate-300'
                          }`}
                      >
                        {isSelected && <Check size={12} className="text-white" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Hiển thị tính toán */}
            {surchargeDistributionType === 'selected' && (
              <p className={`text-xs mt-2 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                {Object.values(surchargeSelectedEmployees).filter(Boolean).length} người được chọn - {getSurchargePerPerson().toLocaleString('vi-VN')} VND/người
              </p>
            )}
          </div>
        )}

        {/* Danh sách nhân viên */}
        {selectedSession && (
          <div>
            <label className={`block text-xs mb-1.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Chọn người làm</label>

            {/* Search Bar */}
            <div className="mb-3">
              <input
                type="text"
                placeholder="Tìm kiếm nhân viên..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full p-2.5 border rounded-lg text-sm focus:outline-none ${theme === 'dark'
                  ? 'bg-slate-800 border-slate-700 text-slate-200 placeholder-slate-500 focus:border-slate-600'
                  : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-slate-400'
                  }`}
              />
            </div>

            {/* Filtered Employees List */}
            <div className={`border rounded-lg divide-y max-h-48 overflow-y-auto ${theme === 'dark'
              ? 'border-slate-700 divide-slate-700'
              : 'border-slate-200 divide-slate-100'
              }`}>
              {employees.length === 0 ? (
                <div className="p-3 text-center text-slate-500 text-xs">Chưa có nhân viên</div>
              ) : getSortedEmployees().length === 0 ? (
                <div className="p-3 text-center text-slate-500 text-xs">Không tìm thấy nhân viên</div>
              ) : (
                getSortedEmployees().map(emp => {
                  const shiftCount = employeeShiftCounts[emp.id] || 0;
                  const isSelected = assignments[emp.id] || false;

                  return (
                    <div
                      key={emp.id}
                      onClick={() => toggleAssignment(emp.id)}
                      className={`p-2.5 flex items-center justify-between cursor-pointer transition-colors ${theme === 'dark'
                        ? 'hover:bg-slate-800/50'
                        : 'hover:bg-slate-50'
                        } ${isSelected ? (theme === 'dark' ? 'bg-slate-800/30' : 'bg-blue-50/50') : ''}`}
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <span className={`text-sm truncate ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'} ${isSelected ? 'font-medium' : ''}`}>
                          {emp.name}
                        </span>
                        {shiftCount > 0 && (
                          <span className={`text-xs px-1.5 py-0.5 rounded-full ${theme === 'dark'
                            ? 'bg-slate-700 text-slate-400'
                            : 'bg-slate-100 text-slate-500'
                            }`}>
                            {shiftCount}
                          </span>
                        )}
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected
                          ? 'bg-primary border-primary'
                          : theme === 'dark' ? 'border-slate-600' : 'border-slate-300'
                          }`}
                      >
                        {isSelected && <Check size={12} className="text-white" />}
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
