import React from "react";
import {
  LayoutDashboard,
  CalendarRange,
  Users,
  Wallet2,
  Settings,
  LogOut,
  Sun,
  Moon,
} from "lucide-react";
import { motion } from "framer-motion";
import { useThemeStyles } from "../../hooks/useThemeStyles";

interface NavbarProps {
  currentTab: string;
  setTab: (tab: string) => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setTab,
  onLogout,
}) => {


  const navItems = [
    { id: "dashboard", label: "Tổng quan", icon: LayoutDashboard },
    { id: "calendar", label: "Lịch Tiệc", icon: CalendarRange },
    { id: "employees", label: "Nhân Sự", icon: Users },
    { id: "payroll", label: "Thanh Toán", icon: Wallet2 },
    { id: "settings", label: "Cài đặt", icon: Settings },
  ];

  // Lấy style đồng bộ với theme
  const {
    theme,
    toggleTheme,
    cardBgClass: sidebarBg,
    borderClass: borderColor,
    textMutedClass: textMuted,
    textSecondaryClass,
    hoverBgClass: hoverBg,
  } = useThemeStyles();



  // Dùng ref xử lý swipe tránh stale state
  const [hoveredTabId, setHoveredTabId] = React.useState<string | null>(null);
  const touchTabIdRef = React.useRef<string | null>(null);

  // Xóa state khi app mất focus
  React.useEffect(() => {
    const handleReset = () => {
      setHoveredTabId(null);
      touchTabIdRef.current = null;
    };
    window.addEventListener("blur", handleReset);
    return () => window.removeEventListener("blur", handleReset);
  }, []);

  const activeTabId = currentTab === "locations" ? "calendar" : currentTab;
  const displayTabId = hoveredTabId || activeTabId;
  const activeIndex = navItems.findIndex((item) => item.id === displayTabId);
  const isHoverOnly = !!hoveredTabId && hoveredTabId !== activeTabId;
  const hoverText = `hover:${textSecondaryClass}`;

  return (
    <>
      {/* Thanh điều hướng bên (Desktop) */}
      <div
        className={`hidden md:flex flex-col w-60 h-screen ${sidebarBg} border-r ${borderColor} fixed left-0 top-0 z-30`}
      >
        <div
          className={`p-5 border-b ${borderColor} flex flex-col items-center`}
        >
          <img
            src="/logo_text.png"
            alt="AT ShiftPay"
            className="h-8 object-contain"
          />
          <span className={`text-[11px] ${textMuted} mt-0.5 block`}>
            Made by{" "}
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

        <nav
          className="flex-1 p-3 space-y-1 relative"
          aria-label="Điều hướng chính"
        >
          {navItems.map((item) => {
            const isActive =
              currentTab === item.id ||
              (item.id === "calendar" && currentTab === "locations");
            return (
              <motion.button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                aria-current={isActive ? "page" : undefined}
                aria-label={item.label}
                className={`relative flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors z-10 ${
                  isActive
                    ? "text-primary bg-primary/5"
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
        <div className={`p-4 border-t ${borderColor} flex items-center gap-1`}>
          <motion.button
            type="button"
            onClick={onLogout}
            aria-label="Đăng xuất"
            className="flex-1 flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
          >
            <LogOut size={18} />
            <span>Đăng xuất</span>
          </motion.button>

          <div
            className={`w-[1px] h-6 ${
              theme === "dark" ? "bg-slate-800" : "bg-slate-200"
            }`}
          />

          <motion.button
            type="button"
            onClick={toggleTheme}
            className={`flex items-center justify-center w-10 h-10 rounded-lg transition-colors ${textMuted} ${hoverText} ${hoverBg}`}
            title={theme === "dark" ? "Giao diện sáng" : "Giao diện tối"}
          >
            {theme === "dark" ? (
              <Sun size={18} className="text-amber-400" />
            ) : (
              <Moon size={18} className="text-slate-600" />
            )}
          </motion.button>
        </div>
      </div>

      <nav
        className={`md:hidden fixed bottom-5 left-4 right-4 h-16 ${sidebarBg}/80 backdrop-blur-xl flex z-[9999] rounded-2xl shadow-lg px-2 overflow-hidden touch-none select-none`}
        aria-label="Điều hướng chính"
        onTouchStart={(e) => {
          const touch = e.touches[0];
          const element = document.elementFromPoint(touch.clientX, touch.clientY);
          const tabButton = element?.closest("button[data-tab-id]");
          if (tabButton) {
            const tabId = tabButton.getAttribute("data-tab-id");
            if (tabId) {
              touchTabIdRef.current = tabId;
              setHoveredTabId(tabId);
            }
          }
        }}
        onTouchMove={(e) => {
          const touch = e.touches[0];
          const element = document.elementFromPoint(
            touch.clientX,
            touch.clientY
          );
          const tabButton = element?.closest("button[data-tab-id]");
          if (tabButton) {
            const tabId = tabButton.getAttribute("data-tab-id");
            if (tabId && tabId !== touchTabIdRef.current) {
              touchTabIdRef.current = tabId;
              setHoveredTabId(tabId);
              if ("vibrate" in navigator) navigator.vibrate(5);
            }
          } else {
            touchTabIdRef.current = null;
            setHoveredTabId(null);
          }
        }}
        onTouchEnd={(e) => {
          if (touchTabIdRef.current) {
            if (e.cancelable) e.preventDefault();
            setTab(touchTabIdRef.current);
          }
          touchTabIdRef.current = null;
          setHoveredTabId(null);
        }}
        onTouchCancel={() => {
          touchTabIdRef.current = null;
          setHoveredTabId(null);
        }}
      >
        <div className="absolute inset-x-2 top-0 pointer-events-none">
          {activeIndex !== -1 && (
            <motion.div
              className="flex justify-center"
              style={{ width: `${100 / navItems.length}%` }}
              initial={false}
              animate={{ 
                x: `${activeIndex * 100}%`,
                y: 0,
                opacity: isHoverOnly ? 0.5 : 1
              }}
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            >
              <div className="w-8 h-[3px] bg-primary rounded-full shadow-[0_0_8px_rgba(var(--color-primary),0.5)]" />
            </motion.div>
          )}
        </div>

        {navItems.map((item) => {
          const isActive =
            currentTab === item.id ||
            (item.id === "calendar" && currentTab === "locations");
          const isHovered = hoveredTabId === item.id;
            
          return (
            <button
              key={item.id}
              data-tab-id={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              aria-current={isActive ? "page" : undefined}
              aria-label={item.label}
              className={`relative flex-1 flex flex-col items-center justify-center gap-1 transition-colors rounded-xl touch-none ${
                isActive
                  ? "text-primary bg-primary/10"
                  : isHovered
                  ? "text-primary/70 bg-primary/5"
                  : textMuted
              }`}
            >
              <item.icon size={20} strokeWidth={isActive ? 2 : 1.5} />
              <span className="text-[10px] whitespace-nowrap">
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
