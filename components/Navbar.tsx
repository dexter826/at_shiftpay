import React from 'react';
import { CalendarRange, Users, Wallet2, LogOut } from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  setTab: (tab: string) => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setTab, onLogout }) => {
  const navItems = [
    { id: 'dashboard', label: 'Lịch Tiệc', icon: CalendarRange },
    { id: 'employees', label: 'Nhân Sự', icon: Users },
    { id: 'payroll', label: 'Thanh Toán', icon: Wallet2 },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-col w-64 h-screen bg-slate-800 border-r border-slate-700 fixed left-0 top-0 z-30">
        <div className="p-6">
          <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-600">
            AT ShiftPay
          </h1>
          <p className="text-xs text-slate-500 font-medium tracking-wider uppercase mt-1">Quản lý tính công</p>
        </div>

        <nav className="flex flex-col px-3 gap-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`flex items-center gap-3 p-3 rounded-xl transition-all font-medium ${currentTab === item.id
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                : 'hover:bg-slate-700 text-slate-400 hover:text-slate-200'
                }`}
            >
              <item.icon size={20} strokeWidth={currentTab === item.id ? 2.5 : 2} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="mt-auto px-3 pb-6">
          <button
            onClick={onLogout}
            className="flex items-center gap-3 p-3 rounded-xl transition-all font-medium w-full hover:bg-red-500/10 text-red-400 hover:text-red-300"
          >
            <LogOut size={20} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </div>

      {/* Mobile Bottom Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 flex justify-around p-2 pb-safe z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.3)]">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl w-full transition-colors ${currentTab === item.id ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-500'
              }`}
          >
            <item.icon size={24} strokeWidth={currentTab === item.id ? 2.5 : 2} />
            <span className="text-[10px] font-bold">{item.label}</span>
          </button>
        ))}
      </div>
    </>
  );
};