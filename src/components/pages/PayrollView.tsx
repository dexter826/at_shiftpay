import React, { useMemo, useState, useCallback, useRef, useEffect, memo } from 'react';
import { Shift, PayrollSummary, PaymentTransaction, Event, Location } from '../../types';
import { dbService } from '../../services';

import { useToast } from '../ui/Toast';
import { useThemeStyles } from '../../hooks/useThemeStyles';
import { PaymentModal } from '../modals/PaymentModal';
import { SettlementModal } from '../modals/SettlementModal';
import { useAuthStore } from '../../stores';
import { DropdownOption } from '../ui/Dropdown';

// Import extracted components
import PayrollStats from './payroll/PayrollStats';
import PayrollFilters from './payroll/PayrollFilters';
import PayrollList from './payroll/PayrollList';
import HistoryList from './payroll/HistoryList';
import EmployeeDetailModal from './payroll/PayrollEmployeeDetailModal';
import TransactionDetailModal from './payroll/TransactionDetailModal';
import ConfirmPaymentModal from './payroll/ConfirmPaymentModal';
import MonthPickerModal from './payroll/MonthPickerModal';

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
  const { user } = useAuthStore();
  const userId = user?.uid || '';


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
        userId,
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


  // Tải thêm dữ liệu lịch sử
  useEffect(() => {
    if (activeTab === 'history' && paymentHistory.length === 0) {
      loadMorePayments(true);
    }
  }, [activeTab, paymentHistory.length, loadMorePayments]);

  // Hook style đồng bộ theme
  const {
    bgClass,
    borderClass,
    textPrimaryClass,
    textMutedClass,
    textSecondaryClass,
  } = useThemeStyles();

  // Preload avatar nhân viên
  useEffect(() => {
    if (employees.length > 0) {
      employees.forEach(emp => {
        const empImage = emp.imageUrl || emp.avatar;
        if (empImage) {
          const img = new Image();
          img.src = empImage;
        }
      });
    }
  }, [employees]);

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
        note: `Thanh toán ${selectedShiftIds.length} ca làm việc`,
        userId: userId
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

  const selectedAdvancedShifts = useMemo(() => {
    if (!selectedEmpId) return [];
    return shifts
      .filter(s => s.employeeId === selectedEmpId && s.status === 'advanced')
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
    <div className={`pb-28 md:pb-0 ${bgClass} min-h-screen`}>
      {/* Tiêu đề & Stats */}
      <div className={`py-4 px-4 md:px-6 border-b ${borderClass}`}>
        <div className="flex justify-between items-center">
          {activeTab === 'payroll' && summary.length > 0 && (
            null
          )}
        </div>
        <PayrollStats 
          loading={loading}
          totalEarned={totalEarned}
          totalDebt={totalDebt}
          totalAdvanced={totalAdvanced}
          totalShifts={totalShifts}
          totalFees={totalFees}
          totalUnpaidShifts={totalUnpaidShifts}
          totalAdvancedShifts={totalAdvancedShifts}
        />
      </div>

      {/* Tabs chuyển đổi */}
      <div className="flex px-4 md:px-6 pt-5 md:pt-6 pb-2 gap-4">
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

      {/* Bộ lọc */}
      <PayrollFilters 
        activeTab={activeTab}
        payrollSearchTerm={payrollSearchTerm}
        setPayrollSearchTerm={setPayrollSearchTerm}
        payrollSortBy={payrollSortBy}
        setPayrollSortBy={setPayrollSortBy}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterDate={filterDate}
        onOpenFilterModal={() => setIsFilterModalOpen(true)}
        setViewYear={setViewYear}
        currentYear={viewYear}
      />

      {/* Danh sách */}
      <div className="px-4 md:px-6 pt-2 pb-4 md:pb-6 space-y-2">
        {activeTab === 'payroll' ? (
          <PayrollList 
            loading={loading}
            items={filteredAndSortedSummary}
            employees={employees}
            visibleCount={payrollVisibleCount}
            setVisibleCount={setPayrollVisibleCount}
            onSelectEmployee={setSelectedEmpId}
            onPaymentClick={(id) => {
              setSelectedEmpId(id);
              setShowPaymentModal(true);
            }}
            searchTerm={payrollSearchTerm}
          />
        ) : (
          <HistoryList 
            loading={loading}
            items={filteredHistory}
            hasMore={hasMore}
            isFetchingMore={isFetchingMore}
            loadMorePayments={loadMorePayments}
            onSelectTransaction={setSelectedTransactionId}
          />
        )}
      </div>

      {/* Modal chi tiết nhân viên */}
      <EmployeeDetailModal 
        isOpen={!!selectedEmpId}
        onClose={() => setSelectedEmpId(null)}
        selectedEmployeeSummary={selectedEmployeeSummary}
        selectedUnpaidShifts={selectedUnpaidShifts}
        selectedAdvancedShifts={selectedAdvancedShifts}
        onPayment={() => {
          setSelectedShiftIds(selectedUnpaidShifts.map(s => s.id));
          setShowPaymentModal(true);
        }}
        onSettlement={() => setShowSettlementModal(true)}
      />

      {/* Chi tiết giao dịch */}
      <TransactionDetailModal 
        isOpen={!!selectedTransactionId}
        onClose={() => setSelectedTransactionId(null)}
        selectedTransaction={selectedTransaction}
        transactionShifts={transactionShifts}
        events={events}
        locations={locations}
      />

      {/* Xác nhận thanh toán */}
      <ConfirmPaymentModal 
        isOpen={payConfirm}
        onClose={() => setPayConfirm(false)}
        onConfirm={confirmPay}
        selectedShiftsTotal={selectedShiftsTotal}
        selectedEmployeeSummary={selectedEmployeeSummary}
        selectedCount={selectedShiftIds.length}
      />

      {/* Chọn tháng */}
      <MonthPickerModal 
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        filterDate={filterDate}
        setFilterDate={setFilterDate}
        viewYear={viewYear}
        setViewYear={setViewYear}
      />

      {/* Modal thanh toán */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          // Only clear emp if we are not in detail view? 
          // Previous logic: setSelectedEmpId(null);
          // But wait, if we are in detail modal, payment modal sits on top.
          // If we close payment modal, we might want to return to detail modal or list.
          // In original code: 
          // onClose={() => { setShowPaymentModal(false); setSelectedEmpId(null); setSelectedShiftIds([]); }}
          // This implies it closes everything.
          // However, if we clicked "Thanh toán" from inside the EmployeeDetailModal, we might want to stay there?
          // But the original code was closing everything. I will keep original behavior for safety.
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

export default memo(PayrollView);
