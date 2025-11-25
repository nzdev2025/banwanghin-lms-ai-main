// src/components/dashboard/AtRiskStudents.jsx (The "High Alert" Version)
import React from 'react';
import Icon from '../../icons/Icon';
import { useStudentPerformanceData } from '../../hooks/useStudentPerformanceData';

const AtRiskStudents = ({ subjects, onStudentClick }) => {
    const { students, assignments, loading } = useStudentPerformanceData(subjects);

    const atRiskStudents = React.useMemo(() => {
        const atRisk = [];
        if (loading) return atRisk;

        students.forEach((student) => {
            let lowScoreCount = 0;
            if (student.scores) {
                for (const assignmentId in student.scores) {
                    const assignment = assignments.get(assignmentId);
                    const score = student.scores[assignmentId];
                    if (assignment && typeof score === 'number') {
                        if (score / assignment.maxScore < 0.5) {
                            lowScoreCount += 1;
                        }
                    }
                }
            }
            if (lowScoreCount >= 2) {
                atRisk.push({ ...student, lowScoreCount });
            }
        });

        return atRisk.sort((a, b) => b.lowScoreCount - a.lowScoreCount);
    }, [students, assignments, loading]);

    return (
        <div className="min-h-[240px] rounded-3xl border border-rose-500/35 bg-rose-500/10 p-6 shadow-[0_25px_55px_-35px_rgba(244,63,94,0.65)] backdrop-blur-lg">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Icon name="AlertTriangle" className="text-rose-400" />
                นักเรียนที่น่าเป็นห่วง
            </h3>
            {loading ? (
                <div className="flex items-center justify-center h-48"><Icon name="Loader2" className="animate-spin text-rose-400" size={32} /></div>
            ) : atRiskStudents.length === 0 ? (
                <div className="text-center py-4 flex flex-col items-center justify-center h-48">
                    <Icon name="CheckCircle2" size={40} className="text-green-400 mb-2" />
                    <p className="text-rose-200/80">ยอดเยี่ยม!</p>
                    <p className="text-sm text-rose-200/60">ไม่มีนักเรียนที่เข้าเกณฑ์</p>
                </div>
            ) : (
                <ul className="space-y-3 max-h-64 overflow-y-auto">
                    {atRiskStudents.map(student => (
                        <li key={student.id} onClick={() => onStudentClick(student, student.grade)} className="bg-rose-500/10 hover:bg-rose-500/20 p-3 rounded-lg flex items-center gap-4 cursor-pointer transition-colors">
                            <div className="bg-rose-500/20 p-2 rounded-full">
                                <Icon name="AlertTriangle" size={20} className="text-rose-300" />
                            </div>
                            <div className="flex-grow min-w-0">
                                <p className="font-bold text-white truncate">{student.firstName} {student.lastName}</p>
                                <p className="text-xs text-rose-300/80">ป.{student.grade.replace('p','')} - มี {student.lowScoreCount} รายการที่คะแนนต่ำกว่า 50%</p>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default AtRiskStudents;
