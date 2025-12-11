// The main application component renders different views based on
// authentication state and wraps the UI in an error boundary.
// It uses AppContext for global state management.

import React, { Suspense, lazy } from 'react';
import { Routes, Route, Outlet, useLocation, Navigate } from 'react-router-dom';
import { AppContextProvider, useApp } from './context/AppContext';
import { SiteConfigProvider, useSiteConfig } from './context/SiteConfigContext';

// Layout
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';

// Views
import ErrorBoundary from './components/ErrorBoundary';
import Icon from './icons/Icon';

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

// Modals
import GradeSelectionModal from './components/modals/GradeSelectionModal';
import ClassDetailView from './components/modals/ClassDetailView';
import SubjectManagementModal from './components/modals/SubjectManagementModal';
import RosterManagementModal from './components/modals/RosterManagementModal';
import StudentProfileModal from './components/modals/StudentProfileModal';
import SavingsManagementModal from './components/modals/SavingsManagementModal';
import ClassroomToolkitModal from './components/modals/ClassroomToolkitModal';
import AIWorksheetGeneratorModal from './components/modals/AIWorksheetGeneratorModal';
import LineNotifySettingsModal from './components/modals/LineNotifySettingsModal';
import AttendanceModal from './components/modals/AttendanceModal';
import LightningQuizModal from './components/modals/LightningQuizModal';
import HealthRecordModal from './components/modals/HealthRecordModal';
import DevelopmentalAssessmentModal from './components/modals/DevelopmentalAssessmentModal';
import Pp5GeneratorModal from './components/modals/Pp5GeneratorModal';
import AILessonPlanGeneratorModal from './components/modals/AILessonPlanGeneratorModal';
import ResetAssignmentsModal from './components/modals/ResetAssignmentsModal';
import StudentProgressModal from './components/modals/StudentProgressModal';
import SiteEditorModal from './components/modals/SiteEditorModal';
import AttendanceReportModal from './components/modals/AttendanceReportModal';

// Loading Component
const PageLoader = () => (
  <div className="flex h-full w-full items-center justify-center">
    <Icon name="Loader2" className="animate-spin text-teal-400" size={32} />
  </div>
);

