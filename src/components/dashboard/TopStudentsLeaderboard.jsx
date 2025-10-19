// src/components/dashboard/TopStudentsLeaderboard.jsx (The "Champion" Version)
import React from 'react';
import { getDocs, collection } from 'firebase/firestore';
import { db, appId } from '../../firebase/firebase';
import { grades } from '../../constants/data';
import Icon from '../../icons/Icon';

const TopStudentsLeaderboard = ({ subjects, onStudentClick }) => {
    const [topStudents, setTopStudents] = React.useState([]);
    const [isLoading, setIsLoading] = React.useState(true);

    // Memoize podium styles to avoid redefining on each render
    const podiumStyles = React.useMemo(() => ({
        0: { iconColor: 'text-amber-300', ringColor: 'bg-amber-400/20', borderColor: 'border-amber-400/30' },
        1: { iconColor: 'text-slate-300', ringColor: 'bg-slate-400/20', borderColor: 'border-slate-400/30' },
        2: { iconColor: 'text-orange-400', ringColor: 'bg-orange-500/20', borderColor: 'border-orange-500/30' },
    }), []);

    React.useEffect(() => {
        const calculateTopStudents = async () => {
            if (!db || subjects.length === 0) {
                setIsLoading(false);
                return;
            }
            setIsLoading(true);

            const studentData = new Map();
            const assignmentsMap = new Map();

            // 1. Fetch all data
            for (const grade of grades) {
                 const studentsSnap = await getDocs(collection(db, `artifacts/${appId}/public/data/rosters/${grade}/students`));
                 studentsSnap.forEach(doc => {
                    if (!studentData.has(doc.id)) {
                        studentData.set(doc.id, { ...doc.data(), id: doc.id, grade, scores: {} });
                    }
                });

                for (const subject of subjects) {
                    const assignmentsSnap = await getDocs(collection(db, `artifacts/${appId}/public/data/subjects/${subject.id}/grades/${grade}/assignments`));
                    assignmentsSnap.forEach(doc => {
                        if (!assignmentsMap.has(doc.id)) assignmentsMap.set(doc.id, doc.data());
                    });

                    const scoresSnap = await getDocs(collection(db, `artifacts/${appId}/public/data/subjects/${subject.id}/grades/${grade}/scores`));
                    scoresSnap.forEach(scoreDoc => {
                        const student = studentData.get(scoreDoc.id);
                        if (student) {
                            student.scores = { ...student.scores, ...scoreDoc.data() };
                        }
                    });
                }
            }
            
            // 2. Calculate scores and rank
            const rankedStudents = [];
            studentData.forEach(student => {
                let totalEarned = 0;
                let totalMax = 0;
                Object.keys(student.scores).forEach(assignmentId => {
                    const assignment = assignmentsMap.get(assignmentId);
                    if (assignment && typeof student.scores[assignmentId] === 'number') {
                        totalEarned += student.scores[assignmentId];
                        totalMax += assignment.maxScore;
                    }
                });
                const percentage = totalMax > 0 ? (totalEarned / totalMax) * 100 : 0;
                if (percentage > 0) {
                     rankedStudents.push({ ...student, score: percentage });
                }
            });

            const topThree = rankedStudents.sort((a, b) => b.score - a.score).slice(0, 3);
            setTopStudents(topThree);
            setIsLoading(false);
        };

        calculateTopStudents();
    }, [subjects]);

    return (
        <div className="min-h-[240px] rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-lg shadow-[0_25px_55px_-35px_rgba(15,23,42,0.8)]">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Icon name="Crown" className="text-amber-300" />
                นักเรียนยอดเยี่ยม (Leaderboard)
            </h3>
            {isLoading ? (
                 <div className="space-y-3">
                    {Array(3).fill(0).map((_, i) => <div key={i} className="h-16 bg-gray-700/50 rounded-lg animate-pulse"></div>)}
                </div>
            ) : topStudents.length === 0 ? (
                <div className="text-center py-4 flex flex-col items-center justify-center h-48">
                    <p className="text-gray-500">ยังไม่มีข้อมูลคะแนนเพียงพอ</p>
                    <p className="text-sm text-gray-600">โปรดเพิ่มคะแนนในรายวิชาก่อน</p>
                </div>
            ) : (
                <ul className="space-y-3">
                    {topStudents.map((student, index) => {
                         const style = podiumStyles[index] || { iconColor: 'text-gray-400', ringColor: 'bg-gray-600/20', borderColor: 'border-gray-600/30' };
                         return (
                            <li key={student.id} onClick={() => onStudentClick(student, student.grade)} className={`bg-white/5 hover:bg-white/10 border ${style.borderColor} p-3 rounded-lg flex items-center gap-4 cursor-pointer transition-colors`}>
                                <div className={`p-2 rounded-full ${style.ringColor}`}>
                                    <Icon name="Crown" size={24} className={style.iconColor} />
                                </div>
                                <div className="flex-grow min-w-0">
                                    <p className="font-bold text-white truncate">{student.firstName} {student.lastName}</p>
                                    <p className="text-xs text-gray-400">ป.{student.grade.replace('p','')} - คะแนนรวม {student.score.toFixed(2)}%</p>
                                </div>
                                <span className="font-bold text-xl text-white">#{index + 1}</span>
                            </li>
                         )
                    })}
                </ul>
            )}
        </div>
    );
};

export default TopStudentsLeaderboard;
