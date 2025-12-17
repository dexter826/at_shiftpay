import React, { useMemo, useState } from 'react';
import { Shift, PayrollSummary } from '../types';
import { formatCurrency, formatDate } from '../constants';
import { dbService } from '../services/firebase';
import { Wallet2, ChevronRight, Banknote, Calendar, CheckCircle2 } from 'lucide-react';
import { Modal } from './ui/Modal';
import { useToast } from './ui/Toast';
import { useTheme } from '../contexts/ThemeContext';

interface PayrollViewProps {
  shifts: Shift[];
  employees: any[];
}

export const PayrollView: React.FC<PayrollViewProps> = ({ shifts, employees }) => {
  const [selectedEmpId, setSelectedEmpId] = useState<string | null>(null);
  const { theme } = useTheme();

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
      for (const shift of unpaidShifts) {
        await dbService.updateShift(shift.id, { status: 'paid', paidAt: Date.now() });
      }
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

  return (
    <div className={`pb-16 md:pb-0 md:ml-60 ${bgClass} min-h-screen`}>
      {/* Header */}
      <div className={`p-4 md:p-6 border-b ${borderClass}`}>
        <h1 className={`text-lg font-semibold ${textPrimaryClass}`}>Thanh Toán</h1>
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

      {/* List */}
      <div className="p-4 md:p-6 space-y-2">
        {summary.map((item) => (
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
        ))}
      </div>

      {/* Modal */}
      <Modal
        title={selectedEmployeeSummary?.employeeName || "Chi tiết"}
        isOpen={!!selectedEmpId}
        onClose={() => setSelectedEmpId(null)}
        footer={
          selectedEmployeeSummary && selectedEmployeeSummary.totalUnpaid > 0 ? (
            <button
              onClick={handlePay}
              className="w-full bg-[#ecb52d] text-white py-2.5 rounded-lg text-sm font-medium hover:bg-[#d4a128] transition-colors flex justify-center items-center gap-2"
            >
              <Banknote size={16} />
              Thanh toán {formatCurrency(selectedEmployeeSummary.totalUnpaid)}
            </button>
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
                        {s.session === 'morning' ? 'Ca Sáng' : 'Ca Chiều'}
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

      {/* Pay Confirm Modal */}
      <Modal
        title="Xác nhận thanh toán"
        isOpen={payConfirm}
        onClose={() => setPayConfirm(false)}
        footer={
          <div className="flex gap-2">
            <button
              onClick={() => setPayConfirm(false)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium border ${borderClass} ${theme === 'dark' ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'} transition-colors`}
            >
              Hủy
            </button>
            <button
              onClick={confirmPay}
              className="flex-1 bg-[#ecb52d] text-white py-2.5 rounded-lg text-sm font-medium hover:bg-[#d4a128] transition-colors"
            >
              Xác nhận
            </button>
          </div>
        }
      >
        <p className={`text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
          Thanh toán {formatCurrency(selectedEmployeeSummary?.totalUnpaid || 0)} cho {selectedEmployeeSummary?.employeeName}?
        </p>
      </Modal>
    </div>
  );
};
