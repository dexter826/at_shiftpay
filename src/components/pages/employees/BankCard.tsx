import React from 'react';
import { useThemeStore } from '../../../stores';

interface BankCardProps {
    bankName?: string;
    accountNumber?: string;
    accountName?: string;
}

const BankCard: React.FC<BankCardProps> = ({
    bankName = 'Ngân hàng',
    accountNumber = '**** **** **** ****',
    accountName = 'CHỦ TÀI KHOẢN'
}) => {
    const isDark = useThemeStore(state => state.theme) === 'dark';

    return (
        <div className="w-full max-w-[320px] aspect-[1.586/1] relative self-center isolate">
            <div className="absolute inset-0 rounded-2xl shadow-2xl border border-[var(--border-color)] bg-[var(--bg-card)] overflow-hidden">
                <div className="relative h-full p-5 flex flex-col justify-between">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/10 rounded-full -ml-12 -mb-12 blur-xl pointer-events-none" />

                    <div>
                        <div className="flex justify-between items-start mb-6">
                            <div className="space-y-1">
                                <p className="text-[10px] uppercase tracking-widest font-bold text-[var(--text-secondary)]">
                                    Hệ thống thanh toán
                                </p>
                                <h3 className="text-lg font-black italic tracking-tighter text-[var(--text-primary)]">
                                    {bankName}
                                </h3>
                            </div>
                            <div className="w-10 h-8 rounded-md bg-yellow-500 relative overflow-hidden border border-yellow-700/30 flex-shrink-0 shadow-[inset_0_1px_1px_rgba(255,255,255,0.5)] text-yellow-900/80">
                                <svg viewBox="0 0 40 32" className="w-full h-full opacity-60 pointer-events-none" fill="none" stroke="currentColor" strokeWidth="1.2">
                                    <rect x="14" y="8" width="12" height="16" rx="4" />
                                    <path d="M14 12 C 10 12 7 12 7 6" />
                                    <path d="M14 20 C 10 20 7 20 7 26" />
                                    <path d="M26 12 C 30 12 33 12 33 6" />
                                    <path d="M26 20 C 30 20 33 20 33 26" />
                                    <path d="M14 16 H 4" />
                                    <path d="M26 16 H 36" />
                                </svg>

                            </div>
                        </div>

                        <div className="mb-4">
                            <p className="text-[8px] uppercase tracking-widest mb-1 font-semibold text-[var(--text-muted)]">
                                Số tài khoản
                            </p>
                            <p className="text-xl font-mono font-bold tracking-[0.12em] text-[var(--text-primary)] drop-shadow-sm">
                                {accountNumber}
                            </p>
                        </div>
                    </div>

                    <div className="flex justify-between items-end">
                        <div className="flex-1 min-w-0">
                            <p className="text-[8px] uppercase tracking-widest mb-0.5 font-semibold text-[var(--text-muted)]">
                                Chủ tài khoản
                            </p>
                            <p className="text-sm font-bold truncate uppercase text-[var(--text-primary)]">
                                {accountName}
                            </p>
                        </div>

                        <div className="flex -space-x-3 opacity-95 flex-shrink-0">
                            <div className={`w-7 h-7 rounded-full ${isDark ? 'bg-red-500/80 mix-blend-screen' : 'bg-red-500'}`} />
                            <div className={`w-7 h-7 rounded-full ${isDark ? 'bg-yellow-500/80 mix-blend-screen' : 'bg-yellow-400'}`} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BankCard;
