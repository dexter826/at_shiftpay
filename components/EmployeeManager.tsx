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
      setError('Vui lòng nhập đầy đủ thông tin');
      return;
    }

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
      setError('Có lỗi xảy ra');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Xóa nhân viên này?')) {
      await dbService.deleteEmployee(id);
      refreshData();
    }
  };

  const filteredEmployees = employees.filter(e =>
    e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.phone.includes(searchTerm)
  );

  return (
    <div className="pb-16 md:pb-0 md:ml-60 bg-slate-900 min-h-screen">
      {/* Header */}
      <div className="p-4 md:p-6 border-b border-slate-800">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-lg font-semibold text-slate-100">Nhân Sự</h1>
            <p className="text-xs text-slate-500 mt-0.5">{employees.length} nhân viên</p>
          </div>
          <button
            onClick={openAddModal}
            className="bg-emerald-500 text-white px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium hover:bg-emerald-600 transition-colors"
          >
            <UserPlus size={16} />
            <span className="hidden sm:inline">Thêm mới</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative mt-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Tìm kiếm..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-700"
          />
        </div>
      </div>

      {/* List */}
      <div className="p-4 md:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredEmployees.map((emp) => (
            <div key={emp.id} className="p-3 bg-slate-900 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors group">
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-200 truncate">{emp.name}</p>
                  <a href={`tel:${emp.phone}`} className="text-xs text-slate-500 flex items-center gap-1 mt-1 hover:text-emerald-500 transition-colors">
                    <Phone size={12} />
                    {emp.phone}
                  </a>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEditModal(emp)}
                    className="p-1.5 text-slate-500 hover:text-emerald-500 transition-colors"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(emp.id)}
                    className="p-1.5 text-slate-500 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredEmployees.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            <Users size={24} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">Không tìm thấy</p>
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal
        title={editingEmp ? "Sửa thông tin" : "Thêm nhân viên"}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        footer={
          <button
            onClick={handleSubmit}
            className="w-full bg-emerald-500 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors"
          >
            Lưu
          </button>
        }
      >
        <form className="space-y-4">
          {error && (
            <div className="p-2.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg">
              {error}
            </div>
          )}
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Họ tên</label>
            <input
              type="text"
              placeholder="Nguyễn Văn A"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-600"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Số điện thoại</label>
            <input
              type="tel"
              placeholder="0912345678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-600"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
