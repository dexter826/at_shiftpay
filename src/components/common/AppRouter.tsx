import React, { Suspense, lazy } from 'react';
import Loader from '../ui/Loading';
import { Employee, Event, Shift, UserSettings } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';
import styled from 'styled-components';

const Dashboard = lazy(() => import('../pages/Dashboard'));
const CalendarView = lazy(() => import('../pages/CalendarView'));
const EmployeeManager = lazy(() => import('../pages/EmployeeManager'));
const PayrollView = lazy(() => import('../pages/PayrollView'));
const SettingsView = lazy(() => import('../pages/SettingsView'));
const ReviewsView = lazy(() => import('../pages/ReviewsView'));

type Tab = 'overview' | 'dashboard' | 'employees' | 'payroll' | 'settings' | 'reviews';

// Loading overlay for Suspense fallback
const LoadingOverlay = styled.div<{ theme: string }>`
  position: fixed;
  inset: 0;
  background: ${props => props.theme === 'dark' ? 'rgba(15, 23, 42, 0.95)' : 'rgba(248, 250, 252, 0.95)'};
  backdrop-filter: blur(4px);
  z-index: 9998;
  display: flex;
  align-items: center;
  justify-content: center;
  padding-top: env(safe-area-inset-top, 0);
  padding-bottom: env(safe-area-inset-bottom, 0);
  padding-left: env(safe-area-inset-left, 0);
  padding-right: env(safe-area-inset-right, 0);
`;

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
  const { theme } = useTheme();

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
    <Suspense fallback={
      <LoadingOverlay theme={theme}>
        <Loader />
      </LoadingOverlay>
    }>
      {renderContent()}
    </Suspense>
  );
}
