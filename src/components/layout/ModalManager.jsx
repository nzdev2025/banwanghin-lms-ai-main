import React from 'react';
import { useApp } from '../../context/AppContext';

// Modals
import GradeSelectionModal from '../modals/GradeSelectionModal';
import ClassDetailView from '../modals/ClassDetailView';
import SubjectManagementModal from '../modals/SubjectManagementModal';
import RosterManagementModal from '../modals/RosterManagementModal';
import StudentProfileModal from '../modals/StudentProfileModal';
import SavingsManagementModal from '../modals/SavingsManagementModal';
import ClassroomToolkitModal from '../modals/ClassroomToolkitModal';
import AIWorksheetGeneratorModal from '../modals/AIWorksheetGeneratorModal';
import LineNotifySettingsModal from '../modals/LineNotifySettingsModal';
import AttendanceModal from '../modals/AttendanceModal';
import LightningQuizModal from '../modals/LightningQuizModal';
import HealthRecordModal from '../modals/HealthRecordModal';
import DevelopmentalAssessmentModal from '../modals/DevelopmentalAssessmentModal';
import Pp5GeneratorModal from '../modals/Pp5GeneratorModal';
import AILessonPlanGeneratorModal from '../modals/AILessonPlanGeneratorModal';
import ResetAssignmentsModal from '../modals/ResetAssignmentsModal';
import StudentProgressModal from '../modals/StudentProgressModal';
import SiteEditorModal from '../modals/SiteEditorModal';
import AttendanceReportModal from '../modals/AttendanceReportModal';

const ModalManager = () => {
  const { modalStack, closeModal, openModal, subjects } = useApp();

  const handleStudentClick = (student, grade) => openModal('studentProfile', { student, grade });

  return (
    <>
      {modalStack.map((modal, index) => {
        // Only render the top-most modal if you want to stack them visually, 
        // but typically all might be rendered if they overlay.
        // The original code had: if (index !== modalStack.length - 1) return null;
        // This implies only the TOP modal is visible.
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
    </>
  );
};

export default ModalManager;
