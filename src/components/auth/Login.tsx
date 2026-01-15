import React, { useState, useRef, useEffect } from 'react';
import { auth } from '../../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, setPersistence, browserLocalPersistence, browserSessionPersistence, sendEmailVerification } from 'firebase/auth';
import { useThemeStyles } from '../../hooks/useThemeStyles';
import { AnimatePresence } from 'framer-motion';

import { ForgotPasswordModal } from './ForgotPasswordModal';
import { useAuthStore } from '../../stores/authStore';
import { useToast } from '../ui/Toast';
import { Tiles } from '../ui/Tiles';
import { AnimatedIconHandle } from '../ui/icons/types';

// Import sub-components
import LoginHeader from './login/LoginHeader';
import LoginIllustration from './login/LoginIllustration';
import VerificationView from './login/VerificationView';
import QuickLoginView from './login/QuickLoginView';
import AuthForm from './login/AuthForm';

interface LoginProps {
  onLogin: () => void;
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

  const { savedUser, saveUserInfo, clearSavedUserInfo, user: currentUser, refreshUser, logout } = useAuthStore();
  const { showToast } = useToast();

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

  const eyeIconRef = useRef<AnimatedIconHandle>(null);
  const eyeOffIconRef = useRef<AnimatedIconHandle>(null);
  const confirmEyeIconRef = useRef<AnimatedIconHandle>(null);
  const confirmEyeOffIconRef = useRef<AnimatedIconHandle>(null);

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
        
        showToast('Email xác thực đã được gửi!', 'success');
        
