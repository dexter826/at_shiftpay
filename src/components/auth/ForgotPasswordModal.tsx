import React, { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../firebase';
import { Modal } from '../ui/Modal';
import Button from '../ui/Button';
import { useToast } from '../ui/Toast';
import { useThemeStyles } from '../../hooks/useThemeStyles';

interface ForgotPasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ isOpen, onClose }) => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const { showToast } = useToast();
    const { inputBgClass, inputBorderClass, textPrimaryClass, textSecondaryClass } = useThemeStyles();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) {
            showToast('Vui lòng nhập email', 'error');
            return;
        }

        setLoading(true);
        try {
            await sendPasswordResetEmail(auth, email);
            showToast('Đã gửi email đặt lại mật khẩu', 'success');
            onClose();
            setEmail('');
        } catch (error: any) {
            console.error('Reset password error:', error);
            let message = 'Có lỗi xảy ra khi gửi email';
            if (error.code === 'auth/user-not-found') {
                message = 'Email không tồn tại trong hệ thống';
            } else if (error.code === 'auth/invalid-email') {
                message = 'Email không hợp lệ';
            }
            showToast(message, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title="Quên mật khẩu"
            isOpen={isOpen}
            onClose={onClose}
            footer={
                <Button
                    onClick={handleSubmit}
                    disabled={loading}
                    fullWidth
                    className=""
                >
                    {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                    Gửi yêu cầu
                </Button>
            }
        >
            <div className="space-y-4">
                <p className={`text-sm ${textSecondaryClass}`}>
                    Nhập email của bạn để nhận liên kết đặt lại mật khẩu.
                </p>
                <div>
                    <label className={`block text-xs ${textSecondaryClass} mb-1.5`}>Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Nhập email của bạn"
                        className={`w-full p-2.5 rounded-lg border focus:outline-none focus:border-primary ${inputBgClass} ${inputBorderClass} ${textPrimaryClass}`}
                    />
                </div>
            </div>
        </Modal>
    );
};
