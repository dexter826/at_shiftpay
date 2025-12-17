import React, { useMemo, useState } from 'react';
import { Employee, Event, Shift, UserSettings, DEFAULT_SETTINGS } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { CalendarRange, Users, Wallet2, TrendingUp, LogOut, Sun, Moon, Settings, Save } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { Modal } from './ui/Modal';
import { TimePicker } from './ui/TimePicker';
import { dbService } from '../services/firebase';
import { useToast } from './ui/Toast';

interface DashboardProps {
    user: any;
    employees: Employee[];
    events: Event[];
    shifts: Shift[];
    settings: UserSettings;
    onLogout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, employees, events, shifts, settings, onLogout }) => {
    const { theme, toggleTheme } = useTheme();
    const { showToast } = useToast();
    const [logoutConfirm, setLogoutConfirm] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [editSettings, setEditSettings] = useState<UserSettings>(settings);
    const [saving, setSaving] = useState(false);
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const openSettings = () => {
        setEditSettings(settings);
        setSettingsOpen(true);
    };

    const handleSaveSettings = async () => {
        setSaving(true);
        try {
            await dbService.updateSettings(editSettings);
            showToast('Đã lưu cài đặt', 'success');
            setSettingsOpen(false);
        } catch (err) {
            showToast('Có lỗi xảy ra', 'error');
        }
        setSaving(false);
    };

    // Thống kê tháng hiện tại
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

    // Dữ liệu biểu đồ - số sự kiện theo ngày trong tháng
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

    // Dữ liệu pie chart - trạng thái thanh toán
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

    return (
        <div className={`pb-16 md:pb-0 md:ml-60 ${bgClass} min-h-screen`}>
            {/* Header với thông tin user */}
            <div className={`p-4 md:p-6 border-b ${borderClass}`}>
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <img src="/avatar.png" alt="Avatar" className="w-10 h-10 rounded-full object-cover" />
                        <div>
                            <p className={`text-sm ${textSecondaryClass}`}>Xin chào,</p>
                            <h2 className={`text-lg font-semibold ${textPrimaryClass}`}>
                                {user?.displayName || user?.email?.split('@')[0] || 'Người dùng'}
                            </h2>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 md:hidden">
                        <button
                            onClick={toggleTheme}
                            className={`p-2 ${textSecondaryClass} hover:text-[#ecb52d] transition-colors`}
                        >
                            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
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
            </div>

            {/* Settings Card for Desktop */}
            <div className="p-4 md:p-6">
                <div className={`p-4 ${cardBgClass} border ${borderClass} rounded-lg`}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className={`text-sm font-medium ${textPrimaryClass} flex items-center gap-2`}>
                            <Settings size={16} />
                            Cài đặt
                        </h3>
                        <button
                            onClick={openSettings}
                            className="text-xs text-[#ecb52d] hover:text-[#f0c654]"
                        >
                            Chỉnh sửa
                        </button>
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

            {/* Settings Modal */}
            <Modal
                title="Cài đặt"
                isOpen={settingsOpen}
                onClose={() => setSettingsOpen(false)}
                footer={
                    <button
                        onClick={handleSaveSettings}
                        disabled={saving}
                        className="w-full bg-[#ecb52d] text-white py-2.5 rounded-lg text-sm font-medium hover:bg-[#d4a128] transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
                    >
                        <Save size={16} />
                        {saving ? 'Đang lưu...' : 'Lưu cài đặt'}
                    </button>
                }
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs text-slate-400 mb-1.5">Mức lương mỗi ca (VNĐ)</label>
                        <input
                            type="number"
                            value={editSettings.shiftRate}
                            onChange={(e) => setEditSettings({ ...editSettings, shiftRate: Number(e.target.value) })}
                            className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-slate-600"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-slate-400 mb-1.5">Giờ bắt đầu ca sáng</label>
                        <TimePicker
                            value={editSettings.morningTime}
                            onChange={(v) => setEditSettings({ ...editSettings, morningTime: v })}
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-slate-400 mb-1.5">Giờ bắt đầu ca chiều</label>
                        <TimePicker
                            value={editSettings.afternoonTime}
                            onChange={(v) => setEditSettings({ ...editSettings, afternoonTime: v })}
                        />
                    </div>
                </div>
            </Modal>

            {/* Logout Confirm Modal */}
            <Modal
                title="Xác nhận đăng xuất"
                isOpen={logoutConfirm}
                onClose={() => setLogoutConfirm(false)}
                footer={
                    <div className="flex gap-2">
                        <button
                            onClick={() => setLogoutConfirm(false)}
                            className="flex-1 py-2.5 rounded-lg text-sm font-medium border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors"
                        >
                            Hủy
                        </button>
                        <button
                            onClick={confirmLogout}
                            className="flex-1 bg-red-500 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
                        >
                            Đăng xuất
                        </button>
                    </div>
                }
            >
                <p className="text-sm text-slate-300">Bạn có chắc muốn đăng xuất khỏi ứng dụng?</p>
            </Modal>
        </div>
    );
};
