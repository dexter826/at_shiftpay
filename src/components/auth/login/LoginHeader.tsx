import React from 'react';

/**
 * Header hiển thị logo ShiftPay ở trang login
 */
const LoginHeader: React.FC = () => {
  return (
    <div className="w-full pb-0 flex flex-col items-center z-10 relative gap-2">
      <img src="/logo_text.png" alt="ShiftPay" className="h-8 object-contain" />
      <p className="text-xs text-[var(--text-muted)]">Quản lý ca làm &amp; tính công</p>
    </div>
  );
};

export default LoginHeader;
