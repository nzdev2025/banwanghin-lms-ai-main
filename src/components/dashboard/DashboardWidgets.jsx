// src/components/dashboard/DashboardWidgets.jsx
import React from 'react';

// --- Widget Components ---
import AtRiskStudents from './AtRiskStudents';
import TopStudentsLeaderboard from './TopStudentsLeaderboard';
import RecentActivityFeed from './RecentActivityFeed';

const DashboardWidgets = ({ subjects, onStudentClick }) => {
    return (
        <aside className="flex flex-col gap-6 xl:sticky xl:top-36">
            <AtRiskStudents subjects={subjects} onStudentClick={onStudentClick} />
            <TopStudentsLeaderboard subjects={subjects} onStudentClick={onStudentClick} />
            <RecentActivityFeed />
        </aside>
    );
};

export default DashboardWidgets;
