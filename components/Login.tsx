import React, { useState } from 'react';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { useTheme } from '../contexts/ThemeContext';
import { Sun, Moon } from 'lucide-react';

interface LoginProps {
  onLogin: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const { theme, toggleTheme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      onLogin();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      onLogin();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
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
        {/* Theme toggle */}
        <div className="flex justify-end mb-4">
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-lg ${textMutedClass} ${theme === 'dark' ? 'hover:bg-slate-800' : 'hover:bg-slate-200'} transition-colors`}
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#ecb52d]">AT ShiftPay</h1>
          <p className={`text-sm ${textMutedClass} mt-1`}>Quản lý tính công</p>
        </div>

        <div className={`${cardBgClass} border ${borderClass} rounded-lg p-6`}>
          <h2 className={`text-lg font-semibold ${textPrimaryClass} mb-4`}>
            {isSignUp ? 'Đăng ký' : 'Đăng nhập'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={`block text-xs ${textMutedClass} mb-1.5`}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full p-2.5 ${inputBgClass} border ${inputBorderClass} rounded-lg text-sm ${textPrimaryClass} placeholder-slate-500 focus:outline-none focus:border-[#ecb52d]`}
                placeholder="email@example.com"
                required
              />
            </div>

            <div>
              <label className={`block text-xs ${textMutedClass} mb-1.5`}>Mật khẩu</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full p-2.5 ${inputBgClass} border ${inputBorderClass} rounded-lg text-sm ${textPrimaryClass} placeholder-slate-500 focus:outline-none focus:border-[#ecb52d]`}
                placeholder="********"
                required
              />
            </div>

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

          <div className="my-4 flex items-center gap-3">
            <div className={`flex-1 h-px ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-200'}`}></div>
            <span className={`text-xs ${textMutedClass}`}>hoặc</span>
            <div className={`flex-1 h-px ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-200'}`}></div>
          </div>

          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className={`w-full flex items-center justify-center gap-2 ${theme === 'dark' ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' : 'bg-white border-slate-300 hover:bg-slate-50'} border ${textPrimaryClass} py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Google
          </button>

          <div className="mt-4 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
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
