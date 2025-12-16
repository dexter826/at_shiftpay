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
      await dbService.payEmployee(selectedEmpId);
      setSelectedEmpId(null);
      refreshData();
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
    <div className="pb-24 md:ml-64 bg-slate-50 min-h-screen">
      <div className="bg-white p-6 border-b border-slate-200 sticky top-0 z-20">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          Thanh Toán Lương
        </h1>
        <div className="flex justify-between items-end mt-4 p-4 bg-slate-900 rounded-2xl text-white shadow-lg">
           <div>
             <p className="text-slate-400 text-xs uppercase font-bold tracking-wider">Tổng quỹ lương nợ</p>
             <p className="text-3xl font-bold mt-1 text-emerald-400">{formatCurrency(totalDebt)}</p>
           </div>
           <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">
             <Wallet2 className="text-emerald-400" size={20} />
           </div>
        </div>
      </div>

      <div className="p-4 md:p-8 space-y-3">
        {summary.map((item) => (
          <button
            key={item.employeeId}
            onClick={() => setSelectedEmpId(item.employeeId)}
            className="w-full bg-white p-4 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md hover:border-indigo-100 transition-all flex justify-between items-center group"
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                item.totalUnpaid > 0 ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-400'
              }`}>
                {item.employeeName.charAt(0)}
              </div>
              <div className="text-left">
                <p className="font-bold text-slate-800 text-lg group-hover:text-indigo-700 transition-colors">
                  {item.employeeName}
                </p>
                <p className={`text-sm ${item.unpaidCount > 0 ? 'text-indigo-500 font-medium' : 'text-slate-400'}`}>
                  {item.unpaidCount > 0 ? `${item.unpaidCount} ca chưa thanh toán` : 'Đã thanh toán hết'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <span className={`font-bold text-lg ${item.totalUnpaid > 0 ? 'text-slate-900' : 'text-slate-300'}`}>
                {formatCurrency(item.totalUnpaid)}
              </span>
              <ChevronRight size={20} className="text-slate-300 group-hover:text-indigo-500" />
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
              className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold text-lg shadow-md hover:bg-emerald-700 active:scale-[0.98] transition-all flex justify-center items-center gap-2"
            >
              <Banknote size={20} />
              Xác Nhận Đã Trả {formatCurrency(selectedEmployeeSummary.totalUnpaid)}
            </button>
          ) : null
        }
      >
        <div className="space-y-4">
          {selectedUnpaidShifts.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-3">
              <CheckCircle2 size={48} className="text-emerald-500" />
              <p className="text-lg font-medium text-slate-600">Tuyệt vời! Không còn khoản nợ nào.</p>
            </div>
          ) : (
            <div className="space-y-3">
               <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">Danh sách ca chưa trả</p>
               {selectedUnpaidShifts.map((s) => (
                 <div key={s.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-slate-400 shadow-sm">
                        <Calendar size={18} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-700">{formatDate(s.eventDate)}</p>
                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                          s.session === 'morning' ? 'bg-orange-100 text-orange-700' : 'bg-indigo-100 text-indigo-700'
                        }`}>
                          {s.session === 'morning' ? 'Ca Sáng' : 'Ca Chiều'}
                        </span>
                      </div>
                    </div>
                    <p className="font-bold text-slate-900">{formatCurrency(s.amount)}</p>
                 </div>
               ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};