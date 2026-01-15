import React from 'react';

/**
 * Header hiển thị logo ShiftPay ở trang login
 */
const LoginHeader: React.FC = () => {
  return (
    <div className="w-full pt-6 pb-0 flex justify-center z-10 relative">
      <img src="/logo_text.png" alt="ShiftPay" className="h-8 object-contain" />
    </div>
  );
};

export default LoginHeader;
