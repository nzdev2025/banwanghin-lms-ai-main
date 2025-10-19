import React from 'react';
import OverallAnalytics from '../components/analytics/OverallAnalytics';

const DashboardView = ({ subjects, handleStudentClick }) => (
  <div className="flex h-full flex-col overflow-hidden">
    <OverallAnalytics subjects={subjects} onStudentClick={handleStudentClick} />
  </div>
);

export default DashboardView;
