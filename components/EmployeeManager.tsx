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
    <div className="p-4 pb-24 md:p-8 md:ml-64 bg-slate-50 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Nhân Sự</h2>
          <p className="text-slate-500">Tổng số: <strong className="text-indigo-600">{employees.length}</strong> nhân viên</p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:scale-105 transition-all font-medium"
        >
          <UserPlus size={18} />
          <span>Thêm Nhân Viên</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={18} className="text-slate-400" />
        </div>
        <input
          type="text"
          placeholder="Tìm kiếm theo tên hoặc số điện thoại..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEmployees.map((emp) => (
          <div key={emp.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow group relative">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-bold text-lg text-slate-800">{emp.name}</p>
                <a href={`tel:${emp.phone}`} className="text-slate-500 flex items-center gap-1.5 mt-2 text-sm font-medium hover:text-indigo-600 transition-colors bg-slate-50 w-fit px-2 py-1 rounded-lg">
                  <Phone size={14} />
                  {emp.phone}
                </a>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => openEditModal(emp)}
                  className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                >
                  <Edit2 size={18} />
                </button>
                <button
                  onClick={() => handleDelete(emp.id)}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {filteredEmployees.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <div className="inline-block p-4 rounded-full bg-slate-100 mb-3">
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
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold text-lg shadow-md hover:bg-indigo-700 active:scale-[0.98] transition-all"
          >
            Lưu Thông Tin
          </button>
        }
      >
        <form className="flex flex-col gap-4">
          {error && <div className="p-3 bg-rose-50 text-rose-600 text-sm rounded-lg border border-rose-100">{error}</div>}
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Họ và tên <span className="text-rose-500">*</span></label>
            <input
              type="text"
              placeholder="Ví dụ: Nguyễn Văn A"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Số điện thoại <span className="text-rose-500">*</span></label>
            <input
              type="tel"
              placeholder="Ví dụ: 0912345678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};