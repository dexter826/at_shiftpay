import React, { memo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Wallet } from 'lucide-react';
import ChartTooltip from './ChartTooltip';

interface PaymentChartProps {
    data: Array<{ name: string; value: number; color: string }>;
}

const PaymentChart: React.FC<PaymentChartProps> = memo(({ data }) => (
    <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg min-h-[340px] flex flex-col">
        <div className="mb-4">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Phân bổ thanh toán</h3>
            <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">Công chưa trả và đã ứng</p>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center">
            {data.length > 0 ? (
                <div className="w-full flex flex-col items-center gap-4">
                    <div className="relative w-full">
                        <ResponsiveContainer width="100%" height={180}>
                            <PieChart>
                                <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={68} paddingAngle={4} dataKey="value">
                                    {data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                                    ))}
                                </Pie>
                                <Tooltip content={<ChartTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-lg font-bold text-[var(--text-primary)]">{data.reduce((a, c) => a + c.value, 0)}</span>
                            <span className="text-[9px] font-semibold text-[var(--text-muted)] uppercase tracking-widest">Tổng</span>
                        </div>
                    </div>

                    <div className="w-full grid grid-cols-1 gap-1.5">
                        {data.map((item, index) => (
                            <div key={index} className="flex items-center justify-between px-2.5 py-1.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-md">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                                    <span className="text-[11px] text-[var(--text-secondary)]">{item.name}</span>
                                </div>
                                <span className="text-[11px] font-semibold text-[var(--text-primary)]">{item.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center gap-2 text-[var(--text-muted)]">
                    <Wallet size={28} strokeWidth={1.5} />
                    <p className="text-sm">Chưa có dữ liệu</p>
                </div>
            )}
        </div>
    </div>
));

export default PaymentChart;
