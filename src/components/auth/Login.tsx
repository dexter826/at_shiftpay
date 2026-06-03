import React, { useState, useEffect } from 'react';
import { auth } from '../../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, setPersistence, browserLocalPersistence, browserSessionPersistence, sendEmailVerification } from 'firebase/auth';
import { AnimatePresence } from 'framer-motion';
import { Heart } from 'lucide-react';

import { ForgotPasswordModal } from './ForgotPasswordModal';
import { useAuthStore } from '../../stores/authStore';
import { useToast } from '../ui/Toast';

import LoginHeader from './login/LoginHeader';
import VerificationView from './login/VerificationView';
import QuickLoginView from './login/QuickLoginView';
import AuthForm from './login/AuthForm';

interface LoginProps {
  onLogin: () => void;
}

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

  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [fullNameError, setFullNameError] = useState('');

  useEffect(() => {
    if (savedUser && showQuickLogin) {
      setEmail(savedUser.email);
    }
  }, [savedUser, showQuickLogin]);

  const validateEmail = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!value) { setEmailError('Email không được để trống'); return false; }
    if (!emailRegex.test(value)) { setEmailError('Email không hợp lệ'); return false; }
    setEmailError(''); return true;
  };

  const validatePassword = (value: string) => {
    if (!value) { setPasswordError('Mật khẩu không được để trống'); return false; }
    if (value.length < 6) { setPasswordError('Mật khẩu phải có ít nhất 6 ký tự'); return false; }
    setPasswordError(''); return true;
  };

  const validateFullName = (value: string) => {
    if (!value.trim()) { setFullNameError('Họ tên không được để trống'); return false; }
    if (value.trim().length < 2) { setFullNameError('Họ tên phải có ít nhất 2 ký tự'); return false; }
    setFullNameError(''); return true;
  };

  const validateConfirmPassword = (value: string) => {
    if (!value) { setConfirmPasswordError('Vui lòng xác nhận mật khẩu'); return false; }
    if (value !== password) { setConfirmPasswordError('Mật khẩu không khớp'); return false; }
    setConfirmPasswordError(''); return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);

    if (isSignUp) {
      const isFullNameValid = validateFullName(fullName);
      const isConfirmPasswordValid = validateConfirmPassword(confirmPassword);
      if (!isEmailValid || !isPasswordValid || !isFullNameValid || !isConfirmPasswordValid) return;
    } else {
      if (!isEmailValid || !isPasswordValid) return;
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
      const messages: Record<string, string> = {
        'auth/email-already-in-use': 'Email đã được sử dụng',
        'auth/invalid-email': 'Email không hợp lệ',
        'auth/weak-password': 'Mật khẩu quá yếu',
        'auth/user-not-found': 'Tài khoản không tồn tại',
        'auth/wrong-password': 'Mật khẩu không đúng',
        'auth/invalid-credential': 'Email hoặc mật khẩu không đúng',
        'auth/too-many-requests': 'Quá nhiều lần thử. Vui lòng thử lại sau',
      };
      const errorMessage = messages[error.code] || 'Đã xảy ra lỗi';
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

  const handleResendEmail = async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      await sendEmailVerification(currentUser);
      showToast('Đã gửi lại email xác thực.', 'success');
    } catch { showToast('Gửi lại email thất bại.', 'error'); }
    finally { setLoading(false); }
  };

  const handleCheckVerification = async () => {
    try {
      setLoading(true);
      await refreshUser();
      if (auth.currentUser?.emailVerified) {
        showToast('Xác thực thành công!', 'success');
        onLogin();
      } else showToast('Email vẫn chưa được xác thực.', 'warning');
    } catch { showToast('Lỗi khi kiểm tra xác thực.', 'error'); }
    finally { setLoading(false); }
  };

  const isUnverified = currentUser && !currentUser.emailVerified;

  return (
    <div className="min-h-dynamic bg-[var(--bg-primary)] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/[0.04] pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-primary/[0.03] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg p-6">
          <LoginHeader />

          <div className="mt-4">
            <AnimatePresence mode="wait">
              {isUnverified ? (
                <VerificationView
                  currentUser={currentUser}
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
                  verificationSent={verificationSent}
                  verificationEmail={verificationEmail}
                  onSubmit={handleSubmit}
                  email={email}
                  onEmailChange={handleEmailChange}
                  onValidateEmail={validateEmail}
                  emailError={emailError}
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
                  confirmPassword={confirmPassword}
                  setConfirmPassword={setConfirmPassword}
                  confirmPasswordError={confirmPasswordError}
                  onValidateConfirmPassword={validateConfirmPassword}
                  showConfirmPassword={showConfirmPassword}
                  setShowConfirmPassword={setShowConfirmPassword}
                  rememberMe={rememberMe}
                  setRememberMe={setRememberMe}
                  onForgotPassword={() => setForgotPasswordOpen(true)}
                  error={error}
                  loading={loading}
                  onSwitchMode={handleSwitchMode}
                />
              )}
            </AnimatePresence>
          </div>
        </div>

        <p className="text-xs text-[var(--text-muted)] text-center mt-6 flex items-center justify-center gap-1.5">
          Made with <Heart size={11} className="text-red-500 fill-red-500" /> by
          <a href="https://github.com/dexter826/dexter826" target="_blank" rel="noopener noreferrer" className="font-semibold text-primary hover:text-[#f0c654] transition-colors">MOB</a>
        </p>
      </div>

      <ForgotPasswordModal isOpen={forgotPasswordOpen} onClose={() => setForgotPasswordOpen(false)} />
    </div>
  );
};
