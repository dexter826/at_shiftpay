import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { UserSettings } from '../../types';
import { dbService } from '../../services/firebase';
import { useToast } from '../ui/Toast';
import Button from '../ui/Button';
import { TimePicker } from '../ui/TimePicker';
import { ChangePasswordModal } from '../auth/ChangePasswordModal';
import {
    User,
    Settings as SettingsIcon,
    Briefcase,
    Moon,
    Sun,
    KeyRound,
    LogOut,
    ChevronRight,
    Save
} from 'lucide-react';

interface SettingsViewProps {
    user: any;
    settings: UserSettings;
    onLogout: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ user, settings, onLogout }) => {
    const { theme, toggleTheme } = useTheme();
    const { showToast } = useToast();

    const [editSettings, setEditSettings] = useState<UserSettings>(settings);
    const [saving, setSaving] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    // Helper to check for changes
    const handleChange = (key: keyof UserSettings, value: any) => {
        const newSettings = { ...editSettings, [key]: value };
        setEditSettings(newSettings);
        setHasChanges(true); // Simple dirty check
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

    // Styles
    const bgClass = theme === 'dark' ? 'bg-slate-900' : 'bg-slate-50';
    const cardBg = theme === 'dark' ? 'bg-slate-800' : 'bg-white';
    const textMain = theme === 'dark' ? 'text-slate-200' : 'text-slate-800';
    const textSub = theme === 'dark' ? 'text-slate-400' : 'text-slate-500';
    const border = theme === 'dark' ? 'border-slate-700' : 'border-slate-200';
    const itemHover = theme === 'dark' ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50';

    const SectionTitle = ({ icon: Icon, title }: { icon: any, title: string }) => (
        <div className={`flex items-center gap-2 mb-4 px-1 ${textSub} text-sm font-medium uppercase tracking-wider`}>
            <Icon size={16} />
            <span>{title}</span>
        </div>
    );

    return (
        <div className={`pb-20 md:pb-0 md:ml-60 ${bgClass} min-h-screen`}>
            <div className="max-w-3xl lg:max-w-5xl mx-auto p-4 md:p-6 space-y-5">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <h1 className={`text-2xl font-bold ${textMain}`}>Cài đặt</h1>
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
                </div>

                {/* Single column layout */}
                <div className="space-y-5">
                    {/* Profile Section */}
                    <section>
                        <SectionTitle icon={User} title="Tài khoản" />
                        <div className={`${cardBg} rounded-xl border ${border} overflow-hidden`}>
                            <div className={`p-4 flex items-center gap-4 border-b ${border}`}>
                                <img src="/avatar.png" alt="Avatar" className="w-14 h-14 rounded-full object-cover border-2 border-[#ecb52d]" />
                                <div>
                                    <h3 className={`font-semibold ${textMain}`}>
                                        {user?.displayName || 'Người dùng'}
                                    </h3>
                                    <p className={`text-sm ${textSub}`}>{user?.email}</p>
                                </div>
                            </div>

                            <button
                                onClick={() => setShowPasswordModal(true)}
                                className={`w-full flex items-center justify-between p-4 ${itemHover} transition-colors text-left`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
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

                    {/* Work Config Section */}
                    <section>
                        <SectionTitle icon={Briefcase} title="Cấu hình công việc" />
                        <div className={`${cardBg} rounded-xl border ${border}`}>
                            {/* Shift Rate */}
                            <div className={`p-4 border-b ${border}`}>
                                <div className="flex items-center justify-between mb-2">
                                    <label className={`font-medium ${textMain}`}>Mức lương / ca</label>
                                    <span className={`text-xs ${textSub} px-2 py-1 rounded ${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-100'}`}>VNĐ</span>
                                </div>
                                <input
                                    type="number"
                                    value={editSettings.shiftRate}
                                    onChange={(e) => handleChange('shiftRate', Number(e.target.value))}
                                    className={`w-full p-3 rounded-lg border ${border} bg-transparent ${textMain} focus:outline-none focus:border-[#ecb52d] transition-colors`}
                                />
                                <p className={`text-xs ${textSub} mt-2`}>Áp dụng cho các ca làm việc mới</p>
                            </div>

                            {/* Shift Times */}
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

                    {/* Danger Zone - Moved to bottom */}
                    <section>
                        <div className={`${cardBg} rounded-xl border ${theme === 'dark' ? 'border-red-900/30' : 'border-red-200'} overflow-hidden`}>
                            <button
                                onClick={onLogout}
                                className={`w-full flex items-center justify-between p-4 ${theme === 'dark' ? 'hover:bg-red-900/10' : 'hover:bg-red-50'} transition-colors text-left group`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-red-900/20' : 'bg-red-100'} text-red-500 group-hover:text-red-600`}>
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
