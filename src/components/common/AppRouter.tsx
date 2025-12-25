import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Employee, Event, Shift, UserSettings } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';
import styled from 'styled-components';

import Dashboard from '../pages/Dashboard';
import CalendarView from '../pages/CalendarView';
import EmployeeManager from '../pages/EmployeeManager';
import PayrollView from '../pages/PayrollView';
import SettingsView from '../pages/SettingsView';
import ReviewsView from '../pages/ReviewsView';

type Tab = 'dashboard' | 'calendar' | 'employees' | 'payroll' | 'settings' | 'reviews';

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
      case 'dashboard':
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
      case 'calendar':
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
            onBack={() => setActiveTab('calendar')}
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
    <AnimatePresence mode="wait">
      <motion.div
        key={activeTab}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
      >
        {renderContent()}
      </motion.div>
    </AnimatePresence>
  );
}
