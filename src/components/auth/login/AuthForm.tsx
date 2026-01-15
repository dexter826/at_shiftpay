import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Lock, ChevronLeft } from 'lucide-react';
import Button from '../../ui/Button';
import { ValidationError } from './ValidationError';
import EyeIcon from '../../ui/icons/eye-icon';
import EyeOffIcon from '../../ui/icons/eye-off-icon';
import { AnimatedIconHandle } from '../../ui/icons/types';
import MonkeyAvatar from './MonkeyAvatar';

interface AuthFormProps {
  isSignUp: boolean;
  savedUser: any;
  showQuickLogin: boolean;
  onBackToQuickLogin: () => void;
  hoverBgClass: string;
  textMutedClass: string;
  verificationSent: boolean;
  verificationEmail: string;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  email: string;
  onEmailChange: (value: string) => void;
  onValidateEmail: (value: string) => boolean;
  emailError: string;
  inputBorderClass: string;
  textPrimaryClass: string;
  textSecondaryClass: string;
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
  eyeOffIconRef: React.RefObject<AnimatedIconHandle>;
  eyeIconRef: React.RefObject<AnimatedIconHandle>;
  confirmPassword: string;
  setConfirmPassword: (value: string) => void;
  confirmPasswordError: string;
  onValidateConfirmPassword: (value: string) => boolean;
  showConfirmPassword: boolean;
  setShowConfirmPassword: (value: boolean) => void;
  confirmEyeOffIconRef: React.RefObject<AnimatedIconHandle>;
  confirmEyeIconRef: React.RefObject<AnimatedIconHandle>;
  codeDigits: string[];
  onCodePaste: (e: React.ClipboardEvent) => void;
  inputRefs: React.RefObject<HTMLInputElement>[];
  onCodeChange: (index: number, value: string) => void;
  onCodeKeyDown: (index: number, e: React.KeyboardEvent) => void;
  codeError: string;
  rememberMe: boolean;
  setRememberMe: (value: boolean) => void;
  onForgotPassword: () => void;
  error: string;
  loading: boolean;
  onSwitchMode: () => void;
  borderClass: string;
}

/**
 * Form đăng nhập/đăng ký chính
 */
