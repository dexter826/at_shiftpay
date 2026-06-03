import { motion } from "framer-motion";
import React from "react";
import { LayoutDashboard, CalendarRange, Users, Wallet, Settings, LogOut, Moon, Sun } from "lucide-react";
import { useThemeStore } from "../../stores";

interface NavbarProps {
  currentTab: string;
  setTab: (tab: string) => void;
  onLogout: () => void;
}

const navItems = [
  { id: "dashboard", label: "Tổng quan", icon: LayoutDashboard },
  { id: "calendar", label: "Lịch Tiệc", icon: CalendarRange },
  { id: "employees", label: "Nhân Sự", icon: Users },
  { id: "payroll", label: "Thanh Toán", icon: Wallet },
  { id: "settings", label: "Cài đặt", icon: Settings },
];

const NavItem: React.FC<{
  item: typeof navItems[0];
  isActive: boolean;
  onClick: () => void;
  isMobile?: boolean;
}> = ({ item, isActive, onClick, isMobile }) => (
  <motion.button
    type="button"
    onClick={onClick}
    className={`relative flex items-center transition-colors ${
      isMobile
        ? "flex-1 flex-col gap-0.5 py-1.5 rounded-lg text-[11px] leading-tight justify-center"
        : "gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium justify-start"
    } ${
      isActive
        ? "text-primary bg-primary/5"
        : `text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--border-color)]`
    }`}
  >
    {isActive && !isMobile && (
      <motion.div
        layoutId="nav-indicator-desktop"
        className="absolute left-0 top-2 bottom-2 w-[3px] bg-primary rounded-full"
        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
      />
    )}
    <item.icon size={isMobile ? 20 : 18} />
    <span>{item.label}</span>
  </motion.button>
);

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setTab, onLogout }) => {
  const { theme, toggleTheme } = useThemeStore();
  const activeTabId = currentTab === "locations" ? "calendar" : currentTab;

  const handleSetTab = (id: string) => setTab(id);

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden md:flex flex-col w-60 h-screen bg-[var(--bg-card)] border-r border-[var(--border-color)] fixed left-0 top-0 z-30 pt-safe">
        <div className="p-5 border-b border-[var(--border-color)] flex flex-col items-center">
          <img src="/logo_text.png" alt="ShiftPay" className="h-8 object-contain" />
          <span className="text-[11px] text-[var(--text-muted)] mt-0.5">
            Made by{" "}
            <a href="https://github.com/dexter826/dexter826" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
              MOB
            </a>
          </span>
        </div>

        <nav className="flex-1 p-3 space-y-1 relative" aria-label="Điều hướng chính">
          {navItems.map((item) => (
            <NavItem
              key={item.id}
              item={item}
              isActive={activeTabId === item.id}
              onClick={() => handleSetTab(item.id)}
            />
          ))}
        </nav>

        <div className="p-4 border-t border-[var(--border-color)] flex items-center gap-1">
          <button
            type="button"
            onClick={onLogout}
            className="flex-1 flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-red-500 hover:text-red-400 hover:bg-red-500/10"
          >
            <LogOut size={18} />
            <span>Đăng xuất</span>
          </button>

          <div className="w-px h-6 bg-[var(--border-color)]" />

          <button
            type="button"
            onClick={toggleTheme}
            className="flex items-center justify-center w-10 h-10 rounded-lg transition-colors text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--border-color)]"
            title={theme === "dark" ? "Giao diện sáng" : "Giao diện tối"}
          >
            {theme === "dark" ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[var(--bg-card)] border-t border-[var(--border-color)] flex items-center z-40 pb-safe px-4"
        aria-label="Điều hướng chính"
      >
        <div className="absolute inset-x-4 top-0 pointer-events-none">
          {(() => {
            const idx = navItems.findIndex((i) => i.id === activeTabId);
            return idx !== -1 ? (
              <motion.div
                className="flex justify-center"
                style={{ width: `${100 / navItems.length}%` }}
                initial={false}
                animate={{ x: `${idx * 100}%` }}
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              >
                <div className="w-8 h-[3px] bg-primary rounded-full" />
              </motion.div>
            ) : null;
          })()}
        </div>

        {navItems.map((item) => (
          <NavItem
            key={item.id}
            item={item}
            isActive={activeTabId === item.id}
            onClick={() => handleSetTab(item.id)}
            isMobile
          />
        ))}
      </nav>
    </>
  );
};
