import React from 'react';
import { useThemeStyles } from '../../hooks/useThemeStyles';
import { UserSettings } from '../../types';
import Switch from '../ui/Switch';
import LogoutIcon from '../ui/icons/logout-icon';
import { AnimatedIconHandle } from '../ui/icons/types';
import AccountSection from './settings/AccountSection';
import WorkConfigSection from './settings/WorkConfigSection';

interface SettingsViewProps {
    user: any;
    settings: UserSettings;
    onLogout: () => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ user, settings, onLogout }) => {
    const {
        bgClass,
        textPrimaryClass,
        borderClass,
        cardBgClass,
        hoverBgClass
    } = useThemeStyles();

    const logoutIconRef = React.useRef<AnimatedIconHandle>(null);

    return (
        <div className={`pb-24 md:pb-0 ${bgClass} min-h-screen`}>
            {/* Header Section */}
            <div className={`py-4 px-4 md:px-6 border-b ${borderClass}`}>
                <div className="flex items-center justify-between">
                    <h1 className={`text-lg font-semibold ${textPrimaryClass}`}>Cài đặt</h1>
                    <div className="flex items-center gap-3">
                        <Switch />
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className={`px-4 pt-5 pb-4 md:px-6 md:pt-6 md:pb-6 space-y-5`}>
                <div className="space-y-5">
                    {/* Account Section */}
                    <AccountSection user={user} />

                    {/* Work Config Section */}
                    {user?.uid && (
                         <WorkConfigSection userUid={user.uid} settings={settings} />
                    )}

                    {/* Danger Zone */}
                    <section>
                        <div className={`${cardBgClass} rounded-xl border border-red-500/20 overflow-hidden`}>
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
        </div>
    );
};

export default SettingsView;

