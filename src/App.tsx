import React, { useState, useEffect, useMemo } from 'react';
import Loader from './components/ui/Loading';
import { Navbar, TopBar, OfflineIndicator } from './components/layout';
import { Dashboard, CalendarView, EmployeeManager, PayrollView, SettingsView } from './components/pages';
import { Login } from './components/auth';
import { Splashscreen } from './components/common';
import { ExportModal } from './components/modals';
import { Modal } from './components/ui/Modal';
import Button from './components/ui/Button';
import { ToastProvider } from './components/ui/Toast';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { dbService } from './services/firebase';
import { exportDetailedReport } from './services/excel';
import { Employee, Event, Shift, UserSettings, DEFAULT_SETTINGS } from './types';
import { auth } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

// Simple Mock Routing - Updated for HMR
type Tab = 'overview' | 'dashboard' | 'employees' | 'payroll' | 'settings';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Global State
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [viewDate, setViewDate] = useState(new Date());

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const { theme } = useTheme();

  const handleOpenExport = () => {
    setIsExportModalOpen(true);
  };



  const handleExportReport = async (month: number, year: number) => {
    try {
      setIsLoading(true);
      const [fetchedEvents, fetchedShifts] = await Promise.all([
        dbService.getEventsByMonth(month, year),
        dbService.getShiftsByMonth(month, year)
      ]);
      await exportDetailedReport(month, year, fetchedEvents, fetchedShifts, employees, settings);
      setIsExportModalOpen(false);
    } catch (error) {
      console.error("Export failed:", error);
      // Ideally show a toast here
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Real-time subscriptions
  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    let loadedCount = 0;
    const checkLoaded = () => {
      loadedCount++;
      if (loadedCount >= 5) setIsLoading(false); // Increased count for unpaid shifts
    };

    const unsubEmployees = dbService.subscribeEmployees((data) => {
      setEmployees(data);
      checkLoaded();
    });

    const currentMonth = viewDate.getMonth();
    const currentYear = viewDate.getFullYear();

    const unsubEvents = dbService.subscribeEventsByMonth(currentMonth, currentYear, (data) => {
      setEvents(data);
      checkLoaded();
    });

    // Load current month shifts
    let currentMonthShifts: Shift[] = [];
    let unpaidShifts: Shift[] = [];

    // Helper to merge shifts without duplicates
    const mergeShifts = (monthShifts: Shift[], unpaid: Shift[]) => {
      const uniqueShifts = new Map<string, Shift>();
      [...monthShifts, ...unpaid].forEach(s => uniqueShifts.set(s.id, s));
      return Array.from(uniqueShifts.values());
    };

    const unsubShifts = dbService.subscribeShiftsByMonth(currentMonth, currentYear, (data) => {
      currentMonthShifts = data;
      setShifts(mergeShifts(currentMonthShifts, unpaidShifts));
      checkLoaded();
    });

    const unsubUnpaid = dbService.subscribeUnpaidShifts((data) => {
      unpaidShifts = data;
      setShifts(mergeShifts(currentMonthShifts, unpaidShifts));
      checkLoaded();
    });

    const unsubSettings = dbService.subscribeSettings((data) => {
      setSettings(data);
      checkLoaded();
    });

    return () => {
      unsubEmployees();
      unsubEvents();
      unsubShifts();
      unsubUnpaid();
      unsubSettings();
    };
  }, [user, viewDate]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error", error);
    }
  };


  const requestLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    handleLogout();
  };

  // Derived State
  const totalDebt = useMemo(() => {
    return shifts
      .filter(s => s.status === 'unpaid')
      .reduce((sum, s) => sum + s.amount, 0);
  }, [shifts]);

  const renderContent = (loading: boolean) => {
    switch (activeTab) {
      case 'overview':
        return (
          <Dashboard
            user={user}
            employees={employees}
            events={events}
            shifts={shifts}
            settings={settings}
            loading={loading}

            onLogout={requestLogout}
            onNavigateToSettings={() => setActiveTab('settings')}
            currentDate={viewDate}
          />
        );
      case 'dashboard':
        return (
          <CalendarView
            events={events}
            shifts={shifts}
            employees={employees}
            totalDebt={totalDebt}
            settings={settings}
            currentDate={viewDate}
            onDateChange={setViewDate}
          />
        );
      case 'employees':
        return (
          <EmployeeManager
            employees={employees}
            shifts={shifts}
            events={events}
            loading={loading}
          />
        ); // Payroll and Settings cases are unchanged
      case 'payroll':
        return (
          <PayrollView
            shifts={shifts}
            employees={employees}
          />
        );
      case 'settings':
        return (
          <SettingsView
            user={user}
            settings={settings}

            onLogout={requestLogout}
          />
        );
      default:
        return null;
    }
  };

  return (
    <ToastProvider>
      <OfflineIndicator />
      {authLoading ? (
        <div className={`flex items-center justify-center h-screen ${theme === 'dark' ? 'bg-slate-900' : 'bg-slate-50'}`}>
          <Loader />
        </div>
      ) : !user ? (
        <Login onLogin={() => setUser(auth.currentUser)} />
      ) : (
        <AppContent
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onLogout={requestLogout}
          renderContent={() => renderContent(isLoading)}
          user={user}
          onOpenExport={handleOpenExport}
          isExportModalOpen={isExportModalOpen}
          setIsExportModalOpen={setIsExportModalOpen}
          onExportReport={handleExportReport}
          showLogoutConfirm={showLogoutConfirm}
          onCloseLogoutConfirm={() => setShowLogoutConfirm(false)}
          onConfirmLogout={confirmLogout}
        />
      )}
    </ToastProvider>
  );
}

