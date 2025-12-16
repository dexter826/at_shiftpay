import React, { useMemo, useState } from 'react';
import { Shift, PayrollSummary } from '../types';
import { formatCurrency, formatDate } from '../constants';
import { dbService } from '../services/firebase';
import { Wallet2, ChevronRight, Banknote, Calendar, CheckCircle2 } from 'lucide-react';
import { Modal } from './ui/Modal';
import { useToast } from './ui/Toast';

interface PayrollViewProps {
  shifts: Shift[];
  employees: any[];
}

export const PayrollView: React.FC<PayrollViewProps> = ({ shifts, employees }) => {
  const [selectedEmpId, setSelectedEmpId] = useState<string | null>(null);

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
    <div className="pb-16 md:pb-0 md:ml-60 bg-slate-900 min-h-screen">
      {/* Header */}
      <div className="p-4 md:p-6 border-b border-slate-800">
        <h1 className="text-lg font-semibold text-slate-100">Thanh Toán</h1>
        <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs text-emerald-500/70 uppercase tracking-wide">Tổng nợ lương</p>
              <p className="text-2xl font-bold text-emerald-500 mt-1">{formatCurrency(totalDebt)}</p>
            </div>
            <Wallet2 size={24} className="text-emerald-500/50" />
          </div>
        </div>
      </div>

      {/* List */}
      <div className="p-4 md:p-6 space-y-2">
        {summary.map((item) => (
          <button
            key={item.employeeId}
            onClick={() => setSelectedEmpId(item.employeeId)}
            className="w-full p-3 bg-slate-900 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors flex justify-between items-center group"
          >
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium ${item.totalUnpaid > 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-800 text-slate-500'
                }`}>
                {item.employeeName.charAt(0)}
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-slate-200">{item.employeeName}</p>
                <p className={`text-xs ${item.unpaidCount > 0 ? 'text-emerald-500' : 'text-slate-500'}`}>
                  {item.unpaidCount > 0 ? `${item.unpaidCount} ca chưa trả` : 'Đã thanh toán'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={`text-sm font-medium ${item.totalUnpaid > 0 ? 'text-slate-200' : 'text-slate-600'}`}>
                {formatCurrency(item.totalUnpaid)}
              </span>
              <ChevronRight size={16} className="text-slate-600" />
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
              className="w-full bg-emerald-500 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors flex justify-center items-center gap-2"
            >
              <Banknote size={16} />
              Thanh toán {formatCurrency(selectedEmployeeSummary.totalUnpaid)}
            </button>
          ) : null
        }
      >
        <div className="space-y-3">
          {selectedUnpaidShifts.length === 0 ? (
            <div className="py-8 flex flex-col items-center justify-center text-slate-500 gap-2">
              <CheckCircle2 size={32} className="text-emerald-500" />
              <p className="text-sm">Không còn khoản nợ</p>
            </div>
          ) : (
            <>
              <p className="text-xs text-slate-500 uppercase tracking-wide">Ca chưa trả</p>
              {selectedUnpaidShifts.map((s) => (
                <div key={s.id} className="flex justify-between items-center p-3 bg-slate-800/50 border border-slate-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Calendar size={16} className="text-slate-500" />
                    <div>
                      <p className="text-sm text-slate-200">{formatDate(s.eventDate)}</p>
                      <span className={`text-[10px] font-medium ${s.session === 'morning' ? 'text-orange-500' : 'text-emerald-500'
                        }`}>
                        {s.session === 'morning' ? 'Ca Sáng' : 'Ca Chiều'}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-slate-200">{formatCurrency(s.amount)}</p>
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
              className="flex-1 py-2.5 rounded-lg text-sm font-medium border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={confirmPay}
              className="flex-1 bg-emerald-500 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors"
            >
              Xác nhận
            </button>
          </div>
        }
      >
        <p className="text-sm text-slate-300">
          Thanh toán {formatCurrency(selectedEmployeeSummary?.totalUnpaid || 0)} cho {selectedEmployeeSummary?.employeeName}?
        </p>
      </Modal>
    </div>
  );
};