const AuthForm: React.FC<AuthFormProps> = ({
  isSignUp,
  savedUser,
  showQuickLogin,
  onBackToQuickLogin,
  hoverBgClass,
  textMutedClass,
  verificationSent,
  verificationEmail,
  onSubmit,
  email,
  onEmailChange,
  onValidateEmail,
  emailError,
  inputBorderClass,
  textPrimaryClass,
  textSecondaryClass,
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
  eyeOffIconRef,
  eyeIconRef,
  confirmPassword,
  setConfirmPassword,
  confirmPasswordError,
  onValidateConfirmPassword,
  showConfirmPassword,
  setShowConfirmPassword,
  confirmEyeOffIconRef,
  confirmEyeIconRef,
  codeDigits,
  onCodePaste,
  inputRefs,
  onCodeChange,
  onCodeKeyDown,
  codeError,
  rememberMe,
  setRememberMe,
  onForgotPassword,
  error,
  loading,
  onSwitchMode,
  borderClass
}) => {
  const [isFocusing, setIsFocusing] = useState(false);

  return (
    <motion.div
      key={isSignUp ? 'signup-form' : 'login-form'}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="relative"
    >
      {/* Monkey Animation - Only for Login */}
      {!isSignUp && (
        <MonkeyAvatar isBlind={!showPassword} isFocusing={isFocusing} />
      )}

      {/* Back button if saved user exists */}
      {!isSignUp && savedUser && !showQuickLogin && (
        <button
          onClick={onBackToQuickLogin}
          className={`absolute top-0 left-0 z-20 p-2 rounded-full ${hoverBgClass} ${textMutedClass} hover:text-primary transition-colors`}
          title={`Quay lại đăng nhập với ${savedUser.displayName}`}
        >
          <ChevronLeft size={24} />
        </button>
      )}

      <motion.h2
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-3xl font-retro text-primary mb-4 text-center drop-shadow-[3px_3px_0px_rgba(0,0,0,1)] tracking-wide"
      >
        {isSignUp ? 'Đăng ký' : 'Đăng nhập'}
      </motion.h2>

      {verificationSent && (
        <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-start gap-3">
          <div className="mt-0.5">✓</div>
          <div>
            <p className="font-semibold text-sm">Đăng ký thành công!</p>
            <p className="text-sm mt-1 opacity-90">Email xác thực đã được gửi đến <span className="font-bold">{verificationEmail}</span></p>
          </div>
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-2">
        {/* Email */}
        <div className="space-y-1">
          <label className={`text-sm font-medium ${textSecondaryClass} ml-1`}>
            Email
          </label>
          <div className="relative group">
            <div className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${textMutedClass} group-focus-within:text-primary`}>
              <User size={18} />
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              onFocus={() => setIsFocusing(true)}
              onBlur={() => {
                setIsFocusing(false);
                onValidateEmail(email);
              }}
              className={`w-full bg-transparent pl-10 pr-4 py-2 rounded-xl border ${emailError
                ? 'border-red-500 focus:ring-red-500/20'
                : `${inputBorderClass} focus:border-primary focus:ring-primary/20`}
                focus:ring-2 focus:outline-none transition-all duration-200 text-sm ${textPrimaryClass}`}
              placeholder="Nhập email của bạn"
              autoComplete="email"
            />
          </div>
          <ValidationError message={emailError} />
        </div>

        {/* Họ tên */}
        {isSignUp && (
          <div className="space-y-1">
            <label className={`text-sm font-medium ${textSecondaryClass} ml-1`}>
              Họ và tên
            </label>
            <div className="relative group">
              <div className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${textMutedClass} group-focus-within:text-primary`}>
                <User size={18} />
              </div>
              <input
                type="text"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (fullNameError) onValidateFullName(e.target.value);
                }}
                onFocus={() => setIsFocusing(true)}
                onBlur={() => {
                  setIsFocusing(false);
                  onValidateFullName(fullName);
                }}
                className={`w-full bg-transparent pl-10 pr-4 py-2 rounded-xl border ${fullNameError
                  ? 'border-red-500 focus:ring-red-500/20'
                  : `${inputBorderClass} focus:border-primary focus:ring-primary/20`}
                  focus:ring-2 focus:outline-none transition-all duration-200 text-sm ${textPrimaryClass}`}
                placeholder="Nhập họ tên của bạn"
                autoComplete="name"
               />
            </div>
            <ValidationError message={fullNameError} />
          </div>
        )}

        {/* Mật khẩu */}
        <div className="space-y-1">
          <label className={`text-sm font-medium ${textSecondaryClass} ml-1`}>
            Mật khẩu
          </label>
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
                if (isSignUp && confirmPassword && confirmPasswordError) {
                  onValidateConfirmPassword(confirmPassword);
                }
              }}
              onFocus={() => setIsFocusing(true)}
              onBlur={() => {
                setIsFocusing(false);
                onValidatePassword(password);
              }}
              className={`w-full bg-transparent pl-10 pr-11 py-2 rounded-xl border ${passwordError
                ? 'border-red-500 focus:ring-red-500/20'
                : `${inputBorderClass} focus:border-primary focus:ring-primary/20`}
                focus:ring-2 focus:outline-none transition-all duration-200 text-sm ${textPrimaryClass}`}
              placeholder="Nhập mật khẩu"
              autoComplete={isSignUp ? "new-password" : "current-password"}
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

        {/* Xác nhận mật khẩu */}
        {isSignUp && (
          <div className="space-y-1">
            <label className={`text-sm font-medium ${textSecondaryClass} ml-1`}>
              Xác nhận mật khẩu
            </label>
            <div className="relative group">
              <div className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${textMutedClass} group-focus-within:text-primary`}>
                <Lock size={18} />
              </div>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (confirmPasswordError) onValidateConfirmPassword(e.target.value);
                }}
                onFocus={() => setIsFocusing(true)}
                onBlur={() => {
                  setIsFocusing(false);
                  onValidateConfirmPassword(confirmPassword);
                }}
                className={`w-full bg-transparent pl-10 pr-11 py-2 rounded-xl border ${confirmPasswordError
                  ? 'border-red-500 focus:ring-red-500/20'
                  : `${inputBorderClass} focus:border-primary focus:ring-primary/20`}
                  focus:ring-2 focus:outline-none transition-all duration-200 text-sm ${textPrimaryClass}`}
                placeholder="Nhập lại mật khẩu"
                autoComplete="new-password"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                onMouseEnter={() => {
                    if (showConfirmPassword) confirmEyeOffIconRef.current?.startAnimation();
                    else confirmEyeIconRef.current?.startAnimation();
                }}
                onMouseLeave={() => {
                    if (showConfirmPassword) confirmEyeOffIconRef.current?.stopAnimation();
                    else confirmEyeIconRef.current?.stopAnimation();
                }}
                className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md ${hoverBgClass} ${textMutedClass} transition-colors`}
              >
                {showConfirmPassword ? <EyeOffIcon ref={confirmEyeOffIconRef} size={16} /> : <EyeIcon ref={confirmEyeIconRef} size={16} />}
               </button>
            </div>
            <ValidationError message={confirmPasswordError} />
          </div>
        )}

        {/* Mã bếp */}
        {isSignUp && (
          <div className="space-y-1">
            <label className={`block text-sm font-medium ${textSecondaryClass} ml-1`}>Nhập 4 số là địa chỉ "Bếp"</label>
            <div className="flex gap-2 justify-center" onPaste={onCodePaste}>
              {codeDigits.map((digit, index) => (
                <input
                  key={index}
                  ref={inputRefs[index]}
                  type="tel"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => onCodeChange(index, e.target.value)}
                  onKeyDown={(e) => onCodeKeyDown(index, e)}
                  className={`w-10 h-9 text-center text-base font-bold bg-transparent border rounded-xl
                ${codeError
                      ? 'border-red-500 focus:ring-red-500/20'
                      : `${inputBorderClass} focus:border-primary focus:ring-primary/20`}
                focus:ring-2 focus:outline-none transition-all duration-200 ${textPrimaryClass}`}
                />
               ))}
            </div>
            <ValidationError message={codeError} />
          </div>
        )}

        {/* Ghi nhớ & Quên mật khẩu */}
        {!isSignUp && (
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
              className="text-sm text-primary hover:text-[#f0c654] font-medium transition-colors hover:underline"
            >
              Quên mật khẩu?
            </button>
          </div>
        )}

        <div className="pt-2">
          <Button
            type="submit"
            disabled={loading}
            fullWidth
            className="h-11 text-sm"
          >
            {loading ? 'Đang xử lý...' : (isSignUp ? 'Đăng ký' : 'Đăng nhập')}
          </Button>
        </div>
      </form>

      {/* Đổi chế độ mobile */}
      <div className={`md:hidden mt-8 text-center border-t ${borderClass} pt-6`}>
        <p className={`text-sm ${textMutedClass} mb-3`}>
          {isSignUp ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'}
        </p>
        <button
          onClick={onSwitchMode}
          className="text-primary hover:text-[#f0c654] text-sm font-semibold transition-colors"
        >
          {isSignUp ? 'Đăng nhập ngay' : 'Tạo tài khoản mới'}
        </button>
      </div>
    </motion.div>
  );
};

export default AuthForm;
