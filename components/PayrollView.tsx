import React, { useMemo, useState } from 'react';
import { Shift, PayrollSummary } from '../types';
import { formatCurrency, formatDate } from '../constants';
import { dbService } from '../services/firebase';
import { Wallet2, ChevronRight, Banknote, Calendar, CheckCircle2 } from 'lucide-react';
import { Modal } from './ui/Modal';

interface PayrollViewProps {
  shifts: Shift[];
  employees: any[];
  refreshData: () => void;
}

export const PayrollView: React.FC<PayrollViewProps> = ({ shifts, employees, refreshData }) => {
  const [selectedEmpId, setSelectedEmpId] = useState<string | null>(null);

  // Group by employee and calculate totals
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

  const handlePay = async () => {
    if (!selectedEmpId) return;
    if (window.confirm('Xác nhận thanh toán toàn bộ lương cho nhân viên này?')) {
      try {
        // Update all unpaid shifts for this employee
        const unpaidShifts = shifts.filter(s => s.employeeId === selectedEmpId && s.status === 'unpaid');
        for (const shift of unpaidShifts) {
          await dbService.updateShift(shift.id, {
            status: 'paid',
            paidAt: Date.now()
          });
        }
        setSelectedEmpId(null);
        refreshData();
      } catch (error) {
        console.error('Error paying employee:', error);
        alert('Có lỗi xảy ra khi thanh toán');
      }
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
    <div className="pb-20 md:pb-0 md:ml-64 bg-slate-900 min-h-screen">
      <div className="bg-slate-800 p-4 md:p-6 border-b border-slate-700 sticky top-0 z-20">
        <h1 className="text-xl md:text-2xl font-bold text-slate-100 flex items-center gap-2">
          Thanh Toán Lương
        </h1>
        <div className="flex justify-between items-end mt-3 md:mt-4 p-3 md:p-4 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl md:rounded-2xl text-white shadow-lg shadow-emerald-500/30">
          <div>
            <p className="text-emerald-100 text-[10px] md:text-xs uppercase font-bold tracking-wider">Tổng quỹ lương nợ</p>
            <p className="text-2xl md:text-3xl font-bold mt-1">{formatCurrency(totalDebt)}</p>
          </div>
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
            <Wallet2 size={18} className="md:w-5 md:h-5" />
          </div>
        </div>
      </div>

      <div className="p-4 md:p-8 space-y-3">
        {summary.map((item) => (
          <button
            key={item.employeeId}
            onClick={() => setSelectedEmpId(item.employeeId)}
            className="w-full bg-slate-800 p-3 md:p-4 rounded-xl md:rounded-2xl shadow-sm border border-slate-700 hover:shadow-lg hover:border-emerald-500/30 transition-all flex justify-between items-center group active:scale-[0.98]"
          >
            <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
              <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center font-bold text-base md:text-lg flex-shrink-0 ${item.totalUnpaid > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-500'
                }`}>
                {item.employeeName.charAt(0)}
              </div>
              <div className="text-left flex-1 min-w-0">
                <p className="font-bold text-slate-100 text-base md:text-lg group-hover:text-emerald-400 transition-colors truncate">
                  {item.employeeName}
                </p>
                <p className={`text-xs md:text-sm ${item.unpaidCount > 0 ? 'text-emerald-400 font-medium' : 'text-slate-500'}`}>
                  {item.unpaidCount > 0 ? `${item.unpaidCount} ca chưa thanh toán` : 'Đã thanh toán hết'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
              <span className={`font-bold text-sm md:text-lg ${item.totalUnpaid > 0 ? 'text-slate-100' : 'text-slate-600'}`}>
                {formatCurrency(item.totalUnpaid)}
              </span>
              <ChevronRight size={18} className="text-slate-600 group-hover:text-emerald-400 md:w-5 md:h-5" />
            </div>
          </button>
        ))}
      </div>

      {/* Detail Modal */}
      <Modal
        title={selectedEmployeeSummary?.employeeName || "Chi tiết"}
        isOpen={!!selectedEmpId}
        onClose={() => setSelectedEmpId(null)}
        footer={
          selectedEmployeeSummary && selectedEmployeeSummary.totalUnpaid > 0 ? (
            <button
              onClick={handlePay}
              className="w-full bg-emerald-500 text-white py-3 rounded-xl font-bold text-lg shadow-md hover:bg-emerald-600 active:scale-[0.98] transition-all flex justify-center items-center gap-2"
            >
              <Banknote size={20} />
              Xác Nhận Đã Trả {formatCurrency(selectedEmployeeSummary.totalUnpaid)}
            </button>
          ) : null
        }
      >
        <div className="space-y-4">
          {selectedUnpaidShifts.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-500 gap-3">
              <CheckCircle2 size={48} className="text-emerald-500" />
              <p className="text-lg font-medium text-slate-300">Tuyệt vời! Không còn khoản nợ nào.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">Danh sách ca chưa trả</p>
              {selectedUnpaidShifts.map((s) => (
                <div key={s.id} className="flex justify-between items-center p-3 bg-slate-700 rounded-xl border border-slate-600">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 shadow-sm">
                      <Calendar size={18} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-200">{formatDate(s.eventDate)}</p>
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${s.session === 'morning' ? 'bg-orange-500/20 text-orange-400' : 'bg-emerald-500/20 text-emerald-400'
                        }`}>
                        {s.session === 'morning' ? 'Ca Sáng' : 'Ca Chiều'}
                      </span>
                    </div>
                  </div>
                  <p className="font-bold text-slate-100">{formatCurrency(s.amount)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};