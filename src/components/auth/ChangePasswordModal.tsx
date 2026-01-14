import React, { useState, useRef } from 'react';
import { Modal } from '../ui/Modal';
import Button from '../ui/Button';
import { useThemeStyles } from '../../hooks/useThemeStyles';
import { Lock, AlertCircle, Check } from 'lucide-react';
import EyeIcon from '../ui/icons/eye-icon';
import EyeOffIcon from '../ui/icons/eye-off-icon';
import { AnimatedIconHandle } from '../ui/icons/types';
import { auth } from '../../firebase';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose }) => {


  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const currentEyeRef = useRef<AnimatedIconHandle>(null);
  const currentEyeOffRef = useRef<AnimatedIconHandle>(null);
  const newEyeRef = useRef<AnimatedIconHandle>(null);
  const newEyeOffRef = useRef<AnimatedIconHandle>(null);
  const confirmEyeRef = useRef<AnimatedIconHandle>(null);
  const confirmEyeOffRef = useRef<AnimatedIconHandle>(null);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const { theme, inputBorderClass, textMutedClass, textPrimaryClass } = useThemeStyles();

  const inputStyle = `flex-1 ml-3 bg-transparent ${textPrimaryClass} focus:outline-none text-sm`;

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
      // Xác thực lại tài khoản
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Ghi mật khẩu mới
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
      if (!success) { // Giữ loading nếu thất bại
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

        {/* Mật khẩu hiện tại */}
        <div>
          <label className={`block text-xs font-medium ${textMutedClass} mb-1.5`}>Mật khẩu hiện tại</label>
          <div className={`flex items-center border-b-2 ${inputBorderClass} pb-2 transition-colors focus-within:border-primary`}>
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
              tabIndex={-1}
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              onMouseEnter={() => {
                  if (showCurrentPassword) currentEyeOffRef.current?.startAnimation();
                  else currentEyeRef.current?.startAnimation();
              }}
              onMouseLeave={() => {
                  if (showCurrentPassword) currentEyeOffRef.current?.stopAnimation();
                  else currentEyeRef.current?.stopAnimation();
              }}
              className={`${textMutedClass} hover:text-primary transition-colors`}
            >
              {showCurrentPassword ? <EyeOffIcon ref={currentEyeOffRef} size={18} /> : <EyeIcon ref={currentEyeRef} size={18} />}
            </button>
          </div>
        </div>

        {/* Mật khẩu mới */}
        <div>
          <label className={`block text-xs font-medium ${textMutedClass} mb-1.5`}>Mật khẩu mới</label>
          <div className={`flex items-center border-b-2 ${inputBorderClass} pb-2 transition-colors focus-within:border-primary`}>
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
              tabIndex={-1}
              onClick={() => setShowNewPassword(!showNewPassword)}
              onMouseEnter={() => {
                  if (showNewPassword) newEyeOffRef.current?.startAnimation();
                  else newEyeRef.current?.startAnimation();
              }}
              onMouseLeave={() => {
                  if (showNewPassword) newEyeOffRef.current?.stopAnimation();
                  else newEyeRef.current?.stopAnimation();
              }}
              className={`${textMutedClass} hover:text-primary transition-colors`}
            >
              {showNewPassword ? <EyeOffIcon ref={newEyeOffRef} size={18} /> : <EyeIcon ref={newEyeRef} size={18} />}
            </button>
          </div>
        </div>

        {/* Xác nhận mật khẩu mới */}
        <div>
          <label className={`block text-xs font-medium ${textMutedClass} mb-1.5`}>Xác nhận mật khẩu mới</label>
          <div className={`flex items-center border-b-2 ${inputBorderClass} pb-2 transition-colors focus-within:border-primary`}>
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
              tabIndex={-1}
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              onMouseEnter={() => {
                  if (showConfirmPassword) confirmEyeOffRef.current?.startAnimation();
                  else confirmEyeRef.current?.startAnimation();
              }}
              onMouseLeave={() => {
                  if (showConfirmPassword) confirmEyeOffRef.current?.stopAnimation();
                  else confirmEyeRef.current?.stopAnimation();
              }}
              className={`${textMutedClass} hover:text-primary transition-colors`}
            >
              {showConfirmPassword ? <EyeOffIcon ref={confirmEyeOffRef} size={18} /> : <EyeIcon ref={confirmEyeRef} size={18} />}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
