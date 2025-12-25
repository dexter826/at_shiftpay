import React, { useMemo, useState } from 'react';
import { Employee, Event, Shift, UserSettings } from '../../types';
import { PAYMENT_COLORS } from '../../constants/colors';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { CalendarRange, Users, Wallet2, TrendingUp, LogOut, Sun, Moon, Settings, FileDown, ChevronLeft, ChevronRight } from 'lucide-react';
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
    const [monthlyData, setMonthlyData] = useState<{ events: Event[], shifts: Shift[] }>({
        events: initialEvents,
        shifts: initialShifts
    });
    const [isDataLoading, setIsDataLoading] = useState(false);

    const currentMonth = selectedDate.getMonth();
    const currentYear = selectedDate.getFullYear();

    // Tải dữ liệu khi đổi tháng
    React.useEffect(() => {
        const fetchData = async () => {
            const now = new Date();
            // Nếu là tháng hiện tại, dùng data từ props cho nhanh và realtime
            if (currentMonth === now.getMonth() && currentYear === now.getFullYear()) {
                setMonthlyData({ events: initialEvents, shifts: initialShifts });
                return;
            }

            setIsDataLoading(true);
            try {
                const [fetchedEvents, fetchedShifts] = await Promise.all([
                    dbService.getEventsByMonth(currentMonth + 1, currentYear),
                    dbService.getShiftsByMonth(currentMonth + 1, currentYear)
                ]);
                setMonthlyData({ events: fetchedEvents, shifts: fetchedShifts });
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            } finally {
                setIsDataLoading(false);
            }
        };

        fetchData();
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

    // Tính toán thống kê chi tiết cho các stat cards dựa trên monthlyData
    const monthlyStats = useMemo(() => {
        const { events, shifts } = monthlyData;
        const statsMonth = selectedDate.getMonth();
        const statsYear = selectedDate.getFullYear();
        const now = new Date();
        const isCurrentMonth = statsMonth === now.getMonth() && statsYear === now.getFullYear();

        // Sự kiện trong tháng được chọn
        const monthEvents = events.filter(e => {
            const d = new Date(e.date);
            return d.getMonth() === statsMonth && d.getFullYear() === statsYear;
        });

        // Sự kiện hôm nay (chỉ hiển thị nếu đang ở tháng/năm hiện tại)
        const todayEvents = isCurrentMonth ? events.filter(e => {
            const d = new Date(e.date);
            return d.getFullYear() === now.getFullYear() &&
                d.getMonth() === now.getMonth() &&
                d.getDate() === now.getDate();
        }) : [];

        const weekStartDate = new Date(now);
        weekStartDate.setHours(0, 0, 0, 0);
        weekStartDate.setDate(now.getDate() - now.getDay());
        const weekEndDate = new Date(weekStartDate);
        weekEndDate.setDate(weekStartDate.getDate() + 6);
        weekEndDate.setHours(23, 59, 59, 999);

        // Sự kiện tuần này (chỉ hiển thị nếu đang ở tháng/năm hiện tại)
        const weekEvents = isCurrentMonth ? events.filter(e => {
            const d = new Date(e.date);
            return d >= weekStartDate && d <= weekEndDate;
        }) : [];

        // Công trong tháng được chọn
        const monthShifts = shifts.filter(s => {
            const d = new Date(s.date);
            return d.getMonth() === statsMonth && d.getFullYear() === statsYear;
        });

        const morningShifts = monthShifts.filter(s => s.session === 'morning');
        const afternoonShifts = monthShifts.filter(s => s.session === 'afternoon');

        // "Còn cần trả" lấy FULL từ initialShifts (không lọc theo tháng)
        const allUnpaidShifts = initialShifts.filter(s => s.status === 'unpaid');
        const allAdvancedShifts = initialShifts.filter(s => s.status === 'advanced');

        const totalUnpaidAmount = allUnpaidShifts.reduce((sum, s) => sum + s.amount, 0);
        const totalAdvancedAmount = allAdvancedShifts.reduce((sum, s) => sum + s.amount, 0);

        // Nhân viên - tính dựa trên shifts hiện có trong tháng
        const activeEmployeeIds = new Set(monthShifts.map(s => s.employeeId));
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
            unpaidAmount: totalUnpaidAmount, // Dữ liệu tổng
            advancedAmount: totalAdvancedAmount, // Dữ liệu tổng
            totalEarned: totalUnpaidAmount + totalAdvancedAmount,
            isCurrentMonth
        };
    }, [monthlyData, initialShifts, selectedDate, employees]);

    // ... (chartData logic remains same) ...
    const chartData = useMemo(() => {
        const { events, shifts } = monthlyData;
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
    }, [monthlyData, currentMonth, currentYear]);

    const paymentData = useMemo(() => {
        const unpaid = initialShifts.filter(s => s.status === 'unpaid').length;
        const paid = initialShifts.filter(s => s.status === 'paid').length;
        const advanced = initialShifts.filter(s => s.status === 'advanced').length;
        return [
            { name: 'Đã thanh toán', value: paid, color: PAYMENT_COLORS.PAID },
            { name: 'Còn cần trả', value: unpaid, color: PAYMENT_COLORS.UNPAID },
            { name: 'Đã ứng tiền', value: advanced, color: PAYMENT_COLORS.ADVANCED },
        ].filter(d => d.value > 0);
    }, [initialShifts]);

    const monthName = new Intl.DateTimeFormat('vi-VN', { month: 'long', year: 'numeric' }).format(selectedDate);

    const {
        theme,
        bgClass,
        borderClass,
        cardBgClass,
        textPrimaryClass,
        textSecondaryClass
    } = useThemeStyles();

    return (
        <div className={`pb-16 md:pb-0 ${bgClass} min-h-screen`}>
            <AnimatePresence mode="wait">
                {loading ? (
                    <motion.div
                        key="skeleton"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className={`hidden md:block p-6 border-b ${borderClass}`}>
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

                                <div className="flex items-center gap-4">
                                    {/* Bộ chọn tháng Desktop */}
                                    <div className={`flex items-center gap-2 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'} p-1 rounded-lg border`}>
                                        <button
                                            onClick={handleGoToToday}
                                            className={`px-3 py-1.5 text-xs font-medium rounded-md ${textSecondaryClass} ${theme === 'dark' ? 'hover:bg-slate-700' : 'hover:bg-white'} hover:shadow-sm transition-all`}
                                        >
                                            Tháng này
                                        </button>
                                        <div className="flex items-center gap-1 px-2">
                                            <button
                                                onClick={handlePrevMonth}
                                                className={`p-1.5 rounded-md ${theme === 'dark' ? 'hover:bg-slate-700' : 'hover:bg-white'} ${textSecondaryClass} transition-all`}
                                            >
                                                <ChevronLeft size={18} />
                                            </button>
                                            <span className={`text-sm font-semibold ${textPrimaryClass} min-w-[140px] text-center capitalize`}>
                                                {monthName}
                                            </span>
                                            <button
                                                onClick={handleNextMonth}
                                                className={`p-1.5 rounded-md ${theme === 'dark' ? 'hover:bg-slate-700' : 'hover:bg-white'} ${textSecondaryClass} transition-all`}
                                            >
                                                <ChevronRight size={18} />
                                            </button>
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
                        </div>

                        <div className="relative min-h-[calc(100vh-120px)]">
                            {/* Loading Overlay cho dữ liệu tháng mới */}
                            <AnimatePresence>
                                {isDataLoading && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className={`fixed md:absolute top-[64px] md:top-0 bottom-[72px] md:bottom-0 inset-x-0 md:inset-0 ${theme === 'dark' ? 'bg-slate-900/60' : 'bg-white/60'} z-30 md:z-10 flex items-center justify-center backdrop-blur-[2px] md:rounded-xl`}
                                    >
                                        <motion.div
                                            initial={{ scale: 0.5, opacity: 0 }}
                                            animate={{ scale: 0.9, opacity: 1 }}
                                            exit={{ scale: 0.5, opacity: 0 }}
                                            transition={{ type: "spring", damping: 20, stiffness: 300 }}
                                        >
                                            <Loader fullScreen={false} />
                                        </motion.div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className={`p-4 md:p-6 space-y-6 transition-all duration-300`}>
                                {/* Bộ chọn tháng & Xuất báo cáo (Mobile) */}
                                <div className="md:hidden space-y-3">
                                    <div className={`flex items-center justify-between p-2 ${cardBgClass} border ${borderClass} rounded-lg`}>
                                        <button
                                            onClick={handlePrevMonth}
                                            className={`p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 ${textSecondaryClass}`}
                                        >
                                            <ChevronLeft size={20} />
                                        </button>
                                        <div className="flex flex-col items-center">
                                            <span className={`text-sm font-bold ${textPrimaryClass} capitalize`}>
                                                {monthName}
                                            </span>
                                            <button
                                                onClick={handleGoToToday}
                                                className="text-[10px] text-primary font-medium"
                                            >
                                                Quay về tháng này
                                            </button>
                                        </div>
                                        <button
                                            onClick={handleNextMonth}
                                            className={`p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 ${textSecondaryClass}`}
                                        >
                                            <ChevronRight size={20} />
                                        </button>
                                    </div>
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
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 min-h-[260px] md:min-h-[130px]">
                    {/* Sự kiện tháng này */}
                    <div className={`p-4 ${cardBgClass} border ${borderClass} rounded-lg`}>
                        <div className={`flex items-center gap-2 ${textSecondaryClass} mb-2`}>
                            <CalendarRange size={16} />
                            <span className="text-xs">Sự kiện {monthlyStats.isCurrentMonth ? 'tháng này' : 'trong tháng'}</span>
                        </div>
                        <p className={`text-2xl font-bold ${textPrimaryClass} mb-3`}>{monthlyStats.totalEvents}</p>
                        <div className="pt-3 border-t border-slate-200 dark:border-slate-700 space-y-1 text-xs">
                            {monthlyStats.isCurrentMonth ? (
                                <>
                                    <div className="flex justify-between">
                                        <span className={textSecondaryClass}>Hôm nay</span>
                                        <span className={`font-medium ${textPrimaryClass}`}>{monthlyStats.todayEvents}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className={textSecondaryClass}>Tuần này</span>
                                        <span className={`font-medium ${textPrimaryClass}`}>{monthlyStats.weekEvents}</span>
                                    </div>
                                </>
                            ) : (
                                <div className="flex justify-between">
                                    <span className={textSecondaryClass}>Trung bình/tuần</span>
                                    <span className={`font-medium ${textPrimaryClass}`}>
                                        {Math.round(monthlyStats.totalEvents / 4)}
                                    </span>
                                </div>
                            )}
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
                            <span className="text-xs font-semibold">Tổng còn cần trả</span>
                        </div>
                        <p className="text-2xl font-bold text-primary">
                            {monthlyStats.unpaidAmount.toLocaleString('vi-VN')}đ
                        </p>
                        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 space-y-1 text-xs">
                            <div className="flex justify-between">
                                <span className={textSecondaryClass}>Tổng nợ:</span>
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
                    </div>
                </div>

                {/* Biểu đồ */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Biểu đồ cột */}
                    <div className={`p-4 ${cardBgClass} border ${borderClass} rounded-lg min-h-[300px]`}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className={`text-sm font-medium ${textPrimaryClass}`}>
                                Hoạt động trong tháng
                            </h3>
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
                        <h3 className={`text-sm font-medium ${textPrimaryClass} mb-4`}>Trạng thái thanh toán (Tổng)</h3>
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
        </div>
    </motion.div>
    )}
</AnimatePresence>
</div>
);
};

export default Dashboard;
