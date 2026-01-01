import React from 'react';
import { LayoutDashboard, CalendarRange, Users, Wallet2, Settings, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import { useThemeStyles } from '../../hooks/useThemeStyles';

interface NavbarProps {
  currentTab: string;
  setTab: (tab: string) => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setTab, onLogout }) => {

  const navItems = [
    { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard },
    { id: 'calendar', label: 'Lịch Tiệc', icon: CalendarRange },
    { id: 'employees', label: 'Nhân Sự', icon: Users },
    { id: 'payroll', label: 'Thanh Toán', icon: Wallet2 },
    { id: 'settings', label: 'Cài đặt', icon: Settings },
  ];

  // Style theo theme
  const {
    theme,
    cardBgClass: sidebarBg,
    borderClass: borderColor,
    textMutedClass: textMuted,
    textSecondaryClass,
    hoverBgClass: hoverBg
  } = useThemeStyles();

  const hoverText = `hover:${textSecondaryClass}`;

  return (
    <>
      {/* Sidebar Desktop */}
      <div className={`hidden md:flex flex-col w-60 h-screen ${sidebarBg} border-r ${borderColor} fixed left-0 top-0 z-30`}>
        <div className={`p-5 border-b ${borderColor} flex flex-col items-center`}>
          <img src="/logo_text.png" alt="AT ShiftPay" className="h-8 object-contain" />
          <span className={`text-[11px] ${textMuted} mt-0.5 block`}>
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
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <motion.button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive
                  ? 'bg-primary/10 text-primary'
                  : `${textMuted} ${hoverText} ${hoverBg}`
                  }`}
                whileTap={{ scale: 0.98 }}
              >
                <item.icon size={18} strokeWidth={isActive ? 2 : 1.5} />
                <span>{item.label}</span>
              </motion.button>
            );
          })}
        </nav>

        {/* Footer Desktop */}
        <div className={`p-4 border-t ${borderColor}`}>
          <motion.button
            onClick={onLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10"
            whileTap={{ scale: 0.98 }}
          >
            <LogOut size={18} />
            <span>Đăng xuất</span>
          </motion.button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`md:hidden fixed bottom-0 left-0 right-0 ${sidebarBg} border-t ${borderColor} flex z-50`}>
        {navItems.filter(item => item.id !== 'settings').map((item) => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${isActive
                ? 'text-primary'
                : textMuted
                }`}
            >
              <item.icon size={20} strokeWidth={isActive ? 2 : 1.5} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </>
  );
};
