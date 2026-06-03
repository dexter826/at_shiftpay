import React from 'react';
import { UserSettings } from '../../types';
import Switch from '../ui/Switch';
import { LogOut, Sun, Moon } from 'lucide-react';
import { useThemeStore } from '../../stores';
import AccountSection from './settings/AccountSection';
import WorkConfigSection from './settings/WorkConfigSection';

interface SettingsViewProps {
    user: any;
    settings: UserSettings;
    onLogout: () => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ user, settings, onLogout }) => {
    const { theme } = useThemeStore();

    return (
        <div className="pb-28 md:pb-0 bg-[var(--bg-primary)] min-h-dynamic">
            <div className="p-4 md:p-6 space-y-4">
                <AccountSection user={user} />

                {user?.uid && <WorkConfigSection userUid={user.uid} settings={settings} />}

                <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg overflow-hidden">
                    <div className="flex items-center justify-between p-3.5">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 flex items-center justify-center rounded-md bg-[var(--border-color)] text-[var(--text-secondary)]">
                                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                            </div>
                            <div>
                                <p className="text-sm font-medium text-[var(--text-primary)]">Giao diện</p>
                                <p className="text-[11px] text-[var(--text-muted)]">
                                    {theme === 'dark' ? 'Chế độ tối' : 'Chế độ sáng'}
                                </p>
                            </div>
                        </div>
                        <Switch />
                    </div>
                </div>

                <div className="bg-[var(--bg-card)] border border-red-500/20 rounded-lg overflow-hidden">
                    <button onClick={onLogout} className="w-full flex items-center gap-3 p-3.5 hover:bg-red-500/5 transition-colors text-left">
                        <div className="w-8 h-8 flex items-center justify-center rounded-md bg-red-500/10 text-red-500">
                            <LogOut size={16} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-red-500">Đăng xuất</p>
                            <p className="text-[11px] text-red-400/70">Kết thúc phiên làm việc</p>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsView;