function AppContent() {
  const {
    user,
    userRole,
    authLoading,
    subjects,
    modalStack,
    openModal,
    closeModal,
    closeAllModals
  } = useApp();

  const location = useLocation();
  const isPublicQuizRoute = location.pathname.startsWith('/quiz');

  // Close all modals on route change
  React.useEffect(() => {
    closeAllModals();
  }, [location.pathname, closeAllModals]);

  const isPublicAttendanceJoinRoute = location.pathname.startsWith('/attendance/join');

  const handleStudentClick = (student, grade) => openModal('studentProfile', { student, grade });

  if (isPublicQuizRoute) {
    return (
      <ErrorBoundary>
        <Suspense fallback={<div className="min-h-screen bg-gray-900 flex items-center justify-center"><Icon name="Loader2" className="animate-spin text-teal-400" size={48} /></div>}>
          <LightningQuizJoinView />
        </Suspense>
      </ErrorBoundary>
    );
  }

  if (isPublicAttendanceJoinRoute) {
    return (
      <ErrorBoundary>
        <Suspense fallback={<div className="min-h-screen bg-gray-900 flex items-center justify-center"><Icon name="Loader2" className="animate-spin text-teal-400" size={48} /></div>}>
          <AttendanceJoinView />
        </Suspense>
      </ErrorBoundary>
    );
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Icon name="Loader2" className="animate-spin text-teal-400" size={48} />
      </div>
    );
  }
  if (!user) {
    return (
      <Suspense fallback={<div className="min-h-screen bg-gray-900 flex items-center justify-center"><Icon name="Loader2" className="animate-spin text-teal-400" size={48} /></div>}>
        <LoginView />
      </Suspense>
    );
  }

  const AppLayout = () => {
    const currentYear = new Date().getFullYear();
    const { siteConfig } = useSiteConfig();

    return (
      <div className="flex min-h-screen bg-gradient-to-br from-[#1b1f38] via-[#121629] to-[#0b1020] text-slate-100">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-hidden">
            <div className="mx-auto w-full max-w-[1400px] px-6 py-6 lg:px-10">
              <div className="flex min-h-full flex-col gap-8">
                <div className="flex-1 overflow-y-auto">
                  <Suspense fallback={<PageLoader />}>
                    <Outlet />
                  </Suspense>
                </div>
                <footer className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 px-6 py-6 text-sm text-slate-300 backdrop-blur-lg sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    © {currentYear} {siteConfig.footerText}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.3em] text-slate-500">
                    <span>เวอร์ชัน {siteConfig.version}</span>
                    <span className="hidden sm:block">•</span>
                    <span>พัฒนาโดย {siteConfig.developerName} ICT Talent Connext ED</span>
                  </div>
                </footer>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  };

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

      {modalStack.map((modal, index) => {
        if (index !== modalStack.length - 1) return null;
        switch (modal.type) {
          case 'manageAttendance':
            return <AttendanceModal key={index} onClose={closeModal} />;
          case 'attendanceReport':
            return <AttendanceReportModal key={index} onClose={closeModal} />;
          case 'lineNotifySettings':
            return <LineNotifySettingsModal key={index} onClose={closeModal} />;
          case 'selectGrade':
            return (
              <GradeSelectionModal
                key={index}
                subject={modal.data}
                onSelect={(subject, grade) => openModal('classDetail', { subject, grade })}
                onClose={closeModal}
              />
            );
          case 'classDetail':
            return (
              <ClassDetailView
                key={index}
                subject={modal.data.subject}
                grade={modal.data.grade}
                onStudentClick={handleStudentClick}
                onClose={closeModal}
              />
            );
          case 'manageSubjects':
            return <SubjectManagementModal key={index} subjects={subjects} onClose={closeModal} />;
          case 'manageRoster':
            return <RosterManagementModal key={index} onClose={closeModal} />;
          case 'studentProfile':
            return (
              <StudentProfileModal
                key={index}
                student={modal.data.student}
                grade={modal.data.grade}
                subjects={subjects}
                openModal={openModal}
                onClose={closeModal}
              />
            );
          case 'studentProgress':
            return (
              <StudentProgressModal
                key={index}
                student={modal.data.student}
                grade={modal.data.grade}
                subjects={subjects}
                onClose={closeModal}
              />
            );
          case 'manageSavings':
            return <SavingsManagementModal key={index} onClose={closeModal} />;
          case 'aiWorksheet':
            return <AIWorksheetGeneratorModal key={index} onClose={closeModal} />;
          case 'aiLessonPlan':
            return <AILessonPlanGeneratorModal key={index} onClose={closeModal} />;
          case 'lightningQuiz':
            return <LightningQuizModal key={index} onClose={closeModal} />;
          case 'classroomToolkit':
            return <ClassroomToolkitModal key={index} onClose={closeModal} />;
          case 'healthRecord':
            return <HealthRecordModal key={index} onClose={closeModal} />;
          case 'developmentalAssessment':
            return <DevelopmentalAssessmentModal key={index} onClose={closeModal} />;
          case 'pp5Generator':
            return <Pp5GeneratorModal key={index} subjects={subjects} onClose={closeModal} />;
          case 'resetAssignments':
            return <ResetAssignmentsModal key={index} subjects={subjects} onClose={closeModal} />;
          case 'siteEditor':
            return <SiteEditorModal key={index} onClose={closeModal} />;
          default:
            return null;
        }
      })}
    </ErrorBoundary>
  );
}

function App() {
  return (
    <AppContextProvider>
      <SiteConfigProvider>
        <AppContent />
      </SiteConfigProvider>
    </AppContextProvider>
  );
}

export default App;
