import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { CalendarView } from './components/CalendarView';
import { EmployeeManager } from './components/EmployeeManager';
import { PayrollView } from './components/PayrollView';
import { Login } from './components/Login';
import { dbService } from './services/firebase';
import { Employee, Event, Shift } from './types';
import { auth } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

// Simple Mock Routing
type Tab = 'dashboard' | 'employees' | 'payroll';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Global State
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const [empData, evtData, shiftData] = await Promise.all([
        dbService.getEmployees(),
        dbService.getEvents(),
        dbService.getShifts()
      ]);
      setEmployees(empData);
      setEvents(evtData);
      setShifts(shiftData);
    } catch (error) {
      console.error("Failed to load data", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (user) {
      loadData();
    } else {
      setIsLoading(false);
    }
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
      case 'dashboard':
        return (
          <CalendarView
            events={events}
            shifts={shifts}
            employees={employees}
            refreshData={loadData}
            totalDebt={totalDebt}
          />
        );
      case 'employees':
        return (
          <EmployeeManager
            employees={employees}
            refreshData={loadData}
          />
        );
      case 'payroll':
        return (
          <PayrollView
            shifts={shifts}
            employees={employees}
            refreshData={loadData}
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
    <div className="min-h-screen bg-slate-900">
      <Navbar currentTab={activeTab} setTab={(t) => setActiveTab(t as Tab)} onLogout={handleLogout} />
      <main>
        {renderContent()}
      </main>
    </div>
  );
}

export default App;