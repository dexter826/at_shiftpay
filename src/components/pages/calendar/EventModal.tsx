import React, { useState, useEffect, useMemo } from "react";
import {
  Employee,
  Shift,
  ShiftSession,
  Event,
  UserSettings,
  DEFAULT_SETTINGS,
  Location,
} from "../../../types";
import { dbService, deleteField } from "../../../services";
import {
  Sun,
  Moon,
  Check,
  AlertCircle,
  Banknote,
  ThumbsUp,
  ThumbsDown,
  Minus,
  MapPin,
  Type,
  FileText,
  Search,
} from "lucide-react";
import { useThemeStyles } from "../../../hooks/useThemeStyles";
import { Modal } from "../../ui/Modal";
import Button from "../../ui/Button";
import { TimePicker } from "../../ui/TimePicker";
import { useToast } from "../../ui/Toast";
import SearchInput from "../../ui/SearchInput";
import { areValuesEqual } from "../../../utils/compare";
import { useAuthStore } from "../../../stores";

interface EventModalProps {
  date: string;
  existingEvent: Event | null;
  existingShifts: Shift[];
  employees: Employee[];
  locations: Location[];
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
  locations,
  settings,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const {
    theme,
    textPrimaryClass,
    textSecondaryClass,
    textMutedClass,
    borderClass,
    divideClass,
    cardBgClass,
    hoverBgClass: hoverBg,
    inputBgClass,
    inputBorderClass,
    highlightBgClass,
  } = useThemeStyles();
  const { user } = useAuthStore();
  const userId = user?.uid || '';
  const { showToast } = useToast();
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [note, setNote] = useState("");
  const [time, setTime] = useState("");
  const [amount, setAmount] = useState<number>(settings.shiftRate);
  const [surcharge, setSurcharge] = useState<number>(0);
  const [surchargeDistributionType, setSurchargeDistributionType] = useState<
    "equal" | "selected"
  >("equal");
  const [surchargeSelectedEmployees, setSurchargeSelectedEmployees] = useState<
    Record<string, boolean>
  >({});
  const [selectedSession, setSelectedSession] = useState<ShiftSession | null>(
    null
  );
  const [assignments, setAssignments] = useState<Record<string, boolean>>({});
  const [review, setReview] = useState<"high" | "low" | undefined>(undefined);
  const [reviewNote, setReviewNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [titleError, setTitleError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [employeeShiftCounts, setEmployeeShiftCounts] = useState<
    Record<string, number>
  >({});
  const [initialState, setInitialState] = useState<any>(null);
  const [initialSelectedIds, setInitialSelectedIds] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    if (isOpen) {
      if (existingEvent) {
        setTitle(existingEvent.title);

        // Tìm địa điểm từ ID
        const loc = locations.find((l) => l.id === existingEvent.locationId);
        setLocation(loc ? loc.name : "");

        setNote(existingEvent.note || "");
        setTime(existingEvent.time || "");

        // Lấy đánh giá địa điểm
        if (loc) {
          setReview(loc.review);
          setReviewNote(loc.reviewNote || "");
        } else {
          setReview(undefined);
          setReviewNote("");
        }

        const newAssignments: Record<string, boolean> = {};
        let detectedSession: ShiftSession | null = null;

        // Ưu tiên: Sự kiện > Ca cũ > Mặc định
        let detectedAmount = existingEvent.amount;
        if (!detectedAmount && existingShifts.length > 0) {
          const firstShift = existingShifts[0];
          if (firstShift.amount) detectedAmount = firstShift.amount;
        }
        if (!detectedAmount) {
          detectedAmount = settings.shiftRate;
        }

        existingShifts.forEach((s) => {
          newAssignments[s.employeeId] = true;
          if (!detectedSession) detectedSession = s.session;
        });

        setAssignments(newAssignments);
        setInitialSelectedIds(new Set(existingShifts.map((s) => s.employeeId)));
        setSelectedSession(detectedSession);
        setAmount(detectedAmount);
        setSurcharge(existingEvent.surcharge || 0);

        // Khôi phục phân phối phụ phí
        if (existingEvent.surchargeDistribution) {
          setSurchargeDistributionType(
            existingEvent.surchargeDistribution.type
          );
          if (
            existingEvent.surchargeDistribution.type === "selected" &&
            existingEvent.surchargeDistribution.selectedEmployeeIds
          ) {
            const selectedSurchargeEmps: Record<string, boolean> = {};
            existingEvent.surchargeDistribution.selectedEmployeeIds.forEach(
              (id) => {
                selectedSurchargeEmps[id] = true;
              }
            );
            setSurchargeSelectedEmployees(selectedSurchargeEmps);
          }
        } else {
          setSurchargeDistributionType("equal");
          setSurchargeSelectedEmployees({});
        }

        // Đặt giờ theo ca
        if (!existingEvent.time && detectedSession) {
          setTime(
            detectedSession === "morning"
              ? settings.morningTime
              : settings.afternoonTime
          );
        }
      } else {
        setTitle("");
        setLocation("");
        setNote("");
        setTime("");
        setAmount(settings.shiftRate);
        setSurcharge(0);
        setSurchargeDistributionType("equal");
        setSurchargeSelectedEmployees({});
        setSelectedSession(null);
        setAssignments({});
        setInitialSelectedIds(new Set());
        setReview(undefined);
        setReviewNote("");
      }

      loadEmployeeShiftCounts();

      // Lấy đánh giá từ địa điểm
      if (existingEvent) {
        const loc = locations.find((l) => l.id === existingEvent.locationId);
        if (loc) {
          setReview(loc.review);
          setReviewNote(loc.reviewNote || "");
        }
      }

      // Lưu trạng thái gốc
      if (existingEvent) {
        const loc = locations.find((l) => l.id === existingEvent.locationId);
        setInitialState({
          title: existingEvent.title,
          locationId: existingEvent.locationId || "",
          note: existingEvent.note || "",
          time: existingEvent.time || "",
          amount: existingEvent.amount || settings.shiftRate,
          surcharge: existingEvent.surcharge || 0,
          surchargeDistribution: existingEvent.surchargeDistribution,
          assignments: Object.fromEntries(
            existingShifts.map((s) => [s.employeeId, true])
          ),
          session: existingShifts[0]?.session || null,
          review: loc?.review,
          reviewNote: loc?.reviewNote || "",
        });
      } else {
        setInitialState(null);
      }
    }
  }, [isOpen, existingEvent, existingShifts, settings, locations]);

