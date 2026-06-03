import React from 'react';
import { motion } from 'framer-motion';
import { Mail, RefreshCw, LogOut } from 'lucide-react';
import Button from '../../ui/Button';

interface VerificationViewProps {
  currentUser: any;
  loading: boolean;
  onCheckVerification: () => Promise<void>;
  onResendEmail: () => Promise<void>;
  onLogout: () => void;
}

const VerificationView: React.FC<VerificationViewProps> = ({
  currentUser, loading, onCheckVerification, onResendEmail, onLogout,
}) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.95 }}
    className="flex flex-col items-center text-center space-y-5"
  >
    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary">
      <Mail size={32} />
    </div>

    <div>
      <h2 className="text-xl font-bold text-primary mb-1">Xác thực Email</h2>
      <p className="text-sm text-[var(--text-secondary)]">Email xác thực đã gửi đến:</p>
      <p className="text-sm font-bold text-primary mt-0.5">{currentUser?.email}</p>
    </div>

    <div className="p-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg w-full space-y-2 text-left">
      <p className="text-xs text-[var(--text-muted)] flex items-start gap-2">
        <span className="text-primary mt-0.5">•</span> Kiểm tra hộp thư đến (hoặc thư rác)
      </p>
      <p className="text-xs text-[var(--text-muted)] flex items-start gap-2">
        <span className="text-primary mt-0.5">•</span> Nhấn vào đường link trong email để xác nhận
      </p>
    </div>

    <div className="w-full space-y-2">
      <Button onClick={onCheckVerification} fullWidth disabled={loading} className="h-11 text-sm">
        {loading ? <RefreshCw className="animate-spin" size={16} /> : null}
        Tôi đã xác thực
      </Button>

      <button onClick={onResendEmail} disabled={loading} className="w-full py-2 text-xs font-medium text-[var(--text-secondary)] hover:text-primary transition-colors flex items-center justify-center gap-1">
        <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
        Gửi lại email
      </button>

      <button onClick={onLogout} className="w-full py-2 text-xs font-medium text-red-500 hover:text-red-400 transition-colors flex items-center justify-center gap-1 border-t border-[var(--border-color)] mt-2 pt-3">
        <LogOut size={12} /> Quay lại đăng nhập
      </button>
    </div>
  </motion.div>
);

export default VerificationView;
