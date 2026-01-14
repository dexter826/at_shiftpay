import React, { useState } from 'react';
import { AlertTriangle, Trash2, Loader2 } from 'lucide-react';
import { useThemeStyles } from '../../hooks/useThemeStyles';
import { dbService } from '../../services';
import { auth } from '../../firebase';
import { deleteUser } from 'firebase/auth';
import { useToast } from '../ui/Toast';
import Button from '../ui/Button';
import { Modal } from '../ui/Modal';
import { useAuthStore } from '../../stores/authStore';

interface DeleteAccountModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({ isOpen, onClose }) => {
    const { textPrimaryClass: textMain, textMutedClass: textSub, borderClass: border } = useThemeStyles();
    const { showToast } = useToast();
    const clearSavedUserInfo = useAuthStore(state => state.clearSavedUserInfo);
    const [confirmText, setConfirmText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    const REQUIRED_CONFIRM_TEXT = 'XÓA TÀI KHOẢN';

    const handleDelete = async () => {
        if (confirmText !== REQUIRED_CONFIRM_TEXT) return;

        setIsDeleting(true);
        try {
            const user = auth.currentUser;
            if (!user) throw new Error('Không tìm thấy người dùng');

            await dbService.deleteUserAccountData(user.uid);
            await deleteUser(user);
            clearSavedUserInfo();

            showToast('Tài khoản đã được xóa vĩnh viễn', 'success');
        } catch (error: any) {
            console.error('Delete account error:', error);
            if (error.code === 'auth/requires-recent-login') {
                showToast('Để bảo mật, vui lòng Đăng xuất và Đăng nhập lại để thực hiện thao tác này', 'error', 6000);
            } else {
                showToast('Có lỗi xảy ra khi xóa tài khoản', 'error');
            }
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Xóa tài khoản"
            footer={
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="flex-1"
                        disabled={isDeleting}
                    >
                        Hủy
                    </Button>
                    <Button
                        onClick={handleDelete}
                        variant="danger"
                        className="flex-1"
                        disabled={confirmText !== REQUIRED_CONFIRM_TEXT || isDeleting}
                    >
                        {isDeleting ? (
                            <Loader2 size={18} className="animate-spin mr-2" />
                        ) : (
                            <Trash2 size={18} className="mr-2" />
                        )}
                        {isDeleting ? 'Đang xóa...' : 'Xác nhận xóa'}
                    </Button>
                </div>
            }
        >
            <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-red-500/10 text-red-500 mb-2">
                    <AlertTriangle size={24} className="flex-shrink-0" />
                    <p className="text-sm font-medium">
                        Hành động này <span className="font-bold uppercase underline">không thể hoàn tác</span>!
                    </p>
                </div>

                <p className={`text-sm ${textSub} leading-relaxed`}>
                    Toàn bộ dữ liệu về nhân viên, ca làm, sự kiện và lịch sử thanh toán của bạn sẽ bị xóa vĩnh viễn khỏi hệ thống.
                </p>

                <div className="pt-2">
                    <label className={`block text-sm font-medium ${textMain} mb-2`}>
                        Nhập <span className="font-bold text-red-500">"{REQUIRED_CONFIRM_TEXT}"</span> để xác nhận:
                    </label>
                    <input
                        type="text"
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        placeholder={REQUIRED_CONFIRM_TEXT}
                        className={`w-full px-4 py-3 rounded-xl border ${border} bg-transparent ${textMain} focus:outline-none focus:border-red-500 transition-colors text-sm`}
                        autoFocus
                    />
                </div>
            </div>
        </Modal>
    );
};