  const loadEmployeeShiftCounts = async () => {
    try {
      const currentDate = new Date(date);
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();

      const shifts = await dbService.getShiftsByMonth(
        userId,
        currentMonth + 1,
        currentYear
      );
      const counts: Record<string, number> = {};

      shifts.forEach((shift) => {
        if (shift.status === 'unpaid') {
          counts[shift.employeeId] = (counts[shift.employeeId] || 0) + 1;
        }
      });

      setEmployeeShiftCounts(counts);
    } catch (error) {
      console.error("Error loading employee shift counts:", error);
      setEmployeeShiftCounts({});
    }
  };

  const selectSession = (session: ShiftSession) => {
    if (selectedSession === session) {
      setSelectedSession(null);
      setAssignments({});
      setTime("");
    } else {
      setSelectedSession(session);
      setAssignments({});
      setSearchTerm("");
      // Đặt giờ mặc định
      setTime(
        session === "morning" ? settings.morningTime : settings.afternoonTime
      );
    }
  };

  const toggleAssignment = (empId: string) => {
    setAssignments((prev) => ({
      ...prev,
      [empId]: !prev[empId],
    }));
  };

  const getSelectedCount = () =>
    Object.values(assignments).filter(Boolean).length;

  const getSurchargePerPerson = () => {
    if (!surcharge || surcharge === 0) return 0;

    if (surchargeDistributionType === "equal") {
      const totalPeople = getSelectedCount();
      return totalPeople > 0 ? surcharge / totalPeople : 0;
    } else {
      const selectedCount = Object.values(surchargeSelectedEmployees).filter(
        Boolean
      ).length;
      return selectedCount > 0 ? surcharge / selectedCount : 0;
    }
  };

