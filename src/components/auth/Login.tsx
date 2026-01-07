import React, { useState, useRef, useEffect } from 'react';
import { auth } from '../../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, setPersistence, browserLocalPersistence, browserSessionPersistence, sendEmailVerification } from 'firebase/auth';
import { useThemeStyles } from '../../hooks/useThemeStyles';
import { User, Lock, Eye, EyeOff, Heart, X, ChevronRight, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { ForgotPasswordModal } from './ForgotPasswordModal';
import Button from '../ui/Button';
import { useAuthStore } from '../../stores/authStore';

interface LoginProps {
  onLogin: () => void;
}

interface SavedUser {
  email: string;
  displayName: string;
}

const CORRECT_CODE = '2738';

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);

  const { savedUser, saveUserInfo, clearSavedUserInfo } = useAuthStore();

  const [showQuickLogin, setShowQuickLogin] = useState<boolean>(false);

  useEffect(() => {
    if (savedUser && !showQuickLogin && !password) {
      setShowQuickLogin(true);
    }
  }, [savedUser]);

  const [codeDigits, setCodeDigits] = useState(['', '', '', '']);
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [fullNameError, setFullNameError] = useState('');
  const [codeError, setCodeError] = useState('');

  useEffect(() => {
    if (savedUser && showQuickLogin) {
      setEmail(savedUser.email);
    }
  }, [savedUser, showQuickLogin]);

  const validateEmail = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!value) {
      setEmailError('Email không được để trống');
      return false;
    }
    if (!emailRegex.test(value)) {
      setEmailError('Email không hợp lệ');
      return false;
    }
    setEmailError('');
    return true;
  };

  const validatePassword = (value: string) => {
    if (!value) {
      setPasswordError('Mật khẩu không được để trống');
      return false;
    }
    if (value.length < 6) {
      setPasswordError('Mật khẩu phải có ít nhất 6 ký tự');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const validateFullName = (value: string) => {
    if (!value.trim()) {
      setFullNameError('Họ tên không được để trống');
      return false;
    }
    if (value.trim().length < 2) {
      setFullNameError('Họ tên phải có ít nhất 2 ký tự');
      return false;
    }
    setFullNameError('');
    return true;
  };

  const validateConfirmPassword = (value: string) => {
    if (!value) {
      setConfirmPasswordError('Vui lòng xác nhận mật khẩu');
      return false;
    }
    if (value !== password) {
      setConfirmPasswordError('Mật khẩu không khớp');
      return false;
    }
    setConfirmPasswordError('');
    return true;
  };

  const validateCode = () => {
    const code = codeDigits.join('');
    if (code.length !== 4) {
      setCodeError('Vui lòng nhập đủ 4 số');
      return false;
    }
    if (code !== CORRECT_CODE) {
      setCodeError('Mã số không đúng');
      return false;
    }
    setCodeError('');
    return true;
  };

  const handleCodeChange = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) return;
    const newDigits = [...codeDigits];
    newDigits[index] = value;
    setCodeDigits(newDigits);
    setCodeError('');
    if (value && index < 3) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !codeDigits[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handleCodePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 4);
    if (/^\d+$/.test(pastedData)) {
      const newDigits = [...codeDigits];
      for (let i = 0; i < pastedData.length && i < 4; i++) {
        newDigits[i] = pastedData[i];
      }
      setCodeDigits(newDigits);
      setCodeError('');
      const focusIndex = Math.min(pastedData.length, 3);
      inputRefs[focusIndex].current?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);

    if (isSignUp) {
      const isFullNameValid = validateFullName(fullName);
      const isConfirmPasswordValid = validateConfirmPassword(confirmPassword);
      const isCodeValid = validateCode();
      if (!isEmailValid || !isPasswordValid || !isFullNameValid || !isConfirmPasswordValid || !isCodeValid) {
        return;
      }
    } else {
      if (!isEmailValid || !isPasswordValid) {
        return;
      }
    }

    setLoading(true);

    try {
      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: fullName.trim() });
        await sendEmailVerification(userCredential.user);
        setVerificationEmail(email);
        await auth.signOut();
        setVerificationSent(true);
        setError('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setFullName('');
        setCodeDigits(['', '', '', '']);
        setEmailError('');
        setPasswordError('');
        setConfirmPasswordError('');
        setFullNameError('');
        setCodeError('');
        setIsSignUp(false);
        return;
      } else {
        await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        if (!userCredential.user.emailVerified) {
          await auth.signOut();
          setError('Vui lòng xác thực email trước khi đăng nhập.');
          setLoading(false);
          return;
        }

        saveUserInfo({
          email: userCredential.user.email!,
          displayName: userCredential.user.displayName || 'Người dùng'
        });

        onLogin();
      }
    } catch (error: any) {
      let errorMessage = 'Đã xảy ra lỗi';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Email đã được sử dụng';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Email không hợp lệ';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Mật khẩu quá yếu';
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = 'Tài khoản không tồn tại';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Mật khẩu không đúng';
      } else if (error.code === 'auth/invalid-credential') {
        errorMessage = 'Email hoặc mật khẩu không đúng';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Quá nhiều lần thử. Vui lòng thử lại sau';
      }
      setError(errorMessage);
      setLoading(false);
    }
  };

  const handleSwitchMode = () => {
    setIsSignUp(!isSignUp);
    setError('');
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');
    setFullNameError('');
    setCodeError('');
    setCodeDigits(['', '', '', '']);
    setVerificationSent(false);
  };

  const handleSwitchAccount = () => {
    setShowQuickLogin(false);
    setEmail('');
    setPassword('');
    setError('');
  };

  const handleRemoveAccount = () => {
    clearSavedUserInfo();
    handleSwitchAccount();
  };

  const handleBackToQuickLogin = () => {
    if (savedUser) {
      setEmail(savedUser.email);
      setShowQuickLogin(true);
      setError('');
      setPassword('');
    }
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (emailError) validateEmail(value);
    if (verificationSent) setVerificationSent(false);
  };

  const {
    theme,
    bgClass: themeBgClass,
    cardBgClass: themeCardBgClass,
    textPrimaryClass,
    textSecondaryClass,
    textMutedClass,
    inputBorderClass,
    borderClass,
    hoverBgClass
  } = useThemeStyles();

  const isDark = theme === 'dark';

  const bgClass = isDark
    ? 'bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 to-slate-950'
    : 'bg-slate-50 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white to-slate-100';

  const cardBgClass = isDark
    ? 'bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700 shadow-[0_0_40px_-10px_rgba(236,181,45,0.1)]'
    : 'bg-white border border-slate-200 shadow-[0_25px_60px_-15px_rgba(236,181,45,0.25)]';

  const illustrationBg = isDark ? 'bg-slate-900' : 'bg-slate-50';

  return (
    <div className={`min-h-screen ${bgClass} flex items-center justify-center p-4 md:p-6 transition-colors duration-300`}>
      <div className={`w-full max-w-5xl ${cardBgClass} rounded-3xl shadow-2xl overflow-hidden flex flex-col min-h-[600px] transition-all duration-300 relative`}>
        {/* Họa tiết trang trí */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2 pointer-events-none" />

        {/* Logo tiêu đề */}
        <div className="w-full pt-8 pb-2 flex justify-center z-10 relative">
          <img src="/logo_text.png" alt="AT ShiftPay" className="h-12 object-contain" />
        </div>

        <div className="flex flex-col md:flex-row flex-1">
          {/* Cột trái: Minh họa */}
          <div className={`hidden md:flex md:w-1/2 flex-col items-center justify-center p-12 relative overflow-hidden`}>

            <div className="w-full relative z-10 text-center flex flex-col items-center justify-center">
              <img
                src="/background.png"
                alt="Illustration"
                className="max-w-xs mx-auto mb-6 drop-shadow-2xl hover:scale-105 transition-transform duration-500"
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
                {(!savedUser || !showQuickLogin) && (
                  <button
                    onClick={handleSwitchMode}
                    className={`mt-4 px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 border ${borderClass} ${hoverBgClass} ${textSecondaryClass}`}
                  >
                    {isSignUp ? 'Đã có tài khoản? Đăng nhập' : 'Tạo tài khoản mới'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Đường kẻ phân cách */}
          <div className={`hidden md:block w-px ${theme === 'dark' ? 'bg-slate-700/50' : 'bg-slate-200/50'} my-12 self-stretch`} />

          {/* Cột phải: Form */}
          <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col justify-center">
            <div className="max-w-md mx-auto w-full">
              {/* Logo mobile (đã ẩn) */}
              <div className="md:hidden text-center mb-4 hidden">
                <img src="/logo_text.png" alt="AT ShiftPay" className="h-8 mx-auto object-contain" />
              </div>

              <AnimatePresence mode="wait">
                {savedUser && showQuickLogin && !isSignUp ? (
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
                          src="/avatar.png"
                          alt={savedUser.displayName}
                          className="w-full h-full rounded-full object-cover bg-slate-100"
                        />
                      </div>
                      <div className="absolute bottom-0 right-0 bg-green-500 w-5 h-5 rounded-full border-2 border-slate-900 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>

                      <button
                        type="button"
                        onClick={handleRemoveAccount}
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

                    <form onSubmit={handleSubmit} className="w-full space-y-4">
                      <div className="space-y-1.5 text-left">
                        <div className="relative group">
                          <div className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${textMutedClass} group-focus-within:text-primary`}>
                            <Lock size={18} />
                          </div>
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => {
                              setPassword(e.target.value);
                              if (passwordError) validatePassword(e.target.value);
                            }}
                            className={`w-full bg-transparent pl-10 pr-11 py-3 rounded-xl border ${passwordError
                              ? 'border-red-500 focus:ring-red-500/20'
                              : `${inputBorderClass} focus:border-primary focus:ring-primary/20`}
                                        focus:ring-2 focus:outline-none transition-all duration-200 text-sm ${textPrimaryClass}`}
                            placeholder="Nhập mật khẩu"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md ${hoverBgClass} ${textMutedClass} transition-colors`}
                          >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                        {passwordError && <p className="text-red-500 text-xs ml-1 font-medium">{passwordError}</p>}
                      </div>

                      {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-sm rounded-xl flex items-center gap-2 animate-pulse justify-center">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                          </svg>
                          {error}
                        </div>
                      )}

                      <Button
                        type="submit"
                        disabled={loading}
                        fullWidth
                        className="h-12 text-base shadow-lg hover:shadow-primary/25"
                      >
                        {loading ? 'Đang đăng nhập...' : 'Tiếp tục'}
                      </Button>

                      <div className="flex flex-col gap-2 pt-2">
                        <button
                          type="button"
                          onClick={handleSwitchAccount}
                          className={`text-sm ${textMutedClass} hover:${textSecondaryClass} hover:underline transition-colors flex items-center justify-center gap-1 mx-auto`}
                        >
                          <span>Đăng nhập tài khoản khác</span>
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    </form>
                  </motion.div>
                ) : (
                  <motion.div
                    key={isSignUp ? 'signup-form' : 'login-form'}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="relative"
                  >
                    {/* Back button if saved user exists */}
                    {!isSignUp && savedUser && !showQuickLogin && (
                      <button
                        onClick={handleBackToQuickLogin}
                        className={`absolute top-0 left-0 z-20 p-2 rounded-full ${hoverBgClass} ${textMutedClass} hover:text-primary transition-colors`}
                        title={`Quay lại đăng nhập với ${savedUser.displayName}`}
                      >
                        <ChevronLeft size={24} />
                      </button>
                    )}

                    <motion.h2
                      initial={{ y: -10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className="text-4xl font-retro text-primary mb-6 text-center drop-shadow-[4px_4px_0px_rgba(0,0,0,1)] tracking-wide"
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

                    <form onSubmit={handleSubmit} className="space-y-4">
                      {/* Email */}
                      <div className="space-y-1.5">
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
                            onChange={(e) => handleEmailChange(e.target.value)}
                            onBlur={() => validateEmail(email)}
                            className={`w-full bg-transparent pl-10 pr-4 py-2.5 rounded-xl border ${emailError
                              ? 'border-red-500 focus:ring-red-500/20'
                              : `${inputBorderClass} focus:border-primary focus:ring-primary/20`}
                              focus:ring-2 focus:outline-none transition-all duration-200 text-sm ${textPrimaryClass}`}
                            placeholder="Nhập email của bạn"
                          />
                        </div>
                        {emailError && <p className="text-red-500 text-xs ml-1 font-medium">{emailError}</p>}
                      </div>

                      {/* Họ tên */}
                      {isSignUp && (
                        <div className="space-y-1.5">
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
                                if (fullNameError) validateFullName(e.target.value);
                              }}
                              onBlur={() => validateFullName(fullName)}
                              className={`w-full bg-transparent pl-10 pr-4 py-2.5 rounded-xl border ${fullNameError
                                ? 'border-red-500 focus:ring-red-500/20'
                                : `${inputBorderClass} focus:border-primary focus:ring-primary/20`}
                                focus:ring-2 focus:outline-none transition-all duration-200 text-sm ${textPrimaryClass}`}
                              placeholder="Nhập họ tên của bạn"
                            />
                          </div>
                          {fullNameError && <p className="text-red-500 text-xs ml-1 font-medium">{fullNameError}</p>}
                        </div>
                      )}

                      {/* Mật khẩu */}
                      <div className="space-y-1.5">
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
                              if (passwordError) validatePassword(e.target.value);
                              if (isSignUp && confirmPassword && confirmPasswordError) {
                                validateConfirmPassword(confirmPassword);
                              }
                            }}
                            onBlur={() => validatePassword(password)}
                            className={`w-full bg-transparent pl-10 pr-11 py-2.5 rounded-xl border ${passwordError
                              ? 'border-red-500 focus:ring-red-500/20'
                              : `${inputBorderClass} focus:border-primary focus:ring-primary/20`}
                              focus:ring-2 focus:outline-none transition-all duration-200 text-sm ${textPrimaryClass}`}
                            placeholder="Nhập mật khẩu"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md ${hoverBgClass} ${textMutedClass} transition-colors`}
                          >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                        {passwordError && <p className="text-red-500 text-xs ml-1 font-medium">{passwordError}</p>}
                      </div>

                      {/* Xác nhận mật khẩu */}
                      {isSignUp && (
                        <div className="space-y-1.5">
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
                                if (confirmPasswordError) validateConfirmPassword(e.target.value);
                              }}
                              onBlur={() => validateConfirmPassword(confirmPassword)}
                              className={`w-full bg-transparent pl-10 pr-11 py-2.5 rounded-xl border ${confirmPasswordError
                                ? 'border-red-500 focus:ring-red-500/20'
                                : `${inputBorderClass} focus:border-primary focus:ring-primary/20`}
                                focus:ring-2 focus:outline-none transition-all duration-200 text-sm ${textPrimaryClass}`}
                              placeholder="Nhập lại mật khẩu"
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md ${hoverBgClass} ${textMutedClass} transition-colors`}
                            >
                              {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                          {confirmPasswordError && <p className="text-red-500 text-xs ml-1 font-medium">{confirmPasswordError}</p>}
                        </div>
                      )}

                      {/* Mã bếp */}
                      {isSignUp && (
                        <div className="space-y-2">
                          <label className={`block text-sm font-medium ${textSecondaryClass} ml-1`}>Nhập 4 số là địa chỉ "Bếp"</label>
                          <div className="flex gap-3 justify-center" onPaste={handleCodePaste}>
                            {codeDigits.map((digit, index) => (
                              <input
                                key={index}
                                ref={inputRefs[index]}
                                type="tel"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleCodeChange(index, e.target.value)}
                                onKeyDown={(e) => handleCodeKeyDown(index, e)}
                                className={`w-12 h-10 text-center text-lg font-bold bg-transparent border rounded-xl
                              ${codeError
                                    ? 'border-red-500 focus:ring-red-500/20'
                                    : `${inputBorderClass} focus:border-primary focus:ring-primary/20`}
                              focus:ring-2 focus:outline-none transition-all duration-200 ${textPrimaryClass}`}
                              />
                            ))}
                          </div>
                          {codeError && <p className="text-red-500 text-xs ml-1 font-medium">{codeError}</p>}
                        </div>
                      )}

                      {/* Ghi nhớ & Quên mật khẩu */}
                      {!isSignUp && (
                        <div className="flex items-center justify-between pt-1">
                          <label className="flex items-center gap-2 cursor-pointer group">
                            <div className="relative flex items-center">
                              <input
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                className={`peer h-4 w-4 cursor-pointer appearance-none rounded border ${borderClass} checked:border-primary checked:bg-primary transition-all`}
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
                            onClick={() => setForgotPasswordOpen(true)}
                            className="text-sm text-primary hover:text-[#f0c654] font-medium transition-colors hover:underline"
                          >
                            Quên mật khẩu?
                          </button>
                        </div>
                      )}

                      {error && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-sm rounded-xl flex items-center gap-2 animate-pulse">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                          </svg>
                          {error}
                        </div>
                      )}

                      <Button
                        type="submit"
                        disabled={loading}
                        fullWidth
                        className="mt-4"
                      >
                        {loading ? 'Đang xử lý...' : (isSignUp ? 'Đăng ký' : 'Đăng nhập')}
                      </Button>
                    </form>

                    {/* Đổi chế độ mobile */}
                    <div className={`md:hidden mt-8 text-center border-t ${borderClass} pt-6`}>
                      <p className={`text-sm ${textMutedClass} mb-3`}>
                        {isSignUp ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'}
                      </p>
                      <button
                        onClick={handleSwitchMode}
                        className="text-primary hover:text-[#f0c654] text-sm font-semibold transition-colors"
                      >
                        {isSignUp ? 'Đăng nhập ngay' : 'Tạo tài khoản mới'}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      <ForgotPasswordModal
        isOpen={forgotPasswordOpen}
        onClose={() => setForgotPasswordOpen(false)}
      />
    </div>
  );
};
