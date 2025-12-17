import React, { useState } from 'react';
import { LayoutDashboard, CalendarRange, Users, Wallet2, LogOut, Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { Modal } from './ui/Modal';

interface NavbarProps {
  currentTab: string;
  setTab: (tab: string) => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setTab, onLogout }) => {
  const { theme, toggleTheme } = useTheme();
  const [logoutConfirm, setLogoutConfirm] = useState(false);

  const navItems = [
    { id: 'overview', label: 'Tổng quan', icon: LayoutDashboard },
    { id: 'dashboard', label: 'Lịch Tiệc', icon: CalendarRange },
    { id: 'employees', label: 'Nhân Sự', icon: Users },
    { id: 'payroll', label: 'Thanh Toán', icon: Wallet2 },
  ];

  const handleLogoutClick = () => {
    setLogoutConfirm(true);
  };

  const confirmLogout = () => {
    setLogoutConfirm(false);
    onLogout();
  };

  // Theme classes
  const sidebarBg = theme === 'dark' ? 'bg-slate-900' : 'bg-white';
  const borderColor = theme === 'dark' ? 'border-slate-800' : 'border-slate-200';
  const textMuted = theme === 'dark' ? 'text-slate-400' : 'text-slate-500';
  const hoverText = theme === 'dark' ? 'hover:text-slate-200' : 'hover:text-slate-700';
  const hoverBg = theme === 'dark' ? 'hover:bg-slate-800' : 'hover:bg-slate-100';

  return (
    <>
      {/* Desktop Sidebar */}
      <div className={`hidden md:flex flex-col w-60 h-screen ${sidebarBg} border-r ${borderColor} fixed left-0 top-0 z-30`}>
        <div className={`p-5 border-b ${borderColor}`}>
          <img src="/logo_text.png" alt="AT ShiftPay" className="h-8 object-contain" />
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            Made by{' '}
            <a
              href="https://github.com/dexter826/dexter826"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#ecb52d] transition-colors"
            >
              MOB
            </a>
          </span>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${currentTab === item.id
                ? 'bg-[#ecb52d]/10 text-[#ecb52d]'
                : `${textMuted} ${hoverText} ${hoverBg}`
                }`}
            >
              <item.icon size={18} strokeWidth={currentTab === item.id ? 2 : 1.5} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className={`p-3 border-t ${borderColor} space-y-1`}>
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium ${textMuted} ${hoverText} ${hoverBg} transition-colors`}
          >
            {theme === 'dark' ? <Sun size={18} strokeWidth={1.5} /> : <Moon size={18} strokeWidth={1.5} />}
            <span>{theme === 'dark' ? 'Chế độ sáng' : 'Chế độ tối'}</span>
          </button>

          <button
            onClick={handleLogoutClick}
            className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium ${textMuted} hover:text-red-400 ${hoverBg} transition-colors`}
          >
            <LogOut size={18} strokeWidth={1.5} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </div>

      {/* Mobile Bottom Bar */}
      <div className={`md:hidden fixed bottom-0 left-0 right-0 ${sidebarBg} border-t ${borderColor} flex z-50`}>
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${currentTab === item.id
              ? 'text-[#ecb52d]'
              : 'text-slate-500'
              }`}
          >
            <item.icon size={20} strokeWidth={currentTab === item.id ? 2 : 1.5} />
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      {/* Logout Confirm Modal */}
      <Modal
        title="Xác nhận đăng xuất"
        isOpen={logoutConfirm}
        onClose={() => setLogoutConfirm(false)}
        footer={
          <div className="flex gap-2">
            <button
              onClick={() => setLogoutConfirm(false)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium border ${borderColor} ${theme === 'dark' ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'} transition-colors`}
            >
              Hủy
            </button>
            <button
              onClick={confirmLogout}
              className="flex-1 bg-red-500 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
            >
              Đăng xuất
            </button>
          </div>
        }
      >
        <p className={`text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>Bạn có chắc muốn đăng xuất khỏi ứng dụng?</p>
      </Modal>
    </>
  );
};
