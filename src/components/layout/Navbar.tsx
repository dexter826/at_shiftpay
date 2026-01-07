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
  const [hoveredTabId, setHoveredTabId] = React.useState<string | null>(null);

  const navItems = [
    { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard },
    { id: 'calendar', label: 'Lịch Tiệc', icon: CalendarRange },
    { id: 'employees', label: 'Nhân Sự', icon: Users },
    { id: 'payroll', label: 'Thanh Toán', icon: Wallet2 },
    { id: 'settings', label: 'Cài đặt', icon: Settings },
  ];

  // Lấy style đồng bộ với theme
  const {
    theme,
    cardBgClass: sidebarBg,
    borderClass: borderColor,
    textMutedClass: textMuted,
    textSecondaryClass,
    hoverBgClass: hoverBg
  } = useThemeStyles();

  // Reset hover state khi mất focus hoặc đổi tab ứng dụng
  React.useEffect(() => {
    const handleReset = () => setHoveredTabId(null);
    window.addEventListener('visibilitychange', handleReset);
    window.addEventListener('blur', handleReset);
    window.addEventListener('pagehide', handleReset);
    return () => {
      window.removeEventListener('visibilitychange', handleReset);
      window.removeEventListener('blur', handleReset);
      window.removeEventListener('pagehide', handleReset);
    };
  }, []);

  const hoverText = `hover:${textSecondaryClass}`;

  return (
    <>
      {/* Thanh điều hướng bên (Desktop) */}
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

        <nav className="flex-1 p-3 space-y-1 relative">
          {navItems.map((item) => {
            const isActive = currentTab === item.id || (item.id === 'calendar' && currentTab === 'locations');
            return (
              <motion.button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`relative flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors z-10 ${isActive
                  ? 'text-primary bg-primary/5'
                  : `${textMuted} ${hoverText} ${hoverBg}`
                  }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator-desktop"
                    className="absolute left-0 top-2 bottom-2 w-[3px] bg-primary rounded-full z-20"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <item.icon size={18} strokeWidth={isActive ? 2 : 1.5} />
                <span>{item.label}</span>
              </motion.button>
            );
          })}
        </nav>

        {/* Nhóm chức năng cuối trang (Desktop) */}
        <div className={`p-4 border-t ${borderColor}`}>
          <motion.button
            onClick={onLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10"
          >
            <LogOut size={18} />
            <span>Đăng xuất</span>
          </motion.button>
        </div>
      </div>

      {/* Thanh điều hướng dưới (Mobile) */}
      <div
        className={`md:hidden fixed bottom-1 left-4 right-4 h-16 ${sidebarBg}/80 backdrop-blur-xl border ${borderColor} flex z-50 rounded-2xl shadow-lg px-2 overflow-hidden`}
        onTouchMove={(e) => {
          const touch = e.touches[0];
          const element = document.elementFromPoint(touch.clientX, touch.clientY);
          const tabButton = element?.closest('button[data-tab-id]');
          if (tabButton) {
            const tabId = tabButton.getAttribute('data-tab-id');
            if (tabId && tabId !== hoveredTabId) {
              setHoveredTabId(tabId);
              if ('vibrate' in navigator) navigator.vibrate(5);
            }
          } else {
            setHoveredTabId(null);
          }
        }}
        onTouchEnd={() => {
          if (hoveredTabId) {
            setTab(hoveredTabId);
          }
          setHoveredTabId(null);
        }}
        onTouchCancel={() => setHoveredTabId(null)}
      >
        {navItems.map((item) => {
          const isActive = currentTab === item.id || (item.id === 'calendar' && currentTab === 'locations');
          const isHovered = hoveredTabId === item.id;

          return (
            <button
              key={item.id}
              data-tab-id={item.id}
              onClick={() => setTab(item.id)}
              className={`relative flex-1 flex flex-col items-center justify-center gap-1 transition-all rounded-xl ${isActive
                ? 'text-primary bg-primary/10'
                : isHovered
                  ? 'text-primary/70 bg-primary/5'
                  : textMuted
                }`}
            >
              {(isActive || isHovered) && (
                <motion.div
                  layoutId="nav-indicator-mobile"
                  className="absolute top-0 w-8 h-[3px] bg-primary rounded-full z-20"
                  initial={false}
                  animate={{ opacity: isHovered && !isActive ? 0.5 : 1 }}
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <item.icon size={20} strokeWidth={isActive ? 2 : 1.5} />
              <span className="text-[10px] whitespace-nowrap">{item.label}</span>
            </button>
          );
        })}
      </div>
    </>
  );
};
