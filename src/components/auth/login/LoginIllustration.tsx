import React from 'react';
import { Heart } from 'lucide-react';

const LoginIllustration: React.FC = () => (
  <div className="hidden md:flex md:w-[45%] min-h-dynamic bg-[var(--bg-card)] border-r border-[var(--border-color)] items-center justify-center p-8 relative overflow-hidden">
    {/* Decorative blobs */}
    <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-primary/[0.04] pointer-events-none" />
    <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-primary/[0.03] pointer-events-none" />

    <div className="relative z-10 flex flex-col items-center text-center gap-6">
      <img src="/logo_text.png" alt="ShiftPay" className="h-10 object-contain" />

      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Quản lý ca làm & tính công</h1>
        <p className="text-sm text-[var(--text-secondary)] max-w-xs leading-relaxed">
          Ứng dụng quản lý nhân sự và tính công lương theo ca làm việc
        </p>
      </div>

      {/* Decorative dots */}
      <div className="flex gap-2 mt-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="w-1.5 h-1.5 rounded-full bg-primary/20" />
        ))}
      </div>

      <p className="text-xs text-[var(--text-muted)] flex items-center gap-1.5 absolute bottom-8">
        Made with <Heart size={11} className="text-red-500 fill-red-500" /> by MOB
      </p>
    </div>
  </div>
);

export default LoginIllustration;
