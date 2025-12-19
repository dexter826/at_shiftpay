import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import Button from '../ui/Button';
import { useTheme } from '../../contexts/ThemeContext';
import { Lock, Eye, EyeOff, AlertCircle, Check } from 'lucide-react';
import { auth } from '../../firebase';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose }) => {
  const { theme } = useTheme();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Theme classes
  const inputBorderClass = theme === 'dark' ? 'border-slate-600' : 'border-gray-300';
  const textMutedClass = theme === 'dark' ? 'text-slate-400' : 'text-gray-500';
  const textPrimaryClass = theme === 'dark' ? 'text-slate-200' : 'text-gray-800';

  const inputStyle = `flex-1 ml-3 bg-transparent ${textPrimaryClass} placeholder-gray-400 focus:outline-none text-sm`;

  const resetForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setSuccess('');
    setLoading(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validateForm = () => {
    if (!currentPassword) {
      setError('Vui lòng nhập mật khẩu hiện tại');
      return false;
    }
    if (!newPassword) {
      setError('Vui lòng nhập mật khẩu mới');
      return false;
    }
    if (newPassword.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự');
      return false;
    }
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError('');
    setSuccess('');

    const user = auth.currentUser;
    if (!user || !user.email) {
      setError('Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.');
      setLoading(false);
      return;
    }

    try {
      // 1. Re-authenticate
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // 2. Update password
      await updatePassword(user, newPassword);

      setSuccess('Đổi mật khẩu thành công!');
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err: any) {
      console.error("Change password error:", err);
      if (err.code === 'auth/wrong-password') {
        setError('Mật khẩu hiện tại không đúng');
      } else if (err.code === 'auth/weak-password') {
        setError('Mật khẩu quá yếu');
      } else if (err.code === 'auth/requires-recent-login') {
        setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      } else {
        setError('Đã xảy ra lỗi: ' + (err.message || 'Vui lòng thử lại sau'));
      }
    } finally {
      if (!success) { // logic check to avoid overwriting success loading state if needed, but simple setLoading(false) is fine here usually unless dealing with async success close
        setLoading(false);
      }
    }
  };

  return (
    <Modal
      title="Đổi mật khẩu"
      isOpen={isOpen}
      onClose={handleClose}
      footer={
        <div className="flex gap-2 w-full">
          <Button
            variant="secondary"
            onClick={handleClose}
            className="flex-1"
            disabled={loading}
            hideIcon
          >
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            className="flex-1"
            disabled={loading}
          >
            {!loading && <Check size={16} />}
            {loading ? 'Đang xử lý...' : 'Cập nhật'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 py-2">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-sm rounded-lg">
            <AlertCircle size={16} />
            <p>{error}</p>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 text-green-500 text-sm rounded-lg">
            <AlertCircle size={16} />
            <p>{success}</p>
          </div>
        )}

        {/* Current Password */}
        <div>
          <label className={`block text-xs font-medium ${textMutedClass} mb-1.5`}>Mật khẩu hiện tại</label>
          <div className={`flex items-center border-b-2 ${inputBorderClass} pb-2 transition-colors focus-within:border-[#ecb52d]`}>
            <Lock size={18} className={textMutedClass} />
            <input
              type={showCurrentPassword ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className={inputStyle}
              placeholder="Nhập mật khẩu hiện tại"
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              className={`${textMutedClass} hover:text-[#ecb52d] transition-colors`}
            >
              {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* New Password */}
        <div>
          <label className={`block text-xs font-medium ${textMutedClass} mb-1.5`}>Mật khẩu mới</label>
          <div className={`flex items-center border-b-2 ${inputBorderClass} pb-2 transition-colors focus-within:border-[#ecb52d]`}>
            <Lock size={18} className={textMutedClass} />
            <input
              type={showNewPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={inputStyle}
              placeholder="Nhập mật khẩu mới (min 6 ký tự)"
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className={`${textMutedClass} hover:text-[#ecb52d] transition-colors`}
            >
              {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* Confirm New Password */}
        <div>
          <label className={`block text-xs font-medium ${textMutedClass} mb-1.5`}>Xác nhận mật khẩu mới</label>
          <div className={`flex items-center border-b-2 ${inputBorderClass} pb-2 transition-colors focus-within:border-[#ecb52d]`}>
            <Lock size={18} className={textMutedClass} />
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={inputStyle}
              placeholder="Nhập lại mật khẩu mới"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className={`${textMutedClass} hover:text-[#ecb52d] transition-colors`}
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
