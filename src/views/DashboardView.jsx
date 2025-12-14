import React, { useEffect } from 'react';
import OverallAnalytics from '../components/analytics/OverallAnalytics';
import AnnouncementBanner from '../components/dashboard/AnnouncementBanner';
import StudentSearchBar from '../components/dashboard/StudentSearchBar';
import { useApp } from '../context/AppContext';
import { useSiteConfig } from '../context/SiteConfigContext';

const DashboardView = () => {
  const { subjects, openModal, allStudents, isLoadingStudents, fetchAllStudents } = useApp();
  const { siteConfig } = useSiteConfig();

  // Fetch all students on mount (cached in context)
  useEffect(() => {
    fetchAllStudents();
  }, [fetchAllStudents]);

  const handleStudentSelect = (student) => {
    openModal('studentProfile', { student, grade: student.grade });
  };

  const handleStudentClick = (student, grade) => {
    openModal('studentProfile', { student, grade });
  };

  return (
    <div className="flex h-full flex-col overflow-hidden gap-6">
      {/* Announcement Banner */}
      <AnnouncementBanner config={siteConfig.announcement} />

      {/* Search Bar Section */}
      <StudentSearchBar
        students={allStudents}
        isLoading={isLoadingStudents}
        onStudentSelect={handleStudentSelect}
      />

      {/* Analytics Dashboard */}
      <OverallAnalytics subjects={subjects} onStudentClick={handleStudentClick} />
    </div>
  );
};

export default DashboardView;