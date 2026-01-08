import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '../ui/Skeleton';
import { Shift, PayrollSummary, PaymentTransaction, Event, Location } from '../../types';
import { formatCurrency, formatDate } from '../../constants';
import { dbService } from '../../services';

import { Wallet2, ChevronRight, Banknote, Calendar, CheckCircle2, History, Clock, Search, Filter, ChevronLeft, X, CalendarDays, FileDown, Check, AlertTriangle, Calculator, ArrowUpDown, MapPin, Loader2, Plus } from 'lucide-react';
import { LoadMore } from '../ui/LoadMore';
import { Modal } from '../ui/Modal';
import Button from '../ui/Button';
import { useToast } from '../ui/Toast';
import { useThemeStyles } from '../../hooks/useThemeStyles';
import { PaymentModal } from '../modals/PaymentModal';
import { SettlementModal } from '../modals/SettlementModal';
import { Dropdown, DropdownOption } from '../ui/Dropdown';

interface PayrollViewProps {
  shifts: Shift[];
  employees: any[];
  events: Event[];
  locations: Location[];
  loading?: boolean;
}

const PayrollView: React.FC<PayrollViewProps> = ({ shifts, employees, events, locations, loading = false }) => {
  const [activeTab, setActiveTab] = useState<'payroll' | 'history'>('payroll');
  const [paymentHistory, setPaymentHistory] = useState<PaymentTransaction[]>([]);
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const observer = useRef<IntersectionObserver | null>(null);

  const [selectedEmpId, setSelectedEmpId] = useState<string | null>(null);
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [payrollSearchTerm, setPayrollSearchTerm] = useState('');
  const [payrollSortBy, setPayrollSortBy] = useState<'amount' | 'shifts' | 'name'>('amount');
  const [filterDate, setFilterDate] = useState(''); // YYYY-MM
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [selectedShiftIds, setSelectedShiftIds] = useState<string[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSettlementModal, setShowSettlementModal] = useState(false);
  const [payrollVisibleCount, setPayrollVisibleCount] = useState(15);

  // Reset phan trang khi doi tim kiem hoac tab
  useEffect(() => {
    if (activeTab === 'payroll') {
      setPayrollVisibleCount(15);
    }
  }, [activeTab, payrollSearchTerm, payrollSortBy]);

  const loadMorePayments = useCallback(async (isInitial = false) => {
    if (isFetchingMore || (!hasMore && !isInitial)) return;

    setIsFetchingMore(true);
    try {
      const { payments, lastVisible: nextLastVisible } = await dbService.getPaymentsPaginated(
        20,
        isInitial ? undefined : lastVisible
      );

      if (isInitial) {
        setPaymentHistory(payments);
      } else {
        // Tránh trùng lặp nếu có real-time update hoặc fetch song song
        setPaymentHistory(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const newPayments = payments.filter(p => !existingIds.has(p.id));
          return [...prev, ...newPayments];
        });
      }

      setLastVisible(nextLastVisible);
      setHasMore(payments.length === 20);
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setIsFetchingMore(false);
    }
  }, [isFetchingMore, hasMore, lastVisible]);

  // Bo IntersectionObserver

  // Tải thêm dữ liệu lịch sử
  useEffect(() => {
    if (activeTab === 'history' && paymentHistory.length === 0) {
      loadMorePayments(true);
    }
  }, [activeTab, paymentHistory.length, loadMorePayments]);

  // Hook style đồng bộ theme
  const {
    theme,
    bgClass,
    cardBgClass,
    borderClass,
    textPrimaryClass,
    textSecondaryClass,
    textMutedClass,
    inputBgClass,
    inputBorderClass,
    hoverBgClass,
    highlightBgClass
  } = useThemeStyles();

  const summary: PayrollSummary[] = useMemo(() => {
    const map: Record<string, PayrollSummary & { totalFees?: number }> = {};

    employees.forEach(emp => {
      map[emp.id] = {
        employeeId: emp.id,
        employeeName: emp.name,
        phone: emp.phone,
        unpaidCount: 0,
        totalUnpaid: 0,
        advancedCount: 0,
        totalAdvanced: 0,
        netAmount: 0
      };
    });

    shifts.forEach(s => {
      if (map[s.employeeId]) {
        // Tìm event tương ứng với shift để lấy surcharge
        const event = events.find(e => e.id === s.eventId && e.date === s.date);
        let shiftFee = 0;

        if (event?.surcharge && event.surcharge > 0) {
          // Kiểm tra phân bổ phụ phí
          if (!event.surchargeDistribution || event.surchargeDistribution.type === 'equal') {
            // Chia đều cho tất cả nhân viên trong event
            const shiftsInEvent = shifts.filter(sh => sh.eventId === event.id && sh.date === event.date);
            const uniqueEmployees = new Set(shiftsInEvent.map(sh => sh.employeeId));
            shiftFee = event.surcharge / uniqueEmployees.size;
          } else if (event.surchargeDistribution.type === 'selected') {
            // Chỉ chia cho nhân viên được chọn
            if (event.surchargeDistribution.selectedEmployeeIds?.includes(s.employeeId)) {
              shiftFee = event.surcharge / event.surchargeDistribution.selectedEmployeeIds.length;
            }
          }
        }

        if (s.status === 'unpaid') {
          map[s.employeeId].unpaidCount += 1;
          map[s.employeeId].totalUnpaid += s.amount;
          if (shiftFee > 0) {
            map[s.employeeId].totalFees = (map[s.employeeId].totalFees || 0) + shiftFee;
          }
        } else if (s.status === 'advanced') {
          map[s.employeeId].advancedCount += 1;
          map[s.employeeId].totalAdvanced += s.amount;
          if (shiftFee > 0) {
            map[s.employeeId].totalFees = (map[s.employeeId].totalFees || 0) + shiftFee;
          }
        }
      }
    });

    // Net amount = chưa trả
    Object.values(map).forEach(emp => {
      emp.netAmount = emp.totalUnpaid;
    });

    return Object.values(map).sort((a, b) => b.netAmount - a.netAmount);
  }, [shifts, employees, events]);

  // Lọc và sắp xếp
  const filteredAndSortedSummary = useMemo(() => {
    const filtered = summary.filter(item => {
      const matchesSearch = item.employeeName.toLowerCase().includes(payrollSearchTerm.toLowerCase()) ||
        item.phone.includes(payrollSearchTerm);
      const hasDebt = item.totalUnpaid > 0 || item.totalAdvanced > 0;
      return matchesSearch && hasDebt;
    });

    return filtered.sort((a, b) => {
      switch (payrollSortBy) {
        case 'amount':
          return b.totalUnpaid - a.totalUnpaid;
        case 'shifts':
          return b.unpaidCount - a.unpaidCount;
        case 'name':
          return a.employeeName.localeCompare(b.employeeName, 'vi'); // Tên A-Z
        default:
          return 0;
      }
    });
  }, [summary, payrollSearchTerm, payrollSortBy]);

  // Tùy chọn sắp xếp
  const payrollSortOptions: DropdownOption[] = [
    { value: 'amount', label: 'Số tiền cao' },
    { value: 'shifts', label: 'Nhiều công' },
    { value: 'name', label: 'Tên A-Z' }
  ];

  const totalDebt = summary.reduce((acc, curr) => acc + curr.totalUnpaid, 0);
  const totalAdvanced = summary.reduce((acc, curr) => acc + curr.totalAdvanced, 0);
  const totalEarned = totalDebt + totalAdvanced;
  const totalUnpaidShifts = summary.reduce((acc, curr) => acc + curr.unpaidCount, 0);
  const totalAdvancedShifts = summary.reduce((acc, curr) => acc + curr.advancedCount, 0);
  const totalShifts = totalUnpaidShifts + totalAdvancedShifts;
  const totalFees = summary.reduce((acc, curr) => acc + ((curr as any).totalFees || 0), 0);

  const [payConfirm, setPayConfirm] = useState(false);
  const { showToast } = useToast();

  const handlePay = async () => {
    if (selectedShiftIds.length === 0) {
      showToast('Vui lòng chọn ít nhất một ca để thanh toán', 'error');
      return;
    }
    setPayConfirm(true);
  };

  // Chọn/Bỏ chọn
  const handleSelectAll = () => {
    if (selectedShiftIds.length === selectedUnpaidShifts.length) {
      setSelectedShiftIds([]);
    } else {
      setSelectedShiftIds(selectedUnpaidShifts.map(shift => shift.id));
    }
  };

  // Chọn/Bỏ chọn từng ca
  const handleSelectShift = (shiftId: string) => {
    setSelectedShiftIds(prev =>
      prev.includes(shiftId)
        ? prev.filter(id => id !== shiftId)
        : [...prev, shiftId]
    );
  };

  const confirmPay = async () => {
    if (!selectedEmpId || selectedShiftIds.length === 0) return;
    try {
      const selectedShifts = shifts.filter(s => selectedShiftIds.includes(s.id));
      const totalAmount = selectedShifts.reduce((sum, s) => sum + s.amount, 0);
      const employee = employees.find(e => e.id === selectedEmpId);

      if (!employee) return;

      const paymentData = {
        employeeId: selectedEmpId,
        employeeName: employee.name,
        amount: totalAmount,
        date: Date.now(),
        shiftIds: selectedShiftIds,
        type: 'regular' as const,
        note: `Thanh toán ${selectedShiftIds.length} ca làm việc`
      };

      await dbService.createPaymentTransaction(paymentData, selectedShiftIds);

      showToast('Đã thanh toán thành công', 'success');
      setSelectedEmpId(null);
      setPayConfirm(false);
      setSelectedShiftIds([]);
      // Làm mới dữ liệu
      loadMorePayments(true);
    } catch (error) {
      console.error('Error:', error);
      showToast('Có lỗi xảy ra', 'error');
    }
  };

  const selectedEmployeeSummary = selectedEmpId ? summary.find(s => s.employeeId === selectedEmpId) : null;
  const selectedUnpaidShifts = useMemo(() => {
    if (!selectedEmpId) return [];
    return shifts
      .filter(s => s.employeeId === selectedEmpId && s.status === 'unpaid')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [selectedEmpId, shifts]);

  const selectedTransaction = useMemo(() => {
    if (!selectedTransactionId) return null;
    return paymentHistory.find(p => p.id === selectedTransactionId);
  }, [selectedTransactionId, paymentHistory]);

  // Tổng tiền các ca đã chọn
  const selectedShiftsTotal = useMemo(() => {
    return selectedUnpaidShifts
      .filter(shift => selectedShiftIds.includes(shift.id))
      .reduce((sum, shift) => sum + shift.amount, 0);
  }, [selectedUnpaidShifts, selectedShiftIds]);

  // Reset theo nhân viên
  React.useEffect(() => {
    if (selectedEmpId && selectedUnpaidShifts.length > 0) {
      // Mặc định chọn tất cả khi mở modal
      setSelectedShiftIds(selectedUnpaidShifts.map(shift => shift.id));
    } else {
      setSelectedShiftIds([]);
    }
  }, [selectedEmpId, selectedUnpaidShifts]);

  const transactionShifts = useMemo(() => {
    if (!selectedTransaction) return [];
    return selectedTransaction.shiftIds?.map(shiftId =>
      shifts.find(s => s.id === shiftId)
    ).filter(Boolean) || [];
  }, [selectedTransaction, shifts]);

  // Lịch sử giao dịch
  const filteredHistory = useMemo(() => {
    return paymentHistory.filter(payment => {
      const matchesSearch = payment.employeeName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDate = filterDate ? payment.date >= new Date(filterDate).getTime() && payment.date < new Date(filterDate).setMonth(new Date(filterDate).getMonth() + 1) : true;
      return matchesSearch && matchesDate;
    });
  }, [paymentHistory, searchTerm, filterDate]);

  return (
    <div className={`pb-24 md:pb-0 ${bgClass} min-h-screen`}>
      {/* Tiêu đề */}
      <div className={`p-4 md:p-6 border-b ${borderClass}`}>
        <div className="flex justify-between items-center">
          {activeTab === 'payroll' && summary.length > 0 && (
            null
          )}
        </div>
        <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
          {/* Mobile UI */}
          <div className="block md:hidden">
            {/* Tổng đã làm - Lên trên */}
            <div className="text-center mb-4">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Wallet2 size={20} className="text-blue-500" />
                <p className="text-xs text-blue-500 uppercase tracking-wide font-medium">Tổng đã làm</p>
              </div>
              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.div
                    key="loading-total"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Skeleton width={120} height={36} className="mx-auto" />
                  </motion.div>
                ) : (
                  <motion.p
                    key="content-total"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-3xl font-bold text-blue-500"
                  >
                    {formatCurrency(totalEarned)}
                  </motion.p>
                )}
              </AnimatePresence>
              <p className="text-sm text-blue-500 mt-1">
                {totalShifts} công{totalFees > 0 ? ` (+ ${formatCurrency(totalFees)} phụ phí)` : ''}
              </p>
            </div>

            {/* Tình hình lương + Đã ứng (2 cột) */}
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-primary/20">
              <div className="text-center flex flex-col items-center">
                <p className="text-xs text-primary uppercase tracking-wide">Tình hình lương</p>
                <AnimatePresence mode="wait">
                  {loading ? (
                    <motion.div
                      key="loading-debt"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="mt-1"
                    >
                      <Skeleton width={80} height={24} />
                    </motion.div>
                  ) : (
                    <motion.p
                      key="content-debt"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-lg font-bold text-primary mt-1"
                    >
                      {formatCurrency(totalDebt)}
                    </motion.p>
                  )}
                </AnimatePresence>
                <p className="text-xs text-primary">{totalUnpaidShifts} công</p>
              </div>

              <div className="text-center flex flex-col items-center">
                <p className="text-xs text-orange-500 uppercase tracking-wide">Đã ứng</p>
                <AnimatePresence mode="wait">
                  {loading ? (
                    <motion.div
                      key="loading-advanced"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="mt-1"
                    >
                      <Skeleton width={80} height={24} />
                    </motion.div>
                  ) : (
                    <motion.p
                      key="content-advanced"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className={`text-lg font-bold mt-1 ${totalAdvanced > 0 ? 'text-orange-500' : textMutedClass}`}
                    >
                      {formatCurrency(totalAdvanced)}
                    </motion.p>
                  )}
                </AnimatePresence>
                <p className={`text-xs ${totalAdvanced > 0 ? 'text-orange-500' : textMutedClass}`}>
                  {totalAdvancedShifts} công
                </p>
              </div>
            </div>
          </div>

          {/* Desktop UI */}
          <div className="hidden md:flex justify-between items-start">
            <div className="flex-1">
              <div className="grid grid-cols-3 gap-6">
                {/* Tình hình lương */}
                <div>
                  <p className="text-xs text-primary uppercase tracking-wide">Tình hình lương</p>
                  <AnimatePresence mode="wait">
                    {loading ? (
                      <motion.div
                        key="loading-debt-dt"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="mt-1"
                      >
                        <Skeleton width={100} height={32} />
                      </motion.div>
                    ) : (
                      <motion.p
                        key="content-debt-dt"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="text-2xl font-bold text-primary mt-1"
                      >
                        {formatCurrency(totalDebt)}
                      </motion.p>
                    )}
                  </AnimatePresence>
                  <p className="text-xs text-primary mt-1">{totalUnpaidShifts} công</p>
                </div>

                {/* Đã ứng */}
                <div className={totalAdvanced > 0 ? '' : 'opacity-50'}>
                  <p className="text-xs text-orange-500 uppercase tracking-wide">Đã ứng</p>
                  <AnimatePresence mode="wait">
                    {loading ? (
                      <motion.div
                        key="loading-advanced-dt"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="mt-1"
                      >
                        <Skeleton width={100} height={28} />
                      </motion.div>
                    ) : (
                      <motion.p
                        key="content-advanced-dt"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className={`text-2xl font-bold mt-1 ${totalAdvanced > 0 ? 'text-orange-500' : textMutedClass}`}
                      >
                        {formatCurrency(totalAdvanced)}
                      </motion.p>
                    )}
                  </AnimatePresence>
                  <p className={`text-xs mt-1 ${totalAdvanced > 0 ? 'text-orange-500' : textMutedClass}`}>
                    {totalAdvancedShifts} công
                  </p>
                </div>

                {/* Tổng đã làm */}
                <div>
                  <p className="text-xs text-blue-500 uppercase tracking-wide">Tổng đã làm</p>
                  <AnimatePresence mode="wait">
                    {loading ? (
                      <motion.div
                        key="loading-total-dt"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="mt-1"
                      >
                        <Skeleton width={100} height={28} />
                      </motion.div>
                    ) : (
                      <motion.p
                        key="content-total-dt"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="text-2xl font-bold text-blue-500 mt-1"
                      >
                        {formatCurrency(totalEarned)}
                      </motion.p>
                    )}
                  </AnimatePresence>
                  <p className="text-xs text-blue-500 mt-1">
                    {totalShifts} công{totalFees > 0 ? ` (+ ${formatCurrency(totalFees)} phụ phí)` : ''}
                  </p>
                </div>
              </div>
            </div>
            <Wallet2 size={24} className="text-primary/50" />
          </div>
        </div>
      </div>

      {/* Tabs chuyển đổi */}
      <div className="flex px-4 md:px-6 pt-4 md:pt-6 pb-2 gap-4">
        <button
          onClick={() => setActiveTab('payroll')}
          className={`pb-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'payroll' ? 'border-primary text-primary' : `border-transparent ${textMutedClass} hover:${textSecondaryClass}`}`}
        >
          Chưa thanh toán
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`pb-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'history' ? 'border-primary text-primary' : `border-transparent ${textMutedClass} hover:${textSecondaryClass}`}`}
        >
          Lịch sử
        </button>
      </div>

      {/* Bộ lọc lương */}
      {activeTab === 'payroll' && (
        <div className="px-4 md:px-6 pb-2 flex gap-2">
          <div className={`flex-1 flex items-center px-3 h-[42px] border ${borderClass} rounded-xl ${cardBgClass}`}>
            <Search size={16} className={textMutedClass} />
            <input
              type="text"
              placeholder="Nhập tên nhân viên"
              value={payrollSearchTerm}
              onChange={(e) => setPayrollSearchTerm(e.target.value)}
              className={`ml-2 w-full bg-transparent outline-none text-sm ${textPrimaryClass} placeholder:text-slate-500`}
            />
          </div>

          <Dropdown
            options={payrollSortOptions}
            value={payrollSortBy}
            onChange={(value) => setPayrollSortBy(value as 'amount' | 'shifts' | 'name')}
            icon={<ArrowUpDown size={16} />}
            className="h-[42px]"
          />
        </div>
      )}

      {/* Bộ lọc lịch sử */}
      {activeTab === 'history' && (
        <div className="px-4 md:px-6 pb-2 flex gap-2">
          <div className={`flex-1 flex items-center px-3 h-[42px] border ${borderClass} rounded-xl ${cardBgClass}`}>
            <Search size={16} className={textMutedClass} />
            <input
              type="text"
              placeholder="Nhập tên nhân viên"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`ml-2 w-full bg-transparent outline-none text-sm ${textPrimaryClass} placeholder:text-slate-500`}
            />
          </div>
          <button
            onClick={() => {
              setViewYear(filterDate ? parseInt(filterDate.split('-')[0]) : new Date().getFullYear());
              setIsFilterModalOpen(true);
            }}
            className={`flex items-center gap-2 px-3 h-[42px] border ${borderClass} rounded-xl ${cardBgClass} text-sm ${textPrimaryClass}`}
          >
            <CalendarDays size={16} className={filterDate ? 'text-primary' : textMutedClass} />
            <span className={filterDate ? 'text-primary font-medium' : textMutedClass}>
              {filterDate ? `Tháng ${filterDate.split('-')[1]}/${filterDate.split('-')[0]}` : 'Tất cả thời gian'}
            </span>
          </button>
        </div>
      )}

      {/* Danh sách */}
      <div className="px-4 md:px-6 pt-2 pb-4 md:pb-6 space-y-2">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading-list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-2"
            >
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className={`w-full p-3 ${cardBgClass} border ${borderClass} rounded-lg flex justify-between items-center`}>
                  <div className="flex items-center gap-3 w-full">
                    <Skeleton variant="circular" width={36} height={36} />
                    <div className="flex-1 space-y-2">
                      <Skeleton width="40%" height={16} />
                      <Skeleton width="30%" height={12} />
                    </div>
                    <Skeleton width={80} height={20} />
                  </div>
                </div>
              ))}
            </motion.div>
          ) : activeTab === 'payroll' ? (
            <motion.div
              key="payroll-list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-2"
            >
              {filteredAndSortedSummary.length === 0 ? (
                <div className={`text-center py-10 ${textMutedClass}`}>
                  <CheckCircle2 size={48} className="mx-auto mb-2 opacity-20" />
                  <p>{payrollSearchTerm ? 'Không tìm thấy nhân viên nào' : 'Không có khoản nợ nào'}</p>
                </div>
              ) : (
                <>
                  {filteredAndSortedSummary.slice(0, payrollVisibleCount).map((item) => {
                    const employee = employees.find(e => e.id === item.employeeId);
                    const employeeImage = employee?.imageUrl || employee?.avatar;
                    const itemWithFees = item as typeof item & { totalFees?: number };

                    return (
                      <button
                        key={item.employeeId}
                        onClick={() => {
                          setSelectedEmpId(item.employeeId);
                          if (item.totalUnpaid > 0) {
                            setShowPaymentModal(true);
                          }
                        }}
                        className={`w-full p-3 ${cardBgClass} border ${borderClass} rounded-lg hover:border-primary/50 transition-colors flex justify-between items-center group`}
                      >
                        <div className="flex items-center gap-3">
                          {employeeImage ? (
                            <img
                              src={employeeImage}
                              alt={item.employeeName}
                              className={`w-9 h-9 rounded-full object-cover border-2 ${item.totalUnpaid > 0 ? 'border-primary' : borderClass}`}
                            />
                          ) : (
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium ${item.totalUnpaid > 0 ? 'bg-primary/10 text-primary' : `${hoverBgClass} ${textMutedClass}`
                              }`}>
                              {item.employeeName.charAt(0)}
                            </div>
                          )}
                          <div className="text-left">
                            <div className="flex items-center gap-2">
                              <p className={`text-sm font-medium ${textSecondaryClass}`}>{item.employeeName}</p>
                              {itemWithFees.totalFees && itemWithFees.totalFees > 0 && (
                                <span className="px-1.5 py-0.5 text-[10px] font-medium bg-blue-500/10 text-blue-500 border border-blue-500/30 rounded">
                                  Có phụ phí
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              {item.unpaidCount > 0 && (
                                <span className="text-primary">
                                  {item.unpaidCount} công chưa trả
                                </span>
                              )}
                              {item.advancedCount > 0 && (
                                <span className="text-orange-500">
                                  {item.advancedCount} công đã ứng
                                </span>
                              )}
                              {item.unpaidCount === 0 && item.advancedCount === 0 && (
                                <span className={textMutedClass}>Không có công nợ</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <span className={`text-sm font-medium ${item.totalUnpaid > 0 ? 'text-primary' : textMutedClass}`}>
                              {formatCurrency(item.totalUnpaid)}
                            </span>
                            {item.totalAdvanced > 0 && (
                              <p className="text-xs text-orange-500">
                                Đã ứng: {formatCurrency(item.totalAdvanced)}
                              </p>
                            )}
                          </div>
                          <ChevronRight size={16} className={textMutedClass} />
                        </div>
                      </button>
                    );
                  })}
                  <LoadMore
                    currentCount={payrollVisibleCount}
                    totalCount={filteredAndSortedSummary.length}
                    onLoadMore={() => setPayrollVisibleCount(prev => prev + 15)}
                    unit="nhân viên"
                    className="mt-4"
                  />
                </>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="history-list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-2"
            >
              {filteredHistory.length === 0 && !isFetchingMore ? (
                <div className={`text-center py-10 ${textMutedClass}`}>
                  <History size={48} className="mx-auto mb-2 opacity-20" />
                  <p>Không tìm thấy giao dịch nào</p>
                </div>
              ) : (
                <>
                  {filteredHistory.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setSelectedTransactionId(item.id)}
                      className={`w-full p-3 ${cardBgClass} border ${borderClass} rounded-lg hover:border-primary/50 transition-colors flex justify-between items-center group`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium ${hoverBgClass} ${textMutedClass}`}>
                          <History size={16} />
                        </div>
                        <div className="text-left">
                          <div className="flex items-center gap-2">
                            <p className={`text-sm font-medium ${textSecondaryClass}`}>{item.employeeName}</p>
                            {item.type === 'advance' && (
                              <span className="px-2 py-0.5 text-xs bg-transparent border border-orange-600 dark:border-orange-400 text-orange-600 dark:text-orange-400 rounded-full">
                                Ứng tiền
                              </span>
                            )}
                            {item.type === 'settlement' && (
                              <span className="px-2 py-0.5 text-xs bg-transparent border border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400 rounded-full">
                                Quyết toán
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock size={12} className={textMutedClass} />
                            <p className={`text-xs ${textMutedClass}`}>
                              {new Date(item.date).toLocaleDateString('vi-VN')} {new Date(item.date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${textSecondaryClass}`}>
                          {formatCurrency(item.amount)}
                        </span>
                        <ChevronRight size={16} className={textMutedClass} />
                      </div>
                    </button>
                  ))}

                  {isFetchingMore ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="w-6 h-6 text-primary animate-spin" />
                    </div>
                  ) : hasMore && (
                    <LoadMore
                      currentCount={filteredHistory.length}
                      totalCount={filteredHistory.length + (hasMore ? 1 : 0)} // Trick de hien nut vi hien tai k biet exact total
                      onLoadMore={loadMorePayments}
                      unit="giao dịch"
                      className="mt-4"
                    />
                  )}

                  {!hasMore && filteredHistory.length > 0 && (
                    <p className={`text-center text-[11px] ${textMutedClass} tracking-wide uppercase font-medium mt-6`}>
                      Đã hiển thị toàn bộ {filteredHistory.length} giao dịch
                    </p>
                  )}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modal chi tiết nhân viên */}
      <Modal
        title={selectedEmployeeSummary?.employeeName || "Chi tiết"}
        isOpen={!!selectedEmpId}
        onClose={() => setSelectedEmpId(null)}
        footer={
          selectedEmployeeSummary && selectedEmployeeSummary.advancedCount > 0 ? (
            <Button
              onClick={() => setShowSettlementModal(true)}
              fullWidth
            >
              <Calculator size={16} className="text-white" />
              Quyết toán tiền ứng
            </Button>
          ) : null
        }
      >
        <div className="space-y-4">
          {/* Tổng quan */}
          {selectedEmployeeSummary && (
            <div className={`p-4 ${cardBgClass} border ${borderClass} rounded-lg`}>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className={textMutedClass}>Chưa thanh toán:</span>
                  <p className={`font-medium text-primary`}>
                    {formatCurrency(selectedEmployeeSummary.totalUnpaid)} ({selectedEmployeeSummary.unpaidCount} ca)
                  </p>
                </div>
                <div>
                  <span className={textMutedClass}>Đã ứng:</span>
                  <p className={`font-medium text-orange-500`}>
                    {formatCurrency(selectedEmployeeSummary.totalAdvanced)} ({selectedEmployeeSummary.advancedCount} ca)
                  </p>
                </div>
                <div className={`col-span-2 pt-2 border-t ${borderClass}`}>
                  <span className={textMutedClass}>Tổng tiền đã làm:</span>
                  <p className={`font-bold text-lg text-blue-500`}>
                    {formatCurrency(selectedEmployeeSummary.totalUnpaid + selectedEmployeeSummary.totalAdvanced)}
                  </p>
                  <div className="mt-2 text-sm">
                    <div className="flex justify-between">
                      <span className={textMutedClass}>Đã nhận (ứng):</span>
                      <span className="text-orange-500">
                        {formatCurrency(selectedEmployeeSummary.totalAdvanced)}
                      </span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span className={textMutedClass}>Còn lại cần trả:</span>
                      <span className="text-primary">
                        {formatCurrency(selectedEmployeeSummary.totalUnpaid)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Thông tin tạm ứng */}
          {selectedEmployeeSummary && selectedEmployeeSummary.advancedCount > 0 && (
            <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <AlertTriangle size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className={`font-medium ${textPrimaryClass} mb-1`}>Có tiền ứng cần quyết toán</p>
                <p className={textSecondaryClass}>
                  Nhân viên đã nhận {formatCurrency(selectedEmployeeSummary.totalAdvanced)} tiền ứng.
                </p>
              </div>
            </div>
          )}

          {selectedUnpaidShifts.length === 0 ? (
            <div className={`py-8 flex flex-col items-center justify-center ${textMutedClass} gap-2`}>
              <CheckCircle2 size={32} className="text-primary" />
              <p className="text-sm">Không còn ca chưa thanh toán</p>
              {selectedEmployeeSummary && selectedEmployeeSummary.advancedCount > 0 && (
                <p className="text-xs text-orange-500 mt-2">
                  Có {selectedEmployeeSummary.advancedCount} ca đã ứng tiền cần quyết toán
                </p>
              )}
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center">
                <p className={`text-xs ${textMutedClass} uppercase tracking-wide`}>Công chưa trả</p>
                <button
                  onClick={handleSelectAll}
                  className={`text-xs font-medium px-2 py-1 rounded ${selectedShiftIds.length === selectedUnpaidShifts.length
                    ? 'text-primary bg-primary/10'
                    : `${textMutedClass} hover:${textSecondaryClass}`
                    } transition-colors`}
                >
                  {selectedShiftIds.length === selectedUnpaidShifts.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                </button>
              </div>
              {selectedUnpaidShifts.map((s) => (
                <div
                  key={s.id}
                  className={`flex justify-between items-center p-3 border rounded-lg cursor-pointer transition-all ${selectedShiftIds.includes(s.id)
                    ? 'bg-primary/10 border-primary/30'
                    : `${hoverBgClass} ${borderClass} hover:border-primary/20`
                    }`}
                  onClick={() => handleSelectShift(s.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${selectedShiftIds.includes(s.id)
                      ? 'bg-primary border-primary'
                      : `${inputBorderClass} ${inputBgClass}`
                      }`}>
                      {selectedShiftIds.includes(s.id) && (
                        <Check size={10} className="text-white" />
                      )}
                    </div>
                    <Calendar size={16} className={textMutedClass} />
                    <div>
                      <p className={`text-sm ${textSecondaryClass}`}>{formatDate(s.date)}</p>
                      <span className={`text-[10px] font-medium ${s.session === 'morning' ? 'text-orange-500' : 'text-primary'
                        }`}>
                        {s.session === 'morning' ? 'Tiệc Sáng' : 'Tiệc Chiều'}
                      </span>
                    </div>
                  </div>
                  <p className={`text-sm font-medium ${textSecondaryClass}`}>{formatCurrency(s.amount)}</p>
                </div>
              ))}

              {/* Tổng tiền đã chọn */}
              {selectedShiftIds.length > 0 && (
                <div className={`mt-3 p-3 bg-primary/10 border border-primary/20 rounded-lg`}>
                  <div className="flex justify-between items-center">
                    <span className={`text-sm font-medium text-primary`}>
                      Đã chọn {selectedShiftIds.length} ca
                    </span>
                    <span className={`text-sm font-bold text-primary`}>
                      {formatCurrency(selectedShiftsTotal)}
                    </span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </Modal>

      {/* Chi tiết giao dịch */}
      <Modal
        title="Chi tiết thanh toán"
        isOpen={!!selectedTransactionId}
        onClose={() => setSelectedTransactionId(null)}
        footer={null}
      >
        <div className="space-y-3">
          {/* Thông tin chung */}
          <div className={`p-4 ${cardBgClass} border ${borderClass} rounded-lg`}>
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs ${textMutedClass}`}>Loại giao dịch</span>
                  {selectedTransaction?.type === 'advance' && (
                    <span className="px-2 py-0.5 text-xs bg-transparent border border-orange-600 dark:border-orange-400 text-orange-600 dark:text-orange-400 rounded-full">
                      Ứng tiền
                    </span>
                  )}
                  {selectedTransaction?.type === 'settlement' && (
                    <span className="px-2 py-0.5 text-xs bg-transparent border border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400 rounded-full">
                      Quyết toán
                    </span>
                  )}
                  {(!selectedTransaction?.type || selectedTransaction?.type === 'regular') && (
                    <span className="px-2 py-0.5 text-xs bg-transparent border border-green-600 dark:border-green-400 text-green-600 dark:text-green-400 rounded-full">
                      Thanh toán thường
                    </span>
                  )}
                </div>
                <span className={`text-xl font-bold ${textSecondaryClass}`}>
                  {formatCurrency(selectedTransaction?.amount || 0)}
                </span>
              </div>
              <div className="text-right">
                <span className={`text-xs ${textMutedClass}`}>Thời gian</span>
                <p className={`text-sm font-medium ${textSecondaryClass}`}>
                  {selectedTransaction ? new Date(selectedTransaction.date).toLocaleString('vi-VN') : ''}
                </p>
              </div>
            </div>

            {selectedTransaction?.note && (
              <div className={`pt-2 border-t ${borderClass}`}>
                <span className={`text-xs ${textMutedClass}`}>Ghi chú:</span>
                <p className={`text-sm ${textSecondaryClass}`}>{selectedTransaction.note}</p>
              </div>
            )}
          </div>

          <p className={`text-xs ${textMutedClass} uppercase tracking-wide pt-2`}>Các ca làm việc</p>
          {transactionShifts.length === 0 ? (
            <div className={`py-4 text-center ${textMutedClass}`}>
              <p className="text-sm">Không tìm thấy thông tin ca làm việc (Có thể đã bị xóa)</p>
            </div>
          ) : (
            transactionShifts.map((s) => {
              const event = events.find(e => e.id === s.eventId);
              return (
                <div key={s.id} className={`flex justify-between items-center p-3 ${hoverBgClass} border ${borderClass} rounded-lg`}>
                  <div className="flex items-center gap-3">
                    <Calendar size={16} className={textMutedClass} />
                    <div>
                      <p className={`text-sm font-medium ${textSecondaryClass}`}>{event?.title || 'Không rõ sự kiện'}</p>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-medium ${s.session === 'morning' ? 'text-orange-500' : 'text-primary'
                          }`}>
                          {s.session === 'morning' ? 'Tiệc Sáng' : 'Tiệc Chiều'}
                        </span>
                        <span className={`text-[10px] ${textMutedClass}`}>•</span>
                        <span className={`text-[10px] ${textMutedClass}`}>{formatDate(s.date)}</span>
                      </div>
                      {event?.locationId && (
                        <p className={`text-[10px] ${textMutedClass} mt-0.5 flex items-center gap-1`}>
                          <MapPin size={10} />
                          {locations.find(l => l.id === event.locationId)?.name || 'Không rõ địa điểm'}
                        </p>
                      )}
                    </div>
                  </div>
                  <p className={`text-sm font-medium ${textSecondaryClass}`}>{formatCurrency(s.amount)}</p>
                </div>
              );
            })
          )}
        </div>
      </Modal>

      {/* Xác nhận thanh toán */}
      <Modal
        title="Xác nhận thanh toán"
        isOpen={payConfirm}
        onClose={() => setPayConfirm(false)}
        footer={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => setPayConfirm(false)}
              className="flex-1"
            >
              Hủy
            </Button>
            <Button
              onClick={confirmPay}
              className="flex-1"
            >
              <Check size={16} />
              Xác nhận
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <p className={`text-sm ${textSecondaryClass}`}>
            Thanh toán {formatCurrency(selectedShiftsTotal)} cho {selectedEmployeeSummary?.employeeName}?
          </p>
          <div className={`p-3 ${hoverBgClass} rounded-lg`}>
            <p className={`text-xs ${textMutedClass} mb-1`}>Chi tiết:</p>
            <p className={`text-sm ${textSecondaryClass}`}>
              {selectedShiftIds.length} ca làm việc được chọn
            </p>
          </div>
        </div>
      </Modal>

      {/* Chọn tháng */}
      <Modal
        title="Chọn thời gian"
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        footer={
          <button
            onClick={() => {
              setFilterDate('');
              setIsFilterModalOpen(false);
            }}
            className={`w-full py-2.5 rounded-lg text-sm font-medium border ${borderClass} ${textSecondaryClass} hover:${hoverBgClass} transition-colors`}
          >
            Xem tất cả lịch sử
          </button>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center px-2">
            <button
              onClick={() => setViewYear(prev => prev - 1)}
              className={`p-1 rounded-full ${hoverBgClass}`}
            >
              <ChevronLeft size={20} className={textSecondaryClass} />
            </button>
            <span className={`text-lg font-bold ${textPrimaryClass}`}>{viewYear}</span>
            <button
              onClick={() => setViewYear(prev => prev + 1)}
              className={`p-1 rounded-full ${hoverBgClass}`}
            >
              <ChevronRight size={20} className={textSecondaryClass} />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 12 }, (_, i) => i + 1).map(month => {
              const monthStr = month.toString().padStart(2, '0');
              const value = `${viewYear}-${monthStr}`;
              const isSelected = filterDate === value;
              const isCurrentMonth = new Date().getMonth() + 1 === month && new Date().getFullYear() === viewYear;

              return (
                <button
                  key={month}
                  onClick={() => {
                    setFilterDate(value);
                    setIsFilterModalOpen(false);
                  }}
                  className={`
                           py-3 rounded-lg text-sm font-medium transition-colors border
                           ${isSelected
                      ? 'bg-primary text-white border-primary'
                      : `
                                 ${hoverBgClass}
                                 ${borderClass} ${textSecondaryClass}
                                 ${isCurrentMonth ? 'border-primary/50 text-primary' : ''}
                              `
                    }
                        `}
                >
                  Tháng {month}
                </button>
              );
            })}
          </div>
        </div>
      </Modal>

      {/* Modal thanh toán */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setSelectedEmpId(null);
          setSelectedShiftIds([]);
        }}
        employeeSummary={selectedEmployeeSummary}
        shifts={shifts}
        selectedShiftIds={selectedShiftIds}
        onShiftSelect={handleSelectShift}
        onSelectAll={handleSelectAll}
        events={events}
        employees={employees}
        locations={locations}
        onSuccess={() => loadMorePayments(true)}
      />

      {/* Modal quyết toán */}
      {selectedEmpId && (
        <SettlementModal
          isOpen={showSettlementModal}
          onClose={() => setShowSettlementModal(false)}
          employeeId={selectedEmpId}
          employeeName={selectedEmployeeSummary?.employeeName || ''}
          shifts={shifts}
          paymentHistory={paymentHistory}
          events={events}
          locations={locations}
          onSuccess={() => loadMorePayments(true)}
        />
      )}

    </div>
  );
};

export default PayrollView;
