import React, { useState, useEffect, useMemo } from 'react';
import Loader from './components/ui/Loading';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { CalendarView } from './components/CalendarView';
import { EmployeeManager } from './components/EmployeeManager';
import { PayrollView } from './components/PayrollView';
import { Login } from './components/Login';
import { OfflineIndicator } from './components/OfflineIndicator';
import { Splashscreen } from './components/Splashscreen';
import { SettingsView } from './components/SettingsView';
import { ToastProvider } from './components/ui/Toast';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { dbService } from './services/firebase';
import { Employee, Event, Shift, UserSettings, DEFAULT_SETTINGS } from './types';
import { auth } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

// Simple Mock Routing - Updated for HMR
type Tab = 'overview' | 'dashboard' | 'employees' | 'payroll' | 'settings';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  // Kiểm tra sessionStorage ngay từ đầu để tránh render không cần thiết
  const [showSplash, setShowSplash] = useState(() => {
    return !sessionStorage.getItem('splashscreen_shown');
  });

  // Global State
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [viewDate, setViewDate] = useState(new Date());

  const { theme } = useTheme();

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
            onLogout={handleLogout}
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
            onLogout={handleLogout}
          />
        );
      default:
        return null;
    }
  };

  // Hiển thị splashscreen nếu cần
  if (showSplash) {
    return <Splashscreen onComplete={() => setShowSplash(false)} />;
  }

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
          handleLogout={handleLogout}
          renderContent={() => renderContent(isLoading)}
        />
      )}
    </ToastProvider>
  );
}

// Separate component to use theme
function AppContent({
  activeTab,
  setActiveTab,
  handleLogout,
  renderContent,
}: {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  handleLogout: () => void;
  renderContent: () => React.ReactNode;
}) {
  const { theme } = useTheme();

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-slate-900' : 'bg-slate-50'}`}>
      <Navbar currentTab={activeTab} setTab={(t) => setActiveTab(t as Tab)} onLogout={handleLogout} />
      <main>
        {renderContent()}
      </main>
    </div>
  );
}

function AppWrapper() {
  return (
    <ThemeProvider>
      <App />
    </ThemeProvider>
  );
}

export default AppWrapper;