// Separate component to use theme
function AppContent({
  activeTab,
  setActiveTab,
  onLogout,
  renderContent,
  user,
  onOpenExport,
  isExportModalOpen,
  setIsExportModalOpen,
  onExportReport,
  showLogoutConfirm,
  onCloseLogoutConfirm,
  onConfirmLogout
}: {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  onLogout: () => void;
  renderContent: () => React.ReactNode;
  user: any;
  onOpenExport: () => void;
  isExportModalOpen: boolean;
  setIsExportModalOpen: (open: boolean) => void;
  onExportReport: (month: number, year: number) => void;
  showLogoutConfirm: boolean;
  onCloseLogoutConfirm: () => void;
  onConfirmLogout: () => void;
}) {
  const { theme } = useTheme();

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-slate-900' : 'bg-slate-50'}`}>
      <TopBar
        user={user}
        onOpenExport={onOpenExport}
        onNavigateToSettings={() => setActiveTab('settings')}
        onLogout={onLogout}
      />
      <Navbar
        currentTab={activeTab}
        setTab={(t) => setActiveTab(t as Tab)}
        onLogout={onLogout}
        onOpenExport={onOpenExport}
      />
      <main>
        {renderContent()}
      </main>

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={onExportReport}
      />

      <Modal
        title="Xác nhận đăng xuất"
        isOpen={showLogoutConfirm}
        onClose={onCloseLogoutConfirm}
        footer={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={onCloseLogoutConfirm}
              className="flex-1"
              hideIcon
            >
              Hủy
            </Button>
            <Button
              variant="danger"
              onClick={onConfirmLogout}
              className="flex-1"
            >
              Đăng xuất
            </Button>
          </div>
        }
      >
        <p className="text-sm text-slate-300">Bạn có chắc muốn đăng xuất khỏi ứng dụng?</p>
      </Modal>
    </div>
  );
}

function AppWrapper() {
  return (
    <ThemeProvider>
      <AppWithSplash />
    </ThemeProvider>
  );
}

function AppWithSplash() {
  // Kiểm tra sessionStorage ngay từ đầu để tránh render không cần thiết
  const [showSplash, setShowSplash] = useState(() => {
    return !sessionStorage.getItem('splashscreen_shown');
  });

  // Hiển thị splashscreen nếu cần
  if (showSplash) {
    return <Splashscreen onComplete={() => setShowSplash(false)} />;
  }

  return <App />;
}

export default AppWrapper;