import React from 'react';
import { useThemeStyles } from '../../../hooks/useThemeStyles';

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
    const { theme } = useThemeStyles();
    const isDark = theme === 'dark';

    return (
        <div className="w-full max-w-[320px] aspect-[1.586/1] relative self-center isolate">
            <div className={`absolute inset-0 rounded-2xl shadow-2xl border ${isDark ? 'border-slate-700' : 'border-primary/10'}`} />
            
            <div 
                className={`absolute inset-0 rounded-2xl overflow-hidden transition-all duration-300 transform-gpu ${
                    isDark 
                        ? 'bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950' 
                        : 'bg-gradient-to-br from-primary via-primary-600 to-primary-700'
                }`}
                style={{ WebkitMaskImage: '-webkit-radial-gradient(white, black)' }} // Ép Chrome cắt góc chính xác
            >
                <div className={`relative h-full p-5 flex flex-col justify-between ${!isDark ? 'text-slate-900' : ''}`}>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/10 rounded-full -ml-12 -mb-12 blur-xl pointer-events-none" />

                    <div>
                        <div className="flex justify-between items-start mb-6">
                            <div className="space-y-1">
                                <p className={`text-[10px] uppercase tracking-widest font-bold ${isDark ? 'text-primary' : 'text-slate-900/50'}`}>
                                    Hệ thống thanh toán
                                </p>
                                <h3 className={`text-lg font-black italic tracking-tighter ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                                    {bankName}
                                </h3>
                            </div>
                            <div className="w-10 h-8 rounded-md bg-gradient-to-br from-yellow-100 via-yellow-400 to-yellow-600 relative overflow-hidden border border-yellow-700/30 flex-shrink-0 shadow-[inset_0_1px_1px_rgba(255,255,255,0.5)]">
                                <svg viewBox="0 0 40 32" className="w-full h-full opacity-60" fill="none" stroke="currentColor" strokeWidth="1.2">
                                    <rect x="14" y="8" width="12" height="16" rx="4" />
                                    <path d="M14 12 C 10 12 7 12 7 6" />
                                    <path d="M14 20 C 10 20 7 20 7 26" />
                                    <path d="M26 12 C 30 12 33 12 33 6" />
                                    <path d="M26 20 C 30 20 33 20 33 26" />
                                    <path d="M14 16 H 4" />
                                    <path d="M26 16 H 36" />
                                </svg>
                                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent" />
                            </div>
                        </div>

                        <div className="mb-4">
                            <p className={`text-[8px] uppercase tracking-widest mb-1 font-semibold ${isDark ? 'text-slate-500' : 'text-slate-900/50'}`}>
                                Số tài khoản
                            </p>
                            <p className={`text-xl font-mono font-bold tracking-[0.12em] ${isDark ? 'text-primary' : 'text-slate-900'} drop-shadow-sm`}>
                                {accountNumber}
                            </p>
                        </div>
                    </div>

                    <div className="flex justify-between items-end">
                        <div className="flex-1 min-w-0">
                            <p className={`text-[8px] uppercase tracking-widest mb-0.5 font-semibold ${isDark ? 'text-slate-500' : 'text-slate-900/50'}`}>
                                Chủ tài khoản
                            </p>
                            <p className={`text-sm font-bold truncate uppercase ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
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
