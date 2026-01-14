import React, { memo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Wallet2 } from 'lucide-react';
import { useThemeStyles } from '../../../hooks/useThemeStyles';
import ChartTooltip from './ChartTooltip';

interface PaymentChartProps {
    data: Array<{
        name: string;
        value: number;
        color: string;
    }>;
}

const PaymentChart: React.FC<PaymentChartProps> = ({ data }) => {
    const {
        theme,
        cardBgClass,
        borderClass,
        textPrimaryClass,
        textSecondaryClass,
        textMutedClass
    } = useThemeStyles();

    return (
        <div className={`p-5 md:p-6 ${cardBgClass} border ${borderClass} rounded-2xl shadow-sm min-h-[380px] flex flex-col`}>
            <div className="mb-6 text-center sm:text-left flex flex-col items-center sm:items-start">
                <h3 className={`text-base font-bold ${textPrimaryClass} mb-1`}>Phân bổ thanh toán</h3>
                <p className={`text-xs ${textSecondaryClass}`}>Tỷ lệ giữa công chưa trả và đã ứng</p>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center">
                {data.length > 0 ? (
                    <div className="w-full flex flex-col items-center gap-8">
                        <div className="relative w-full z-0 overflow-hidden">
                            <ResponsiveContainer width="100%" height={220} minWidth={0} debounce={100} className="relative z-10">
                                <PieChart>
                                    <Pie
                                        data={data}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {data.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={entry.color}
                                                stroke="transparent"
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<ChartTooltip />} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-0">
                                <span className={`text-xl font-black ${textPrimaryClass}`}>
                                    {data.reduce((acc, curr) => acc + curr.value, 0)}
                                </span>
                                <span className={`text-[10px] font-bold uppercase tracking-widest ${textMutedClass}`}>Tổng công</span>
                            </div>
                        </div>

                        <div className="w-full grid grid-cols-1 gap-2">
                            {data.map((item, index) => (
                                <div
                                    key={index}
                                    className={`flex items-center justify-between p-3 rounded-xl ${theme === 'dark' ? 'bg-slate-800/40' : 'bg-slate-50'} border ${borderClass}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                                        <span className={`text-xs font-bold ${textSecondaryClass}`}>{item.name}</span>
                                    </div>
                                    <span className={`text-xs font-black ${textPrimaryClass}`}>{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className={`h-full flex flex-col items-center justify-center gap-3 ${textMutedClass}`}>
                        <div className="p-4 bg-slate-500/5 rounded-full">
                            <Wallet2 size={32} strokeWidth={1.5} />
                        </div>
                        <p className="text-sm font-medium">Chưa có dữ liệu thanh toán</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default memo(PaymentChart);
