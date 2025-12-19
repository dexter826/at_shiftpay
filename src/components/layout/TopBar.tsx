import React from 'react';
import { Settings, LogOut } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface TopBarProps {
    user: any;
    onNavigateToSettings: () => void;
    onLogout: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ user, onNavigateToSettings, onLogout }) => {
    const { theme } = useTheme();

    const bgClass = theme === 'dark' ? 'bg-slate-900' : 'bg-slate-50';
    const borderClass = theme === 'dark' ? 'border-slate-800' : 'border-slate-200';
    const textPrimaryClass = theme === 'dark' ? 'text-slate-100' : 'text-slate-800';
    const textSecondaryClass = theme === 'dark' ? 'text-slate-400' : 'text-slate-500';

    return (
        <div className={`md:hidden sticky top-0 z-40 px-4 py-3 ${bgClass} border-b ${borderClass} flex justify-between items-center`}>
            <div className="flex items-center gap-3">
                <img
                    src="/avatar.png"
                    alt="Avatar"
                    className="w-10 h-10 rounded-full object-cover border-2 border-[#ecb52d]"
                    onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=User&background=ecb52d&color=fff';
                    }}
                />
                <div>
                    <p className={`text-xs ${textSecondaryClass}`}>Xin chào,</p>
                    <h2 className={`text-sm font-bold ${textPrimaryClass} truncate max-w-[120px]`}>
                        {user?.displayName || 'Người dùng'}
                    </h2>
                </div>
            </div>

            <div className="flex items-center gap-1">
                <button
                    onClick={onNavigateToSettings}
                    className={`p-2 ${textSecondaryClass} hover:text-[#ecb52d] transition-colors`}
                >
                    <Settings size={20} />
                </button>
                <button
                    onClick={onLogout}
                    className={`p-2 text-red-500 hover:text-red-600 transition-colors`}
                >
                    <LogOut size={20} />
                </button>
            </div>
        </div>
    );
};