  const toggleSurchargeEmployee = (empId: string) => {
    setSurchargeSelectedEmployees((prev) => ({
      ...prev,
      [empId]: !prev[empId],
    }));
  };

  const formatDateTitle = (dateStr: string) => {
    const date = new Date(dateStr);
    const dayNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
    const dayOfWeek = dayNames[date.getDay()];
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    return `${dayOfWeek}, ${day}/${month}`;
  };

  const getSortedEmployees = () => {
    const filteredEmployees = employees.filter((emp) =>
      emp.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return filteredEmployees.sort((a, b) => {
      // Ưu tiên 0: Đã chọn ban đầu
      const aInitial = initialSelectedIds.has(a.id) ? 1 : 0;
      const bInitial = initialSelectedIds.has(b.id) ? 1 : 0;
      if (aInitial !== bInitial) return bInitial - aInitial;

      // Ưu tiên 1: Số ca giảm dần
      const aCount = employeeShiftCounts[a.id] || 0;
      const bCount = employeeShiftCounts[b.id] || 0;
      if (aCount !== bCount) return bCount - aCount;

      // Ưu tiên 2: Tên
      return a.name.localeCompare(b.name);
    });
  };

  const validateTitle = (value: string) => {
    // Không bắt buộc tên
    setTitleError("");
    return true;
  };

  const hasChanged = useMemo(() => {
    if (!existingEvent || !initialState) return true; // Cho phép lưu nếu tạo mới

    const currentSurchargeDistribution =
      surcharge > 0
        ? {
            type: surchargeDistributionType,
            selectedEmployeeIds:
              surchargeDistributionType === "selected"
                ? Object.entries(surchargeSelectedEmployees)
                    .filter(([_, selected]) => selected)
                    .map(([id]) => id)
                : undefined,
          }
        : undefined;

    const currentState = {
      title: title.trim() || "Tiệc",
      locationId: locations.find((l) => l.name === location.trim())?.id || "",
      note: note.trim(),
      time,
      amount,
      surcharge,
      surchargeDistribution: currentSurchargeDistribution,
      assignments: Object.fromEntries(
        Object.entries(assignments).filter(([_, v]) => v)
      ),
      session: selectedSession,
      review,
      reviewNote: reviewNote.trim(),
    };

    return !areValuesEqual(currentState, initialState);
  }, [
    title,
    location,
    note,
    time,
    amount,
    surcharge,
    surchargeDistributionType,
    surchargeSelectedEmployees,
    assignments,
    selectedSession,
    review,
    reviewNote,
    initialState,
    existingEvent,
  ]);

  const handleSubmit = async () => {
    // Tên mặc định là "Tiệc"
    const finalTitle = title.trim() || "Tiệc";
    if (!selectedSession) {
      showToast("Chọn một ca làm việc", "error");
      return;
    }
    if (getSelectedCount() === 0) {
      showToast("Chọn ít nhất 1 nhân viên", "error");
      return;
    }

    // Kiểm tra người nhận phụ phí
    if (surcharge > 0 && surchargeDistributionType === "selected") {
      const selectedSurchargeCount = Object.values(surchargeSelectedEmployees).filter(Boolean).length;
      if (selectedSurchargeCount === 0) {
        showToast("Chọn ít nhất 1 người nhận phụ phí", "error");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // Xử lý Địa điểm & Đánh giá
      let locationId = "";
      if (location.trim()) {
        locationId = await dbService.findOrCreateLocation(userId, location.trim(), {
          review,
          reviewNote: reviewNote.trim(),
        });
      }

      // Chuẩn bị dữ liệu
      const isEditing = !!existingEvent;

      // Phân loại: Thêm, Sửa, Xóa
      const shiftsToCreate: Omit<Shift, "id">[] = [];
      const shiftsToUpdate: { id: string; data: Partial<Shift> }[] = [];
      const shiftIdsToDelete: string[] = [];

      // 1. Thêm & Sửa
      Object.entries(assignments).forEach(([empId, isAssigned]) => {
        if (!isAssigned) return;
        const emp = employees.find((e) => e.id === empId);
        if (!emp) return;

        // Tính lương kèm phụ phí
        let finalAmount = amount;
        if (surcharge > 0) {
          if (surchargeDistributionType === "equal") {
            finalAmount += getSurchargePerPerson();
          } else if (
            surchargeDistributionType === "selected" &&
            surchargeSelectedEmployees[empId]
          ) {
            finalAmount += getSurchargePerPerson();
          }
        }

        const prevShift = existingShifts.find(
          (s) => s.employeeId === empId && s.session === selectedSession
        );

        if (prevShift) {
          // Cập nhật số tiền & tên
          shiftsToUpdate.push({
            id: prevShift.id,
            data: {
              amount: finalAmount,
              employeeName: emp.name,
            },
          });
        } else {
          // Tạo ca mới
          const shiftData: Omit<Shift, "id"> = {
            eventId: "",
            date: date,
            employeeId: empId,
            employeeName: emp.name,
            session: selectedSession!,
            amount: finalAmount,
            status: "unpaid",
            userId: userId,
          };
          shiftsToCreate.push(shiftData);
        }
      });

      // 2. Xóa (ca bỏ chọn)

      existingShifts.forEach((s) => {
        const kept = shiftsToUpdate.find((upd) => upd.id === s.id);
        if (!kept) {
          shiftIdsToDelete.push(s.id);
        }
      });

      // Đóng nhanh
      onSuccess();

      const surchargeDistribution: any =
        surcharge > 0
          ? {
              type: surchargeDistributionType,
            }
          : undefined;

      if (surchargeDistribution && surchargeDistributionType === "selected") {
        surchargeDistribution.selectedEmployeeIds = Object.entries(
          surchargeSelectedEmployees
        )
          .filter(([_, selected]) => selected)
          .map(([id]) => id);
      }

      const eventData: any = {
        date,
        title: finalTitle,
        locationId,
        note,
        time,
        amount,
        surcharge,
        userId: userId,
      };

      if (surchargeDistribution) {
        eventData.surchargeDistribution = surchargeDistribution;
      }

      if (isEditing && existingEvent) {
        // Cập nhật thông minh
        await dbService.batchUpdateEvent(existingEvent.id, eventData, {
          create: shiftsToCreate,
          update: shiftsToUpdate,
          delete: shiftIdsToDelete,
        });
      } else {
        // Tạo mới (Atomic)
        await dbService.createEventWithShifts(eventData, shiftsToCreate);
      }

      showToast(
        isEditing ? "Đã cập nhật sự kiện" : "Đã tạo sự kiện mới",
        "success"
      );
    } catch (err) {
      showToast("Có lỗi xảy ra. Vui lòng thử lại.", "error");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      title={
        existingEvent
          ? `Sửa sự kiện ${formatDateTitle(date)}`
          : `Tạo sự kiện ${formatDateTitle(date)}`
      }
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
            loading={isSubmitting}
            disabled={!hasChanged}
          >
            {existingEvent ? "Cập nhật" : "Lưu"}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">

        {/* Tên & Thời gian */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              className={`block text-xs font-semibold mb-1.5 ${textMutedClass}`}
            >
              Tên sự kiện
            </label>
            <div className="relative">
              <Type
                className={`absolute left-3 top-1/2 -translate-y-1/2 ${textMutedClass}`}
                size={18}
              />
              <input
                type="text"
                placeholder="Nhập tên sự kiện"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (titleError) validateTitle(e.target.value);
                }}
                onBlur={() => validateTitle(title)}
                className={`w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm focus:outline-none ${
                  titleError
                    ? "border-red-500 focus:border-red-500"
                    : `${inputBorderClass} ${inputBgClass} ${textPrimaryClass} placeholder-slate-500 focus:border-primary`
                }`}
              />
            </div>
            {titleError && (
              <p className="text-red-500 text-xs mt-1">{titleError}</p>
            )}
          </div>
          <div>
            <label
              className={`block text-xs font-semibold mb-1.5 ${textMutedClass}`}
            >
              Thời gian bắt đầu
            </label>
            <TimePicker value={time} onChange={setTime} />
          </div>
        </div>

        {/* Địa điểm */}
        <div className="space-y-2">
          <label
            className={`block text-xs font-semibold mb-1.5 ${textMutedClass}`}
          >
            Địa điểm
          </label>
          <div className="relative">
            <MapPin
              className={`absolute left-3 top-1/2 -translate-y-1/2 ${textMutedClass}`}
              size={18}
            />
            <input
              type="text"
              placeholder="Nhập địa điểm"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className={`w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm focus:outline-none ${inputBorderClass} ${inputBgClass} ${textPrimaryClass} placeholder-slate-500 focus:border-primary`}
            />
          </div>

          {/* Cảnh báo địa điểm */}
          {location.length >= 2 &&
            (() => {
              const suggestions = locations.filter(
                (l) =>
                  l.name.toLowerCase().includes(location.toLowerCase()) &&
                  l.name.toLowerCase() !== location.toLowerCase()
              );

              const exactMatch = locations.find(
                (l) => l.name.toLowerCase() === location.toLowerCase()
              );

              return (
                <div className="space-y-2">
                  {/* Autocomplete Suggestions */}
                  {suggestions.length > 0 && (
                    <div
                      className={`mt-1 border ${borderClass} rounded-lg overflow-hidden ${cardBgClass} shadow-sm max-h-32 overflow-y-auto`}
                    >
                      {suggestions.slice(0, 5).map((loc, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setLocation(loc.name);
                            setReview(loc.review);
                            setReviewNote(loc.reviewNote || "");
                          }}
                          className={`w-full px-3 py-2 text-left text-xs ${hoverBg} transition-colors border-b last:border-0 ${borderClass} ${textSecondaryClass}`}
                        >
                          📍 {loc.name}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Warning/Success History */}
                  {exactMatch && exactMatch.review && (
                    <div
                      className={`p-3 rounded-lg border flex items-start gap-3 ${
                        exactMatch.review === "low"
                          ? "bg-red-500/10 border-red-500/20 text-red-600"
                          : "bg-green-500/10 border-green-500/20 text-green-600"
                      }`}
                    >
                      <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                      <div className="text-xs">
                        <p>
                          Địa điểm này từng được đánh giá{" "}
                          <strong>
                            {exactMatch.review === "low" ? "Kém" : "Tốt"}
                          </strong>
                          .
                        </p>
                        {exactMatch.reviewNote && (
                          <p className="mt-1 italic opacity-80">
                            "{exactMatch.reviewNote}"
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
        </div>

        <div>
          <label
            className={`block text-xs font-semibold mb-1.5 ${textMutedClass}`}
          >
            Ghi chú
          </label>
          <div className="relative">
            <FileText
              className={`absolute left-3 top-3 ${textMutedClass}`}
              size={18}
            />
            <textarea
              placeholder="Nhập ghi chú"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className={`w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm focus:outline-none h-20 resize-none ${inputBorderClass} ${inputBgClass} ${textPrimaryClass} placeholder-slate-500 focus:border-primary`}
            />
          </div>
        </div>

        {/* Đánh giá sự kiện */}
        <div>
          <label
            className={`block text-xs font-semibold mb-1.5 ${textMutedClass}`}
          >
            Đánh giá sự kiện
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setReview("high")}
              className={`p-2.5 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                review === "high"
                  ? "border-green-500/50 bg-green-500/10 text-green-500"
                  : `${inputBorderClass} ${textMutedClass} hover:border-primary/50`
              }`}
            >
              <ThumbsUp size={16} />
              Tốt
            </button>
            <button
              type="button"
              onClick={() => setReview(undefined)}
              className={`p-2.5 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                review === undefined
                  ? "border-primary/50 bg-primary/10 text-primary"
                  : `${inputBorderClass} ${textMutedClass} hover:border-primary/50`
              }`}
            >
              <Minus size={16} />
              Thường
            </button>
            <button
              type="button"
              onClick={() => setReview("low")}
              className={`p-2.5 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                review === "low"
                  ? "border-red-500/50 bg-red-500/10 text-red-500"
                  : `${inputBorderClass} ${textMutedClass} hover:border-red-500/50`
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
            <label className={`block text-xs font-semibold ${textMutedClass}`}>
              Lý do đánh giá ({review === "high" ? "Tốt" : "Kém"})
            </label>
            <div className="relative">
              <FileText
                className={`absolute left-3 top-3 ${textMutedClass}`}
                size={18}
              />
              <textarea
                placeholder="Nhập lý do hoặc nhận xét cụ thể..."
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                className={`w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm focus:outline-none h-20 resize-none ${inputBorderClass} ${inputBgClass} ${textPrimaryClass} placeholder-slate-500 ${
                  review === "high"
                    ? "focus:border-green-500/50"
                    : "focus:border-red-500/50"
                }`}
              />
            </div>
          </div>
        )}

        {/* Chọn ca */}
        <div>
          <label
            className={`block text-xs font-semibold mb-1.5 ${textMutedClass}`}
          >
            Ca làm việc
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => selectSession("morning")}
              className={`p-2.5 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                selectedSession === "morning"
                  ? "border-orange-500/50 bg-orange-500/10 text-orange-500"
                  : `${inputBorderClass} ${textMutedClass} hover:border-primary/50`
              }`}
            >
              <Sun size={16} />
              Tiệc Sáng
            </button>
            <button
              type="button"
              onClick={() => selectSession("afternoon")}
              className={`p-2.5 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                selectedSession === "afternoon"
                  ? "border-primary/50 bg-primary/10 text-primary"
                  : `${inputBorderClass} ${textMutedClass} hover:border-primary/50`
              }`}
            >
              <Moon size={16} />
              Tiệc Chiều
            </button>
          </div>
        </div>

        {/* Lương & Phụ phí */}
        {selectedSession && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                className={`block text-xs font-semibold mb-1.5 ${textMutedClass}`}
              >
                Lương/người
              </label>
              <div className="relative">
                <Banknote
                  size={18}
                  className={`absolute left-3 top-1/2 -translate-y-1/2 ${textMutedClass}`}
                />
                <input
                  type="number"
                  value={amount || ""}
                  onChange={(e) =>
                    setAmount(
                      e.target.value === "" ? 0 : Number(e.target.value)
                    )
                  }
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm focus:outline-none ${inputBorderClass} ${inputBgClass} ${textPrimaryClass} placeholder-slate-500 focus:border-primary`}
                />
              </div>
            </div>
            <div>
              <label
                className={`block text-xs font-semibold mb-1.5 ${textMutedClass}`}
              >
                Phụ phí
              </label>
              <div className="relative">
                <Banknote
                  size={18}
                  className={`absolute left-3 top-1/2 -translate-y-1/2 ${textMutedClass}`}
                />
                <input
                  type="number"
                  value={surcharge || ""}
                  onChange={(e) =>
                    setSurcharge(
                      e.target.value === "" ? 0 : Number(e.target.value)
                    )
                  }
                  placeholder="0"
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm focus:outline-none ${inputBorderClass} ${inputBgClass} ${textPrimaryClass} placeholder-slate-500 focus:border-primary`}
                />
              </div>
            </div>
          </div>
        )}

        {/* Phân phối phụ phí */}
        {selectedSession && surcharge > 0 && (
          <div>
            <label
              className={`block text-xs mb-1.5 ${
                theme === "dark" ? "text-slate-400" : "text-slate-500"
              }`}
            >
              Phân phối phụ phí
            </label>

            {/* Radio buttons */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="surchargeDistribution"
                  value="equal"
                  checked={surchargeDistributionType === "equal"}
                  onChange={() => setSurchargeDistributionType("equal")}
                  className="accent-primary"
                />
                <span className={`text-sm ${textSecondaryClass}`}>
                  Chia đều cho tất cả
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="surchargeDistribution"
                  value="selected"
                  checked={surchargeDistributionType === "selected"}
                  onChange={() => {
                    setSurchargeDistributionType("selected");
                  }}
                  className="accent-primary"
                />
                <span className={`text-sm ${textSecondaryClass}`}>
                  Chọn người nhận
                </span>
              </label>
            </div>

            {/* Danh sách người nhận */}
            {surchargeDistributionType === "selected" && (
              <div
                className={`border rounded-lg divide-y max-h-32 overflow-y-auto ${borderClass} ${divideClass}`}
              >
                {Object.entries(assignments)
                  .filter(([_, isAssigned]) => isAssigned)
                  .map(([empId]) => {
                    const emp = employees.find((e) => e.id === empId);
                    if (!emp) return null;

                    const isSelected =
                      surchargeSelectedEmployees[empId] || false;

                    return (
                      <div
                        key={empId}
                        onClick={() => toggleSurchargeEmployee(empId)}
                        className={`p-2.5 flex items-center justify-between cursor-pointer transition-colors hover:bg-primary/5 ${
                          isSelected ? "bg-primary/10" : ""
                        }`}
                      >
                        <span
                          className={`text-sm ${textSecondaryClass} ${
                            isSelected ? "font-medium" : ""
                          }`}
                        >
                          {emp.name}
                        </span>
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                            isSelected
                              ? "bg-primary border-primary"
                              : inputBorderClass
                          }`}
                        >
                          {isSelected && (
                            <Check size={12} className="text-white" />
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}

            {/* Hiển thị tính toán */}
            {surchargeDistributionType === "selected" && (
              <p className={`text-xs mt-2 ${textMutedClass}`}>
                {
                  Object.values(surchargeSelectedEmployees).filter(Boolean)
                    .length
                }{" "}
                người được chọn -{" "}
                {getSurchargePerPerson().toLocaleString("vi-VN")} VND/người
              </p>
            )}
          </div>
        )}

        {/* Danh sách nhân viên */}
        {selectedSession && (
          <div>
            <label className={`block text-xs mb-1.5 ${textMutedClass}`}>
              Chọn người làm ({getSelectedCount()})
            </label>

            {/* Search Bar */}
            <SearchInput
              placeholder="Tìm kiếm nhân viên..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClear={() => setSearchTerm('')}
              containerClassName="mb-3"
            />

            {/* Filtered Employees List */}
            <div
              className={`border rounded-lg divide-y max-h-48 overflow-y-auto ${borderClass} ${divideClass}`}
            >
              {employees.length === 0 ? (
                <div className={`p-3 text-center text-xs ${textMutedClass}`}>
                  Chưa có nhân viên
                </div>
              ) : getSortedEmployees().length === 0 ? (
                <div className={`p-3 text-center text-xs ${textMutedClass}`}>
                  Không tìm thấy nhân viên
                </div>
              ) : (
                getSortedEmployees().map((emp) => {
                  const shiftCount = employeeShiftCounts[emp.id] || 0;
                  const isSelected = assignments[emp.id] || false;

                  return (
                    <div
                      key={emp.id}
                      onClick={() => toggleAssignment(emp.id)}
                      className={`p-2.5 flex items-center justify-between cursor-pointer transition-colors hover:bg-primary/5 ${
                        isSelected ? "bg-primary/10" : ""
                      }`}
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <span
                          className={`text-sm truncate ${textSecondaryClass} ${
                            isSelected ? "font-medium" : ""
                          }`}
                        >
                          {emp.name}
                        </span>
                        {shiftCount > 0 && (
                          <span
                            className={`text-xs px-1.5 py-0.5 rounded-full ${highlightBgClass} ${textMutedClass}`}
                          >
                            {shiftCount}
                          </span>
                        )}
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                          isSelected
                            ? "bg-primary border-primary"
                            : inputBorderClass
                        }`}
                      >
                        {isSelected && (
                          <Check size={12} className="text-white" />
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
