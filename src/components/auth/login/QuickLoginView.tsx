import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, X, ChevronRight } from 'lucide-react';
import Button from '../../ui/Button';
import { ValidationError } from './ValidationError';
import EyeIcon from '../../ui/icons/eye-icon';
import EyeOffIcon from '../../ui/icons/eye-off-icon';
import { AnimatedIconHandle } from '../../ui/icons/types';

interface QuickLoginViewProps {
  savedUser: {
    email: string;
    displayName: string;
    photoURL?: string;
  };
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
  eyeOffIconRef: React.RefObject<AnimatedIconHandle>;
  eyeIconRef: React.RefObject<AnimatedIconHandle>;
  hoverBgClass: string;
  textMutedClass: string;
  inputBorderClass: string;
  textPrimaryClass: string;
  textSecondaryClass: string;
  error: string;
  rememberMe: boolean;
  setRememberMe: (value: boolean) => void;
  loading: boolean;
}

/**
 * Giao diện đăng nhập nhanh cho user đã lưu
 */
const QuickLoginView: React.FC<QuickLoginViewProps> = ({
  savedUser,
  onRemoveAccount,
  onSubmit,
  onSwitchAccount,
  onForgotPassword,
  password,
  setPassword,
  passwordError,
  onValidatePassword,
  showPassword,
  setShowPassword,
  eyeOffIconRef,
  eyeIconRef,
  hoverBgClass,
  textMutedClass,
  inputBorderClass,
  textPrimaryClass,
  textSecondaryClass,
  error,
  rememberMe,
  setRememberMe,
  loading
}) => {
  return (
    <motion.div
      key="quick-login"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center text-center space-y-6"
    >
      <div className="relative">
        <div className="w-24 h-24 rounded-full p-1 border-2 border-primary shadow-[0_0_20px_rgba(236,181,45,0.3)]">
          <img
            src={savedUser.photoURL || "/avatar.png"}
            alt={savedUser.displayName}
            className="w-full h-full rounded-full object-cover bg-slate-100 dark:bg-slate-800"
            onError={(e) => {
              e.currentTarget.src = "/avatar.png";
            }}
          />
        </div>
        <div className="absolute bottom-0 right-0 bg-green-500 w-5 h-5 rounded-full border-2 border-slate-900 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>

        <button
          type="button"
          onClick={onRemoveAccount}
          className="absolute -top-1 -right-1 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white p-1 rounded-full border border-red-500/20 transition-all duration-200"
          title="Gỡ tài khoản"
        >
          <X size={12} />
        </button>
      </div>

      <div>
        <h2 className="text-2xl font-bold font-retro text-primary mb-1">Xin chào!</h2>
        <p className={`text-lg font-medium ${textSecondaryClass}`}>{savedUser.displayName}</p>
        <p className={`text-sm ${textMutedClass} mt-1`}>{savedUser.email}</p>
      </div>

      <form onSubmit={onSubmit} className="w-full space-y-2">
        <input 
          type="text" 
          name="username" 
          value={savedUser.email} 
          readOnly 
          className="hidden" 
          autoComplete="username" 
        />
        <div className="space-y-2 text-left">
          <div className="relative group">
            <div className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${textMutedClass} group-focus-within:text-primary`}>
              <Lock size={18} />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (passwordError) onValidatePassword(e.target.value);
              }}
              className={`w-full bg-transparent pl-10 pr-11 py-3 rounded-xl border ${passwordError
                ? 'border-red-500 focus:ring-red-500/20'
                : `${inputBorderClass} focus:border-primary focus:ring-primary/20`}
                         focus:ring-2 focus:outline-none transition-all duration-200 text-sm ${textPrimaryClass}`}
              placeholder="Nhập mật khẩu"
              autoComplete="current-password"
              autoFocus
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword(!showPassword)}
              onMouseEnter={() => {
                  if (showPassword) eyeOffIconRef.current?.startAnimation();
                  else eyeIconRef.current?.startAnimation();
              }}
              onMouseLeave={() => {
                  if (showPassword) eyeOffIconRef.current?.stopAnimation();
                  else eyeIconRef.current?.stopAnimation();
              }}
              className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md ${hoverBgClass} ${textMutedClass} transition-colors`}
            >
              {showPassword ? <EyeOffIcon ref={eyeOffIconRef} size={16} /> : <EyeIcon ref={eyeIconRef} size={16} />}
            </button>
          </div>
          <ValidationError message={passwordError} />
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ height: 0, opacity: 0, scale: 0.95 }}
              animate={{ height: 'auto', opacity: 1, scale: 1 }}
              exit={{ height: 0, opacity: 0, scale: 0.95 }}
              className="overflow-hidden"
            >
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-sm rounded-xl flex items-center gap-2 animate-pulse justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                {error}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-between pt-2">
          <label className="flex items-center gap-2 cursor-pointer group">
            <div className="relative flex items-center">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className={`peer h-4 w-4 cursor-pointer appearance-none rounded border border-slate-200 dark:border-slate-700 checked:border-primary checked:bg-primary transition-all`}
              />
              <svg className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none opacity-0 peer-checked:opacity-100 text-white transition-opacity" viewBox="0 0 12 12" fill="none">
                <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className={`text-sm ${textMutedClass} group-hover:${textSecondaryClass} transition-colors`}>
              Ghi nhớ đăng nhập
            </span>
          </label>
          <button
            type="button"
            onClick={onForgotPassword}
            className="text-sm font-medium text-primary hover:text-[#f0c654] transition-colors"
          >
            Quên mật khẩu?
          </button>
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            disabled={loading}
            fullWidth
            className="h-11 text-sm"
          >
            {loading ? 'Đăng nhập...' : 'Tiếp tục'}
          </Button>
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <button
            type="button"
            onClick={onSwitchAccount}
            className={`text-sm ${textMutedClass} hover:${textSecondaryClass} hover:underline transition-colors flex items-center justify-center gap-1 mx-auto`}
          >
            <span>Đăng nhập tài khoản khác</span>
            <ChevronRight size={14} />
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default QuickLoginView;
