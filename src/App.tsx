import React, { useState } from 'react';
import Loader from './components/ui/Loading';
import { Navbar, TopBar, OfflineIndicator } from './components/layout';
import { Dashboard, CalendarView, EmployeeManager, PayrollView, SettingsView } from './components/pages';
import { Login } from './components/auth';
import { Splashscreen } from './components/common';
import { ExportModal } from './components/modals';
import { Modal } from './components/ui/Modal';
import Button from './components/ui/Button';
import { ToastProvider } from './components/ui/Toast';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { dbService } from './services/firebase';
import { exportDetailedReport } from './services/excel';
import { useAppData } from './hooks/useAppData';
import { auth } from './firebase';
import { signOut } from 'firebase/auth';

// Điều hướng đơn giản (HMR)
type Tab = 'overview' | 'dashboard' | 'employees' | 'payroll' | 'settings';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    return (localStorage.getItem('activeTab') as Tab) || 'overview';
  });

  React.useEffect(() => {
    localStorage.setItem('activeTab', activeTab);
  }, [activeTab]);

  // Custom hook quản lý dữ liệu
  const {
    user,
    authLoading,
    employees,
    events,
    shifts,
    settings,
    isLoading,
    viewDate,
    setViewDate,
    totalDebt
  } = useAppData();

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const { theme } = useTheme();

  const handleOpenExport = () => {
    setIsExportModalOpen(true);
  };

  const handleExportReport = async (month: number, year: number) => {
    try {
      setIsExporting(true);
      const [fetchedEvents, fetchedShifts] = await Promise.all([
        dbService.getEventsByMonth(month, year),
        dbService.getShiftsByMonth(month, year)
      ]);
      await exportDetailedReport(month, year, fetchedEvents, fetchedShifts, employees, settings);
      setIsExportModalOpen(false);
    } catch (error) {
      console.error("Export failed:", error);
      // Ideally show a toast here
    } finally {
      setIsExporting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error", error);
    }
  };

  const requestLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    handleLogout();
  };

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
            onLogout={requestLogout}
            onNavigateToSettings={() => setActiveTab('settings')}
            onOpenExport={handleOpenExport}
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
      case 'settings':
        return (
          <SettingsView
            user={user}
            settings={settings}
            onLogout={requestLogout}
          />
        );
      default:
        return null;
    }
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
          renderContent={() => renderContent(isLoading)}
          user={user}
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

// Tách component để dùng theme
function AppContent({
  activeTab,
  setActiveTab,
  onLogout,
  renderContent,
  user,
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
  renderContent: () => React.ReactNode;
  user: any;
  onOpenExport: () => void;
  isExportModalOpen: boolean;
  setIsExportModalOpen: (open: boolean) => void;
  onExportReport: (month: number, year: number) => void;
  showLogoutConfirm: boolean;
  onCloseLogoutConfirm: () => void;
  onConfirmLogout: () => void;
}) {
  const { theme } = useTheme();

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-slate-900' : 'bg-slate-50'}`}>
      <TopBar
        user={user}
        onNavigateToSettings={() => setActiveTab('settings')}
        onLogout={onLogout}
      />
      <Navbar
        currentTab={activeTab}
        setTab={(t) => setActiveTab(t as Tab)}
        onLogout={onLogout}
      />
      <main>
        {renderContent()}
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
        <p className={`text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>Bạn có chắc muốn đăng xuất khỏi ứng dụng?</p>
      </Modal>
    </div>
  );
}

function AppWrapper() {
  return (
    <ThemeProvider>
      <AppWithSplash />
    </ThemeProvider>
  );
}

function AppWithSplash() {
  // Check sessionStorage tránh render thừa
  const [showSplash, setShowSplash] = useState(() => {
    return !sessionStorage.getItem('splashscreen_shown');
  });

  // Hiển thị splashscreen
  if (showSplash) {
    return <Splashscreen onComplete={() => setShowSplash(false)} />;
  }

  return <App />;
}

export default AppWrapper;