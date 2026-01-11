import React, { useState, useMemo, useEffect, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Employee, Shift } from '../../types';
import { dbService, deleteField } from '../../services';
import { vietQRService, VietQRBank } from '../../services/vietqr';
import { UserPlus, Trash2, Phone, Edit2, Search, Users, Briefcase, Check, ArrowUpDown, Building2, CheckCircle, RotateCcw, CircleAlert, Upload, Camera, Loader2, Plus } from 'lucide-react';
import { LoadMore } from '../ui/LoadMore';
import { Skeleton } from '../ui/Skeleton';
import { Modal } from '../ui/Modal';
import { EmployeeDetailModal } from '../modals';
import { useToast } from '../ui/Toast';
import Button from '../ui/Button';
import { Dropdown, DropdownOption } from '../ui/Dropdown';
import { useThemeStyles } from '../../hooks/useThemeStyles';
import { areValuesEqual } from '../../utils/compare';
import { ImageCropperModal } from '../modals/ImageCropperModal';
import { useAuthStore } from '../../stores';

interface EmployeeManagerProps {
  employees: Employee[];
  shifts: Shift[];
  events?: { id: string; date: string }[];
  loading?: boolean;
}

const EmployeeManager: React.FC<EmployeeManagerProps> = ({ employees, shifts, events = [], loading = false }) => {
  const { showToast } = useToast();
  // Hook style đồng bộ theme
  const {
    theme,
    bgClass,
    cardBgClass,
    borderClass,
    textPrimaryClass,
    textSecondaryClass,
    textMutedClass,
    inputBgClass,
    inputBorderClass,
    highlightBgClass
  } = useThemeStyles();
  const { user } = useAuthStore();
  const userId = user?.uid || '';

  // Tính công nợ trong tháng
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const shiftCountByEmployee = useMemo(() => {
    const counts: Record<string, number> = {};
    shifts.forEach(s => {
      const d = new Date(s.date);
      if (d.getMonth() === currentMonth && d.getFullYear() === currentYear && s.status === 'unpaid') {
        counts[s.employeeId] = (counts[s.employeeId] || 0) + 1;
      }
    });
    return counts;
  }, [shifts, currentMonth, currentYear]);

  // Điều kiện xóa nhân viên
  const canDeleteEmployee = (empId: string): { canDelete: boolean; reason?: string } => {
    const today = new Date().toISOString().split('T')[0];

    // Công chưa thanh toán
    const unpaidShifts = shifts.filter(s => s.employeeId === empId && s.status === 'unpaid');
    if (unpaidShifts.length > 0) {
      return { canDelete: false, reason: `Nhân viên còn ${unpaidShifts.length} công chưa thanh toán` };
    }

    // Ca làm sắp tới
    const futureShifts = shifts.filter(s => s.employeeId === empId && s.date >= today);
    if (futureShifts.length > 0) {
      return { canDelete: false, reason: `Nhân viên đang có ${futureShifts.length} ca làm sắp tới` };
    }

    return { canDelete: true };
  };

  const [modalOpen, setModalOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [tempImage, setTempImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'shifts' | 'recent'>('name');
  const [error, setError] = useState('');
  const [visibleCount, setVisibleCount] = useState(18);
  const [initialState, setInitialState] = useState<any>(null);

  // Reset danh sách khi tìm kiếm hoặc sắp xếp
  useEffect(() => {
    setVisibleCount(18);
  }, [searchTerm, sortBy]);

  const handleLoadMore = () => {
    setVisibleCount(prev => Math.min(prev + 18, filteredAndSortedEmployees.length));
  };

  const [bankList, setBankList] = useState<VietQRBank[]>([]);
  const [bankId, setBankId] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');

  useEffect(() => {
    const loadBanks = async () => {
      const banks = await vietQRService.getBankList();
      setBankList(banks);
    };
    loadBanks();
  }, []);

  const openAddModal = () => {
    setEditingEmp(null);
    setName('');
    setPhone('');
    setImageUrl('');
    setBankId('');
    setBankName('');
    setAccountNumber('');
    setAccountName('');
    setError('');
    setModalOpen(true);
  };

  const openEditModal = (emp: Employee) => {
    setEditingEmp(emp);
    setName(emp.name);
    setPhone(emp.phone);
    setImageUrl(emp.imageUrl || '');
    setBankId(emp.bankAccount?.bankId || '');
    setBankName(emp.bankAccount?.bankName || '');
    setAccountNumber(emp.bankAccount?.accountNumber || '');
    setAccountName(emp.bankAccount?.accountName || '');
    setError('');

    // Lưu trạng thái so sánh
    setInitialState({
      name: emp.name,
      phone: emp.phone,
      imageUrl: emp.imageUrl || '',
      bankAccount: emp.bankAccount ? {
        bankId: emp.bankAccount.bankId,
        bankName: emp.bankAccount.bankName,
        accountNumber: emp.bankAccount.accountNumber,
        accountName: emp.bankAccount.accountName
      } : null
    });

    setModalOpen(true);
  };

  const openDetailModal = (emp: Employee) => {
    setSelectedEmployee(emp);
    setDetailModalOpen(true);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setPhone(value);
  };

  const hasChanged = useMemo(() => {
    if (!editingEmp || !initialState) return true;

    const bankAccount = bankId && accountNumber && accountName ? {
      bankId,
      bankName,
      accountNumber,
      accountName
    } : null;

    const currentState = {
      name: name.trim(),
      phone: phone.trim(),
      imageUrl: imageUrl.trim(),
      bankAccount: bankAccount
    };

    return !areValuesEqual(currentState, initialState);
  }, [name, phone, imageUrl, bankId, bankName, accountNumber, accountName, initialState, editingEmp]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Kiểm tra định dạng
    if (!file.type.startsWith('image/')) {
      showToast('Vui lòng chọn file ảnh', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setTempImage(reader.result as string);
      setCropperOpen(true);
    };
    reader.readAsDataURL(file);

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCropComplete = async (croppedFile: File) => {
    setIsUploading(true);
    try {
      const url = await dbService.uploadImage(croppedFile);
      setImageUrl(url);
      showToast('Đã tải ảnh lên thành công', 'success');
    } catch (error) {
      console.error('Upload failed:', error);
      showToast('Không thể tải ảnh lên', 'error');
    } finally {
      setIsUploading(false);
      setTempImage(null);
    }
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

    if ((bankId || accountNumber || accountName) && !(bankId && accountNumber && accountName)) {
      setError('Vui lòng điền đầy đủ thông tin ngân hàng hoặc bỏ trống');
      return;
    }

    if (bankId && accountNumber && accountName) {
      const validation = vietQRService.validateBankAccount(accountNumber, accountName);
      if (!validation.valid) {
        setError(validation.error || 'Thông tin ngân hàng không hợp lệ');
        return;
      }
    }

    const bankAccount = bankId && accountNumber && accountName ? {
      bankId,
      bankName,
      accountNumber,
      accountName
    } : null;

    try {
      const isEditing = !!editingEmp;
      const empId = editingEmp?.id;

      // Safeguard lưu dữ liệu

      setModalOpen(false);

      const employeeData: any = {
        name: name.trim(),
        phone: phone.trim(),
        imageUrl: imageUrl.trim()
      };

      if (bankAccount) {
        employeeData.bankAccount = bankAccount;
      } else if (isEditing) {
        // Xóa thông tin ngân hàng nếu đang chỉnh sửa và để trống
        employeeData.bankAccount = deleteField();
      }

      if (isEditing && empId) {
        await dbService.updateEmployee(empId, employeeData);
        showToast('Đã cập nhật nhân viên', 'success');
      } else {
        await dbService.addEmployee(employeeData, userId);
        showToast('Đã thêm nhân viên mới', 'success');
      }
    } catch (err) {
      console.error('Error saving employee:', err);
      const errorMessage = err instanceof Error ? err.message : 'Có lỗi xảy ra';
      showToast(errorMessage, 'error');
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

  const filteredAndSortedEmployees = useMemo(() => {
    const filtered = employees.filter(e =>
      e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.phone.includes(searchTerm)
    );

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name, 'vi');
        case 'shifts':
          const aShifts = shiftCountByEmployee[a.id] || 0;
          const bShifts = shiftCountByEmployee[b.id] || 0;
          return bShifts - aShifts;
        case 'recent':
          // Ưu tiên bản ghi mới
          const aCreatedAt = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const bCreatedAt = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return bCreatedAt - aCreatedAt;
        default:
          return 0;
      }
    });
  }, [employees, searchTerm, sortBy, shiftCountByEmployee]);

  // Tùy chọn sắp xếp
  const sortOptions: DropdownOption[] = [
    { value: 'name', label: 'Tên A-Z' },
    { value: 'shifts', label: 'Nhiều công' },
    { value: 'recent', label: 'Mới nhất' }
  ];

  return (
    <div className={`pb-24 md:pb-0 ${bgClass} min-h-screen`}>
      {/* Tiêu đề */}
      <div className={`p-4 md:p-6 border-b ${borderClass}`}>
        <div className="flex justify-between items-center">
          <div>
            <h1 className={`text-lg font-semibold ${textPrimaryClass}`}>
              {loading ? <Skeleton width={120} height={24} /> : `${employees.length} nhân viên`}
            </h1>
          </div>
          <Button
            onClick={openAddModal}
            disabled={loading}
            className=""
          >
            <UserPlus size={16} />
            <span className="hidden sm:inline">Thêm mới</span>
          </Button>
        </div>

        {/* Tìm kiếm & Sắp xếp */}
        <div className="mt-4 flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${textMutedClass}`} />
            <input
              type="text"
              placeholder="Nhập từ khóa tìm kiếm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={loading}
              className={`w-full pl-9 pr-4 h-[42px] ${cardBgClass} border ${borderClass} rounded-xl text-sm ${textSecondaryClass} placeholder-slate-500 focus:outline-none focus:border-primary disabled:opacity-50`}
            />
          </div>

          <Dropdown
            options={sortOptions}
            value={sortBy}
            onChange={(value) => setSortBy(value as 'name' | 'shifts' | 'recent')}
            icon={<ArrowUpDown size={16} />}
            disabled={loading}
            className="h-[42px]"
          />
        </div>
      </div>

      {/* Danh sách nhân viên */}
      <div className="p-4 md:p-6">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
                <div key={i} className={`flex flex-col ${cardBgClass} border ${borderClass} rounded-xl overflow-hidden relative aspect-square`}>
                  <div className="absolute inset-0 p-4 flex flex-col items-center justify-center gap-2">
                    <Skeleton variant="circular" width={64} height={64} />
                    <Skeleton width={80} height={16} />
                    <Skeleton width={60} height={12} />
                  </div>
                </div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
            >
              {filteredAndSortedEmployees.slice(0, visibleCount).map((emp) => (
                <div
                  key={emp.id}
                  onClick={() => openDetailModal(emp)}
                  className={`flex flex-col ${cardBgClass} border ${borderClass} rounded-xl overflow-hidden hover:border-primary/50 transition-all duration-300 group shadow-sm hover:shadow-lg relative aspect-square cursor-pointer`}
                >                {/* Ảnh cover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${highlightBgClass}`}>
                    {emp.imageUrl ? (
                      <img
                        src={emp.imageUrl}
                        alt={emp.name}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name)}&background=random&color=fff&size=256`;
                        }}
                      />
                    ) : (
                      <div className={`w-full h-full flex items-center justify-center text-3xl font-bold ${textMutedClass} ${highlightBgClass}`}>
                        {emp.name.charAt(0).toUpperCase()}
                      </div>
                    )}

                    {/* Gradient làm nền cho chữ */}
                    <div className="absolute inset-x-0 bottom-0 h-[45%] bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />

                    {/* Thao tác nhanh */}
                    <div className="absolute top-2 right-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex flex-col gap-2 z-10">
                      <button
                        onClick={(e) => { e.stopPropagation(); openEditModal(emp); }}
                        className="p-2 rounded-full bg-white/40 dark:bg-black/50 text-white shadow-sm hover:bg-primary hover:text-white transition-all duration-200"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(emp.id); }}
                        className="p-2 rounded-full bg-white/40 dark:bg-black/50 text-white shadow-sm hover:bg-red-500 hover:text-white transition-all duration-200"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {/* Badge ngân hàng */}
                    <div className="absolute top-2 left-2 z-10">
                      {emp.bankAccount ? (
                        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/80 text-white text-[10px] font-medium shadow-sm">
                          <CheckCircle size={12} />
                          <span>Ngân hàng</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-orange-500/80 text-white text-[10px] font-medium shadow-sm">
                          <CircleAlert size={12} />
                          <span>Ngân hàng</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Thông tin chính */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 z-10 text-white">
                    <h3 className="text-sm font-bold truncate leading-tight mb-1 shadow-black/50 drop-shadow-sm">{emp.name}</h3>

                    <div className="flex flex-col gap-0.5 text-[11px] text-slate-200">
                      <div className="flex items-center gap-1.5 opacity-90">
                        <Phone size={10} className="shrink-0" />
                        <span className="truncate">{emp.phone || '---'}</span>
                      </div>

                      <div className="flex items-center gap-1.5 font-medium text-primary">
                        <Briefcase size={10} className="shrink-0" />
                        <span>{shiftCountByEmployee[emp.id] || 0} công</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <LoadMore
                currentCount={visibleCount}
                totalCount={filteredAndSortedEmployees.length}
                onLoadMore={handleLoadMore}
                unit="nhân viên"
                className="pt-8 pb-4"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {!loading && filteredAndSortedEmployees.length === 0 && (
          <div className={`text-center py-12 ${textMutedClass}`}>
            <Users size={24} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">
              {searchTerm ? 'Không tìm thấy nhân viên nào' : 'Chưa có nhân viên nào'}
            </p>
          </div>
        )}
      </div>

      {/* Form thêm/sửa */}
      <Modal
        title={editingEmp ? "Sửa thông tin" : "Thêm nhân viên"}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        footer={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => setModalOpen(false)}
              className="flex-1"
            >
              Hủy
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1"
              disabled={!hasChanged}
            >
              <Check size={16} />
              Lưu
            </Button>
          </div>
        }
      >
        <form className="space-y-4">
          {error && (
            <div className="p-2.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg">
              {error}
            </div>
          )}
          <div className="flex flex-col items-center justify-center pb-2">
            <div
              onClick={() => !isUploading && fileInputRef.current?.click()}
              className={`relative w-24 h-24 rounded-full overflow-hidden border-2 ${borderClass} ${highlightBgClass} cursor-pointer group transition-all hover:border-primary`}
            >
              {imageUrl ? (
                <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className={`w-full h-full flex items-center justify-center ${textMutedClass}`}>
                  <Camera size={24} />
                </div>
              )}

              {/* Overlay khi đang upload */}
              {isUploading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Loader2 size={24} className="text-white animate-spin" />
                </div>
              )}

              {/* Overlay hover */}
              {!isUploading && (
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <Upload size={20} className="text-white" />
                </div>
              )}
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />
            <p className={`text-[10px] ${textMutedClass} mt-2`}>Click để thay đổi ảnh</p>
          </div>

          <div>
            <label className={`block text-xs ${textMutedClass} mb-1.5`}>Họ tên</label>
            <input
              type="text"
              placeholder="Nhập họ tên"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full p-2.5 ${inputBgClass} border ${inputBorderClass} rounded-lg text-sm ${textSecondaryClass} placeholder-slate-500 focus:outline-none focus:border-primary`}
            />
          </div>
          <div>
            <label className={`block text-xs ${textMutedClass} mb-1.5`}>Số điện thoại (tùy chọn)</label>
            <input
              type="tel"
              placeholder="Nhập số điện thoại"
              value={phone}
              onChange={handlePhoneChange}
              maxLength={11}
              className={`w-full p-2.5 ${inputBgClass} border ${inputBorderClass} rounded-lg text-sm ${textSecondaryClass} placeholder-slate-500 focus:outline-none focus:border-primary`}
            />
          </div>

          <div className={`pt-3 border-t ${borderClass}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Building2 size={14} className="text-primary" />
                <label className={`text-xs font-medium ${textPrimaryClass}`}>Thông tin ngân hàng (tùy chọn)</label>
              </div>
              <button
                type="button"
                onClick={() => {
                  setBankId('');
                  setBankName('');
                  setAccountNumber('');
                  setAccountName('');
                }}
                className={`flex items-center gap-1 px-2 py-1 rounded ${cardBgClass} hover:bg-primary/10 text-primary hover:text-primary/80 transition-colors text-xs`}
                title="Làm mới thông tin ngân hàng"
              >
                <RotateCcw size={12} />
                Làm mới
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className={`block text-xs ${textMutedClass} mb-1.5`}>Ngân hàng</label>
                <Dropdown
                  options={[
                    { value: '', label: '-- Chọn ngân hàng --' },
                    ...bankList.map(bank => ({
                      value: bank.bin,
                      label: `${bank.shortName} - ${bank.name}`
                    }))
                  ]}
                  value={bankId}
                  onChange={(value) => {
                    const selectedBank = bankList.find(b => b.bin === value);
                    setBankId(value);
                    setBankName(selectedBank?.shortName || '');
                  }}
                  placeholder="-- Chọn ngân hàng --"
                  minWidth="w-full"
                  className="w-full"
                  searchable={true}
                  searchPlaceholder="Tìm tên ngân hàng..."
                />
              </div>

              <div>
                <label className={`block text-xs ${textMutedClass} mb-1.5`}>Số tài khoản</label>
                <input
                  type="text"
                  placeholder="Nhập số tài khoản"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value.replace(/[^0-9]/g, ''))}
                  className={`w-full p-2.5 ${inputBgClass} border ${inputBorderClass} rounded-lg text-sm ${textSecondaryClass} placeholder-slate-500 focus:outline-none focus:border-primary`}
                />
              </div>

              <div>
                <label className={`block text-xs ${textMutedClass} mb-1.5`}>Tên chủ tài khoản</label>
                <input
                  type="text"
                  placeholder="Nhập tên chủ tài khoản"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value.toUpperCase())}
                  className={`w-full p-2.5 ${inputBgClass} border ${inputBorderClass} rounded-lg text-sm ${textSecondaryClass} placeholder-slate-500 focus:outline-none focus:border-primary`}
                />
                <p className={`text-[10px] ${textMutedClass} mt-1`}>Viết hoa không dấu</p>
              </div>
            </div>
          </div>
        </form>
      </Modal>

      {/* Modal xóa */}
      <Modal
        title="Xác nhận xóa"
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        footer={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => setDeleteConfirm(null)}
              className="flex-1"
            >
              Hủy
            </Button>
            <Button
              variant="danger"
              onClick={confirmDelete}
              className="flex-1"
            >
              Xóa
            </Button>
          </div>
        }
      >
        <p className={`text-sm ${textSecondaryClass}`}>Bạn có chắc muốn xóa nhân viên này?</p>
      </Modal>

      {/* Lỗi xóa */}
      <Modal
        title="Không thể xóa"
        isOpen={!!deleteError}
        onClose={() => setDeleteError(null)}
        footer={
          <Button
            variant="secondary"
            onClick={() => setDeleteError(null)}
            fullWidth
          >
            Đã hiểu
          </Button>
        }
      >
        <p className={`text-sm ${textSecondaryClass}`}>{deleteError}</p>
      </Modal>

      {/* Chi tiết nhân viên */}
      <EmployeeDetailModal
        isOpen={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedEmployee(null);
        }}
        employee={selectedEmployee}
        shifts={shifts}
        onEditClick={(emp) => openEditModal(emp)}
      />

      {/* Modal cắt ảnh */}
      {tempImage && (
        <ImageCropperModal
          isOpen={cropperOpen}
          onClose={() => {
            setCropperOpen(false);
            setTempImage(null);
          }}
          image={tempImage}
          onCropComplete={handleCropComplete}
        />
      )}
    </div>
  );
};

export default memo(EmployeeManager);
