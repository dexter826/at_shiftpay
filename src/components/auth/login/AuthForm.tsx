import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Lock, Eye, EyeOff, ChevronLeft } from 'lucide-react';
import Button from '../../ui/Button';
import Checkbox from '../../ui/Checkbox';
import { ValidationError } from './ValidationError';

interface AuthFormProps {
  isSignUp: boolean;
  savedUser: any;
  showQuickLogin: boolean;
  onBackToQuickLogin: () => void;
  verificationSent: boolean;
  verificationEmail: string;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  email: string;
  onEmailChange: (value: string) => void;
  onValidateEmail: (value: string) => boolean;
  emailError: string;
  fullName: string;
  setFullName: (value: string) => void;
  fullNameError: string;
  onValidateFullName: (value: string) => boolean;
  password: string;
  setPassword: (value: string) => void;
  passwordError: string;
  onValidatePassword: (value: string) => boolean;
  showPassword: boolean;
  setShowPassword: (value: boolean) => void;
  confirmPassword: string;
  setConfirmPassword: (value: string) => void;
  confirmPasswordError: string;
  onValidateConfirmPassword: (value: string) => boolean;
  showConfirmPassword: boolean;
  setShowConfirmPassword: (value: boolean) => void;
  rememberMe: boolean;
  setRememberMe: (value: boolean) => void;
  onForgotPassword: () => void;
  error: string;
  loading: boolean;
  onSwitchMode: () => void;
}

const AuthForm: React.FC<AuthFormProps> = ({
  isSignUp,
  savedUser,
  showQuickLogin,
  onBackToQuickLogin,
  verificationSent,
  verificationEmail,
  onSubmit,
  email,
  onEmailChange,
  onValidateEmail,
  emailError,
  fullName,
  setFullName,
  fullNameError,
  onValidateFullName,
  password,
  setPassword,
  passwordError,
  onValidatePassword,
  showPassword,
  setShowPassword,
  confirmPassword,
  setConfirmPassword,
  confirmPasswordError,
  onValidateConfirmPassword,
  showConfirmPassword,
  setShowConfirmPassword,
  rememberMe,
  setRememberMe,
  onForgotPassword,
  error,
  loading,
  onSwitchMode,
}) => {
  const inputClass = (hasError: boolean) =>
    `w-full bg-transparent pl-9 pr-9 py-2 rounded-lg border text-sm transition-colors ${
      hasError
        ? 'border-red-500'
        : 'border-[var(--border-color)] focus:border-primary'
    } focus:outline-none text-[var(--text-primary)]`;

  return (
    <motion.div
      key={isSignUp ? 'signup-form' : 'login-form'}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {!isSignUp && savedUser && !showQuickLogin && (
        <button onClick={onBackToQuickLogin} className="mb-4 p-1.5 rounded-lg text-[var(--text-muted)] hover:text-primary transition-colors">
          <ChevronLeft size={20} />
        </button>
      )}

      <h2 className="text-2xl font-bold text-primary text-center mb-5">
        {isSignUp ? 'Đăng ký' : 'Đăng nhập'}
      </h2>

      {verificationSent && (
        <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-sm text-emerald-600 dark:text-emerald-400">
          <p className="font-medium">Đăng ký thành công!</p>
          <p className="mt-0.5 opacity-90">Email xác thực đã gửi đến <span className="font-bold">{verificationEmail}</span></p>
        </div>
      )}

      <AnimatePresence>
        {error && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-3">
            <div className="p-2.5 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-500 text-center">{error}</div>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={onSubmit} className="space-y-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-[var(--text-secondary)] ml-1">Email</label>
          <div className="relative">
            <User size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input type="email" value={email} onChange={(e) => onEmailChange(e.target.value)} onBlur={() => onValidateEmail(email)} className={inputClass(!!emailError)} placeholder="Nhập email" autoComplete="email" />
          </div>
          <ValidationError message={emailError} />
        </div>

        {isSignUp && (
          <div className="space-y-1">
            <label className="text-xs font-medium text-[var(--text-secondary)] ml-1">Họ và tên</label>
            <div className="relative">
              <User size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input type="text" value={fullName} onChange={(e) => { setFullName(e.target.value); if (fullNameError) onValidateFullName(e.target.value); }} onBlur={() => onValidateFullName(fullName)} className={inputClass(!!fullNameError)} placeholder="Nhập họ tên" autoComplete="name" />
            </div>
            <ValidationError message={fullNameError} />
          </div>
        )}

        <div className="space-y-1">
          <label className="text-xs font-medium text-[var(--text-secondary)] ml-1">Mật khẩu</label>
          <div className="relative">
            <Lock size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => { setPassword(e.target.value); if (passwordError) onValidatePassword(e.target.value); }} onBlur={() => onValidatePassword(password)} className={`${inputClass(!!passwordError)} pr-9`} placeholder="Nhập mật khẩu" autoComplete={isSignUp ? 'new-password' : 'current-password'} />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
              {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          <ValidationError message={passwordError} />
        </div>

        {isSignUp && (
          <div className="space-y-1">
            <label className="text-xs font-medium text-[var(--text-secondary)] ml-1">Xác nhận mật khẩu</label>
            <div className="relative">
              <Lock size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); if (confirmPasswordError) onValidateConfirmPassword(e.target.value); }} onBlur={() => onValidateConfirmPassword(confirmPassword)} className={`${inputClass(!!confirmPasswordError)} pr-9`} placeholder="Nhập lại mật khẩu" autoComplete="new-password" />
              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            <ValidationError message={confirmPasswordError} />
          </div>
        )}

        {!isSignUp && (
          <div className="flex items-center justify-between pt-1">
            <Checkbox checked={rememberMe} onChange={setRememberMe} label="Ghi nhớ đăng nhập" />
            <button type="button" onClick={onForgotPassword} className="text-xs text-primary hover:underline font-medium">Quên mật khẩu?</button>
          </div>
        )}

        <Button type="submit" disabled={loading} fullWidth className="h-10 text-sm mt-1">
          {loading ? 'Đang xử lý...' : (isSignUp ? 'Đăng ký' : 'Đăng nhập')}
        </Button>
      </form>

      <div className="mt-5 pt-4 border-t border-[var(--border-color)] text-center">
        <p className="text-xs text-[var(--text-muted)] mb-2">
          {isSignUp ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'}
        </p>
        <button onClick={onSwitchMode} className="text-primary hover:underline text-sm font-medium">
          {isSignUp ? 'Đăng nhập ngay' : 'Tạo tài khoản mới'}
        </button>
      </div>
    </motion.div>
  );
};

export default AuthForm;
