import React, { memo } from 'react';
interface CustomTooltipProps {
    active?: boolean;
    payload?: any[];
    label?: string;
}

const ChartTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        const isPieChart = !label;
        return (
            <div className="bg-[var(--bg-card)]/95 border-[var(--border-color)] border p-3 rounded-lg shadow-xl z-50">
                {!isPieChart && <p className="text-xs font-bold text-[var(--text-secondary)] mb-2">Ngày {label}</p>}
                <div className="space-y-1.5">
                    {payload.map((entry: any, index: number) => (
                        <div key={index} className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.payload.fill || entry.color || entry.fill }} />
                                <span className="text-[11px] font-medium text-[var(--text-primary)]">{entry.name}</span>
                            </div>
                            <span className="text-[11px] font-bold text-[var(--text-primary)]">{entry.value} {isPieChart ? 'công' : ''}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    return null;
};

export default memo(ChartTooltip);
