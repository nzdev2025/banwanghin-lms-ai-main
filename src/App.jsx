// The main application component renders different views based on
// authentication state and wraps the UI in an error boundary.  It
// subscribes to Firebase authentication and subject metadata
// collections, shows a loading spinner while auth is loading,
// presents a login form for unauthenticated users, and otherwise
// displays the dashboard and modals for managing different pieces of
// functionality.  This version includes minor refactoring to improve
// readability and adds an ErrorBoundary around the entire tree to
// gracefully handle runtime errors.

import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db, auth, onAuthStateChanged, handleLogout } from './firebase/firebase';
import { Routes, Route, Outlet, useLocation } from 'react-router-dom';

// Layout
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';

// Views
import ErrorBoundary from './components/ErrorBoundary';
import LoginView from './views/LoginView';
import DashboardView from './views/DashboardView';
import SubjectsView from './views/SubjectsView';
import StudentsView from './views/StudentsView';
import ToolsView from './views/ToolsView';
import ClassroomToolsView from './views/ClassroomToolsView';
import SettingsView from './views/SettingsView';
import LightningQuizJoinView from './views/LightningQuizJoinView';
import Icon from './icons/Icon';

// Modals
import SubjectSelectionView from './components/modals/SubjectSelectionView';
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

function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [subjects, setSubjects] = useState([]);
  const appId = 'banwanghin-lms-dev';
  const [modalStack, setModalStack] = useState([]);
  const location = useLocation();
  const isPublicQuizRoute = location.pathname.startsWith('/quiz');

  // Subscribe to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Listen to subjects metadata
  useEffect(() => {
    if (!user) return;
    const subjectsMetaPath = `artifacts/${appId}/public/data/subjects_meta`;
    const q = query(collection(db, subjectsMetaPath), orderBy('createdAt'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setSubjects(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [appId, user]);

  // Helpers to push/pop modals; using functional updates to avoid stale closures
  const openModal = (type, data = null) => {
    setModalStack((prev) => [...prev, { type, data }]);
  };
  const closeModal = () => {
    setModalStack((prev) => prev.slice(0, prev.length - 1));
  };
  const handleStudentClick = (student, grade) => openModal('studentProfile', { student, grade });

  if (isPublicQuizRoute) {
    return (
      <ErrorBoundary>
        <LightningQuizJoinView />
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
    return <LoginView />;
  }

  const AppLayout = () => {
    const currentYear = new Date().getFullYear();

    return (
      <div className="flex min-h-screen bg-gradient-to-br from-[#1b1f38] via-[#121629] to-[#0b1020] text-slate-100">
        <Sidebar openModal={openModal} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header user={user} handleLogout={handleLogout} />
          <main className="flex-1 overflow-hidden">
            <div className="mx-auto w-full max-w-[1400px] px-6 py-6 lg:px-10">
              <div className="flex min-h-full flex-col gap-8">
                <div className="flex-1 overflow-y-auto">
                  <Outlet />
                </div>
                <footer className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 px-6 py-6 text-sm text-slate-300 backdrop-blur-lg sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    © {currentYear} Banwanghin KruKit AI by Wasin Suksuwan. สงวนลิขสิทธิ์
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.3em] text-slate-500">
                    <span>เวอร์ชัน 5.0</span>
                    <span className="hidden sm:block">•</span>
                    <span>พัฒนาโดย Wasin Sukswan ICT Talent Connext ED</span>
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
          <Route index element={<DashboardView subjects={subjects} handleStudentClick={handleStudentClick} />} />
          <Route path="subjects" element={<SubjectsView subjects={subjects} openModal={openModal} />} />
          <Route path="students" element={<StudentsView openModal={openModal} />} />
          <Route path="tools" element={<ToolsView openModal={openModal} />} />
          <Route path="classroom-tools" element={<ClassroomToolsView openModal={openModal} />} />
          <Route path="settings" element={<SettingsView openModal={openModal} />} />
        </Route>
      </Routes>

      {modalStack.map((modal, index) => {
        if (index !== modalStack.length - 1) return null;
        switch (modal.type) {
          case 'manageAttendance':
            return <AttendanceModal key={index} onClose={closeModal} />;
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
          default:
            return null;
        }
      })}
    </ErrorBoundary>
  );
}

export default App;
