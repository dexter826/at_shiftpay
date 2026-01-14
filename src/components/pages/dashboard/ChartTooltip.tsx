import React, { memo } from 'react';
import { useThemeStyles } from '../../../hooks/useThemeStyles';

interface CustomTooltipProps {
    active?: boolean;
    payload?: any[];
    label?: string;
}

const ChartTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
    const { theme } = useThemeStyles();

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

export default memo(ChartTooltip);
