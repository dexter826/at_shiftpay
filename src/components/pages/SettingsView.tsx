import React, { useState, useRef, useEffect } from 'react';
import { useThemeStyles } from '../../hooks/useThemeStyles';
import { motion, AnimatePresence } from 'framer-motion';
import { UserSettings } from '../../types';
import { dbService } from '../../services';
import { useToast } from '../ui/Toast';
import Button from '../ui/Button';
import { TimePicker } from '../ui/TimePicker';
import { ChangePasswordModal } from '../auth/ChangePasswordModal';
import { DeleteAccountModal } from '../modals/DeleteAccountModal';
import Switch from '../ui/Switch';
import { auth } from '../../firebase';
import { updateProfile } from 'firebase/auth';
import { useAuthStore } from '../../stores/authStore';
import { ImageCropperModal } from '../modals/ImageCropperModal';
import {
    User,
    Briefcase,
    LogOut,
    ChevronRight,
    Save,
    Edit2,
    Check,
    X,
    Upload,
    Camera,
    Loader2,
    Trash2,
    AlertTriangle
} from 'lucide-react';
import KeyIcon from '../ui/icons/key-icon';
import LogoutIcon from '../ui/icons/logout-icon';
import PenIcon from '../ui/icons/pen-icon';
import TrashIcon from '../ui/icons/trash-icon';
import { AnimatedIconHandle } from '../ui/icons/types';

