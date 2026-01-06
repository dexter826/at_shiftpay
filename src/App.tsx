import React, { useState, useEffect } from 'react';
import Loader from './components/ui/Loading';
import { Navbar, OfflineIndicator } from './components/layout';
import { Login } from './components/auth';
import { Splashscreen, AppRouter, PullToRefresh } from './components/common';
import { ExportModal } from './components/modals';
import { Modal } from './components/ui/Modal';
import Button from './components/ui/Button';
import { ToastProvider } from './components/ui/Toast';
import { useThemeStore, useAuthStore, useAppDataStore } from './stores';
import { dbService } from './services';
import { exportDetailedReport } from './services/export';

type Tab = 'dashboard' | 'calendar' | 'employees' | 'payroll' | 'settings' | 'locations';

function App() {
  const theme = useThemeStore(state => state.theme);
  const { user, loading: authLoading, init: initAuth, logout } = useAuthStore();
  const {
    employees,
    locations,
    events,
    shifts,
    settings,
    isLoading,
    viewDate,
    setViewDate,
    totalDebt,
    activeTab,
    setActiveTab,
    initSubscriptions,
    cleanupSubscriptions,
    refreshData
  } = useAppDataStore();

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Init auth listener
  useEffect(() => {
    const unsubscribe = initAuth();
    return () => unsubscribe();
  }, [initAuth]);

  // Init data subscriptions when user changes
  useEffect(() => {
    if (user) {
      initSubscriptions(user.uid);
    } else {
      cleanupSubscriptions();
    }
    return () => cleanupSubscriptions();
  }, [user, initSubscriptions, cleanupSubscriptions]);

  // Re-init subscriptions when viewDate changes
  useEffect(() => {
    if (user) {
      initSubscriptions(user.uid);
    }
  }, [viewDate, user, initSubscriptions]);

  const handleOpenExport = () => {
    setIsExportModalOpen(true);
  };

  const handleExportReport = async (month: number, year: number, onlyDebt: boolean) => {
    try {
      setIsExporting(true);
      const queryYear = month === 0 ? 0 : year;
      const [fetchedEvents, fetchedShifts] = await Promise.all([
        dbService.getEventsByMonth(month, queryYear),
        dbService.getShiftsByMonth(month, queryYear)
      ]);
      await exportDetailedReport(month, queryYear, fetchedEvents, fetchedShifts, employees, locations, settings, onlyDebt);
      setIsExportModalOpen(false);
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const requestLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    logout();
  };

  return (
    <ToastProvider>
      <OfflineIndicator />
      {authLoading ? (
        <div className={`flex items-center justify-center h-screen ${theme === 'dark' ? 'bg-slate-900' : 'bg-slate-50'}`}>
          <Loader />
        </div>
      ) : !user ? (
        <Login onLogin={() => { }} />
      ) : (
        <AppContent
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onLogout={requestLogout}
          user={user}
          employees={employees}
          locations={locations}
          events={events}
          shifts={shifts}
          settings={settings}
          isLoading={isLoading}
          viewDate={viewDate}
          setViewDate={setViewDate}
          totalDebt={totalDebt}
          refreshData={refreshData}
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

function AppContent({
  activeTab,
  setActiveTab,
  onLogout,
  user,
  employees,
  locations,
  events,
  shifts,
  settings,
  isLoading,
  viewDate,
  setViewDate,
  totalDebt,
  refreshData,
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
  user: any;
  employees: any[];
  locations: any[];
  events: any[];
  shifts: any[];
  settings: any;
  isLoading: boolean;
  viewDate: Date;
  setViewDate: (date: Date) => void;
  totalDebt: number;
  refreshData: () => void;
  onOpenExport: () => void;
  isExportModalOpen: boolean;
  setIsExportModalOpen: (open: boolean) => void;
  onExportReport: (month: number, year: number, onlyDebt: boolean) => void;
  showLogoutConfirm: boolean;
  onCloseLogoutConfirm: () => void;
  onConfirmLogout: () => void;
}) {
  const theme = useThemeStore(state => state.theme);

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-slate-900' : 'bg-slate-50'}`}>
      <Navbar
        currentTab={activeTab}
        setTab={(t) => setActiveTab(t as Tab)}
        onLogout={onLogout}
      />
      <main className="md:pl-60">
        <PullToRefresh onRefresh={refreshData}>
          <AppRouter
            activeTab={activeTab}
            setActiveTab={(t) => setActiveTab(t as any)}
            user={user}
            employees={employees}
            locations={locations}
            events={events}
            shifts={shifts}
            settings={settings}
            loading={isLoading}
            viewDate={viewDate}
            setViewDate={setViewDate}
            totalDebt={totalDebt}
            onLogout={onLogout}
            onOpenExport={onOpenExport}
          />
        </PullToRefresh>
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
        <p className={`text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
          Bạn có chắc muốn đăng xuất khỏi ứng dụng?
        </p>
      </Modal>
    </div>
  );
}

function AppWrapper() {
  const [showSplash, setShowSplash] = useState(() => {
    return !sessionStorage.getItem('splashscreen_shown');
  });

  if (showSplash) {
    return <Splashscreen onComplete={() => setShowSplash(false)} />;
  }

  return <App />;
}

export default AppWrapper;
