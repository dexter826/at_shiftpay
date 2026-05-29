import React, { memo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { CalendarRange, TrendingUp, TrendingDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useThemeStyles } from '../../../hooks/useThemeStyles';
import { PAYMENT_COLORS } from '../../../constants/colors';
import ChartTooltip from './ChartTooltip';

interface ActivityChartProps {
    data: any[];
    growthStats: {
        eventGrowth: number;
        shiftGrowth: number;
        eventCount: number;
        shiftCount: number;
    };
    monthName: string;
    onPrevMonth: () => void;
    onNextMonth: () => void;
    onGoToToday: () => void;
    onMonthClick: () => void;
}

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

/**
 * Biểu đồ hiển thị hoạt động tháng
 */
const ActivityChart: React.FC<ActivityChartProps> = ({
    data,
    growthStats,
    monthName,
    onPrevMonth,
    onNextMonth,
    onGoToToday,
    onMonthClick
}) => {
    const {
        theme,
        cardBgClass,
        borderClass,
        textPrimaryClass,
        textSecondaryClass,
        textMutedClass,
        inputBgClass,
        inputBorderClass,
        hoverBgClass
    } = useThemeStyles();

    return (
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
                            onClick={onGoToToday}
                            className={`flex-1 sm:flex-none px-3 py-1.5 text-[11px] font-bold rounded-lg ${textSecondaryClass} ${hoverBgClass} transition-all`}
                        >
                            Hiện tại
                        </button>
                        <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1" />
                        <div className="flex items-center gap-0.5">
                            <button
                                onClick={onPrevMonth}
                                className={`p-1.5 rounded-lg ${hoverBgClass} ${textSecondaryClass} transition-colors`}
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <button
                                onClick={onMonthClick}
                                className={`text-xs font-bold ${textPrimaryClass} min-w-[90px] text-center capitalize px-2 py-1 rounded-lg hover:${hoverBgClass} transition-colors cursor-pointer`}
                                title="Chọn tháng hiển thị"
                            >
                                {monthName}
                            </button>
                            <button
                                onClick={onNextMonth}
                                className={`p-1.5 rounded-lg ${hoverBgClass} ${textSecondaryClass} transition-colors`}
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 w-full relative overflow-hidden">
                {data.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300} minWidth={0} debounce={100}>
                        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                            <Tooltip content={<ChartTooltip />} cursor={{ fill: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }} />
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
    );
};

export default memo(ActivityChart);
