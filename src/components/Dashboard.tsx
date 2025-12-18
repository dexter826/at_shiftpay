import React, { useMemo, useState } from 'react';
import { Employee, Event, Shift, UserSettings } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { CalendarRange, Users, Wallet2, TrendingUp, LogOut, Sun, Moon, Settings } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { Modal } from './ui/Modal';
import { Skeleton } from './ui/Skeleton';
import Button from './ui/Button';

interface DashboardProps {
    user: any;
    employees: Employee[];
    events: Event[];
    shifts: Shift[];
    settings: UserSettings;

    loading?: boolean;
    onLogout: () => void;
    onNavigateToSettings: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, employees, events, shifts, settings, loading = false, onLogout, onNavigateToSettings }) => {
    const { theme, toggleTheme } = useTheme();
    const [logoutConfirm, setLogoutConfirm] = useState(false);
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    // ... (logic calculations remain same) ...
    const monthlyStats = useMemo(() => {
        const monthEvents = events.filter(e => {
            const d = new Date(e.date);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });

        const monthShifts = shifts.filter(s => {
            const d = new Date(s.eventDate);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });

        const unpaidShifts = monthShifts.filter(s => s.status === 'unpaid');
        const paidShifts = monthShifts.filter(s => s.status === 'paid');

        return {
            totalEvents: monthEvents.length,
            totalShifts: monthShifts.length,
            unpaidAmount: unpaidShifts.reduce((sum, s) => sum + s.amount, 0),
            paidAmount: paidShifts.reduce((sum, s) => sum + s.amount, 0),
        };
    }, [events, shifts, currentMonth, currentYear]);

    // ... (chartData logic remains same) ...
    const chartData = useMemo(() => {
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const data = [];

        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayEvents = events.filter(e => e.date === dateStr).length;
            const dayShifts = shifts.filter(s => s.eventDate === dateStr).length;

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

    // ... (paymentData logic remains same) ...
    const paymentData = useMemo(() => {
        const unpaid = shifts.filter(s => s.status === 'unpaid').length;
        const paid = shifts.filter(s => s.status === 'paid').length;
        return [
            { name: 'Đã thanh toán', value: paid, color: '#10b981' },
            { name: 'Chưa thanh toán', value: unpaid, color: '#f59e0b' },
        ].filter(d => d.value > 0);
    }, [shifts]);

    const monthName = new Intl.DateTimeFormat('vi-VN', { month: 'long' }).format(new Date());

    const handleLogoutClick = () => {
        setLogoutConfirm(true);
    };

    const confirmLogout = () => {
        setLogoutConfirm(false);
        onLogout();
    };

    const bgClass = theme === 'dark' ? 'bg-slate-900' : 'bg-slate-50';
    const borderClass = theme === 'dark' ? 'border-slate-800' : 'border-slate-200';
    const cardBgClass = theme === 'dark' ? 'bg-slate-800/50' : 'bg-white';
    const textPrimaryClass = theme === 'dark' ? 'text-slate-100' : 'text-slate-800';
    const textSecondaryClass = theme === 'dark' ? 'text-slate-400' : 'text-slate-500';

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
            {/* Header với thông tin user */}
            <div className={`p-4 md:p-6 border-b ${borderClass}`}>
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <img src="/avatar.png" alt="Avatar" className="w-10 h-10 rounded-full object-cover border-2 border-[#ecb52d]" />
                        <div>
                            <p className={`text-sm ${textSecondaryClass}`}>Xin chào,</p>
                            <h2 className={`text-lg font-semibold ${textPrimaryClass}`}>
                                {user?.displayName || user?.email?.split('@')[0] || 'Người dùng'}
                            </h2>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 md:hidden">
                        <button
                            onClick={onNavigateToSettings}
                            className={`p-2 ${textSecondaryClass} hover:text-[#ecb52d] transition-colors`}
                        >
                            <Settings size={20} />
                        </button>
                        <button
                            onClick={handleLogoutClick}
                            className={`p-2 ${textSecondaryClass} hover:text-red-400 transition-colors`}
                        >
                            <LogOut size={20} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="p-4 md:p-6 space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className={`p-4 ${cardBgClass} border ${borderClass} rounded-lg`}>
                        <div className={`flex items-center gap-2 ${textSecondaryClass} mb-2`}>
                            <CalendarRange size={16} />
                            <span className="text-xs">Sự kiện tháng này</span>
                        </div>
                        <p className={`text-2xl font-bold ${textPrimaryClass}`}>{monthlyStats.totalEvents}</p>
                    </div>

                    <div className={`p-4 ${cardBgClass} border ${borderClass} rounded-lg`}>
                        <div className={`flex items-center gap-2 ${textSecondaryClass} mb-2`}>
                            <TrendingUp size={16} />
                            <span className="text-xs">Tổng công</span>
                        </div>
                        <p className={`text-2xl font-bold ${textPrimaryClass}`}>{monthlyStats.totalShifts}</p>
                    </div>

                    <div className={`p-4 ${cardBgClass} border ${borderClass} rounded-lg`}>
                        <div className={`flex items-center gap-2 ${textSecondaryClass} mb-2`}>
                            <Users size={16} />
                            <span className="text-xs">Nhân viên</span>
                        </div>
                        <p className={`text-2xl font-bold ${textPrimaryClass}`}>{employees.length}</p>
                    </div>

                    <div className={`p-4 ${cardBgClass} border ${borderClass} rounded-lg`}>
                        <div className="flex items-center gap-2 text-orange-400 mb-2">
                            <Wallet2 size={16} />
                            <span className="text-xs">Chưa thanh toán</span>
                        </div>
                        <p className="text-2xl font-bold text-orange-400">
                            {monthlyStats.unpaidAmount.toLocaleString('vi-VN')}đ
                        </p>
                    </div>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Bar Chart */}
                    <div className={`p-4 ${cardBgClass} border ${borderClass} rounded-lg`}>
                        <h3 className={`text-sm font-medium ${textPrimaryClass} mb-4`}>
                            Hoạt động {monthName}
                        </h3>
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
                                    <Bar dataKey="events" name="Sự kiện" fill="#10b981" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="shifts" name="Công" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className={`h-[200px] flex items-center justify-center ${textSecondaryClass} text-sm`}>
                                Chưa có dữ liệu
                            </div>
                        )}
                    </div>

                    {/* Pie Chart */}
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

                {/* Settings Card for Desktop (Read Only Info) */}
                <div className={`p-4 ${cardBgClass} border ${borderClass} rounded-lg`}>
                    <div className="flex items-center justify-between mb-4">
                        <h3
                            className={`text-sm font-medium ${textPrimaryClass} flex items-center gap-2 cursor-pointer hover:text-[#ecb52d] transition-colors`}
                            onClick={onNavigateToSettings}
                        >
                            <Settings size={16} />
                            Thông tin cấu hình
                        </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <p className={`text-xs ${textSecondaryClass} mb-1`}>Mức lương/ca</p>
                            <p className={`text-sm font-medium ${textPrimaryClass}`}>
                                {settings.shiftRate.toLocaleString('vi-VN')}đ
                            </p>
                        </div>
                        <div>
                            <p className={`text-xs ${textSecondaryClass} mb-1`}>Giờ ca sáng</p>
                            <p className={`text-sm font-medium ${textPrimaryClass}`}>{settings.morningTime}</p>
                        </div>
                        <div>
                            <p className={`text-xs ${textSecondaryClass} mb-1`}>Giờ ca chiều</p>
                            <p className={`text-sm font-medium ${textPrimaryClass}`}>{settings.afternoonTime}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Logout Confirm Modal */}
            <Modal
                title="Xác nhận đăng xuất"
                isOpen={logoutConfirm}
                onClose={() => setLogoutConfirm(false)}
                footer={
                    <div className="flex gap-2">
                        <Button
                            variant="secondary"
                            onClick={() => setLogoutConfirm(false)}
                            className="flex-1"
                            hideIcon
                        >
                            Hủy
                        </Button>
                        <Button
                            variant="danger"
                            onClick={confirmLogout}
                            className="flex-1"
                        >
                            Đăng xuất
                        </Button>
                    </div>
                }
            >
                <p className="text-sm text-slate-300">Bạn có chắc muốn đăng xuất khỏi ứng dụng?</p>
            </Modal>
        </div >
    );
};
