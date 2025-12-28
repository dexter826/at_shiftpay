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

    // Tính toán thống kê tổng quan (không lọc theo tháng)
    const stats = useMemo(() => {
        const now = new Date();

        // Sự kiện hôm nay
        const todayEvents = initialEvents.filter(e => {
            const d = new Date(e.date);
            return d.getFullYear() === now.getFullYear() &&
                d.getMonth() === now.getMonth() &&
                d.getDate() === now.getDate();
        });

        const weekStartDate = new Date(now);
        weekStartDate.setHours(0, 0, 0, 0);
        weekStartDate.setDate(now.getDate() - now.getDay());
        const weekEndDate = new Date(weekStartDate);
        weekEndDate.setDate(weekStartDate.getDate() + 6);
        weekEndDate.setHours(23, 59, 59, 999);

        // Sự kiện tuần này
        const weekEvents = initialEvents.filter(e => {
            const d = new Date(e.date);
            return d >= weekStartDate && d <= weekEndDate;
        });

        // Chỉ lấy shifts chưa trả lương
        const unpaidShifts = initialShifts.filter(s => s.status === 'unpaid');
        const morningShifts = unpaidShifts.filter(s => s.session === 'morning');
        const afternoonShifts = unpaidShifts.filter(s => s.session === 'afternoon');

        // Nhân viên active (có shifts chưa trả lương)
        const activeEmployeeIds = new Set(unpaidShifts.map(s => s.employeeId));
        const activeEmployees = employees.filter(e => activeEmployeeIds.has(e.id));

        // Sự kiện chưa hoàn tất lương (còn shifts unpaid)
        const unpaidEventIds = new Set(unpaidShifts.map(s => s.eventId));
        const unpaidEvents = initialEvents.filter(e => unpaidEventIds.has(e.id));

        // Tổng lương
        const totalUnpaidAmount = unpaidShifts.reduce((sum, s) => sum + s.amount, 0);
        const allAdvancedShifts = initialShifts.filter(s => s.status === 'advanced');
        const totalAdvancedAmount = allAdvancedShifts.reduce((sum, s) => sum + s.amount, 0);

        return {
            totalEvents: unpaidEvents.length,
            todayEvents: todayEvents.length,
            weekEvents: weekEvents.length,
            totalShifts: unpaidShifts.length,
            morningShifts: morningShifts.length,
            afternoonShifts: afternoonShifts.length,
            totalEmployees: employees.length,
            activeEmployees: activeEmployees.length,
            unpaidAmount: totalUnpaidAmount,
            advancedAmount: totalAdvancedAmount,
            totalEarned: totalUnpaidAmount + totalAdvancedAmount
        };
    }, [initialEvents, initialShifts, employees]);

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
                            <div className={`px-4 pt-0 pb-4 md:px-6 md:pt-0 md:pb-6 space-y-6 transition-all duration-300`}>
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
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 min-h-[260px] md:min-h-[130px]">
                                    {/* Tổng sự kiện */}
                                    <div className={`p-4 ${cardBgClass} border ${borderClass} rounded-lg`}>
                                        <div className={`flex items-center gap-2 ${textSecondaryClass} mb-2`}>
                                            <CalendarRange size={16} />
                                            <span className="text-xs">Tổng sự kiện</span>
                                        </div>
                                        <p className={`text-2xl font-bold ${textPrimaryClass} mb-3`}>{stats.totalEvents}</p>
                                        <div className="pt-3 border-t border-slate-200 dark:border-slate-700 space-y-1 text-xs">
                                            <div className="flex justify-between">
                                                <span className={textSecondaryClass}>Hôm nay</span>
                                                <span className={`font-medium ${textPrimaryClass}`}>{stats.todayEvents}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className={textSecondaryClass}>Tuần này</span>
                                                <span className={`font-medium ${textPrimaryClass}`}>{stats.weekEvents}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Tổng công */}
                                    <div className={`p-4 ${cardBgClass} border ${borderClass} rounded-lg`}>
                                        <div className={`flex items-center gap-2 ${textSecondaryClass} mb-2`}>
                                            <TrendingUp size={16} />
                                            <span className="text-xs">Tổng công</span>
                                        </div>
                                        <p className={`text-2xl font-bold ${textPrimaryClass} mb-3`}>{stats.totalShifts}</p>
                                        <div className="pt-3 border-t border-slate-200 dark:border-slate-700 space-y-1 text-xs">
                                            <div className="flex justify-between">
                                                <span className={textSecondaryClass}>Sáng</span>
                                                <span className={`font-medium ${textPrimaryClass}`}>{stats.morningShifts}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className={textSecondaryClass}>Chiều</span>
                                                <span className={`font-medium ${textPrimaryClass}`}>{stats.afternoonShifts}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Tổng nhân viên */}
                                    <div className={`p-4 ${cardBgClass} border ${borderClass} rounded-lg`}>
                                        <div className={`flex items-center gap-2 ${textSecondaryClass} mb-2`}>
                                            <Users size={16} />
                                            <span className="text-xs">Tổng nhân viên</span>
                                        </div>
                                        <p className={`text-2xl font-bold ${textPrimaryClass} mb-3`}>{stats.totalEmployees}</p>
                                        <div className="pt-3 border-t border-slate-200 dark:border-slate-700 space-y-1 text-xs">
                                            <div className="flex justify-between">
                                                <span className={textSecondaryClass}>Đã làm</span>
                                                <span className={`font-medium ${textPrimaryClass}`}>{stats.activeEmployees}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className={textSecondaryClass}>Chưa làm</span>
                                                <span className={`font-medium ${textPrimaryClass}`}>{stats.totalEmployees - stats.activeEmployees}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className={`p-4 ${cardBgClass} border ${borderClass} rounded-lg`}>
                                        <div className="flex items-center gap-2 text-primary mb-2">
                                            <Wallet2 size={16} />
                                            <span className="text-xs font-semibold">Tổng lương</span>
                                        </div>
                                        <p className="text-2xl font-bold text-primary">
                                            {stats.totalEarned.toLocaleString('vi-VN')}đ
                                        </p>
                                        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 space-y-1 text-xs">
                                            <div className="flex justify-between">
                                                <span className={textSecondaryClass}>Đã ứng:</span>
                                                <span className="font-medium text-orange-500">
                                                    {stats.advancedAmount.toLocaleString('vi-VN')}đ
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className={textSecondaryClass}>Còn cần trả:</span>
                                                <span className="font-medium text-blue-500">
                                                    {stats.unpaidAmount.toLocaleString('vi-VN')}đ
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Biểu đồ */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    {/* Biểu đồ cột */}
                                    <div className={`relative p-4 ${cardBgClass} border ${borderClass} rounded-lg min-h-[300px]`}>
                                        <AnimatePresence>
                                            {isDataLoading && (
                                                <motion.div
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    transition={{ duration: 0.2 }}
                                                    className={`absolute inset-0 ${theme === 'dark' ? 'bg-slate-900/60' : 'bg-white/60'} z-10 flex items-center justify-center backdrop-blur-[2px] rounded-lg`}
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
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                                            <h3 className={`text-sm font-semibold ${textPrimaryClass} whitespace-nowrap`}>
                                                Hoạt động trong tháng
                                            </h3>
                                            <div className={`flex items-center gap-1 sm:gap-2 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'} p-1 rounded-lg border w-full sm:w-auto justify-between sm:justify-start`}>
                                                <button
                                                    onClick={handleGoToToday}
                                                    className={`px-2 sm:px-3 py-1.5 text-[10px] sm:text-xs font-medium rounded-md ${textSecondaryClass} ${theme === 'dark' ? 'hover:bg-slate-700' : 'hover:bg-white'} hover:shadow-sm transition-all whitespace-nowrap`}
                                                >
                                                    Tháng này
                                                </button>
                                                <div className="flex items-center gap-1 px-1 sm:px-2">
                                                    <button
                                                        onClick={handlePrevMonth}
                                                        className={`p-1 sm:p-1.5 rounded-md ${theme === 'dark' ? 'hover:bg-slate-700' : 'hover:bg-white'} ${textSecondaryClass} transition-all`}
                                                    >
                                                        <ChevronLeft size={16} className="sm:w-[18px] sm:h-[18px]" />
                                                    </button>
                                                    <span className={`text-xs sm:text-sm font-semibold ${textPrimaryClass} min-w-[100px] sm:min-w-[120px] text-center capitalize`}>
                                                        {monthName}
                                                    </span>
                                                    <button
                                                        onClick={handleNextMonth}
                                                        className={`p-1 sm:p-1.5 rounded-md ${theme === 'dark' ? 'hover:bg-slate-700' : 'hover:bg-white'} ${textSecondaryClass} transition-all`}
                                                    >
                                                        <ChevronRight size={16} className="sm:w-[18px] sm:h-[18px]" />
                                                    </button>
                                                </div>
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
                                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
                                                <div className="relative w-[150px] h-[150px]">
                                                    <ResponsiveContainer width="100%" height="100%">
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
                                                            <Tooltip
                                                                formatter={(value: number) => [`${value} công`, 'Số lượng']}
                                                                contentStyle={{
                                                                    backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff',
                                                                    border: `1px solid ${theme === 'dark' ? '#334155' : '#e2e8f0'}`,
                                                                    borderRadius: 8,
                                                                    fontSize: '12px'
                                                                }}
                                                            />
                                                        </PieChart>
                                                    </ResponsiveContainer>
                                                </div>
                                                <div className="grid grid-cols-2 sm:grid-cols-1 gap-x-4 gap-y-2">
                                                    {paymentData.map((item, index) => (
                                                        <div key={index} className="flex items-center gap-2">
                                                            <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                                                            <span className={`text-xs ${textSecondaryClass} whitespace-nowrap`}>{item.name}: {item.value} công</span>
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