        setVerificationEmail(email);
        setVerificationSent(true);
        setError('');
      } else {
        await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        
        if (!userCredential.user.emailVerified) {
          showToast('Tài khoản chưa được xác thực email.', 'warning');
          return;
        }

        saveUserInfo({
          email: userCredential.user.email!,
          displayName: userCredential.user.displayName || 'Người dùng',
          photoURL: userCredential.user.photoURL || undefined
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
      showToast(errorMessage, 'error');
    } finally {
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
    textPrimaryClass,
    textSecondaryClass,
    textMutedClass,
    inputBorderClass,
    borderClass,
    hoverBgClass
  } = useThemeStyles();

  const isDark = theme === 'dark';

  const bgClass = isDark ? 'bg-slate-950' : 'bg-slate-50';

  const cardBgClass = isDark
    ? 'bg-slate-900 border border-slate-700 shadow-[0_0_40px_-10px_rgba(236,181,45,0.1)]'
    : 'bg-white border border-slate-200 shadow-[0_25px_60px_-15px_rgba(236,181,45,0.25)]';

  const handleResendEmail = async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      await sendEmailVerification(currentUser);
      showToast('Đã gửi lại email xác thực.', 'success');
    } catch (err: any) {
      showToast('Gửi lại email thất bại. Vui lòng thử lại sau.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckVerification = async () => {
    try {
      setLoading(true);
      await refreshUser();
      if (auth.currentUser?.emailVerified) {
        showToast('Xác thực thành công!', 'success');
        onLogin();
      } else {
        showToast('Email vẫn chưa được xác thực. Vui lòng kiểm tra hộp thư của bạn.', 'warning');
      }
    } catch (err) {
      showToast('Lỗi khi kiểm tra xác thực.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const isUnverified = currentUser && !currentUser.emailVerified;

  useEffect(() => {
    if (isUnverified) {
      document.title = 'Xác thực Email - ShiftPay';
    } else if (savedUser && showQuickLogin && !isSignUp) {
      document.title = 'Đăng nhập nhanh - ShiftPay';
    } else if (isSignUp) {
      document.title = 'Đăng ký - ShiftPay';
    } else {
      document.title = 'Đăng nhập - ShiftPay';
    }
  }, [isUnverified, isSignUp, savedUser, showQuickLogin]);

  return (
    <div className={`min-h-screen ${bgClass} flex items-center justify-center p-4 md:p-6 relative overflow-hidden bg-slate-50 dark:bg-slate-950`}>
      {/* Background Tiles */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
        <Tiles />
      </div>

      <div className={`w-full max-w-5xl ${cardBgClass} rounded-3xl shadow-2xl overflow-hidden flex flex-col relative my-auto`}>
        <LoginHeader />

        <div className="flex flex-col md:flex-row flex-1">
          <LoginIllustration
            textSecondaryClass={textSecondaryClass}
            textMutedClass={textMutedClass}
            borderClass={borderClass}
            hoverBgClass={hoverBgClass}
            isSignUp={isSignUp}
            onSwitchMode={handleSwitchMode}
            showSwitchMode={!savedUser || !showQuickLogin}
          />

          <div className={`hidden md:block w-px ${isDark ? 'bg-slate-700/50' : 'bg-slate-200/50'} my-12 self-stretch`} />

          <div className="w-full md:w-1/2 p-4 md:p-6 flex flex-col justify-center">
            <div className="max-w-md mx-auto w-full min-h-[550px] flex flex-col justify-center">
              <AnimatePresence mode="wait">
                {isUnverified ? (
                  <VerificationView
                    currentUser={currentUser}
                    textSecondaryClass={textSecondaryClass}
                    textMutedClass={textMutedClass}
                    isDark={isDark}
                    borderClass={borderClass}
                    loading={loading}
                    onCheckVerification={handleCheckVerification}
                    onResendEmail={handleResendEmail}
                    onLogout={logout}
                  />
                ) : savedUser && showQuickLogin && !isSignUp ? (
                  <QuickLoginView
                    savedUser={savedUser}
                    onRemoveAccount={handleRemoveAccount}
                    onSubmit={handleSubmit}
                    onSwitchAccount={handleSwitchAccount}
                    onForgotPassword={() => setForgotPasswordOpen(true)}
                    password={password}
                    setPassword={setPassword}
                    passwordError={passwordError}
                    onValidatePassword={validatePassword}
                    showPassword={showPassword}
                    setShowPassword={setShowPassword}
                    eyeOffIconRef={eyeOffIconRef}
                    eyeIconRef={eyeIconRef}
                    hoverBgClass={hoverBgClass}
                    textMutedClass={textMutedClass}
                    inputBorderClass={inputBorderClass}
                    textPrimaryClass={textPrimaryClass}
                    textSecondaryClass={textSecondaryClass}
                    error={error}
                    rememberMe={rememberMe}
                    setRememberMe={setRememberMe}
                    loading={loading}
                  />
                ) : (
                  <AuthForm
                    isSignUp={isSignUp}
                    savedUser={savedUser}
                    showQuickLogin={showQuickLogin}
                    onBackToQuickLogin={handleBackToQuickLogin}
                    hoverBgClass={hoverBgClass}
                    textMutedClass={textMutedClass}
                    verificationSent={verificationSent}
                    verificationEmail={verificationEmail}
                    onSubmit={handleSubmit}
                    email={email}
                    onEmailChange={handleEmailChange}
                    onValidateEmail={validateEmail}
                    emailError={emailError}
                    inputBorderClass={inputBorderClass}
                    textPrimaryClass={textPrimaryClass}
                    textSecondaryClass={textSecondaryClass}
                    fullName={fullName}
                    setFullName={setFullName}
                    fullNameError={fullNameError}
                    onValidateFullName={validateFullName}
                    password={password}
                    setPassword={setPassword}
                    passwordError={passwordError}
                    onValidatePassword={validatePassword}
                    showPassword={showPassword}
                    setShowPassword={setShowPassword}
                    eyeOffIconRef={eyeOffIconRef}
                    eyeIconRef={eyeIconRef}
                    confirmPassword={confirmPassword}
                    setConfirmPassword={setConfirmPassword}
                    confirmPasswordError={confirmPasswordError}
                    onValidateConfirmPassword={validateConfirmPassword}
                    showConfirmPassword={showConfirmPassword}
                    setShowConfirmPassword={setShowConfirmPassword}
                    confirmEyeOffIconRef={confirmEyeOffIconRef}
                    confirmEyeIconRef={confirmEyeIconRef}
                    codeDigits={codeDigits}
                    onCodePaste={handleCodePaste}
                    inputRefs={inputRefs as any}
                    onCodeChange={handleCodeChange}
                    onCodeKeyDown={handleCodeKeyDown}
                    codeError={codeError}
                    rememberMe={rememberMe}
                    setRememberMe={setRememberMe}
                    onForgotPassword={() => setForgotPasswordOpen(true)}
                    error={error}
                    loading={loading}
                    onSwitchMode={handleSwitchMode}
                    borderClass={borderClass}
                  />
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
