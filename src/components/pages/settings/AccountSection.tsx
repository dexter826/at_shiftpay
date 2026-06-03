import React, { useState, useRef } from 'react';
import { User, Camera, Loader2, Edit2, Check, X, Key, ChevronRight, Trash2 } from 'lucide-react';
import { auth } from '../../../firebase';
import { updateProfile } from 'firebase/auth';
import { dbService } from '../../../services';
import { useAuthStore } from '../../../stores/authStore';
import { useToast } from '../../ui/Toast';
import { ImageCropperModal } from '../../modals/ImageCropperModal';
import { ChangePasswordModal } from '../../auth/ChangePasswordModal';
import { DeleteAccountModal } from './DeleteAccountModal';
import KeyIcon from '../../ui/icons/key-icon';
import TrashIcon from '../../ui/icons/trash-icon';
import { AnimatedIconHandle } from '../../ui/icons/types';

interface AccountSectionProps {
    user: any;
}

const AccountSection: React.FC<AccountSectionProps> = ({ user }) => {
    const itemHover = 'hover:bg-[var(--border-color)]';
    const { showToast } = useToast();
    const saveUserInfo = useAuthStore(state => state.saveUserInfo);

    const [isEditingName, setIsEditingName] = useState(false);
    const [editedName, setEditedName] = useState(user?.displayName || '');
    const [savingName, setSavingName] = useState(false);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const [cropperOpen, setCropperOpen] = useState(false);
    const [tempImage, setTempImage] = useState<string | null>(null);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const avatarInputRef = useRef<HTMLInputElement>(null);
    const passwordIconRef = useRef<AnimatedIconHandle>(null);
    const deleteIconRef = useRef<AnimatedIconHandle>(null);

    const handleSaveDisplayName = async () => {
        if (!editedName.trim()) {
            showToast('Tên không được để trống', 'error');
            return;
        }
        setSavingName(true);
        try {
            if (auth.currentUser) {
                await updateProfile(auth.currentUser, { displayName: editedName.trim() });
                showToast('Đã cập nhật tên hiển thị', 'success');
                setIsEditingName(false);
            }
        } catch (err) {
            console.error(err);
            showToast('Có lỗi xảy ra', 'error');
        }
        setSavingName(false);
    };

    const handleCancelEditName = () => {
        setEditedName(user?.displayName || '');
        setIsEditingName(false);
    };

    const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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

        if (avatarInputRef.current) avatarInputRef.current.value = '';
    };

    const handleCropComplete = async (croppedFile: File) => {
        setIsUploadingAvatar(true);
        try {
            const url = await dbService.uploadImage(croppedFile);
            if (auth.currentUser) {
                await updateProfile(auth.currentUser, { photoURL: url });
                saveUserInfo({
                    email: auth.currentUser.email!,
                    displayName: auth.currentUser.displayName || 'Người dùng',
                    photoURL: url
                });
                showToast('Đã cập nhật ảnh đại diện', 'success');
            }
        } catch (err) {
            console.error('Avatar upload error:', err);
            showToast('Không thể tải ảnh lên', 'error');
        } finally {
            setIsUploadingAvatar(false);
            setTempImage(null);
        }
    };



    return (
        <section>
            <div className={`flex items-center gap-2 mb-4 px-1 text-[var(--text-muted)] text-sm font-medium uppercase tracking-wider`}>
                <User size={16} />
                <span>Tài khoản</span>
            </div>
            
            <div className={`bg-[var(--bg-card)] rounded-lg border border-[var(--border-color)] overflow-hidden`}>
                <div className={`p-4 flex items-center gap-4 border-b border-[var(--border-color)]`}>
                    <div
                        onClick={() => !isUploadingAvatar && avatarInputRef.current?.click()}
                        className={`relative w-16 h-16 rounded-full overflow-hidden border-2 border-primary flex-shrink-0 cursor-pointer group`}
                    >
                        {user?.photoURL ? (
                            <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <img src="/avatar.png" alt="Avatar" className="w-full h-full object-cover" />
                        )}

                        {isUploadingAvatar && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <Loader2 size={20} className="text-white animate-spin" />
                            </div>
                        )}

                        {!isUploadingAvatar && (
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <Camera size={18} className="text-white" />
                            </div>
                        )}
                    </div>
                    <input
                        type="file"
                        ref={avatarInputRef}
                        onChange={handleAvatarUpload}
                        accept="image/*"
                        className="hidden"
                    />
                    <div className="flex-1 min-w-0">
                        {isEditingName ? (
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={editedName}
                                    onChange={(e) => setEditedName(e.target.value)}
                                    className={`flex-1 min-w-0 px-3 py-2 rounded-lg border border-[var(--border-color)] bg-transparent text-[var(--text-primary)] focus:outline-none focus:border-primary text-sm`}
                                    placeholder="Nhập tên hiển thị"
                                    autoFocus
                                />
                                <button
                                    onClick={handleSaveDisplayName}
                                    disabled={savingName}
                                    className="p-2 rounded-lg flex-shrink-0 bg-green-500/10 text-green-500 hover:bg-green-500/20 transition-colors"
                                >
                                    <Check size={18} />
                                </button>
                                <button
                                    onClick={handleCancelEditName}
                                    disabled={savingName}
                                    className="p-2 rounded-lg flex-shrink-0 bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <h3 className={`font-semibold text-[var(--text-primary)]`}>
                                    {user?.displayName || 'Người dùng'}
                                </h3>
                                <button
                                    onClick={() => setIsEditingName(true)}
                                    className={`p-1 rounded hover:bg-[var(--border-color)] text-[var(--text-muted)] transition-colors`}
                                >
                                    <Edit2 size={14} />
                                </button>
                            </div>
                        )}
                        <p className={`text-sm text-[var(--text-muted)]`}>{user?.email}</p>
                    </div>
                </div>

                <button
                    onClick={() => setShowPasswordModal(true)}
                    onMouseEnter={() => passwordIconRef.current?.startAnimation()}
                    onMouseLeave={() => passwordIconRef.current?.stopAnimation()}
                    className={`w-full flex items-center justify-between p-4 ${itemHover} transition-colors text-left border-b border-[var(--border-color)]`}
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                            <KeyIcon ref={passwordIconRef} size={20} />
                        </div>
                        <div>
                            <p className={`font-medium text-[var(--text-primary)]`}>Đổi mật khẩu</p>
                            <p className={`text-xs text-[var(--text-muted)]`}>Cập nhật mật khẩu đăng nhập</p>
                        </div>
                    </div>
                    <ChevronRight size={18} className="text-[var(--text-muted)]" />
                </button>

                <button
                    onClick={() => setShowDeleteModal(true)}
                    onMouseEnter={() => deleteIconRef.current?.startAnimation()}
                    onMouseLeave={() => deleteIconRef.current?.stopAnimation()}
                    className={`w-full flex items-center justify-between p-4 ${itemHover} transition-colors text-left group`}
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-red-500/10 text-red-500 group-hover:text-red-600">
                            <TrashIcon ref={deleteIconRef} size={20} />
                        </div>
                        <div>
                            <p className={`font-medium text-[var(--text-primary)] group-hover:text-red-600`}>Xóa tài khoản</p>
                            <p className={`text-xs text-[var(--text-muted)]`}>Xóa vĩnh viễn toàn bộ dữ liệu của bạn</p>
                        </div>
                    </div>
                    <ChevronRight size={18} className="text-[var(--text-muted)]" />
                </button>
            </div>

            <ChangePasswordModal
                isOpen={showPasswordModal}
                onClose={() => setShowPasswordModal(false)}
            />
            <DeleteAccountModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
            />
            
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
        </section>
    );
};

export default AccountSection;
