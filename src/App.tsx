import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { CalendarView } from './components/CalendarView';
import { EmployeeManager } from './components/EmployeeManager';
import { PayrollView } from './components/PayrollView';
import { Login } from './components/Login';
import { OfflineIndicator } from './components/OfflineIndicator';
import { Splashscreen } from './components/Splashscreen';
import { ToastProvider } from './components/ui/Toast';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { dbService } from './services/firebase';
import { Employee, Event, Shift, UserSettings, DEFAULT_SETTINGS } from './types';
import { auth } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

// Simple Mock Routing
type Tab = 'overview' | 'dashboard' | 'employees' | 'payroll';

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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      // Chỉ set user nếu email đã được xác thực
      if (currentUser && currentUser.emailVerified) {
        setUser(currentUser);
      } else {
        setUser(null);
      }
      setAuthLoading(false);
    });
    return unsubscribe;
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
      if (loadedCount >= 4) setIsLoading(false);
    };

    const unsubEmployees = dbService.subscribeEmployees((data) => {
      setEmployees(data);
      checkLoaded();
    });

    const unsubEvents = dbService.subscribeEvents((data) => {
      setEvents(data);
      checkLoaded();
    });

    const unsubShifts = dbService.subscribeShifts((data) => {
      setShifts(data);
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
      unsubSettings();
    };
  }, [user]);

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

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <Dashboard
            user={user}
            employees={employees}
            events={events}
            shifts={shifts}
            settings={settings}
            onLogout={handleLogout}
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
          />
        );
      case 'employees':
        return (
          <EmployeeManager
            employees={employees}
            shifts={shifts}
            events={events}
          />
        );
      case 'payroll':
        return (
          <PayrollView
            shifts={shifts}
            employees={employees}
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

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900 dark:bg-slate-900">
        <div className="w-8 h-8 border-2 border-[#ecb52d] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={() => setUser(auth.currentUser)} />;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900 dark:bg-slate-900">
        <div className="w-8 h-8 border-2 border-[#ecb52d] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <ToastProvider>
      <OfflineIndicator />
      <AppContent
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        handleLogout={handleLogout}
        renderContent={renderContent}
      />
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