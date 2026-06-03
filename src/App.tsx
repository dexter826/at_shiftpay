import React, { useState, useEffect } from 'react';
import Loader from './components/ui/Loading';
import { Navbar, OfflineIndicator } from './components/layout';
import { Login } from './components/auth';
import { Splashscreen, AppRouter, PullToRefresh } from './components/common';
import { ExportModal } from './components/modals';
import { Modal } from './components/ui/Modal';
import Button from './components/ui/Button';
import { ToastProvider } from './components/ui/Toast';
import ScrollToTopButton from './components/ui/ScrollToTopButton';
import { useThemeStore, useAuthStore, useAppDataStore } from './stores';
import { dbService } from './services';
import { exportDetailedReport } from './services/exportService';

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
    isCalendarLoading,
    viewDate,
    setViewDate,
    totalDebt,
    activeTab,
    setActiveTab,
    initSubscriptions,
    cleanupSubscriptions,
    refreshData
  } = useAppDataStore();

  // Cập nhật tiêu đề trang theo Tab và cuộn lên đầu trang
  useEffect(() => {
    if (user && user.emailVerified) {
      const tabNames: Record<Tab, string> = {
        dashboard: 'Tổng quan',
        calendar: 'Lịch tiệc',
        employees: 'Nhân sự',
        payroll: 'Thanh toán',
        locations: 'Địa điểm',
        settings: 'Cài đặt'
      };
      document.title = `${tabNames[activeTab]} - ShiftPay`;
      window.scrollTo(0, 0);
    }
  }, [activeTab, user]);

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Lắng nghe auth
  useEffect(() => {
    const unsubscribe = initAuth();
    return () => unsubscribe();
  }, [initAuth]);

  // Tải data user
  useEffect(() => {
    if (user) {
      initSubscriptions(user.uid);
    } else {
      cleanupSubscriptions();
    }
    return () => cleanupSubscriptions();
  }, [user, initSubscriptions, cleanupSubscriptions]);

  // Sync khi đổi ngày
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
      const [fetchedEvents, fetchedShifts] = await Promise.all([
        dbService.getEventsByMonth(user.uid, month, year),
        dbService.getShiftsByMonth(user.uid, month, year)
      ]);
      await exportDetailedReport(month, year, fetchedEvents, fetchedShifts, employees, locations, settings, onlyDebt);
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
        <div className="flex items-center justify-center h-screen bg-[var(--bg-primary)]">
          <Loader />
        </div>
      ) : (!user || !user.emailVerified) ? (
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
          isCalendarLoading={isCalendarLoading}
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
  isCalendarLoading,
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
  isCalendarLoading: boolean;
  viewDate: Date;
  setViewDate: (date: Date) => void;
  totalDebt: number;
  refreshData: (userId: string) => void;
  onOpenExport: () => void;
  isExportModalOpen: boolean;
  setIsExportModalOpen: (open: boolean) => void;
  onExportReport: (month: number, year: number, onlyDebt: boolean) => void;
  showLogoutConfirm: boolean;
  onCloseLogoutConfirm: () => void;
  onConfirmLogout: () => void;
}) {
  return (
    <div className="min-h-dynamic bg-[var(--bg-primary)]">
      <Navbar
        currentTab={activeTab}
        setTab={(t) => setActiveTab(t as Tab)}
        onLogout={onLogout}
      />
      <main className="md:pl-60">
        <PullToRefresh onRefresh={() => refreshData(user.uid)}>
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
            calendarLoading={isCalendarLoading}
            viewDate={viewDate}
            setViewDate={setViewDate}
            totalDebt={totalDebt}
            onLogout={onLogout}
            onOpenExport={onOpenExport}
          />
        </PullToRefresh>
      </main>

      <ScrollToTopButton activeTab={activeTab} />

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
        <p className="text-sm text-[var(--text-secondary)]">
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
