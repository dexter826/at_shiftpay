import React from 'react';
import { motion } from 'framer-motion';
import { Employee, Event, Shift, UserSettings, Location } from '../../types';

import Dashboard from '../pages/Dashboard';
import CalendarView from '../pages/CalendarView';
import EmployeeManager from '../pages/EmployeeManager';
import PayrollView from '../pages/PayrollView';
import SettingsView from '../pages/SettingsView';
import LocationManager from '../pages/LocationManager';

type Tab = 'dashboard' | 'calendar' | 'employees' | 'payroll' | 'settings' | 'locations';

interface AppRouterProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  user: any;
  employees: Employee[];
  locations: Location[];
  events: Event[];
  shifts: Shift[];
  settings: UserSettings;
  loading: boolean;
  calendarLoading: boolean;
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
  locations,
  events,
  shifts,
  settings,
  loading,
  calendarLoading,
  viewDate,
  setViewDate,
  totalDebt,
  onLogout,
  onOpenExport
}: AppRouterProps) {
  const tabs = [
    {
      id: 'dashboard',
      component: (
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
      )
    },
    {
      id: 'calendar',
      component: (
        <CalendarView
          events={events}
          shifts={shifts}
          employees={employees}
          locations={locations}
          totalDebt={totalDebt}
          settings={settings}
          currentDate={viewDate}
          onDateChange={setViewDate}
          onNavigateToReviews={() => setActiveTab('locations')}
          loading={loading || calendarLoading}
        />
      )
    },
    {
      id: 'employees',
      component: (
        <EmployeeManager
          employees={employees}
          shifts={shifts}
          events={events}
          loading={loading}
        />
      )
    },
    {
      id: 'payroll',
      component: (
        <PayrollView
          shifts={shifts}
          employees={employees}
          events={events}
          locations={locations}
          loading={loading}
        />
      )
    },
    {
      id: 'locations',
      component: (
        <LocationManager
          locations={locations}
          loading={loading}
          onBack={() => setActiveTab('calendar')}
        />
      )
    },
    {
      id: 'settings',
      component: (
        <SettingsView
          user={user}
          settings={settings}
          onLogout={onLogout}
        />
      )
    }
  ];

  return (
    <div className="relative">
      {tabs.filter(tab => activeTab === tab.id).map((tab) => (
        <div
          key={tab.id}
          className="block"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
          >
            {tab.component}
          </motion.div>
        </div>
      ))}
    </div>
  );
};
