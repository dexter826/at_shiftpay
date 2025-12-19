import React from 'react';
import { LayoutDashboard, CalendarRange, Users, Wallet2, Settings, LogOut } from 'lucide-react';
import { useThemeStyles } from '../../hooks/useThemeStyles';

interface NavbarProps {
  currentTab: string;
  setTab: (tab: string) => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setTab, onLogout }) => {

  const navItems = [
    { id: 'overview', label: 'Tổng quan', icon: LayoutDashboard },
    { id: 'dashboard', label: 'Lịch Tiệc', icon: CalendarRange },
    { id: 'employees', label: 'Nhân Sự', icon: Users },
    { id: 'payroll', label: 'Thanh Toán', icon: Wallet2 },
    { id: 'settings', label: 'Cài đặt', icon: Settings },
  ];

  // Style theo theme
  const {
    theme,
    cardBgClass: sidebarBg, // Map hook's cardBgClass to sidebarBg
    borderClass: borderColor, // Map hook's borderClass to borderColor
    textMutedClass: textMuted // Map hook's textMutedClass to textMuted
  } = useThemeStyles();

  const hoverText = theme === 'dark' ? 'hover:text-slate-200' : 'hover:text-slate-700';
  const hoverBg = theme === 'dark' ? 'hover:bg-slate-800' : 'hover:bg-slate-100';

  return (
    <>
      {/* Sidebar Desktop */}
      <div className={`hidden md:flex flex-col w-60 h-screen ${sidebarBg} border-r ${borderColor} fixed left-0 top-0 z-30`}>
        <div className={`p-5 border-b ${borderColor} flex flex-col items-center`}>
          <img src="/logo_text.png" alt="AT ShiftPay" className="h-8 object-contain" />
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            Made by{' '}
            <a
              href="https://github.com/dexter826/dexter826"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors"
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
                ? 'bg-primary/10 text-primary'
                : `${textMuted} ${hoverText} ${hoverBg}`
                }`}
            >
              <item.icon size={18} strokeWidth={currentTab === item.id ? 2 : 1.5} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Footer Desktop */}
        <div className={`p-4 border-t ${borderColor}`}>
          <button
            onClick={onLogout}
            className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10`}
          >
            <LogOut size={18} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`md:hidden fixed bottom-0 left-0 right-0 ${sidebarBg} border-t ${borderColor} flex z-50`}>
        {navItems.filter(item => item.id !== 'settings').map((item) => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${currentTab === item.id
              ? 'text-primary'
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
