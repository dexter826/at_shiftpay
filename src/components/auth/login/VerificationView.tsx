import React from 'react';
import { motion } from 'framer-motion';
import { Mail, RefreshCw, CheckCircle2, LogOut } from 'lucide-react';
import Button from '../../ui/Button';

interface VerificationViewProps {
  currentUser: any;
  textSecondaryClass: string;
  textMutedClass: string;
  isDark: boolean;
  borderClass: string;
  loading: boolean;
  onCheckVerification: () => Promise<void>;
  onResendEmail: () => Promise<void>;
  onLogout: () => void;
}

/**
 * Giao diện thông báo xác thực email
 */
const VerificationView: React.FC<VerificationViewProps> = ({
  currentUser,
  textSecondaryClass,
  textMutedClass,
  isDark,
  borderClass,
  loading,
  onCheckVerification,
  onResendEmail,
  onLogout
}) => {
  return (
    <motion.div
      key="unverified-view"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="flex flex-col items-center text-center space-y-6"
    >
      <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary relative">
        <Mail size={40} />
        <div className="absolute -top-1 -right-1 bg-amber-500 w-6 h-6 rounded-full border-4 border-slate-900 flex items-center justify-center">
          <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold font-retro text-primary mb-2">Xác thực Email</h2>
        <p className={`text-sm ${textSecondaryClass} max-w-xs mx-auto`}>
          Chúng tôi đã gửi email xác thực đến:
          <span className="block font-bold text-primary mt-1">{currentUser?.email}</span>
        </p>
      </div>

      <div className={`p-4 ${isDark ? 'bg-slate-800/50' : 'bg-slate-50'} rounded-2xl border ${borderClass} w-full space-y-3`}>
        <div className="flex items-start gap-3 text-left">
          <CheckCircle2 size={16} className="text-primary mt-0.5 flex-shrink-0" />
          <p className={`text-xs ${textMutedClass}`}>Kiểm tra hộp thư đến (hoặc thư rác).</p>
        </div>
        <div className="flex items-start gap-3 text-left">
          <CheckCircle2 size={16} className="text-primary mt-0.5 flex-shrink-0" />
          <p className={`text-xs ${textMutedClass}`}>Nhấn vào đường link trong email để xác nhận.</p>
        </div>
      </div>

      <div className="w-full space-y-3">
        <Button
          onClick={onCheckVerification}
          fullWidth
          disabled={loading}
          className="h-12 flex items-center justify-center gap-2 mt-4"
        >
          {loading ? <RefreshCw className="animate-spin" size={18} /> : null}
          Tôi đã xác thực
        </Button>

        <button
          onClick={onResendEmail}
          disabled={loading}
          className={`w-full py-2.5 text-sm font-medium ${textSecondaryClass} hover:text-primary transition-colors flex items-center justify-center gap-2`}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Gửi lại email xác thực
        </button>

        <button
          onClick={onLogout}
          className={`w-full py-2.5 text-sm font-medium text-red-500 hover:text-red-400 transition-colors flex items-center justify-center gap-2 border-t ${borderClass} mt-2 pt-4`}
        >
          <LogOut size={14} />
          Quay lại đăng nhập
        </button>
      </div>
    </motion.div>
  );
};

export default VerificationView;
