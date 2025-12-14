// The main application component renders different views based on
// authentication state and wraps the UI in an error boundary.
// It uses AppContext for global state management.

import React, { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AppContextProvider, useApp } from './context/AppContext';
import { SiteConfigProvider } from './context/SiteConfigContext';
import { ToastProvider } from './context/ToastContext';
import Toast from './components/shared/Toast';
import NetworkStatus from './components/shared/NetworkStatus';
import ErrorBoundary from './components/ErrorBoundary';
import Icon from './icons/Icon';

// Layout
import AppLayout from './components/layout/AppLayout';
import ModalManager from './components/layout/ModalManager';

// Lazy Load Views
const LoginView = lazy(() => import('./views/LoginView'));
const DashboardView = lazy(() => import('./views/DashboardView'));
const SubjectsView = lazy(() => import('./views/SubjectsView'));
const StudentsView = lazy(() => import('./views/StudentsView'));
const ToolsView = lazy(() => import('./views/ToolsView'));
const ClassroomToolsView = lazy(() => import('./views/ClassroomToolsView'));
const SettingsView = lazy(() => import('./views/SettingsView'));
const LightningQuizJoinView = lazy(() => import('./views/LightningQuizJoinView'));
const CalendarView = lazy(() => import('./views/CalendarView'));
const AttendanceJoinView = lazy(() => import('./views/AttendanceJoinView'));

const FullPageLoader = () => (
  <div className="min-h-screen bg-gray-900 flex items-center justify-center">
    <Icon name="Loader2" className="animate-spin text-teal-400" size={48} />
  </div>
);

function AppContent() {
  const {
    user,
    userRole,
    authLoading,
    subjects,
    openModal,
    closeAllModals
  } = useApp();

  const location = useLocation();
  const isPublicQuizRoute = location.pathname.startsWith('/quiz');
  const isPublicAttendanceJoinRoute = location.pathname.startsWith('/attendance/join');

  // Close all modals on route change
  useEffect(() => {
    closeAllModals();
  }, [location.pathname, closeAllModals]);

  if (isPublicQuizRoute) {
    return (
      <ErrorBoundary>
        <Suspense fallback={<FullPageLoader />}>
          <LightningQuizJoinView />
        </Suspense>
      </ErrorBoundary>
    );
  }

  if (isPublicAttendanceJoinRoute) {
    return (
      <ErrorBoundary>
        <Suspense fallback={<FullPageLoader />}>
          <AttendanceJoinView />
        </Suspense>
      </ErrorBoundary>
    );
  }

  if (authLoading) {
    return <FullPageLoader />;
  }

  if (!user) {
    return (
      <Suspense fallback={<FullPageLoader />}>
        <LoginView />
      </Suspense>
    );
  }

  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<DashboardView />} />
          <Route path="subjects" element={<SubjectsView subjects={subjects} openModal={openModal} />} />
          <Route path="calendar" element={<CalendarView subjects={subjects} />} />
          <Route path="students" element={<StudentsView openModal={openModal} />} />
          <Route path="tools" element={<ToolsView openModal={openModal} />} />
          <Route path="classroom-tools" element={<ClassroomToolsView openModal={openModal} />} />
          <Route
            path="settings"
            element={
              userRole === 'admin' ? (
                <SettingsView openModal={openModal} />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
        </Route>
        <Route path="/attendance/join/:grade/:date/:token" element={<AttendanceJoinView />} />
      </Routes>

      <ModalManager />
    </ErrorBoundary>
  );
}

function App() {
  return (
    <AppContextProvider>
      <SiteConfigProvider>
        <ToastProvider>
          <NetworkStatus />
          <AppContent />
          <Toast />
        </ToastProvider>
      </SiteConfigProvider>
    </AppContextProvider>
  );
}

export default App;