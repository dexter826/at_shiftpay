import React, { memo, useRef } from 'react';
import { CalendarIcon as LucideCalendar, TrendingUp, Users, Wallet2 } from 'lucide-react';
import CalendarIcon from '../../ui/icons/calendar-icon'; // Custom animated icon
import { AnimatedIconHandle } from '../../ui/icons/types';
import { useThemeStyles } from '../../../hooks/useThemeStyles';

interface DashboardStatsProps {
    stats: {
        totalEvents: number;
        todayEvents: number;
        weekEvents: number;
        totalShifts: number;
        morningShifts: number;
        afternoonShifts: number;
        totalEmployees: number;
        activeEmployees: number;
        totalEarned: number;
        advancedAmount: number;
        unpaidAmount: number;
    };
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ stats }) => {
    const {
        theme,
        borderClass,
        textPrimaryClass,
        textSecondaryClass
    } = useThemeStyles();

    const calendarRef = useRef<AnimatedIconHandle>(null);

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 min-h-[260px] md:min-h-[130px]">
            {/* Tổng sự kiện */}
            <div
                className={`p-4 ${theme === 'dark' ? 'bg-gradient-to-br from-slate-800 to-slate-900' : 'bg-gradient-to-br from-blue-50 to-white'} border ${borderClass} rounded-2xl group/cal`}
                onMouseEnter={() => calendarRef.current?.startAnimation()}
                onMouseLeave={() => calendarRef.current?.stopAnimation()}
            >
                <div className={`flex items-center gap-2 ${textSecondaryClass} mb-2`}>
                    <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                        <CalendarIcon ref={calendarRef} size={16} />
                    </div>
                    <span className="text-xs font-medium uppercase tracking-wider">Tổng sự kiện</span>
                </div>
                <p className={`text-2xl font-bold ${textPrimaryClass} mb-3 truncate`}>{stats?.totalEvents || 0}</p>
                <div className={`pt-3 border-t ${borderClass} space-y-1 text-xs`}>
                    <div className="flex justify-between">
                        <span className={textSecondaryClass}>Hôm nay</span>
                        <span className={`font-semibold ${textPrimaryClass}`}>{stats?.todayEvents || 0}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className={textSecondaryClass}>Tuần này</span>
                        <span className={`font-semibold ${textPrimaryClass}`}>{stats?.weekEvents || 0}</span>
                    </div>
                </div>
            </div>

            {/* Tổng công */}
            <div
                className={`p-4 ${theme === 'dark' ? 'bg-gradient-to-br from-slate-800 to-slate-900' : 'bg-gradient-to-br from-emerald-50 to-white'} border ${borderClass} rounded-2xl`}
            >
                <div className={`flex items-center gap-2 ${textSecondaryClass} mb-2`}>
                    <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500">
                        <TrendingUp size={16} />
                    </div>
                    <span className="text-xs font-medium uppercase tracking-wider">Tổng công</span>
                </div>
                <p className={`text-2xl font-bold ${textPrimaryClass} mb-3 truncate`}>{stats?.totalShifts || 0}</p>
                <div className={`pt-3 border-t ${borderClass} space-y-1 text-xs`}>
                    <div className="flex justify-between">
                        <span className={textSecondaryClass}>Sáng</span>
                        <span className={`font-semibold ${textPrimaryClass}`}>{stats?.morningShifts || 0}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className={textSecondaryClass}>Chiều</span>
                        <span className={`font-semibold ${textPrimaryClass}`}>{stats?.afternoonShifts || 0}</span>
                    </div>
                </div>
            </div>

            {/* Tổng nhân viên */}
            <div
                className={`p-4 ${theme === 'dark' ? 'bg-gradient-to-br from-slate-800 to-slate-900' : 'bg-gradient-to-br from-orange-50 to-white'} border ${borderClass} rounded-2xl`}
            >
                <div className={`flex items-center gap-2 ${textSecondaryClass} mb-2`}>
                    <div className="p-2 bg-orange-500/10 rounded-lg text-orange-500">
                        <Users size={16} />
                    </div>
                    <span className="text-xs font-medium uppercase tracking-wider">Tổng nhân viên</span>
                </div>
                <p className={`text-2xl font-bold ${textPrimaryClass} mb-3 truncate`}>{stats?.totalEmployees || 0}</p>
                <div className={`pt-3 border-t ${borderClass} space-y-1 text-xs`}>
                    <div className="flex justify-between">
                        <span className={textSecondaryClass}>Đã làm</span>
                        <span className={`font-semibold ${textPrimaryClass}`}>{stats?.activeEmployees || 0}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className={textSecondaryClass}>Chưa làm</span>
                        <span className={`font-semibold ${textPrimaryClass}`}>{(stats?.totalEmployees || 0) - (stats?.activeEmployees || 0)}</span>
                    </div>
                </div>
            </div>

            {/* Tổng lương */}
            <div
                className={`p-4 ${theme === 'dark' ? 'bg-gradient-to-br from-slate-800 to-slate-900' : 'bg-gradient-to-br from-amber-50 to-white'} border ${borderClass} rounded-2xl`}
            >
                <div className={`flex items-center gap-2 ${textSecondaryClass} mb-2`}>
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        <Wallet2 size={16} />
                    </div>
                    <span className="text-xs font-medium uppercase tracking-wider">Tổng lương</span>
                </div>
                <p className="text-2xl font-bold text-primary mb-3 truncate">
                    {(stats?.totalEarned || 0).toLocaleString('vi-VN')}đ
                </p>
                <div className={`pt-3 border-t ${borderClass} space-y-1 text-xs`}>
                    <div className="flex justify-between">
                        <span className={textSecondaryClass}>Đã ứng</span>
                        <span className="font-semibold text-orange-500">
                            {(stats?.advancedAmount || 0).toLocaleString('vi-VN')}đ
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className={textSecondaryClass}>Cần trả</span>
                        <span className="font-semibold text-blue-500">
                            {(stats?.unpaidAmount || 0).toLocaleString('vi-VN')}đ
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default memo(DashboardStats);
