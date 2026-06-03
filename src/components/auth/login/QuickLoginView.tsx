import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Eye, EyeOff, X, ChevronRight } from 'lucide-react';
import Button from '../../ui/Button';
import Checkbox from '../../ui/Checkbox';
import { ValidationError } from './ValidationError';

interface QuickLoginViewProps {
  savedUser: { email: string; displayName: string; photoURL?: string };
  onRemoveAccount: () => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  onSwitchAccount: () => void;
  onForgotPassword: () => void;
  password: string;
  setPassword: (value: string) => void;
  passwordError: string;
  onValidatePassword: (value: string) => boolean;
  showPassword: boolean;
  setShowPassword: (value: boolean) => void;
  error: string;
  rememberMe: boolean;
  setRememberMe: (value: boolean) => void;
  loading: boolean;
}

const QuickLoginView: React.FC<QuickLoginViewProps> = ({
  savedUser, onRemoveAccount, onSubmit, onSwitchAccount, onForgotPassword,
  password, setPassword, passwordError, onValidatePassword,
  showPassword, setShowPassword, error, rememberMe, setRememberMe, loading,
}) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.95 }}
    className="flex flex-col items-center text-center space-y-5"
  >
    <div className="relative">
      <div className="w-20 h-20 rounded-full border-2 border-primary/30 overflow-hidden">
        <img src={savedUser.photoURL || '/avatar.png'} alt={savedUser.displayName} className="w-full h-full object-cover" />
      </div>
      <button type="button" onClick={onRemoveAccount} className="absolute -top-1 -right-1 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white p-0.5 rounded-full transition-colors">
        <X size={12} />
      </button>
    </div>

    <div>
      <h2 className="text-xl font-bold text-primary">Xin chào!</h2>
      <p className="text-sm text-[var(--text-secondary)] mt-0.5">{savedUser.displayName}</p>
      <p className="text-xs text-[var(--text-muted)] mt-0.5">{savedUser.email}</p>
    </div>

    <form onSubmit={onSubmit} className="w-full space-y-3">
      <input type="text" name="username" value={savedUser.email} readOnly className="hidden" autoComplete="username" />
      <div className="text-left space-y-1">
        <div className="relative">
          <Lock size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => { setPassword(e.target.value); if (passwordError) onValidatePassword(e.target.value); }} className={`w-full bg-transparent pl-9 pr-9 py-2 rounded-lg border text-sm transition-colors ${passwordError ? 'border-red-500' : 'border-[var(--border-color)] focus:border-primary'} focus:outline-none text-[var(--text-primary)]`} placeholder="Nhập mật khẩu" autoComplete="current-password" autoFocus />
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-[var(--text-muted)] hover:text-[var(--text-primary)]">
            {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
        <ValidationError message={passwordError} />
      </div>

      <AnimatePresence>
        {error && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="p-2 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-500">{error}</div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between pt-1">
        <Checkbox checked={rememberMe} onChange={setRememberMe} label="Ghi nhớ" />
        <button type="button" onClick={onForgotPassword} className="text-xs text-primary hover:underline font-medium">Quên mật khẩu?</button>
      </div>

      <Button type="submit" disabled={loading} fullWidth className="h-10 text-sm">
        {loading ? 'Đang đăng nhập...' : 'Tiếp tục'}
      </Button>

      <button type="button" onClick={onSwitchAccount} className="text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors flex items-center justify-center gap-1 mx-auto">
        <span>Đăng nhập tài khoản khác</span>
        <ChevronRight size={12} />
      </button>
    </form>
  </motion.div>
);

export default QuickLoginView;
