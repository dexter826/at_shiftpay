import React, { useState } from 'react';
import { useThemeStyles } from '../../hooks/useThemeStyles';
import { UserSettings } from '../../types';
import { dbService } from '../../services';
import { useToast } from '../ui/Toast';
import Button from '../ui/Button';
import { TimePicker } from '../ui/TimePicker';
import { ChangePasswordModal } from '../auth/ChangePasswordModal';
import Switch from '../ui/Switch';
import { auth } from '../../firebase';
import { updateProfile } from 'firebase/auth';
import {
    User,
    Briefcase,
    KeyRound,
    LogOut,
    ChevronRight,
    Save,
    Edit2,
    Check,
    X
} from 'lucide-react';

interface SettingsViewProps {
    user: any;
    settings: UserSettings;
    onLogout: () => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ user, settings, onLogout }) => {
    const { theme } = useThemeStyles();
    const { showToast } = useToast();

    const [editSettings, setEditSettings] = useState<UserSettings>(settings);
    const [saving, setSaving] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [isEditingName, setIsEditingName] = useState(false);
    const [editedName, setEditedName] = useState(user?.displayName || '');
    const [savingName, setSavingName] = useState(false);

    // Xử lý thay đổi cài đặt
    const handleChange = (key: keyof UserSettings, value: any) => {
        const newSettings = { ...editSettings, [key]: value };
        setEditSettings(newSettings);
        setHasChanges(true);
    };

    const handleSaveSettings = async () => {
        setSaving(true);
        try {
            await dbService.updateSettings(editSettings);
            showToast('Đã lưu cài đặt', 'success');
            setHasChanges(false);
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
        <div className={`pb-20 md:pb-0 ${bgClass} min-h-screen`}>
            <div className="max-w-3xl lg:max-w-5xl mx-auto p-4 md:p-6 space-y-5">

                {/* Tiêu đề trang */}
                <div className="flex items-center justify-between">
                    <h1 className={`text-2xl font-bold ${textMain}`}>Cài đặt</h1>
                    <div className="flex items-center gap-3">
                        {hasChanges && (
                            <Button
                                onClick={handleSaveSettings}
                                disabled={saving}
                                className=""
                            >
                                <Save size={18} className="text-white" />
                                <span className="text-white">{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</span>
                            </Button>
                        )}
                        <Switch />
                    </div>
                </div>

                {/* Danh sách cài đặt */}
                <div className="space-y-5">
                    {/* Thông tin tài khoản */}
                    <section>
                        <SectionTitle icon={User} title="Tài khoản" />
                        <div className={`${cardBg} rounded-xl border ${border} overflow-hidden`}>
                            <div className={`p-4 flex items-center gap-4 border-b ${border}`}>
                                <img src="/avatar.png" alt="Avatar" className="w-14 h-14 rounded-full object-cover border-2 border-primary flex-shrink-0" />
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
                                className={`w-full flex items-center justify-between p-4 ${itemHover} transition-colors text-left`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                        <KeyRound size={20} />
                                    </div>
                                    <div>
                                        <p className={`font-medium ${textMain}`}>Đổi mật khẩu</p>
                                        <p className={`text-xs ${textSub}`}>Cập nhật mật khẩu đăng nhập</p>
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
                            {/* Mức lương */}
                            <div className={`p-4 border-b ${border}`}>
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

                            {/* Giờ trực */}
                            <div className="grid grid-cols-1 sm:grid-cols-2">
                                <div className={`p-4 border-b sm:border-b-0 sm:border-r ${border}`}>
                                    <label className={`block font-medium ${textMain} mb-3`}>Giờ bắt đầu ca sáng</label>
                                    <TimePicker
                                        value={editSettings.morningTime}
                                        onChange={(v) => handleChange('morningTime', v)}
                                    />
                                </div>
                                <div className="p-4">
                                    <label className={`block font-medium ${textMain} mb-3`}>Giờ bắt đầu ca chiều</label>
                                    <TimePicker
                                        value={editSettings.afternoonTime}
                                        onChange={(v) => handleChange('afternoonTime', v)}
                                    />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Khu vực nguy hiểm */}
                    <section>
                        <div className={`${cardBg} rounded-xl border border-red-500/20 overflow-hidden`}>
                            <button
                                onClick={onLogout}
                                className="w-full flex items-center justify-between p-4 hover:bg-red-500/5 transition-colors text-left group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-red-500/10 text-red-500 group-hover:text-red-600">
                                        <LogOut size={20} />
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
        </div>
    );
};

export default SettingsView;
