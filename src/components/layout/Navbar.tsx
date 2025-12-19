import React from 'react';
import { LayoutDashboard, CalendarRange, Users, Wallet2, Settings, LogOut, Sun, Moon, FileDown } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface NavbarProps {
  currentTab: string;
  setTab: (tab: string) => void;
  onLogout: () => void;
  onOpenExport: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setTab, onLogout, onOpenExport }) => {
  const { theme, toggleTheme } = useTheme();

  const navItems = [
    { id: 'overview', label: 'Tổng quan', icon: LayoutDashboard },
    { id: 'dashboard', label: 'Lịch Tiệc', icon: CalendarRange },
    { id: 'employees', label: 'Nhân Sự', icon: Users },
    { id: 'payroll', label: 'Thanh Toán', icon: Wallet2 },
    { id: 'settings', label: 'Cài đặt', icon: Settings },
  ];

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

        {/* Desktop Footer */}
        <div className={`p-4 border-t ${borderColor}`}>
          <button
            onClick={onOpenExport}
            className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${textMuted} ${hoverText} ${hoverBg} mb-1`}
          >
            <FileDown size={18} />
            <span>Xuất Báo Cáo</span>
          </button>

          <button
            onClick={toggleTheme}
            className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${textMuted} ${hoverText} ${hoverBg} mb-1`}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            <span>{theme === 'dark' ? 'Chế độ sáng' : 'Chế độ tối'}</span>
          </button>
          <button
            onClick={onLogout}
            className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10`}
          >
            <LogOut size={18} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </div>

      {/* Mobile Bottom Bar */}
      <div className={`md:hidden fixed bottom-0 left-0 right-0 ${sidebarBg} border-t ${borderColor} flex z-50`}>
        {navItems.filter(item => item.id !== 'settings').map((item) => (
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
    </>
  );
};