interface SettingsViewProps {
    user: any;
    settings: UserSettings;
    onLogout: () => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ user, settings, onLogout }) => {
    const { theme } = useThemeStyles();
    const { showToast } = useToast();
    const saveUserInfo = useAuthStore(state => state.saveUserInfo);

    const [editSettings, setEditSettings] = useState<UserSettings>(settings);
    const [saving, setSaving] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isEditingName, setIsEditingName] = useState(false);
    const [editedName, setEditedName] = useState(user?.displayName || '');
    const [savingName, setSavingName] = useState(false);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const [cropperOpen, setCropperOpen] = useState(false);
    const [tempImage, setTempImage] = useState<string | null>(null);
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const logoutIconRef = useRef<AnimatedIconHandle>(null);
    const editNameIconRef = useRef<AnimatedIconHandle>(null);
    const deleteIconRef = useRef<AnimatedIconHandle>(null);
    const passwordIconRef = useRef<AnimatedIconHandle>(null);

    useEffect(() => {
        setEditSettings(settings);
    }, [settings]);

    const hasChanges = JSON.stringify(editSettings) !== JSON.stringify(settings);

    // Xử lý thay đổi cài đặt
    const handleChange = (key: keyof UserSettings, value: any) => {
        setEditSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleCancelSettings = () => {
        setEditSettings(settings);
    };

    const handleSaveSettings = async () => {
        setSaving(true);
        try {
            await dbService.updateSettings(user.uid, editSettings);
            showToast('Đã lưu cài đặt', 'success');
        } catch (err) {
            console.error(err);
            showToast('Có lỗi xảy ra', 'error');
        }
        setSaving(false);
    };

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

        // Reset input để có thể chọn lại cùng 1 file
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

    const {
        bgClass,
        cardBgClass: cardBg,
        textPrimaryClass: textMain,
        textMutedClass: textSub,
        borderClass: border,
        hoverBgClass,
        highlightBgClass
    } = useThemeStyles();

    const itemHover = hoverBgClass;

    const SectionTitle = ({ icon: Icon, title }: { icon: any, title: string }) => (
        <div className={`flex items-center gap-2 mb-4 px-1 ${textSub} text-sm font-medium uppercase tracking-wider`}>
            <Icon size={16} />
            <span>{title}</span>
        </div>
    );

    return (
        <div className={`pb-24 md:pb-0 ${bgClass} min-h-screen`}>
                {/* Header Section */}
                <div className={`py-4 px-4 md:px-6 border-b ${border}`}>
                    <div className="flex items-center justify-between">
                        <h1 className={`text-lg font-semibold ${textMain}`}>Cài đặt</h1>
                        <div className="flex items-center gap-3">
                            <Switch />
                        </div>
                    </div>
                </div>

                {/* Content Section */}
                <div className={`px-4 pt-5 pb-4 md:px-6 md:pt-6 md:pb-6 space-y-5`}>

                {/* Danh sách cài đặt */}
                <div className="space-y-5">
                    {/* Thông tin tài khoản */}
                    <section>
                        <SectionTitle icon={User} title="Tài khoản" />
                        <div className={`${cardBg} rounded-xl border ${border} overflow-hidden`}>
                            <div className={`p-4 flex items-center gap-4 border-b ${border}`}>
                                <div
                                    onClick={() => !isUploadingAvatar && avatarInputRef.current?.click()}
                                    className={`relative w-16 h-16 rounded-full overflow-hidden border-2 border-primary flex-shrink-0 cursor-pointer group`}
                                >
                                    {user?.photoURL ? (
                                        <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <img src="/avatar.png" alt="Avatar" className="w-full h-full object-cover" />
                                    )}

                                    {/* Overlay loading */}
                                    {isUploadingAvatar && (
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                            <Loader2 size={20} className="text-white animate-spin" />
                                        </div>
                                    )}

                                    {/* Overlay hover */}
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
                                                className={`flex-1 min-w-0 px-3 py-2 rounded-lg border ${border} bg-transparent ${textMain} focus:outline-none focus:border-primary text-sm`}
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
                                            <h3 className={`font-semibold ${textMain}`}>
                                                {user?.displayName || 'Người dùng'}
                                            </h3>
                                            <button
                                                onClick={() => setIsEditingName(true)}
                                                className={`p-1 rounded ${hoverBgClass} ${textSub} transition-colors`}
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                        </div>
                                    )}
                                    <p className={`text-sm ${textSub}`}>{user?.email}</p>
                                </div>
                            </div>

                            <button
                                onClick={() => setShowPasswordModal(true)}
                                onMouseEnter={() => passwordIconRef.current?.startAnimation()}
                                onMouseLeave={() => passwordIconRef.current?.stopAnimation()}
                                className={`w-full flex items-center justify-between p-4 ${itemHover} transition-colors text-left border-b ${border}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                        <KeyIcon ref={passwordIconRef} size={20} />
                                    </div>
                                    <div>
                                        <p className={`font-medium ${textMain}`}>Đổi mật khẩu</p>
                                        <p className={`text-xs ${textSub}`}>Cập nhật mật khẩu đăng nhập</p>
                                    </div>
                                </div>
                                <ChevronRight size={18} className={textSub} />
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
                                        <p className={`font-medium ${textMain} group-hover:text-red-600`}>Xóa tài khoản</p>
                                        <p className={`text-xs ${textSub}`}>Xóa vĩnh viễn toàn bộ dữ liệu của bạn</p>
                                    </div>
                                </div>
                                <ChevronRight size={18} className={textSub} />
                            </button>
                        </div>
                    </section>

                    {/* Cấu hình công việc */}
                    <section>
                        <SectionTitle icon={Briefcase} title="Cấu hình công việc" />
                        <div className={`${cardBg} rounded-xl border ${border}`}>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                                {/* Mức lương */}
                                <div className={`p-4 border-b sm:border-r lg:border-b-0 ${border}`}>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className={`font-medium ${textMain}`}>Mức lương / ca</label>
                                        <span className={`text-xs ${textSub} px-2 py-1 rounded ${highlightBgClass}`}>VNĐ</span>
                                    </div>
                                    <input
                                        type="number"
                                        value={editSettings.shiftRate}
                                        onChange={(e) => handleChange('shiftRate', Number(e.target.value))}
                                        className={`w-full p-3 rounded-lg border ${border} bg-transparent ${textMain} focus:outline-none focus:border-primary transition-colors`}
                                    />
                                    <p className={`text-xs ${textSub} mt-2`}>Áp dụng cho các ca làm việc mới</p>
                                </div>

                                {/* Giờ trực - Sáng */}
                                <div className={`p-4 border-b lg:border-r lg:border-b-0 ${border}`}>
                                    <label className={`block font-medium ${textMain} mb-3`}>Giờ bắt đầu ca sáng</label>
                                    <TimePicker
                                        value={editSettings.morningTime}
                                        onChange={(v) => handleChange('morningTime', v)}
                                    />
                                </div>

                                {/* Giờ trực - Chiều */}
                                <div className="p-4">
                                    <label className={`block font-medium ${textMain} mb-3`}>Giờ bắt đầu ca chiều</label>
                                    <TimePicker
                                        value={editSettings.afternoonTime}
                                        onChange={(v) => handleChange('afternoonTime', v)}
                                    />
                                </div>
                            </div>

                            {/* Nút thao tác khi có thay đổi */}
                            <AnimatePresence>
                                {hasChanges && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className={`p-4 border-t ${border} flex items-center justify-end gap-3`}>
                                            <Button
                                                onClick={handleCancelSettings}
                                                disabled={saving}
                                                variant="outline"
                                            >
                                                Hủy
                                            </Button>
                                            <Button
                                                onClick={handleSaveSettings}
                                                disabled={saving}
                                            >
                                                {saving ? (
                                                    <Loader2 size={16} className="animate-spin mr-2" />
                                                ) : (
                                                    <Save size={16} className="mr-2" />
                                                )}
                                                {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                                            </Button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </section>

                    {/* Khu vực nguy hiểm */}
                    <section>
                        <div className={`${cardBg} rounded-xl border border-red-500/20 overflow-hidden`}>
                            <button
                                onClick={onLogout}
                                onMouseEnter={() => logoutIconRef.current?.startAnimation()}
                                onMouseLeave={() => logoutIconRef.current?.stopAnimation()}
                                className="w-full flex items-center justify-between p-4 hover:bg-red-500/5 transition-colors text-left group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-red-500/10 text-red-500 group-hover:text-red-600">
                                        <LogoutIcon ref={logoutIconRef} size={20} />
                                    </div>
                                    <div>
                                        <p className="font-medium text-red-500 group-hover:text-red-600">Đăng xuất</p>
                                        <p className="text-xs text-red-400/70">Kết thúc phiên làm việc hiện tại</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </section>
                </div>

            </div>

            <ChangePasswordModal
                isOpen={showPasswordModal}
                onClose={() => setShowPasswordModal(false)}
            />
            <DeleteAccountModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
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

export default SettingsView;
