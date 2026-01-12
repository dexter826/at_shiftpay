import React, { useMemo, useState, memo } from 'react';
import { Employee, Event, Shift, UserSettings } from '../../types';
import { PAYMENT_COLORS } from '../../constants/colors';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { CalendarRange, Users, Wallet2, TrendingUp, TrendingDown, LogOut, Sun, Moon, Settings, FileDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useThemeStyles } from '../../hooks/useThemeStyles';
import { Modal } from '../ui/Modal';
import { Skeleton } from '../ui/Skeleton';
import Button from '../ui/Button';
import Loader from '../ui/Loading';
import { dbService } from '../../services';

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

const Dashboard: React.FC<DashboardProps> = ({ user, employees, events: initialEvents, shifts: initialShifts, settings, loading = false, onLogout, onNavigateToSettings, onOpenExport }) => {
    const [logoutConfirm, setLogoutConfirm] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const currentMonth = selectedDate.getMonth();
    const currentYear = selectedDate.getFullYear();

    // Lọc dữ liệu tháng hiện tại và tháng trước trực tiếp từ props
    const monthlyData = useMemo(() => {
        const prevMonthDate = new Date(currentYear, currentMonth - 1, 1);
        const prevM = prevMonthDate.getMonth();
        const prevY = prevMonthDate.getFullYear();

        const currentEvents = initialEvents.filter(e => {
            const d = new Date(e.date);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });
        const currentShifts = initialShifts.filter(s => {
            const d = new Date(s.date);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });

        const prevEvents = initialEvents.filter(e => {
            const d = new Date(e.date);
            return d.getMonth() === prevM && d.getFullYear() === prevY;
        });
        const prevShifts = initialShifts.filter(s => {
            const d = new Date(s.date);
            return d.getMonth() === prevM && d.getFullYear() === prevY;
        });

        return {
            events: currentEvents,
            shifts: currentShifts,
            prevEvents,
            prevShifts
        };
    }, [currentMonth, currentYear, initialEvents, initialShifts]);

    const handlePrevMonth = () => {
        setSelectedDate(new Date(currentYear, currentMonth - 1, 1));
    };

    const handleNextMonth = () => {
        setSelectedDate(new Date(currentYear, currentMonth + 1, 1));
    };

    const handleGoToToday = () => {
        setSelectedDate(new Date());
    };

    const stats = useMemo(() => {
        if (loading || employees.length === 0) return null;
        
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const todayEnd = todayStart + 86400000;

        // Dùng getTime để so sánh nhanh hơn
        const todayEvents = initialEvents.filter(e => {
            const t = new Date(e.date).getTime();
            return t >= todayStart && t < todayEnd;
        });

        const weekStart = new Date(now);
        weekStart.setHours(0, 0, 0, 0);
        weekStart.setDate(now.getDate() - now.getDay());
        const weekStartTime = weekStart.getTime();
        const weekEndTime = weekStartTime + (7 * 86400000);

        const weekEvents = initialEvents.filter(e => {
            const t = new Date(e.date).getTime();
            return t >= weekStartTime && t < weekEndTime;
        });

        const unpaidShifts = initialShifts.filter(s => s.status === 'unpaid');
        const morningShiftsCount = unpaidShifts.filter(s => s.session === 'morning').length;
        const afternoonShiftsCount = unpaidShifts.filter(s => s.session === 'afternoon').length;

        const activeEmployeeIds = new Set(unpaidShifts.map(s => s.employeeId));
        const activeEmployeesCount = employees.filter(e => activeEmployeeIds.has(e.id)).length;

        const unpaidEventIds = new Set(unpaidShifts.map(s => s.eventId));
        const unpaidEventsCount = initialEvents.filter(e => unpaidEventIds.has(e.id)).length;

        const totalUnpaidAmount = unpaidShifts.reduce((sum, s) => sum + s.amount, 0);
        // Tối ưu: gom filter và reduce
        const totalAdvancedAmount = initialShifts.reduce((sum, s) => s.status === 'advanced' ? sum + s.amount : sum, 0);

        return {
            totalEvents: unpaidEventsCount,
            todayEvents: todayEvents.length,
            weekEvents: weekEvents.length,
            totalShifts: unpaidShifts.length,
            morningShifts: morningShiftsCount,
            afternoonShifts: afternoonShiftsCount,
            totalEmployees: employees.length,
            activeEmployees: activeEmployeesCount,
            unpaidAmount: totalUnpaidAmount,
            advancedAmount: totalAdvancedAmount,
            totalEarned: totalUnpaidAmount + totalAdvancedAmount
        };
    }, [initialEvents, initialShifts, employees, loading]);

    const chartData = useMemo(() => {
        const { events, shifts } = monthlyData;
        
        // Nhóm dữ liệu theo ngày để tra cứu O(1)
        const eventMap: Record<string, number> = {};
        events.forEach(e => eventMap[e.date] = (eventMap[e.date] || 0) + 1);
        
        const shiftMap: Record<string, number> = {};
        shifts.forEach(s => shiftMap[s.date] = (shiftMap[s.date] || 0) + 1);

        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const data = [];

        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayEvents = eventMap[dateStr] || 0;
            const dayShifts = shiftMap[dateStr] || 0;

            if (dayEvents > 0 || dayShifts > 0) {
                data.push({
                    day: day,
                    events: dayEvents,
                    shifts: dayShifts,
                });
            }
        }
        return data;
    }, [monthlyData.events, monthlyData.shifts, currentMonth, currentYear]);

    const growthStats = useMemo(() => {
        const { events, shifts, prevEvents, prevShifts } = monthlyData;

        const calculateGrowth = (current: number, previous: number) => {
            if (previous === 0) return current > 0 ? 100 : 0;
            return Math.round(((current - previous) / previous) * 100);
        };

        const eventGrowth = calculateGrowth(events.length, prevEvents.length);
        const shiftGrowth = calculateGrowth(shifts.length, prevShifts.length);

        return {
            eventGrowth,
            shiftGrowth,
            eventCount: events.length,
            shiftCount: shifts.length
        };
    }, [monthlyData]);

    const paymentData = useMemo(() => {
        const unpaidShifts = initialShifts.filter(s => s.status === 'unpaid').length;
        const advancedShifts = initialShifts.filter(s => s.status === 'advanced').length;
        return [
            { name: 'Chưa thanh toán', value: unpaidShifts, color: PAYMENT_COLORS.UNPAID },
            { name: 'Đã ứng tiền', value: advancedShifts, color: PAYMENT_COLORS.ADVANCED },
        ].filter(d => d.value > 0);
    }, [initialShifts]);

    const monthName = new Intl.DateTimeFormat('vi-VN', { month: 'long', year: 'numeric' }).format(selectedDate);

    const {
        theme,
        bgClass,
        borderClass,
        cardBgClass,
        textPrimaryClass,
        textSecondaryClass,
        textMutedClass,
        inputBgClass,
        inputBorderClass,
        hoverBgClass
    } = useThemeStyles();

    const TrendIndicator = ({ value, count, label }: { value: number, count: number, label: string }) => {
        const isPositive = value >= 0;
        return (
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-bold ${isPositive
                ? 'bg-emerald-500/10 text-emerald-500'
                : 'bg-rose-500/10 text-rose-500'
                }`}>
                {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                <span>{isPositive ? '+' : ''}{value}% ({count})</span>
                <span className="opacity-70 font-medium">{label}</span>
            </div>
        );
    };

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const isPieChart = !label;
            return (
                <div className={`${theme === 'dark' ? 'bg-slate-800/95 border-slate-700' : 'bg-white/95 border-slate-200'} border p-3 rounded-xl shadow-xl backdrop-blur-md z-50`}>
                    {!isPieChart && <p className={`text-xs font-bold ${theme === 'dark' ? 'text-slate-300' : 'text-slate-500'} mb-2`}>Ngày {label}</p>}
                    <div className="space-y-1.5">
                        {payload.map((entry: any, index: number) => (
                            <div key={index} className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.payload.fill || entry.color || entry.fill }} />
                                    <span className={`text-[11px] font-medium ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>{entry.name}</span>
                                </div>
                                <span className={`text-[11px] font-bold ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>{entry.value} {isPieChart ? 'công' : ''}</span>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className={`pb-20 md:pb-0 ${bgClass} min-h-screen`}>
            <AnimatePresence mode="wait">
                {loading ? (
                    <motion.div
                        key="skeleton"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className={`hidden md:block py-4 px-6 border-b ${borderClass}`}>
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
                        <div className="px-4 pt-0 pb-4 md:px-6 md:pt-0 md:pb-6 space-y-6">
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className={`p-4 ${cardBgClass} border ${borderClass} rounded-lg h-28`}>
                                        <div className="flex items-center gap-2 mb-3">
                                            <Skeleton variant="circular" width={18} height={18} />
                                            <Skeleton variant="text" width="60%" height={12} />
                                        </div>
                                        <Skeleton variant="text" width="40%" height={32} />
                                    </div>
                                ))}
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className={`p-4 md:p-6 ${cardBgClass} border ${borderClass} rounded-xl h-[320px]`}>
                                    <Skeleton variant="text" width="40%" height={24} className="mb-6" />
                                    <Skeleton variant="rectangular" width="100%" height={200} className="rounded-lg" />
                                </div>
                                <div className={`p-4 md:p-6 ${cardBgClass} border ${borderClass} rounded-xl h-[320px]`}>
                                    <Skeleton variant="text" width="40%" height={24} className="mb-6" />
                                    <Skeleton variant="rectangular" width="100%" height={200} className="rounded-lg" />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="content"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        {/* Header section removed - moved to global TopBar */}
                        {/* Greeting Header (Desktop) */}
                        <div className={`hidden md:block py-4 px-6 border-b ${borderClass}`}>
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <img
                                        src={user?.photoURL || "/avatar.png"}
                                        alt="Avatar"
                                        className="w-10 h-10 rounded-full object-cover border-2 border-primary"
                                        onError={(e) => {
                                            e.currentTarget.src = "/avatar.png";
                                        }}
                                    />
                                    <div>
                                        <p className={`text-sm ${textSecondaryClass}`}>Xin chào,</p>
                                        <h2 className={`text-lg font-semibold ${textPrimaryClass}`}>
                                            {user?.displayName || user?.email?.split('@')[0] || 'Người dùng'}
                                        </h2>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <Button
                                        onClick={onOpenExport}
                                        variant="primary"
                                        className="flex items-center gap-2"
                                    >
                                        <FileDown size={18} />
                                        <span>Xuất báo cáo</span>
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className="relative min-h-[calc(100vh-120px)]">
                            <div className={`px-4 pt-5 pb-4 md:px-6 md:pt-0 md:pb-6 space-y-4 md:space-y-6 transition-all duration-300`}>
                                {/* Xuất báo cáo (Mobile) */}
                                <div className="md:hidden">
                                    <Button
                                        onClick={onOpenExport}
                                        variant="primary"
                                        fullWidth={true}
                                        className="flex items-center justify-center gap-2"
                                    >
                                        <FileDown size={18} />
                                        <span>Xuất báo cáo</span>
                                    </Button>
                                </div>

                                {/* Thẻ thống kê */}
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 min-h-[260px] md:min-h-[130px]">
                                    {/* Tổng sự kiện */}
                                    <div
                                        className={`p-4 ${theme === 'dark' ? 'bg-gradient-to-br from-slate-800 to-slate-900' : 'bg-gradient-to-br from-blue-50 to-white'} border ${borderClass} rounded-2xl`}
                                    >
                                        <div className={`flex items-center gap-2 ${textSecondaryClass} mb-2`}>
                                            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                                                <CalendarRange size={16} />
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

                                {/* Biểu đồ */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    {/* Biểu đồ cột */}
                                    {/* Biểu đồ cột */}
                                    <div className={`relative p-5 md:p-6 ${cardBgClass} border ${borderClass} rounded-2xl shadow-sm min-h-[380px] flex flex-col`}>
                                        <div className="flex flex-col gap-4 mb-6">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
                                                    <h3 className={`text-base font-bold ${textPrimaryClass} mb-1`}>
                                                        Hoạt động tháng
                                                    </h3>
                                                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                                                        <TrendIndicator value={growthStats.eventGrowth} count={growthStats.eventCount} label="Sự kiện" />
                                                        <TrendIndicator value={growthStats.shiftGrowth} count={growthStats.shiftCount} label="Số công" />
                                                    </div>
                                                </div>

                                                <div className={`flex items-center justify-between sm:justify-start gap-1 p-1 w-full sm:w-auto ${inputBgClass} ${inputBorderClass} rounded-xl border`}>
                                                    <button
                                                        onClick={handleGoToToday}
                                                        className={`flex-1 sm:flex-none px-3 py-1.5 text-[11px] font-bold rounded-lg ${textSecondaryClass} ${hoverBgClass} transition-all`}
                                                    >
                                                        Hiện tại
                                                    </button>
                                                    <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1" />
                                                    <div className="flex items-center gap-0.5">
                                                        <button onClick={handlePrevMonth} className={`p-1.5 rounded-lg ${hoverBgClass} ${textSecondaryClass}`}>
                                                            <ChevronLeft size={16} />
                                                        </button>
                                                        <span className={`text-xs font-bold ${textPrimaryClass} min-w-[90px] text-center capitalize`}>
                                                            {monthName}
                                                        </span>
                                                        <button onClick={handleNextMonth} className={`p-1.5 rounded-lg ${hoverBgClass} ${textSecondaryClass}`}>
                                                            <ChevronRight size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex-1 w-full relative overflow-hidden">
                                            {chartData.length > 0 ? (
                                                <ResponsiveContainer width="100%" height={300} minWidth={0} debounce={100}>
                                                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                        <XAxis
                                                            dataKey="day"
                                                            tick={{ fill: theme === 'dark' ? '#94a3b8' : '#64748b', fontSize: 10, fontWeight: 600 }}
                                                            axisLine={false}
                                                            tickLine={false}
                                                            dy={10}
                                                        />
                                                        <YAxis
                                                            tick={{ fill: theme === 'dark' ? '#94a3b8' : '#64748b', fontSize: 10, fontWeight: 600 }}
                                                            axisLine={false}
                                                            tickLine={false}
                                                        />
                                                        <Tooltip content={<CustomTooltip />} cursor={{ fill: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }} />
                                                        <Bar dataKey="events" name="Sự kiện" fill={PAYMENT_COLORS.SUCCESS} radius={[4, 4, 0, 0]} barSize={12} />
                                                        <Bar dataKey="shifts" name="Số công" fill={PAYMENT_COLORS.INFO} radius={[4, 4, 0, 0]} barSize={12} />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            ) : (
                                                <div className={`h-full flex flex-col items-center justify-center gap-3 ${textMutedClass}`}>
                                                    <div className="p-4 bg-slate-500/5 rounded-full">
                                                        <CalendarRange size={32} strokeWidth={1.5} />
                                                    </div>
                                                    <p className="text-sm font-medium">Chưa có dữ liệu hoạt động</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Biểu đồ tròn */}
                                    <div className={`p-5 md:p-6 ${cardBgClass} border ${borderClass} rounded-2xl shadow-sm min-h-[380px] flex flex-col`}>
                                        <div className="mb-6 text-center sm:text-left flex flex-col items-center sm:items-start">
                                            <h3 className={`text-base font-bold ${textPrimaryClass} mb-1`}>Phân bổ thanh toán</h3>
                                            <p className={`text-xs ${textSecondaryClass}`}>Tỷ lệ giữa công chưa trả và đã ứng</p>
                                        </div>

                                        <div className="flex-1 flex flex-col items-center justify-center">
                                            {paymentData.length > 0 ? (
                                                <div className="w-full flex flex-col items-center gap-8">
                                                    <div className="relative w-full z-0 overflow-hidden">
                                                        <ResponsiveContainer width="100%" height={220} minWidth={0} debounce={100} className="relative z-10">
                                                            <PieChart>
                                                                <Pie
                                                                    data={paymentData}
                                                                    cx="50%"
                                                                    cy="50%"
                                                                    innerRadius={60}
                                                                    outerRadius={80}
                                                                    paddingAngle={5}
                                                                    dataKey="value"
                                                                >
                                                                    {paymentData.map((entry, index) => (
                                                                        <Cell
                                                                            key={`cell-${index}`}
                                                                            fill={entry.color}
                                                                            stroke="transparent"
                                                                        />
                                                                    ))}
                                                                </Pie>
                                                                <Tooltip content={<CustomTooltip />} />
                                                            </PieChart>
                                                        </ResponsiveContainer>
                                                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-0">
                                                            <span className={`text-xl font-black ${textPrimaryClass}`}>
                                                                {paymentData.reduce((acc, curr) => acc + curr.value, 0)}
                                                            </span>
                                                            <span className={`text-[10px] font-bold uppercase tracking-widest ${textMutedClass}`}>Tổng công</span>
                                                        </div>
                                                    </div>

                                                    <div className="w-full grid grid-cols-1 gap-2">
                                                        {paymentData.map((item, index) => (
                                                            <div
                                                                key={index}
                                                                className={`flex items-center justify-between p-3 rounded-xl ${theme === 'dark' ? 'bg-slate-800/40' : 'bg-slate-50'} border ${borderClass}`}
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                                                                    <span className={`text-xs font-bold ${textSecondaryClass}`}>{item.name}</span>
                                                                </div>
                                                                <span className={`text-xs font-black ${textPrimaryClass}`}>{item.value}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className={`h-full flex flex-col items-center justify-center gap-3 ${textMutedClass}`}>
                                                    <div className="p-4 bg-slate-500/5 rounded-full">
                                                        <Wallet2 size={32} strokeWidth={1.5} />
                                                    </div>
                                                    <p className="text-sm font-medium">Chưa có dữ liệu thanh toán</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default memo(Dashboard);
