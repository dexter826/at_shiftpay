import React, { Suspense, lazy } from 'react';
import Loader from '../ui/Loading';
import { Employee, Event, Shift, UserSettings } from '../../types';

const Dashboard = lazy(() => import('../pages/Dashboard'));
const CalendarView = lazy(() => import('../pages/CalendarView'));
const EmployeeManager = lazy(() => import('../pages/EmployeeManager'));
const PayrollView = lazy(() => import('../pages/PayrollView'));
const SettingsView = lazy(() => import('../pages/SettingsView'));
const ReviewsView = lazy(() => import('../pages/ReviewsView'));

type Tab = 'overview' | 'dashboard' | 'employees' | 'payroll' | 'settings' | 'reviews';

interface AppRouterProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  user: any;
  employees: Employee[];
  events: Event[];
  shifts: Shift[];
  settings: UserSettings;
  loading: boolean;
  viewDate: Date;
  setViewDate: (date: Date) => void;
  totalDebt: number;
  onLogout: () => void;
  onOpenExport: () => void;
}

export function AppRouter({
  activeTab,
  setActiveTab,
  user,
  employees,
  events,
  shifts,
  settings,
  loading,
  viewDate,
  setViewDate,
  totalDebt,
  onLogout,
  onOpenExport
}: AppRouterProps) {
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
            loading={loading}
            onLogout={onLogout}
            onNavigateToSettings={() => setActiveTab('settings')}
            onOpenExport={onOpenExport}
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
            onNavigateToReviews={() => setActiveTab('reviews')}
            loading={loading}
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
        );
      case 'payroll':
        return (
          <PayrollView
            shifts={shifts}
            employees={employees}
            events={events}
            loading={loading}
          />
        );
      case 'reviews':
        return (
          <ReviewsView
            events={events}
            shifts={shifts}
            employees={employees}
            loading={loading}
            onBack={() => setActiveTab('dashboard')}
          />
        );
      case 'settings':
        return (
          <SettingsView
            user={user}
            settings={settings}
            onLogout={onLogout}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Suspense fallback={<Loader />}>
      {renderContent()}
    </Suspense>
  );
}
