import React, { memo } from 'react';
import { Calendar, TrendingUp, Users, Wallet } from 'lucide-react';

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

const cards = [
  {
    label: 'Sự kiện',
    value: 'totalEvents',
    icon: Calendar,
    rows: [
      { label: 'Hôm nay', key: 'todayEvents' },
      { label: 'Tuần này', key: 'weekEvents' },
    ],
  },
  {
    label: 'Công',
    value: 'totalShifts',
    icon: TrendingUp,
    rows: [
      { label: 'Sáng', key: 'morningShifts' },
      { label: 'Chiều', key: 'afternoonShifts' },
    ],
  },
  {
    label: 'Nhân viên',
    value: 'totalEmployees',
    icon: Users,
    rows: [
      { label: 'Đã làm', key: 'activeEmployees' },
      { label: 'Chưa làm', key: null, subtract: true },
    ],
  },
  {
    label: 'Lương',
    value: 'totalEarned',
    icon: Wallet,
    isCurrency: true,
    rows: [
      { label: 'Đã ứng', key: 'advancedAmount', currency: true },
      { label: 'Cần trả', key: 'unpaidAmount', currency: true },
    ],
  },
];

const DashboardStats: React.FC<DashboardStatsProps> = memo(({ stats }) => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
    {cards.map((card) => {
      const Icon = card.icon;
      const mainValue = stats[card.value as keyof typeof stats] as number;
      return (
        <div key={card.label} className="p-3.5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg">
          <div className="flex items-center gap-2 mb-2.5">
            <div className="p-1.5 rounded-md bg-primary/10 text-primary">
              <Icon size={14} />
            </div>
            <span className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wider">{card.label}</span>
          </div>
          <p className={`text-xl font-bold text-[var(--text-primary)] tabular-nums mb-2.5 ${card.isCurrency ? 'text-primary' : ''}`}>
            {card.isCurrency ? `${(mainValue).toLocaleString('vi-VN')}đ` : mainValue}
          </p>
          <div className="pt-2 border-t border-[var(--border-color)] space-y-1">
            {card.rows.map((row) => {
              let val: number;
              if (row.subtract) {
                val = (stats['totalEmployees' as keyof typeof stats] as number) - (stats['activeEmployees' as keyof typeof stats] as number);
              } else {
                val = stats[row.key as keyof typeof stats] as number;
              }
              return (
                <div key={row.label} className="flex justify-between text-[11px]">
                  <span className="text-[var(--text-secondary)]">{row.label}</span>
                  <span className={`font-semibold tabular-nums ${row.color || 'text-[var(--text-primary)]'}`}>
                    {row.currency ? `${val.toLocaleString('vi-VN')}đ` : val}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      );
    })}
  </div>
));

export default DashboardStats;
