import React, { useMemo, useState } from 'react';
import { Shift, PayrollSummary, PaymentTransaction } from '../types';
import { formatCurrency, formatDate } from '../constants';
import { dbService } from '../services/firebase';
import { exportPayrollToExcel } from '../services/excel';
import { Wallet2, ChevronRight, Banknote, Calendar, CheckCircle2, History, Clock, Search, Filter, ChevronLeft, X, CalendarDays, FileDown } from 'lucide-react';
import { Modal } from './ui/Modal';
import Button from './ui/Button';
import { useToast } from './ui/Toast';
import { useTheme } from '../contexts/ThemeContext';

interface PayrollViewProps {
  shifts: Shift[];
  employees: any[];
}

export const PayrollView: React.FC<PayrollViewProps> = ({ shifts, employees }) => {
  const [activeTab, setActiveTab] = useState<'payroll' | 'history'>('payroll');
  const [paymentHistory, setPaymentHistory] = useState<PaymentTransaction[]>([]);
  const [selectedEmpId, setSelectedEmpId] = useState<string | null>(null);
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState(''); // YYYY-MM
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const { theme } = useTheme();

  React.useEffect(() => {
    const unsubscribe = dbService.subscribePayments((data) => {
      setPaymentHistory(data);
    });
    return unsubscribe;
  }, []);

  // Theme classes
  const bgClass = theme === 'dark' ? 'bg-slate-900' : 'bg-slate-50';
  const cardBgClass = theme === 'dark' ? 'bg-slate-900' : 'bg-white';
  const borderClass = theme === 'dark' ? 'border-slate-800' : 'border-slate-200';
  const textPrimaryClass = theme === 'dark' ? 'text-slate-100' : 'text-slate-800';
  const textSecondaryClass = theme === 'dark' ? 'text-slate-200' : 'text-slate-700';
  const textMutedClass = theme === 'dark' ? 'text-slate-500' : 'text-slate-500';

  const summary: PayrollSummary[] = useMemo(() => {
    const map: Record<string, PayrollSummary> = {};

    employees.forEach(emp => {
      map[emp.id] = {
        employeeId: emp.id,
        employeeName: emp.name,
        phone: emp.phone,
        unpaidCount: 0,
        totalUnpaid: 0
      };
    });

    shifts.forEach(s => {
      if (s.status === 'unpaid' && map[s.employeeId]) {
        map[s.employeeId].unpaidCount += 1;
        map[s.employeeId].totalUnpaid += s.amount;
      }
    });

    return Object.values(map).sort((a, b) => b.totalUnpaid - a.totalUnpaid);
  }, [shifts, employees]);

  const totalDebt = summary.reduce((acc, curr) => acc + curr.totalUnpaid, 0);

  const [payConfirm, setPayConfirm] = useState(false);
  const { showToast } = useToast();

  const handlePay = async () => {
    setPayConfirm(true);
  };

  const confirmPay = async () => {
    if (!selectedEmpId) return;
    try {
      const unpaidShifts = shifts.filter(s => s.employeeId === selectedEmpId && s.status === 'unpaid');
      const shiftIds = unpaidShifts.map(s => s.id);
      const totalAmount = unpaidShifts.reduce((sum, s) => sum + s.amount, 0);
      const employee = employees.find(e => e.id === selectedEmpId);

      if (!employee) return;

      const paymentData = {
        employeeId: selectedEmpId,
        employeeName: employee.name,
        amount: totalAmount,
        date: Date.now(),
        shiftIds: shiftIds,
        note: `Thanh toán ${unpaidShifts.length} ca làm việc`
      };

      await dbService.createPaymentTransaction(paymentData, shiftIds);

      showToast('Đã thanh toán thành công', 'success');
      setSelectedEmpId(null);
      setPayConfirm(false);
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
      .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
  }, [selectedEmpId, shifts]);

  const selectedTransaction = useMemo(() => {
    if (!selectedTransactionId) return null;
    return paymentHistory.find(p => p.id === selectedTransactionId);
  }, [selectedTransactionId, paymentHistory]);

  const transactionShifts = useMemo(() => {
    if (!selectedTransaction) return [];
    return shifts.filter(s => s.paymentId === selectedTransaction.id);
    return shifts.filter(s => s.paymentId === selectedTransaction.id);
  }, [selectedTransaction, shifts]);

  // Filtered History
  const filteredHistory = useMemo(() => {
    return paymentHistory.filter(payment => {
      const matchesSearch = payment.employeeName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDate = filterDate ? payment.date >= new Date(filterDate).getTime() && payment.date < new Date(filterDate).setMonth(new Date(filterDate).getMonth() + 1) : true;
      // Simple string match for YYYY-MM if we want to be exact without timezone issues:
      // const paymentDate = new Date(payment.date);
      // const paymentMonth = `${paymentDate.getFullYear()}-${String(paymentDate.getMonth() + 1).padStart(2, '0')}`;
      // const matchesDate = filterDate ? paymentMonth === filterDate : true;

      return matchesSearch && matchesDate;
    });
  }, [paymentHistory, searchTerm, filterDate]);

  return (
    <div className={`pb-16 md:pb-0 md:ml-60 ${bgClass} min-h-screen`}>
      {/* Header */}
      <div className={`p-4 md:p-6 border-b ${borderClass}`}>
        <div className="flex justify-between items-center">
          <h1 className={`text-lg font-semibold ${textPrimaryClass}`}>Thanh Toán</h1>
          {activeTab === 'payroll' && summary.length > 0 && (
            <Button
              onClick={() => exportPayrollToExcel(summary, shifts)}
              className="font-medium"
              variant="secondary"
            >
              <FileDown size={16} className="text-white" />
              <span className="hidden sm:inline text-white">Xuất Excel</span>
            </Button>
          )}
        </div>
        <div className="mt-4 p-4 bg-[#ecb52d]/10 border border-[#ecb52d]/20 rounded-lg">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs text-[#ecb52d]/70 uppercase tracking-wide">Tổng nợ lương</p>
              <p className="text-2xl font-bold text-[#ecb52d] mt-1">{formatCurrency(totalDebt)}</p>
            </div>
            <Wallet2 size={24} className="text-[#ecb52d]/50" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex p-4 md:p-6 pb-0 gap-4">
        <button
          onClick={() => setActiveTab('payroll')}
          className={`pb-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'payroll' ? 'border-[#ecb52d] text-[#ecb52d]' : 'border-transparent text-slate-500 hover:text-slate-400'}`}
        >
          Chưa thanh toán
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`pb-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'history' ? 'border-[#ecb52d] text-[#ecb52d]' : 'border-transparent text-slate-500 hover:text-slate-400'}`}
        >
          Lịch sử
        </button>
      </div>

      {/* Filters (Only for History) */}
      {activeTab === 'history' && (
        <div className="px-4 md:px-6 mt-4 flex gap-2">
          <div className={`flex-1 flex items-center px-3 py-2 border ${borderClass} rounded-lg ${cardBgClass}`}>
            <Search size={16} className={textMutedClass} />
            <input
              type="text"
              placeholder="Tìm nhân viên..."
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
            className={`flex items-center gap-2 px-3 py-2 border ${borderClass} rounded-lg ${cardBgClass} text-sm ${textPrimaryClass}`}
          >
            <CalendarDays size={16} className={filterDate ? 'text-[#ecb52d]' : textMutedClass} />
            <span className={filterDate ? 'text-[#ecb52d] font-medium' : textMutedClass}>
              {filterDate ? `Tháng ${filterDate.split('-')[1]}/${filterDate.split('-')[0]}` : 'Tất cả thời gian'}
            </span>
          </button>
        </div>
      )}

      {/* List */}
      <div className="p-4 md:p-6 space-y-2">
        {activeTab === 'payroll' ? (
          summary.length === 0 ? (
            <div className="text-center py-10 text-slate-500">
              <CheckCircle2 size={48} className="mx-auto mb-2 opacity-20" />
              <p>Không có khoản nợ nào</p>
            </div>
          ) : (
            summary.map((item) => (
              <button
                key={item.employeeId}
                onClick={() => setSelectedEmpId(item.employeeId)}
                className={`w-full p-3 ${cardBgClass} border ${borderClass} rounded-lg hover:border-[#ecb52d]/50 transition-colors flex justify-between items-center group`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium ${item.totalUnpaid > 0 ? 'bg-[#ecb52d]/10 text-[#ecb52d]' : `${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-200'} ${textMutedClass}`
                    }`}>
                    {item.employeeName.charAt(0)}
                  </div>
                  <div className="text-left">
                    <p className={`text-sm font-medium ${textSecondaryClass}`}>{item.employeeName}</p>
                    <p className={`text-xs ${item.unpaidCount > 0 ? 'text-[#ecb52d]' : textMutedClass}`}>
                      {item.unpaidCount > 0 ? `${item.unpaidCount} công chưa trả` : 'Không có công nợ'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${item.totalUnpaid > 0 ? textSecondaryClass : textMutedClass}`}>
                    {formatCurrency(item.totalUnpaid)}
                  </span>
                  <ChevronRight size={16} className={textMutedClass} />
                </div>
              </button>
            ))
          )
        ) : (
          filteredHistory.length === 0 ? (
            <div className="text-center py-10 text-slate-500">
              <History size={48} className="mx-auto mb-2 opacity-20" />
              <p>Không tìm thấy giao dịch nào</p>
            </div>
          ) : (
            filteredHistory.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedTransactionId(item.id)}
                className={`w-full p-3 ${cardBgClass} border ${borderClass} rounded-lg hover:border-[#ecb52d]/50 transition-colors flex justify-between items-center group`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-200'} ${textMutedClass}`}>
                    <History size={16} />
                  </div>
                  <div className="text-left">
                    <p className={`text-sm font-medium ${textSecondaryClass}`}>{item.employeeName}</p>
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
            ))
          )
        )}
      </div>

      {/* Employee Detail Modal */}
      <Modal
        title={selectedEmployeeSummary?.employeeName || "Chi tiết"}
        isOpen={!!selectedEmpId}
        onClose={() => setSelectedEmpId(null)}
        footer={
          selectedEmployeeSummary && selectedEmployeeSummary.totalUnpaid > 0 ? (
            <Button
              onClick={handlePay}
              fullWidth
            >
              <Banknote size={16} className="text-white" />
              Thanh toán {formatCurrency(selectedEmployeeSummary.totalUnpaid)}
            </Button>
          ) : null
        }
      >
        <div className="space-y-3">
          {selectedUnpaidShifts.length === 0 ? (
            <div className={`py-8 flex flex-col items-center justify-center ${textMutedClass} gap-2`}>
              <CheckCircle2 size={32} className="text-[#ecb52d]" />
              <p className="text-sm">Không còn khoản nợ</p>
            </div>
          ) : (
            <>
              <p className={`text-xs ${textMutedClass} uppercase tracking-wide`}>Công chưa trả</p>
              {selectedUnpaidShifts.map((s) => (
                <div key={s.id} className={`flex justify-between items-center p-3 ${theme === 'dark' ? 'bg-slate-800/50' : 'bg-slate-100'} border ${borderClass} rounded-lg`}>
                  <div className="flex items-center gap-3">
                    <Calendar size={16} className={textMutedClass} />
                    <div>
                      <p className={`text-sm ${textSecondaryClass}`}>{formatDate(s.eventDate)}</p>
                      <span className={`text-[10px] font-medium ${s.session === 'morning' ? 'text-orange-500' : 'text-[#ecb52d]'
                        }`}>
                        {s.session === 'morning' ? 'Tiệc Sáng' : 'Tiệc Chiều'}
                      </span>
                    </div>
                  </div>
                  <p className={`text-sm font-medium ${textSecondaryClass}`}>{formatCurrency(s.amount)}</p>
                </div>
              ))}
            </>
          )}
        </div>
      </Modal>

      {/* Transaction Detail Modal */}
      <Modal
        title="Chi tiết thanh toán"
        isOpen={!!selectedTransactionId}
        onClose={() => setSelectedTransactionId(null)}
        footer={null}
      >
        <div className="space-y-3">
          <div className="flex justify-between items-center pb-3 border-b border-slate-700/50">
            <div className="flex flex-col">
              <span className={`text-xs ${textMutedClass}`}>Tổng tiền</span>
              <span className={`text-xl font-bold ${textSecondaryClass}`}>{formatCurrency(selectedTransaction?.amount || 0)}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className={`text-xs ${textMutedClass}`}>Thời gian</span>
              <span className={`text-sm font-medium ${textSecondaryClass}`}>
                {selectedTransaction ? new Date(selectedTransaction.date).toLocaleString('vi-VN') : ''}
              </span>
            </div>
          </div>

          <p className={`text-xs ${textMutedClass} uppercase tracking-wide pt-2`}>Các ca làm việc</p>
          {transactionShifts.length === 0 ? (
            <div className={`py-4 text-center ${textMutedClass}`}>
              <p className="text-sm">Không tìm thấy thông tin ca làm việc (Có thể đã bị xóa)</p>
            </div>
          ) : (
            transactionShifts.map((s) => (
              <div key={s.id} className={`flex justify-between items-center p-3 ${theme === 'dark' ? 'bg-slate-800/50' : 'bg-slate-100'} border ${borderClass} rounded-lg`}>
                <div className="flex items-center gap-3">
                  <Calendar size={16} className={textMutedClass} />
                  <div>
                    <p className={`text-sm ${textSecondaryClass}`}>{formatDate(s.eventDate)}</p>
                    <span className={`text-[10px] font-medium ${s.session === 'morning' ? 'text-orange-500' : 'text-[#ecb52d]'
                      }`}>
                      {s.session === 'morning' ? 'Tiệc Sáng' : 'Tiệc Chiều'}
                    </span>
                  </div>
                </div>
                <p className={`text-sm font-medium ${textSecondaryClass}`}>{formatCurrency(s.amount)}</p>
              </div>
            ))
          )}
        </div>
      </Modal>

      {/* Pay Confirm Modal */}
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
              hideIcon
            >
              Hủy
            </Button>
            <Button
              onClick={confirmPay}
              className="flex-1"
            >
              Xác nhận
            </Button>
          </div>
        }
      >
        <p className={`text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
          Thanh toán {formatCurrency(selectedEmployeeSummary?.totalUnpaid || 0)} cho {selectedEmployeeSummary?.employeeName}?
        </p>
      </Modal>

      {/* Month Filter Modal */}
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
            className={`w-full py-2.5 rounded-lg text-sm font-medium border ${borderClass} ${theme === 'dark' ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'} transition-colors`}
          >
            Xem tất cả lịch sử
          </button>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center px-2">
            <button
              onClick={() => setViewYear(prev => prev - 1)}
              className={`p-1 rounded-full hover:bg-slate-100 ${theme === 'dark' ? 'hover:bg-slate-800' : ''}`}
            >
              <ChevronLeft size={20} className={textSecondaryClass} />
            </button>
            <span className={`text-lg font-bold ${textPrimaryClass}`}>{viewYear}</span>
            <button
              onClick={() => setViewYear(prev => prev + 1)}
              className={`p-1 rounded-full hover:bg-slate-100 ${theme === 'dark' ? 'hover:bg-slate-800' : ''}`}
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
                      ? 'bg-[#ecb52d] text-white border-[#ecb52d]'
                      : `
                                 ${theme === 'dark' ? 'bg-slate-800/50 hover:bg-slate-800' : 'bg-slate-50 hover:bg-slate-100'}
                                 ${borderClass} ${textSecondaryClass}
                                 ${isCurrentMonth ? 'border-[#ecb52d]/50 text-[#ecb52d]' : ''}
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

    </div>
  );
};
