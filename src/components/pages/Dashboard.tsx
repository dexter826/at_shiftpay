import React, { useMemo, useState, memo } from 'react';
import { Employee, Event, Shift, UserSettings } from '../../types';
import { PAYMENT_COLORS } from '../../constants/colors';
import { motion, AnimatePresence } from 'framer-motion';
import ExportIcon from '../ui/icons/export-icon';
import { useThemeStyles } from '../../hooks/useThemeStyles';
import Button from '../ui/Button';
import { Skeleton } from '../ui/Skeleton';

// Imported Components
import DashboardHeader from './dashboard/DashboardHeader';
import DashboardStats from './dashboard/DashboardStats';
import ActivityChart from './dashboard/ActivityChart';
import PaymentChart from './dashboard/PaymentChart';

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

const Dashboard: React.FC<DashboardProps> = ({ 
    user, 
    employees, 
    events: initialEvents, 
    shifts: initialShifts, 
    loading = false, 
    onOpenExport 
}) => {
    const { bgClass, borderClass, cardBgClass } = useThemeStyles();
    
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

    // Preload avatar người dùng
    React.useEffect(() => {
        if (user?.photoURL) {
            const img = new Image();
            img.src = user.photoURL;
        }
    }, [user?.photoURL]);

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

    return (
        <div className={`pb-28 md:pb-0 ${bgClass} min-h-screen`}>
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
                        <DashboardHeader user={user} onOpenExport={onOpenExport} />

                        <div className="relative min-h-[calc(100vh-120px)]">
                            <div className={`px-4 pt-5 pb-4 md:px-6 md:pt-0 md:pb-6 space-y-4 md:space-y-6 transition-all duration-300`}>
                                {/* Xuất báo cáo (Mobile) */}
                                <div className="md:hidden">
                                    <Button
                                        onClick={onOpenExport}
                                        variant="primary"
                                        fullWidth={true}
                                        className="flex items-center justify-center gap-2"
                                        icon={<ExportIcon size={18} />}
                                    >
                                        <span>Xuất báo cáo</span>
                                    </Button>
                                </div>

                                {stats && <DashboardStats stats={stats} />}

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    <ActivityChart 
                                        data={chartData} 
                                        growthStats={growthStats} 
                                        monthName={monthName}
                                        onPrevMonth={handlePrevMonth}
                                        onNextMonth={handleNextMonth}
                                        onGoToToday={handleGoToToday}
                                    />
                                    
                                    <PaymentChart data={paymentData} />
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
