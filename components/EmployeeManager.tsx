import React, { useState } from 'react';
import { Employee } from '../types';
import { dbService } from '../services/firebase';
import { UserPlus, Trash2, Phone, Edit2, Search, Users } from 'lucide-react';
import { Modal } from './ui/Modal';

interface EmployeeManagerProps {
  employees: Employee[];
  refreshData: () => void;
}

export const EmployeeManager: React.FC<EmployeeManagerProps> = ({ employees, refreshData }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');

  const openAddModal = () => {
    setEditingEmp(null);
    setName('');
    setPhone('');
    setError('');
    setModalOpen(true);
  };

  const openEditModal = (emp: Employee) => {
    setEditingEmp(emp);
    setName(emp.name);
    setPhone(emp.phone);
    setError('');
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      setError('Vui lòng nhập đầy đủ tên và số điện thoại');
      return;
    }

    // Simple phone regex validation
    if (!/^\d{9,11}$/.test(phone.replace(/\s/g, ''))) {
      setError('Số điện thoại không hợp lệ');
      return;
    }

    try {
      if (editingEmp) {
        await dbService.updateEmployee(editingEmp.id, { name, phone });
      } else {
        await dbService.addEmployee({ name, phone });
      }
      setModalOpen(false);
      refreshData();
    } catch (err) {
      setError('Có lỗi xảy ra, vui lòng thử lại');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Xóa nhân viên sẽ không xóa lịch sử làm việc của họ. Bạn chắc chắn chứ?')) {
      await dbService.deleteEmployee(id);
      refreshData();
    }
  };

  const filteredEmployees = employees.filter(e =>
    e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.phone.includes(searchTerm)
  );

  return (
    <div className="p-3 pb-20 md:p-6 lg:p-8 md:pb-8 md:ml-64 bg-slate-900 min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 md:mb-8 gap-3 md:gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-100">Nhân Sự</h2>
          <p className="text-sm md:text-base text-slate-400 mt-1">Tổng số: <strong className="text-emerald-400">{employees.length}</strong> nhân viên</p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-emerald-500 text-white px-4 md:px-5 py-2 md:py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-500/30 hover:bg-emerald-600 hover:scale-105 transition-all font-medium text-sm md:text-base w-full sm:w-auto justify-center"
        >
          <UserPlus size={18} />
          <span>Thêm Nhân Viên</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative mb-4 md:mb-6">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={16} className="text-slate-500 md:w-[18px] md:h-[18px]" />
        </div>
        <input
          type="text"
          placeholder="Tìm kiếm theo tên hoặc số điện thoại..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 md:pl-10 pr-4 py-2.5 md:py-3 bg-slate-800 border border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm text-slate-100 placeholder-slate-500 text-sm md:text-base"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        {filteredEmployees.map((emp) => (
          <div key={emp.id} className="bg-slate-800 p-4 md:p-5 rounded-xl md:rounded-2xl shadow-sm border border-slate-700 hover:shadow-lg hover:border-emerald-500/30 transition-all group relative">
            <div className="flex justify-between items-start gap-2">
              <div className="flex-1 min-w-0">
                <p className="font-bold text-base md:text-lg text-slate-100 truncate">{emp.name}</p>
                <a href={`tel:${emp.phone}`} className="text-slate-400 flex items-center gap-1.5 mt-2 text-xs md:text-sm font-medium hover:text-emerald-400 transition-colors bg-slate-700 w-fit px-2 py-1 rounded-lg">
                  <Phone size={12} className="md:w-[14px] md:h-[14px]" />
                  {emp.phone}
                </a>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button
                  onClick={() => openEditModal(emp)}
                  className="p-1.5 md:p-2 text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors active:scale-95"
                >
                  <Edit2 size={16} className="md:w-[18px] md:h-[18px]" />
                </button>
                <button
                  onClick={() => handleDelete(emp.id)}
                  className="p-1.5 md:p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors active:scale-95"
                >
                  <Trash2 size={16} className="md:w-[18px] md:h-[18px]" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredEmployees.length === 0 && (
        <div className="text-center py-16 text-slate-500">
          <div className="inline-block p-4 rounded-full bg-slate-800 mb-3">
            <Users size={32} className="opacity-50" />
          </div>
          <p>Không tìm thấy nhân viên nào.</p>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        title={editingEmp ? "Chỉnh Sửa Nhân Viên" : "Thêm Nhân Viên Mới"}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        footer={
          <button
            onClick={handleSubmit}
            className="w-full bg-emerald-500 text-white py-3 rounded-xl font-bold text-lg shadow-md hover:bg-emerald-600 active:scale-[0.98] transition-all"
          >
            Lưu Thông Tin
          </button>
        }
      >
        <form className="flex flex-col gap-4">
          {error && <div className="p-3 bg-rose-500/10 text-rose-400 text-sm rounded-lg border border-rose-500/20">{error}</div>}
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-300">Họ và tên <span className="text-rose-400">*</span></label>
            <input
              type="text"
              placeholder="Ví dụ: Nguyễn Văn A"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 bg-slate-700 border border-slate-600 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-slate-100 placeholder-slate-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-300">Số điện thoại <span className="text-rose-400">*</span></label>
            <input
              type="tel"
              placeholder="Ví dụ: 0912345678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full p-3 bg-slate-700 border border-slate-600 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-slate-100 placeholder-slate-500"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};