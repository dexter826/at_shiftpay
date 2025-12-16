import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { CalendarView } from './components/CalendarView';
import { EmployeeManager } from './components/EmployeeManager';
import { PayrollView } from './components/PayrollView';
import { Login } from './components/Login';
import { ToastProvider } from './components/ui/Toast';
import { dbService } from './services/firebase';
import { Employee, Event, Shift } from './types';
import { auth } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

// Simple Mock Routing
type Tab = 'overview' | 'dashboard' | 'employees' | 'payroll';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Global State
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
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
      if (loadedCount >= 3) setIsLoading(false);
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

    return () => {
      unsubEmployees();
      unsubEvents();
      unsubShifts();
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
          />
        );
      case 'employees':
        return (
          <EmployeeManager
            employees={employees}
            shifts={shifts}
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

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={() => setUser(auth.currentUser)} />;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-slate-900">
        <Navbar currentTab={activeTab} setTab={(t) => setActiveTab(t as Tab)} onLogout={handleLogout} />
        <main>
          {renderContent()}
        </main>
      </div>
    </ToastProvider>
  );
}

export default App;