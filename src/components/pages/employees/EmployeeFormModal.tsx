import React, { useState, useEffect, useRef, useMemo, memo } from 'react';
import { Camera, Upload, Loader2, Building2, RotateCcw } from 'lucide-react';
import SimpleCheckedIcon from '../../ui/icons/simple-checked-icon';
import { Modal } from '../../ui/Modal';
import Button from '../../ui/Button';
import { Dropdown } from '../../ui/Dropdown';
import { useThemeStyles } from '../../../hooks/useThemeStyles';
import { Employee } from '../../../types';
import { useToast } from '../../ui/Toast';
import { dbService, deleteField } from '../../../services';
import { vietQRService, VietQRBank } from '../../../services/vietqrService';
import ImageCropperModal from './ImageCropperModal';
import { areValuesEqual } from '../../../utils/compare';

interface EmployeeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingEmployee: Employee | null;
  userId: string;
}

const EmployeeFormModal: React.FC<EmployeeFormModalProps> = ({
  isOpen,
  onClose,
  editingEmployee,
  userId,
}) => {
  const { showToast } = useToast();
  const {
    inputBgClass,
    inputBorderClass,
    textSecondaryClass,
    textMutedClass,
    borderClass,
    highlightBgClass,
    textPrimaryClass,
    cardBgClass,
  } = useThemeStyles();

  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  
  // Bank State
  const [bankList, setBankList] = useState<VietQRBank[]>([]);
  const [bankId, setBankId] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');

  // UI State
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [tempImage, setTempImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [initialState, setInitialState] = useState<any>(null);

  // Load banks once
  useEffect(() => {
    const loadBanks = async () => {
      const banks = await vietQRService.getBankList();
      setBankList(banks);
    };
    loadBanks();
  }, []);

  // Initialize form when modal opens or editingEmployee changes
  useEffect(() => {
    if (isOpen) {
      if (editingEmployee) {
        setName(editingEmployee.name);
        setPhone(editingEmployee.phone);
        setImageUrl(editingEmployee.imageUrl || '');
        setBankId(editingEmployee.bankAccount?.bankId || '');
        setBankName(editingEmployee.bankAccount?.bankName || '');
        setAccountNumber(editingEmployee.bankAccount?.accountNumber || '');
        setAccountName(editingEmployee.bankAccount?.accountName || '');
        setError('');

        setInitialState({
          name: editingEmployee.name,
          phone: editingEmployee.phone,
          imageUrl: editingEmployee.imageUrl || '',
          bankAccount: editingEmployee.bankAccount ? {
            bankId: editingEmployee.bankAccount.bankId,
            bankName: editingEmployee.bankAccount.bankName,
            accountNumber: editingEmployee.bankAccount.accountNumber,
            accountName: editingEmployee.bankAccount.accountName
          } : null
        });
      } else {
        // Add mode
        setName('');
        setPhone('');
        setImageUrl('');
        setBankId('');
        setBankName('');
        setAccountNumber('');
        setAccountName('');
        setError('');
        setInitialState(null);
      }
    }
  }, [isOpen, editingEmployee]);

  const hasChanged = useMemo(() => {
    if (!editingEmployee || !initialState) return true;

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
  }, [name, phone, imageUrl, bankId, bankName, accountNumber, accountName, initialState, editingEmployee]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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

  const handleSubmit = async () => {
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
      const isEditing = !!editingEmployee;
      const empId = editingEmployee?.id;

      const employeeData: any = {
        name: name.trim(),
        phone: phone.trim(),
        imageUrl: imageUrl.trim()
      };

      if (bankAccount) {
        employeeData.bankAccount = bankAccount;
      } else if (isEditing) {
        employeeData.bankAccount = deleteField();
      }

      if (isEditing && empId) {
        await dbService.updateEmployee(empId, employeeData);
        showToast('Đã cập nhật nhân viên', 'success');
      } else {
        await dbService.addEmployee(employeeData, userId);
        showToast('Đã thêm nhân viên mới', 'success');
      }
      onClose();
    } catch (err) {
      console.error('Error saving employee:', err);
      const errorMessage = err instanceof Error ? err.message : 'Có lỗi xảy ra';
      showToast(errorMessage, 'error');
    }
  };

  return (
    <>
      <Modal
        title={editingEmployee ? "Sửa thông tin" : "Thêm nhân viên"}
        isOpen={isOpen}
        onClose={onClose}
        footer={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={onClose}
              className="flex-1"
            >
              Hủy
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1"
              disabled={!hasChanged}
            >
              <SimpleCheckedIcon size={16} />
              Lưu
            </Button>
          </div>
        }
      >
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
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

              {isUploading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Loader2 size={24} className="text-white animate-spin" />
                </div>
              )}

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
              onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
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
    </>
  );
};

export default memo(EmployeeFormModal);
