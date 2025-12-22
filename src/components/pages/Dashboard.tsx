import React, { useMemo, useState } from 'react';
import { Employee, Event, Shift, UserSettings } from '../../types';
import { PAYMENT_COLORS } from '../../constants/colors';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { CalendarRange, Users, Wallet2, TrendingUp, LogOut, Sun, Moon, Settings, FileDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useThemeStyles } from '../../hooks/useThemeStyles';
import { Modal } from '../ui/Modal';
import { Skeleton } from '../ui/Skeleton';
import Button from '../ui/Button';

interface DashboardProps {
    user: any;
    employees: Employee[];
    events: Event[];
    shifts: Shift[];
    settings: UserSettings;
    loading?: boolean;
    onLogout: () => void;
    onNavigateToSettings: () => void;
    onOpenExport: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, employees, events, shifts, settings, loading = false, onLogout, onNavigateToSettings, onOpenExport }) => {
    const { theme, toggleTheme } = useThemeStyles();
    const [logoutConfirm, setLogoutConfirm] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const currentMonth = selectedDate.getMonth();
    const currentYear = selectedDate.getFullYear();

    const handlePrevMonth = () => {
        setSelectedDate(new Date(currentYear, currentMonth - 1, 1));
    };

    const handleNextMonth = () => {
        setSelectedDate(new Date(currentYear, currentMonth + 1, 1));
    };

    // Tính toán thống kê chi tiết cho các stat cards
    const monthlyStats = useMemo(() => {
        const now = new Date();
        const statsMonth = now.getMonth();
        const statsYear = now.getFullYear();

        // Sự kiện
        const monthEvents = events.filter(e => {
            const d = new Date(e.date);
            return d.getMonth() === statsMonth && d.getFullYear() === statsYear;
        });
        const todayEvents = events.filter(e => {
            const d = new Date(e.date);
            const today = new Date();
            return d.getFullYear() === today.getFullYear() &&
                d.getMonth() === today.getMonth() &&
                d.getDate() === today.getDate();
        });
        const weekStartDate = new Date(now);
        weekStartDate.setDate(now.getDate() - now.getDay());
        const weekEndDate = new Date(weekStartDate);
        weekEndDate.setDate(weekStartDate.getDate() + 6);
        const weekEvents = monthEvents.filter(e => {
            const d = new Date(e.date);
            return d >= weekStartDate && d <= weekEndDate;
        });

        // Công
        const monthShifts = shifts.filter(s => {
            const d = new Date(s.date);
            return d.getMonth() === statsMonth && d.getFullYear() === statsYear;
        });
        const morningShifts = monthShifts.filter(s => s.session === 'morning');
        const afternoonShifts = monthShifts.filter(s => s.session === 'afternoon');

        const unpaidShifts = monthShifts.filter(s => s.status === 'unpaid');
        const paidShifts = monthShifts.filter(s => s.status === 'paid');
        const advancedShifts = monthShifts.filter(s => s.status === 'advanced');

        const unpaidAmount = unpaidShifts.reduce((sum, s) => sum + s.amount, 0);
        const advancedAmount = advancedShifts.reduce((sum, s) => sum + s.amount, 0);

        // Nhân viên - tính dựa trên shifts hiện có
        const activeEmployeeIds = new Set(shifts.map(s => s.employeeId));
        const activeEmployees = employees.filter(e => activeEmployeeIds.has(e.id));

        return {
            totalEvents: monthEvents.length,
            todayEvents: todayEvents.length,
            weekEvents: weekEvents.length,
            totalShifts: monthShifts.length,
            morningShifts: morningShifts.length,
            afternoonShifts: afternoonShifts.length,
            totalEmployees: employees.length,
            activeEmployees: activeEmployees.length,
            unpaidAmount,
            advancedAmount,
            totalEarned: unpaidAmount + advancedAmount,
            paidAmount: paidShifts.reduce((sum, s) => sum + s.amount, 0),
        };
    }, [events, shifts, employees]);

    // ... (chartData logic remains same) ...
    const chartData = useMemo(() => {
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const data = [];

        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayEvents = events.filter(e => e.date === dateStr).length;
            const dayShifts = shifts.filter(s => s.date === dateStr).length;

            if (dayEvents > 0 || dayShifts > 0) {
                data.push({
                    day: day,
                    events: dayEvents,
                    shifts: dayShifts,
                });
            }
        }
        return data;
    }, [events, shifts, currentMonth, currentYear]);

    const paymentData = useMemo(() => {
        const unpaid = shifts.filter(s => s.status === 'unpaid').length;
        const paid = shifts.filter(s => s.status === 'paid').length;
        const advanced = shifts.filter(s => s.status === 'advanced').length;
        return [
            { name: 'Đã thanh toán', value: paid, color: PAYMENT_COLORS.PAID },
            { name: 'Còn cần trả', value: unpaid, color: PAYMENT_COLORS.UNPAID },
            { name: 'Đã ứng tiền', value: advanced, color: PAYMENT_COLORS.ADVANCED },
        ].filter(d => d.value > 0);
    }, [shifts]);

    const monthName = new Intl.DateTimeFormat('vi-VN', { month: 'long', year: 'numeric' }).format(selectedDate);

    const {
        bgClass,
        borderClass,
        cardBgClass,
        textPrimaryClass,
        textSecondaryClass
    } = useThemeStyles();

    if (loading) {
        return (
            <div className={`pb-16 md:pb-0 md:ml-60 ${bgClass} min-h-screen`}>
                <div className={`p-4 md:p-6 border-b ${borderClass}`}>
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <Skeleton variant="circular" width={40} height={40} />
                            <div>
                                <Skeleton variant="text" width={60} height={16} className="mb-1" />
                                <Skeleton variant="text" width={120} height={20} />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="p-4 md:p-6 space-y-6">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className={`p-4 ${cardBgClass} border ${borderClass} rounded-lg h-24`}>
                                <div className="flex items-center gap-2 mb-2">
                                    <Skeleton variant="circular" width={16} height={16} />
                                    <Skeleton variant="text" width={80} height={12} />
                                </div>
                                <Skeleton variant="text" width={60} height={32} />
                            </div>
                        ))}
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className={`p-4 ${cardBgClass} border ${borderClass} rounded-lg h-[280px]`}>
                            <Skeleton variant="text" width={150} height={20} className="mb-4" />
                            <Skeleton variant="rectangular" width="100%" height={200} />
                        </div>
                        <div className={`p-4 ${cardBgClass} border ${borderClass} rounded-lg h-[280px]`}>
                            <Skeleton variant="text" width={150} height={20} className="mb-4" />
                            <Skeleton variant="rectangular" width="100%" height={200} />
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className={`pb-16 md:pb-0 md:ml-60 ${bgClass} min-h-screen`}>
            {/* Header section removed - moved to global TopBar */}
            {/* Greeting Header (Desktop) */}
            <div className={`hidden md:block p-6 border-b ${borderClass}`}>
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <img src="/avatar.png" alt="Avatar" className="w-10 h-10 rounded-full object-cover border-2 border-primary" />
                        <div>
                            <p className={`text-sm ${textSecondaryClass}`}>Xin chào,</p>
                            <h2 className={`text-lg font-semibold ${textPrimaryClass}`}>
                                {user?.displayName || user?.email?.split('@')[0] || 'Người dùng'}
                            </h2>
                        </div>
                    </div>
                    <Button
                        onClick={onOpenExport}
                        variant="success"
                        className="flex items-center gap-2"
                    >
                        <FileDown size={18} />
                        <span>Xuất báo cáo</span>
                    </Button>
                </div>
            </div>

            <div className="p-4 md:p-6 space-y-6">
                {/* Nút xuất báo cáo (Mobile) */}
                <div className="md:hidden">
                    <Button
                        onClick={onOpenExport}
                        variant="success"
                        fullWidth={true}
                        className="flex items-center justify-center gap-2"
                    >
                        <FileDown size={18} />
                        <span>Xuất báo cáo</span>
                    </Button>
                </div>

                {/* Thẻ thống kê */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* Sự kiện tháng này */}
                    <div className={`p-4 ${cardBgClass} border ${borderClass} rounded-lg`}>
                        <div className={`flex items-center gap-2 ${textSecondaryClass} mb-2`}>
                            <CalendarRange size={16} />
                            <span className="text-xs">Sự kiện tháng này</span>
                        </div>
                        <p className={`text-2xl font-bold ${textPrimaryClass} mb-3`}>{monthlyStats.totalEvents}</p>
                        <div className="pt-3 border-t border-slate-200 dark:border-slate-700 space-y-1 text-xs">
                            <div className="flex justify-between">
                                <span className={textSecondaryClass}>Hôm nay</span>
                                <span className={`font-medium ${textPrimaryClass}`}>{monthlyStats.todayEvents}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className={textSecondaryClass}>Tuần này</span>
                                <span className={`font-medium ${textPrimaryClass}`}>{monthlyStats.weekEvents}</span>
                            </div>
                        </div>
                    </div>

                    {/* Tổng công */}
                    <div className={`p-4 ${cardBgClass} border ${borderClass} rounded-lg`}>
                        <div className={`flex items-center gap-2 ${textSecondaryClass} mb-2`}>
                            <TrendingUp size={16} />
                            <span className="text-xs">Tổng công</span>
                        </div>
                        <p className={`text-2xl font-bold ${textPrimaryClass} mb-3`}>{monthlyStats.totalShifts}</p>
                        <div className="pt-3 border-t border-slate-200 dark:border-slate-700 space-y-1 text-xs">
                            <div className="flex justify-between">
                                <span className={textSecondaryClass}>Sáng</span>
                                <span className={`font-medium ${textPrimaryClass}`}>{monthlyStats.morningShifts}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className={textSecondaryClass}>Chiều</span>
                                <span className={`font-medium ${textPrimaryClass}`}>{monthlyStats.afternoonShifts}</span>
                            </div>
                        </div>
                    </div>

                    {/* Nhân viên */}
                    <div className={`p-4 ${cardBgClass} border ${borderClass} rounded-lg`}>
                        <div className={`flex items-center gap-2 ${textSecondaryClass} mb-2`}>
                            <Users size={16} />
                            <span className="text-xs">Nhân viên</span>
                        </div>
                        <p className={`text-2xl font-bold ${textPrimaryClass} mb-3`}>{monthlyStats.totalEmployees}</p>
                        <div className="pt-3 border-t border-slate-200 dark:border-slate-700 space-y-1 text-xs">
                            <div className="flex justify-between">
                                <span className={textSecondaryClass}>Đã làm</span>
                                <span className={`font-medium ${textPrimaryClass}`}>{monthlyStats.activeEmployees}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className={textSecondaryClass}>Chưa làm</span>
                                <span className={`font-medium ${textPrimaryClass}`}>{monthlyStats.totalEmployees - monthlyStats.activeEmployees}</span>
                            </div>
                        </div>
                    </div>

                    <div className={`p-4 ${cardBgClass} border ${borderClass} rounded-lg`}>
                        <div className="flex items-center gap-2 text-primary mb-2">
                            <Wallet2 size={16} />
                            <span className="text-xs">Còn cần trả</span>
                        </div>
                        <p className="text-2xl font-bold text-primary">
                            {monthlyStats.unpaidAmount.toLocaleString('vi-VN')}đ
                        </p>
                        {monthlyStats.advancedAmount > 0 && (
                            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 space-y-1 text-xs">
                                <div className="flex justify-between">
                                    <span className={textSecondaryClass}>Tổng đã làm:</span>
                                    <span className="font-medium text-blue-500">
                                        {monthlyStats.totalEarned.toLocaleString('vi-VN')}đ
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className={textSecondaryClass}>Đã ứng:</span>
                                    <span className="font-medium text-orange-500">
                                        {monthlyStats.advancedAmount.toLocaleString('vi-VN')}đ
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Biểu đồ */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Biểu đồ cột */}
                    <div className={`p-4 ${cardBgClass} border ${borderClass} rounded-lg`}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className={`text-sm font-medium ${textPrimaryClass}`}>
                                Hoạt động
                            </h3>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handlePrevMonth}
                                    className={`p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 ${textSecondaryClass}`}
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                <span className={`text-sm font-medium ${textPrimaryClass} min-w-[120px] text-center capitalize`}>
                                    {monthName}
                                </span>
                                <button
                                    onClick={handleNextMonth}
                                    className={`p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 ${textSecondaryClass}`}
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                        {chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={chartData}>
                                    <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff',
                                            border: `1px solid ${theme === 'dark' ? '#334155' : '#e2e8f0'}`,
                                            borderRadius: 8
                                        }}
                                        labelStyle={{ color: '#94a3b8' }}
                                    />
                                    <Bar dataKey="events" name="Sự kiện" fill={PAYMENT_COLORS.SUCCESS} radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="shifts" name="Công" fill={PAYMENT_COLORS.INFO} radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className={`h-[200px] flex items-center justify-center ${textSecondaryClass} text-sm`}>
                                Chưa có dữ liệu
                            </div>
                        )}
                    </div>

                    {/* Biểu đồ tròn */}
                    <div className={`p-4 ${cardBgClass} border ${borderClass} rounded-lg`}>
                        <h3 className={`text-sm font-medium ${textPrimaryClass} mb-4`}>Trạng thái thanh toán</h3>
                        {paymentData.length > 0 ? (
                            <div className="flex items-center justify-center gap-6">
                                <ResponsiveContainer width={150} height={150}>
                                    <PieChart>
                                        <Pie
                                            data={paymentData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={40}
                                            outerRadius={60}
                                            dataKey="value"
                                        >
                                            {paymentData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="space-y-2">
                                    {paymentData.map((item, index) => (
                                        <div key={index} className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                                            <span className={`text-xs ${textSecondaryClass}`}>{item.name}: {item.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className={`h-[150px] flex items-center justify-center ${textSecondaryClass} text-sm`}>
                                Chưa có dữ liệu
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div >
    );
};

export default Dashboard;
