import React, { useState, useRef, useEffect } from 'react';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, setPersistence, browserLocalPersistence, browserSessionPersistence, sendEmailVerification } from 'firebase/auth';
import { useTheme } from '../contexts/ThemeContext';
import { Eye, EyeOff, Heart } from 'lucide-react';

interface LoginProps {
  onLogin: () => void;
}

const CORRECT_CODE = '2738';

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const { theme, toggleTheme } = useTheme();
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
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newDigits = [...codeDigits];
    newDigits[index] = value;
    setCodeDigits(newDigits);
    setCodeError('');

    // Auto focus next input
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
      // Focus last filled input or next empty
      const focusIndex = Math.min(pastedData.length, 3);
      inputRefs[focusIndex].current?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate all fields
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
        // Đăng ký tài khoản mới
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);

        // Cập nhật display name
        await updateProfile(userCredential.user, {
          displayName: fullName.trim()
        });

        // Gửi email xác thực
        await sendEmailVerification(userCredential.user);

        // Lưu email để hiển thị trong thông báo
        setVerificationEmail(email);

        // Đăng xuất ngay sau khi đăng ký để bắt buộc verify
        await auth.signOut();

        // Hiển thị thông báo thành công
        setVerificationSent(true);
        setError('');

        // Reset form
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
        // Đăng nhập
        await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
        const userCredential = await signInWithEmailAndPassword(auth, email, password);

        // Kiểm tra email đã được xác thực chưa
        if (!userCredential.user.emailVerified) {
          await auth.signOut();
          setError('Vui lòng xác thực email trước khi đăng nhập. Kiểm tra hộp thư của bạn.');
          setLoading(false);
          return;
        }

        // Chỉ gọi onLogin khi đăng nhập thành công VÀ đã verify email
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

  // Reset form when switching modes (chỉ khi user click chuyển mode)
  const handleSwitchMode = () => {
    setIsSignUp(!isSignUp);
    setError('');
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');
    setFullNameError('');
    setCodeError('');
    setCodeDigits(['', '', '', '']);
    setVerificationSent(false); // Xóa thông báo khi user chủ động chuyển mode
  };

  // Xóa thông báo verification khi user bắt đầu nhập email
  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (emailError) validateEmail(value);
    if (verificationSent) setVerificationSent(false); // Ẩn thông báo khi user bắt đầu nhập
  };

  // Theme classes
  const bgClass = theme === 'dark' ? 'bg-slate-900' : 'bg-slate-50';
  const cardBgClass = theme === 'dark' ? 'bg-slate-900' : 'bg-white';
  const borderClass = theme === 'dark' ? 'border-slate-800' : 'border-slate-200';
  const textPrimaryClass = theme === 'dark' ? 'text-slate-200' : 'text-slate-700';
  const textMutedClass = theme === 'dark' ? 'text-slate-400' : 'text-slate-500';
  const inputBgClass = theme === 'dark' ? 'bg-slate-800' : 'bg-white';
  const inputBorderClass = theme === 'dark' ? 'border-slate-700' : 'border-slate-300';

  return (
    <div className={`min-h-screen ${bgClass} flex items-center justify-center p-4`}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img src="/logo_text.png" alt="AT ShiftPay" className="h-10 mx-auto object-contain" />
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

        <div className={`${cardBgClass} border ${borderClass} rounded-lg p-6`}>
          <h2 className={`text-lg font-semibold ${textPrimaryClass} mb-4`}>
            {isSignUp ? 'Đăng ký' : 'Đăng nhập'}
          </h2>

          {verificationSent && (
            <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 text-green-400 text-xs rounded-lg">
              <p className="font-medium mb-1">✓ Đăng ký thành công!</p>
              <p>Email xác thực đã được gửi đến <strong>{verificationEmail}</strong></p>
              <p className="mt-1">Vui lòng kiểm tra hộp thư và xác thực email trước khi đăng nhập.</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={`block text-xs ${textMutedClass} mb-1.5`}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                onBlur={() => validateEmail(email)}
                className={`w-full p-2.5 ${inputBgClass} border ${emailError ? 'border-red-500' : inputBorderClass} rounded-lg text-sm ${textPrimaryClass} placeholder-slate-500 focus:outline-none focus:border-[#ecb52d]`}
                placeholder="email@example.com"
              />
              {emailError && <p className="text-red-400 text-xs mt-1">{emailError}</p>}
            </div>

            {isSignUp && (
              <div>
                <label className={`block text-xs ${textMutedClass} mb-1.5`}>Họ tên</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (fullNameError) validateFullName(e.target.value);
                  }}
                  onBlur={() => validateFullName(fullName)}
                  className={`w-full p-2.5 ${inputBgClass} border ${fullNameError ? 'border-red-500' : inputBorderClass} rounded-lg text-sm ${textPrimaryClass} placeholder-slate-500 focus:outline-none focus:border-[#ecb52d]`}
                  placeholder="Nguyễn Văn A"
                />
                {fullNameError && <p className="text-red-400 text-xs mt-1">{fullNameError}</p>}
              </div>
            )}

            <div>
              <label className={`block text-xs ${textMutedClass} mb-1.5`}>Mật khẩu</label>
              <div className="relative">
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
                  className={`w-full p-2.5 pr-10 ${inputBgClass} border ${passwordError ? 'border-red-500' : inputBorderClass} rounded-lg text-sm ${textPrimaryClass} placeholder-slate-500 focus:outline-none focus:border-[#ecb52d]`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-2.5 top-1/2 -translate-y-1/2 ${textMutedClass} hover:text-[#ecb52d] transition-colors`}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {passwordError && <p className="text-red-400 text-xs mt-1">{passwordError}</p>}
            </div>

            {isSignUp && (
              <div>
                <label className={`block text-xs ${textMutedClass} mb-1.5`}>Xác nhận mật khẩu</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (confirmPasswordError) validateConfirmPassword(e.target.value);
                    }}
                    onBlur={() => validateConfirmPassword(confirmPassword)}
                    className={`w-full p-2.5 pr-10 ${inputBgClass} border ${confirmPasswordError ? 'border-red-500' : inputBorderClass} rounded-lg text-sm ${textPrimaryClass} placeholder-slate-500 focus:outline-none focus:border-[#ecb52d]`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className={`absolute right-2.5 top-1/2 -translate-y-1/2 ${textMutedClass} hover:text-[#ecb52d] transition-colors`}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {confirmPasswordError && <p className="text-red-400 text-xs mt-1">{confirmPasswordError}</p>}
              </div>
            )}

            {isSignUp && (
              <div>
                <label className={`block text-xs ${textMutedClass} mb-2`}>Nhập 4 số là địa chỉ Bếp</label>
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
                      className={`w-12 h-12 text-center text-lg font-semibold ${inputBgClass} border ${codeError ? 'border-red-500' : inputBorderClass} rounded-lg ${textPrimaryClass} focus:outline-none focus:border-[#ecb52d]`}
                    />
                  ))}
                </div>
                {codeError && <p className="text-red-400 text-xs mt-2 text-center">{codeError}</p>}
              </div>
            )}

            {!isSignUp && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 cursor-pointer accent-[#ecb52d]"
                  style={{ accentColor: '#ecb52d' }}
                />
                <label htmlFor="rememberMe" className={`text-sm ${textMutedClass} cursor-pointer`}>
                  Ghi nhớ đăng nhập
                </label>
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
              className="w-full bg-[#ecb52d] text-white py-2.5 rounded-lg text-sm font-medium hover:bg-[#d4a128] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Đang xử lý...' : (isSignUp ? 'Đăng ký' : 'Đăng nhập')}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={handleSwitchMode}
              className="text-[#ecb52d] hover:text-[#f0c654] text-xs transition-colors"
            >
              {isSignUp ? 'Đã có tài khoản? Đăng nhập' : 'Chưa có tài khoản? Đăng ký'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
