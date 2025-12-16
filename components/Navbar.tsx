import React from 'react';
import { LayoutDashboard, CalendarRange, Users, Wallet2, LogOut } from 'lucide-react';

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
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-col w-60 h-screen bg-slate-900 border-r border-slate-800 fixed left-0 top-0 z-30">
        <div className="p-5 border-b border-slate-800">
          <h1 className="text-xl font-bold text-emerald-500">AT ShiftPay</h1>
          <p className="text-[11px] text-slate-500 mt-0.5">Quản lý tính công</p>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${currentTab === item.id
                ? 'bg-emerald-500/10 text-emerald-500'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
            >
              <item.icon size={18} strokeWidth={currentTab === item.id ? 2 : 1.5} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-slate-800">
          <button
            onClick={onLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
          >
            <LogOut size={18} strokeWidth={1.5} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </div>

      {/* Mobile Bottom Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 flex z-50">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${currentTab === item.id
              ? 'text-emerald-500'
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
