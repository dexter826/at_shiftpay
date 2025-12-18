import React, { useState, useMemo } from 'react';
import { Employee, Shift } from '../types';
import { dbService } from '../services/firebase';
import { UserPlus, Trash2, Phone, Edit2, Search, Users, Briefcase } from 'lucide-react';
import { Skeleton } from './ui/Skeleton';
import { Modal } from './ui/Modal';
import { useToast } from './ui/Toast';
import { useTheme } from '../contexts/ThemeContext';

interface EmployeeManagerProps {
  employees: Employee[];
  shifts: Shift[];
  events?: { id: string; date: string }[];
  loading?: boolean;
}

export const EmployeeManager: React.FC<EmployeeManagerProps> = ({ employees, shifts, events = [], loading = false }) => {
  const { showToast } = useToast();
  const { theme } = useTheme();

  // Theme classes
  const bgClass = theme === 'dark' ? 'bg-slate-900' : 'bg-slate-50';
  const cardBgClass = theme === 'dark' ? 'bg-slate-900' : 'bg-white';
  const borderClass = theme === 'dark' ? 'border-slate-800' : 'border-slate-200';
  const textPrimaryClass = theme === 'dark' ? 'text-slate-100' : 'text-slate-800';
  const textSecondaryClass = theme === 'dark' ? 'text-slate-200' : 'text-slate-700';
  const textMutedClass = theme === 'dark' ? 'text-slate-500' : 'text-slate-500';
  const inputBgClass = theme === 'dark' ? 'bg-slate-800' : 'bg-white';
  const inputBorderClass = theme === 'dark' ? 'border-slate-700' : 'border-slate-300';

  // Tính số công của mỗi nhân viên trong tháng hiện tại
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const shiftCountByEmployee = useMemo(() => {
    const counts: Record<string, number> = {};
    shifts.forEach(s => {
      const d = new Date(s.eventDate);
      if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
        counts[s.employeeId] = (counts[s.employeeId] || 0) + 1;
      }
    });
    return counts;
  }, [shifts, currentMonth, currentYear]);

  // Kiểm tra nhân viên có thể xóa được không
  const canDeleteEmployee = (empId: string): { canDelete: boolean; reason?: string } => {
    const today = new Date().toISOString().split('T')[0];

    // Kiểm tra có công chưa thanh toán không
    const unpaidShifts = shifts.filter(s => s.employeeId === empId && s.status === 'unpaid');
    if (unpaidShifts.length > 0) {
      return { canDelete: false, reason: `Nhân viên còn ${unpaidShifts.length} công chưa thanh toán` };
    }

    // Kiểm tra có nằm trong sự kiện chưa diễn ra không
    const futureShifts = shifts.filter(s => s.employeeId === empId && s.eventDate >= today);
    if (futureShifts.length > 0) {
      return { canDelete: false, reason: `Nhân viên đang có ${futureShifts.length} ca làm sắp tới` };
    }

    return { canDelete: true };
  };

  const [modalOpen, setModalOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');

  const openAddModal = () => {
    setEditingEmp(null);
    setName('');
    setPhone('');
    setImageUrl('');
    setError('');
    setModalOpen(true);
  };

  const openEditModal = (emp: Employee) => {
    setEditingEmp(emp);
    setName(emp.name);
    setPhone(emp.phone);
    setImageUrl(emp.imageUrl || '');
    setError('');
    setModalOpen(true);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setPhone(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Vui lòng nhập họ tên');
      return;
    }

    if (phone && !/^\d{9,11}$/.test(phone)) {
      setError('Số điện thoại phải từ 9-11 chữ số');
      return;
    }

    // Close modal immediately for better UX
    const isEditing = !!editingEmp;
    const empId = editingEmp?.id;
    setModalOpen(false);

    try {
      if (isEditing && empId) {
        await dbService.updateEmployee(empId, { name, phone, imageUrl });
        showToast('Đã cập nhật nhân viên', 'success');
      } else {
        await dbService.addEmployee({ name, phone, imageUrl });
        showToast('Đã thêm nhân viên mới', 'success');
      }
    } catch (err) {
      showToast('Có lỗi xảy ra', 'error');
      // Re-open modal if error (optional, but for now we just show toast)
    }
  };

  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    const { canDelete, reason } = canDeleteEmployee(id);
    if (!canDelete) {
      setDeleteError(reason || 'Không thể xóa nhân viên này');
      return;
    }
    setDeleteConfirm(id);
  };

  const confirmDelete = async () => {
    if (deleteConfirm) {
      await dbService.deleteEmployee(deleteConfirm);
      showToast('Đã xóa nhân viên', 'success');
      setDeleteConfirm(null);
    }
  };

  const filteredEmployees = employees.filter(e =>
    e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.phone.includes(searchTerm)
  );

  return (
    <div className={`pb-16 md:pb-0 md:ml-60 ${bgClass} min-h-screen`}>
      {/* Header */}
      <div className={`p-4 md:p-6 border-b ${borderClass}`}>
        <div className="flex justify-between items-center">
          <div>
            <h1 className={`text-lg font-semibold ${textPrimaryClass}`}>Nhân Sự</h1>
            <p className={`text-xs ${textMutedClass} mt-0.5`}>
              {loading ? <Skeleton width={100} height={14} /> : `${employees.length} nhân viên`}
            </p>
          </div>
          <button
            onClick={openAddModal}
            disabled={loading}
            className="bg-[#ecb52d] text-white px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium hover:bg-[#d4a128] transition-colors disabled:opacity-50"
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
            disabled={loading}
            className={`w-full pl-9 pr-4 py-2 ${cardBgClass} border ${borderClass} rounded-lg text-sm ${textSecondaryClass} placeholder-slate-500 focus:outline-none focus:border-[#ecb52d] disabled:opacity-50`}
          />
        </div>
      </div>

      {/* List */}
      <div className="p-4 md:p-6">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
              <div key={i} className={`flex flex-col ${cardBgClass} border ${borderClass} rounded-xl overflow-hidden relative aspect-square`}>
                <div className="absolute inset-0 p-4 flex flex-col items-center justify-center gap-2">
                  <Skeleton variant="circular" width={64} height={64} />
                  <Skeleton width={80} height={16} />
                  <Skeleton width={60} height={12} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredEmployees.map((emp) => (
              <div key={emp.id} className={`flex flex-col ${cardBgClass} border ${borderClass} rounded-xl overflow-hidden hover:border-[#ecb52d]/50 transition-all duration-300 group shadow-sm hover:shadow-lg relative aspect-square`}>
                {/* Image Container - Full height */}
                <div className="absolute inset-0 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800">
                  {emp.imageUrl ? (
                    <img
                      src={emp.imageUrl}
                      alt={emp.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name)}&background=random&color=fff&size=256`;
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800">
                      {emp.name.charAt(0).toUpperCase()}
                    </div>
                  )}

                  {/* Gradient Overlay for text readability */}
                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none" />

                  {/* Actions overlay - always visible on mobile, hover on desktop */}
                  <div className="absolute top-2 right-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex flex-col gap-2 z-10">
                    <button
                      onClick={(e) => { e.stopPropagation(); openEditModal(emp); }}
                      className="p-2 rounded-full backdrop-blur-md bg-white/30 dark:bg-black/40 text-white shadow-sm hover:bg-[#ecb52d] hover:text-white transition-all duration-200"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(emp.id); }}
                      className="p-2 rounded-full backdrop-blur-md bg-white/30 dark:bg-black/40 text-white shadow-sm hover:bg-red-500 hover:text-white transition-all duration-200"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Content Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-3 z-10 text-white">
                  <h3 className="text-sm font-bold truncate leading-tight mb-1 shadow-black/50 drop-shadow-sm">{emp.name}</h3>

                  <div className="flex flex-col gap-0.5 text-[11px] text-slate-200">
                    <div className="flex items-center gap-1.5 opacity-90">
                      <Phone size={10} className="shrink-0" />
                      <span className="truncate">{emp.phone || '---'}</span>
                    </div>

                    <div className="flex items-center gap-1.5 font-medium text-[#ecb52d]">
                      <Briefcase size={10} className="shrink-0" />
                      <span>{shiftCountByEmployee[emp.id] || 0} công</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredEmployees.length === 0 && (
          <div className={`text-center py-12 ${textMutedClass}`}>
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
            className="w-full bg-[#ecb52d] text-white py-2.5 rounded-lg text-sm font-medium hover:bg-[#d4a128] transition-colors"
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
            <label className={`block text-xs ${textMutedClass} mb-1.5`}>Họ tên</label>
            <input
              type="text"
              placeholder="Nguyễn Văn A"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full p-2.5 ${inputBgClass} border ${inputBorderClass} rounded-lg text-sm ${textSecondaryClass} placeholder-slate-500 focus:outline-none focus:border-[#ecb52d]`}
            />
          </div>
          <div>
            <label className={`block text-xs ${textMutedClass} mb-1.5`}>Số điện thoại (không bắt buộc)</label>
            <input
              type="tel"
              placeholder="0912345678"
              value={phone}
              onChange={handlePhoneChange}
              maxLength={11}
              className={`w-full p-2.5 ${inputBgClass} border ${inputBorderClass} rounded-lg text-sm ${textSecondaryClass} placeholder-slate-500 focus:outline-none focus:border-[#ecb52d]`}
            />
          </div>
          <div>
            <label className={`block text-xs ${textMutedClass} mb-1.5`}>URL Hình ảnh (tùy chọn)</label>
            <input
              type="text"
              placeholder="https://example.com/avatar.jpg"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className={`w-full p-2.5 ${inputBgClass} border ${inputBorderClass} rounded-lg text-sm ${textSecondaryClass} placeholder-slate-500 focus:outline-none focus:border-[#ecb52d]`}
            />
          </div>
        </form>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal
        title="Xác nhận xóa"
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        footer={
          <div className="flex gap-2">
            <button
              onClick={() => setDeleteConfirm(null)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium border ${borderClass} ${theme === 'dark' ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'} transition-colors`}
            >
              Hủy
            </button>
            <button
              onClick={confirmDelete}
              className="flex-1 bg-red-500 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
            >
              Xóa
            </button>
          </div>
        }
      >
        <p className={`text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>Bạn có chắc muốn xóa nhân viên này?</p>
      </Modal>

      {/* Delete Error Modal */}
      <Modal
        title="Không thể xóa"
        isOpen={!!deleteError}
        onClose={() => setDeleteError(null)}
        footer={
          <button
            onClick={() => setDeleteError(null)}
            className={`w-full py-2.5 rounded-lg text-sm font-medium ${theme === 'dark' ? 'bg-slate-700 text-slate-200 hover:bg-slate-600' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'} transition-colors`}
          >
            Đã hiểu
          </button>
        }
      >
        <p className={`text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>{deleteError}</p>
      </Modal>
    </div>
  );
};
