import React, { memo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { CalendarRange, TrendingUp, TrendingDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { PAYMENT_COLORS } from '../../../constants/colors';
import ChartTooltip from './ChartTooltip';

interface ActivityChartProps {
    data: { day: number; events: number; shifts: number }[];
    growthStats: { eventGrowth: number; shiftGrowth: number; eventCount: number; shiftCount: number };
    monthName: string;
    onPrevMonth: () => void;
    onNextMonth: () => void;
    onGoToToday: () => void;
    onMonthClick: () => void;
}

const TrendIndicator = ({ value, count, label }: { value: number; count: number; label: string }) => {
    const isPositive = value >= 0;
    return (
        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${isPositive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
            {isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {isPositive ? '+' : ''}{value}%
        </span>
    );
};

const ActivityChart: React.FC<ActivityChartProps> = memo(({
    data, growthStats, monthName, onPrevMonth, onNextMonth, onGoToToday, onMonthClick
}) => (
    <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg min-h-[340px] flex flex-col">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
            <div className="flex items-center justify-between sm:block">
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">Hoạt động</h3>
                <div className="flex items-center gap-2 mt-1 sm:mt-1">
                    <TrendIndicator value={growthStats.eventGrowth} count={growthStats.eventCount} label="" />
                    <TrendIndicator value={growthStats.shiftGrowth} count={growthStats.shiftCount} label="" />
                </div>
            </div>
            <div className="flex items-center justify-between sm:justify-start gap-1 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-0.5 w-full sm:w-auto">
                <button onClick={onGoToToday} className="flex-1 sm:flex-none px-2 py-1 text-[10px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded transition-colors whitespace-nowrap">Hôm nay</button>
                <div className="h-3 w-px bg-[var(--border-color)] shrink-0" />
                <button onClick={onPrevMonth} className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded transition-colors shrink-0"><ChevronLeft size={14} /></button>
                <button onClick={onMonthClick} className="flex-1 sm:flex-none text-[11px] font-medium text-[var(--text-primary)] min-w-[80px] text-center px-1 whitespace-nowrap">{monthName}</button>
                <button onClick={onNextMonth} className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded transition-colors shrink-0"><ChevronRight size={14} /></button>
            </div>
        </div>

        <div className="flex-1">
            {data.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={data} margin={{ top: 8, right: 4, left: -16, bottom: 0 }}>
                        <XAxis dataKey="day" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} dy={8} />
                        <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                        <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(128,128,128,0.05)' }} />
                        <Bar dataKey="events" name="Sự kiện" fill={PAYMENT_COLORS.SUCCESS} radius={[3, 3, 0, 0]} barSize={8} />
                        <Bar dataKey="shifts" name="Số công" fill={PAYMENT_COLORS.INFO} radius={[3, 3, 0, 0]} barSize={8} />
                    </BarChart>
                </ResponsiveContainer>
            ) : (
                <div className="h-full flex flex-col items-center justify-center gap-2 text-[var(--text-muted)]">
                    <CalendarRange size={28} strokeWidth={1.5} />
                    <p className="text-sm">Chưa có dữ liệu</p>
                </div>
            )}
        </div>
    </div>
));

export default ActivityChart;
