import React, { useState, useRef } from 'react';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, setPersistence, browserLocalPersistence, browserSessionPersistence, sendEmailVerification } from 'firebase/auth';
import { useTheme } from '../contexts/ThemeContext';
import { User, Lock, Eye, EyeOff, Heart } from 'lucide-react';

import { ForgotPasswordModal } from './ForgotPasswordModal';

interface LoginProps {
  onLogin: () => void;
}

const CORRECT_CODE = '2738';

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const { theme } = useTheme();
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

  // OTP-style code input
  const [codeDigits, setCodeDigits] = useState(['', '', '', '']);
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  // Validation errors
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [fullNameError, setFullNameError] = useState('');
  const [codeError, setCodeError] = useState('');

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

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (emailError) validateEmail(value);
    if (verificationSent) setVerificationSent(false);
  };

  // Theme classes
  const isDark = theme === 'dark';
  const bgClass = isDark ? 'bg-slate-900' : 'bg-gray-50';
  const cardBgClass = isDark ? 'bg-slate-800' : 'bg-white';
  const textPrimaryClass = isDark ? 'text-slate-200' : 'text-gray-800';
  const textMutedClass = isDark ? 'text-slate-400' : 'text-gray-500';
  const inputBorderClass = isDark ? 'border-slate-600' : 'border-gray-300';
  const illustrationBg = isDark ? 'bg-slate-800' : 'bg-gray-100';

  // Input style để fix autofill background
  const inputStyle = `flex-1 ml-3 bg-transparent ${textPrimaryClass} placeholder-gray-400 focus:outline-none text-sm [&:-webkit-autofill]:bg-transparent [&:-webkit-autofill]:shadow-[0_0_0_1000px_transparent_inset] [&:-webkit-autofill]:[transition:background-color_5000s_ease-in-out_0s]`;
  const codeInputStyle = `w-12 h-12 text-center text-lg font-semibold bg-transparent border-2 rounded-lg ${textPrimaryClass} focus:outline-none focus:border-[#ecb52d] [&:-webkit-autofill]:shadow-[0_0_0_1000px_transparent_inset]`;

  return (
    <div className={`min-h-screen ${bgClass} flex items-center justify-center p-4`}>
      <div className={`w-full max-w-4xl ${cardBgClass} rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row`}>
        {/* Left side - Illustration */}
        <div className={`hidden md:flex md:w-1/2 ${illustrationBg} items-center justify-center p-8`}>
          <div className="text-center">
            <img
              src="/background.png"
              alt="Illustration"
              className="max-w-xs mx-auto mb-6"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <div className="mt-4">
              <img src="/logo_text.png" alt="AT ShiftPay" className="h-8 mx-auto object-contain" />
              <p className={`text-sm ${textMutedClass} mt-2`}>Ứng dụng quản lý tính công</p>
              <p className={`text-xs ${textMutedClass} mt-1 flex items-center justify-center gap-1`}>
                Made with <Heart size={12} className="text-red-500 fill-red-500" /> by{' '}
                <a
                  href="https://github.com/dexter826/dexter826"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#ecb52d] hover:underline"
                >
                  MOB
                </a>
              </p>
            </div>
            <button
              onClick={handleSwitchMode}
              className="mt-6 text-[#ecb52d] hover:text-[#f0c654] text-sm font-medium underline transition-colors"
            >
              {isSignUp ? 'Đã có tài khoản? Đăng nhập' : 'Tạo tài khoản mới'}
            </button>
          </div>
        </div>

        {/* Separator Line */}
        <div className={`hidden md:block w-[0.5px] my-12 ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`} />

        {/* Right side - Form */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
          {/* Mobile logo */}
          <div className="md:hidden text-center mb-6">
            <img src="/logo_text.png" alt="AT ShiftPay" className="h-8 mx-auto object-contain" />
          </div>

          <h2 className="text-5xl font-retro text-[#ecb52d] mb-8 text-center drop-shadow-[4px_4px_0px_rgba(0,0,0,1)] tracking-wide">
            {isSignUp ? 'Đăng ký' : 'Đăng nhập'}
          </h2>

          {verificationSent && (
            <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 text-green-500 text-xs rounded-lg">
              <p className="font-medium mb-1">✓ Đăng ký thành công!</p>
              <p>Email xác thực đã được gửi đến <strong>{verificationEmail}</strong></p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email field */}
            <div>
              <div className={`flex items-center border-b-2 ${emailError ? 'border-red-500' : inputBorderClass} pb-2`}>
                <User size={20} className={textMutedClass} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  onBlur={() => validateEmail(email)}
                  className={inputStyle}
                  placeholder="Email"
                />
              </div>
              {emailError && <p className="text-red-400 text-xs mt-1">{emailError}</p>}
            </div>

            {/* Full name field (signup only) */}
            {isSignUp && (
              <div>
                <div className={`flex items-center border-b-2 ${fullNameError ? 'border-red-500' : inputBorderClass} pb-2`}>
                  <User size={20} className={textMutedClass} />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (fullNameError) validateFullName(e.target.value);
                    }}
                    onBlur={() => validateFullName(fullName)}
                    className={inputStyle}
                    placeholder="Họ tên"
                  />
                </div>
                {fullNameError && <p className="text-red-400 text-xs mt-1">{fullNameError}</p>}
              </div>
            )}

            {/* Password field */}
            <div>
              <div className={`flex items-center border-b-2 ${passwordError ? 'border-red-500' : inputBorderClass} pb-2`}>
                <Lock size={20} className={textMutedClass} />
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
                  className={inputStyle}
                  placeholder="Mật khẩu"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`${textMutedClass} hover:text-[#ecb52d] transition-colors`}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {passwordError && <p className="text-red-400 text-xs mt-1">{passwordError}</p>}
            </div>

            {/* Confirm password (signup only) */}
            {isSignUp && (
              <div>
                <div className={`flex items-center border-b-2 ${confirmPasswordError ? 'border-red-500' : inputBorderClass} pb-2`}>
                  <Lock size={20} className={textMutedClass} />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (confirmPasswordError) validateConfirmPassword(e.target.value);
                    }}
                    onBlur={() => validateConfirmPassword(confirmPassword)}
                    className={inputStyle}
                    placeholder="Xác nhận mật khẩu"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className={`${textMutedClass} hover:text-[#ecb52d] transition-colors`}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {confirmPasswordError && <p className="text-red-400 text-xs mt-1">{confirmPasswordError}</p>}
              </div>
            )}

            {/* Code input (signup only) */}
            {isSignUp && (
              <div>
                <label className={`block text-xs ${textMutedClass} mb-2`}>Nhập 4 số là địa chỉ "Bếp"</label>
                <div className="flex gap-3 justify-center" onPaste={handleCodePaste}>
                  {codeDigits.map((digit, index) => (
                    <input
                      key={index}
                      ref={inputRefs[index]}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleCodeChange(index, e.target.value)}
                      onKeyDown={(e) => handleCodeKeyDown(index, e)}
                      className={`${codeInputStyle} ${codeError ? 'border-red-500' : inputBorderClass}`}
                    />
                  ))}
                </div>
                {codeError && <p className="text-red-400 text-xs mt-2 text-center">{codeError}</p>}
              </div>
            )}

            {/* Remember me and Forgot Password */}
            {!isSignUp && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="rememberMe"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 cursor-pointer accent-[#ecb52d]"
                  />
                  <label htmlFor="rememberMe" className={`text-sm ${textMutedClass} cursor-pointer`}>
                    Ghi nhớ
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => setForgotPasswordOpen(true)}
                  className="text-xs text-[#ecb52d] hover:text-[#f0c654] font-medium transition-colors"
                >
                  Quên mật khẩu?
                </button>
              </div>
            )}

            {error && (
              <div className="p-2.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#ecb52d] hover:bg-[#d4a128] text-white py-3 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Đang xử lý...' : (isSignUp ? 'Đăng ký' : 'Đăng nhập')}
            </button>
          </form>

          {/* Mobile switch mode */}
          <div className="md:hidden mt-6 text-center">
            <button
              onClick={handleSwitchMode}
              className="text-[#ecb52d] hover:text-[#f0c654] text-sm underline transition-colors"
            >
              {isSignUp ? 'Đã có tài khoản? Đăng nhập' : 'Tạo tài khoản mới'}
            </button>
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
