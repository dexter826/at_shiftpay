import React from 'react';
import { Heart } from 'lucide-react';

interface LoginIllustrationProps {
  textSecondaryClass: string;
  textMutedClass: string;
  borderClass: string;
  hoverBgClass: string;
  isSignUp: boolean;
  onSwitchMode: () => void;
  showSwitchMode: boolean;
}

/**
 * Phần minh họa bên trái của trang login
 */
const LoginIllustration: React.FC<LoginIllustrationProps> = ({
  textSecondaryClass,
  textMutedClass,
  borderClass,
  hoverBgClass,
  isSignUp,
  onSwitchMode,
  showSwitchMode
}) => {
  return (
    <div className="hidden md:flex md:w-1/2 flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="w-full relative z-10 text-center flex flex-col items-center justify-center">
        <img
          src="/background.png"
          alt="Illustration"
          className="max-w-[180px] mx-auto mb-4 drop-shadow-2xl hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
        <p className={`text-sm font-medium ${textSecondaryClass} mt-2 max-w-xs leading-relaxed`}>
          Ứng dụng quản lý nhân sự và tính công lương theo ca làm việc
        </p>
      </div>

      <div className="relative z-10 w-full pt-8">
        <div className="flex flex-col items-center">
          <p className={`text-xs ${textMutedClass} mt-1 flex items-center justify-center gap-1.5`}>
            Made with <Heart size={12} className="text-red-500 fill-red-500 animate-pulse" /> by
            <a
              href="https://github.com/dexter826/dexter826"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-primary hover:text-[#f0c654] transition-colors"
            >
              MOB
            </a>
          </p>
          {showSwitchMode && (
            <button
              onClick={onSwitchMode}
              className={`mt-4 px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 border ${borderClass} ${hoverBgClass} ${textSecondaryClass}`}
            >
              {isSignUp ? 'Đã có tài khoản? Đăng nhập' : 'Tạo tài khoản mới'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginIllustration;
