// src/components/modals/SavingsManagementModal.jsx

import React from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db, appId } from '../../firebase/firebase';
import { grades } from '../../constants/data';
import Icon from '../../icons/Icon';
import StudentSavingsDetailModal from './StudentSavingsDetailModal';
import SavingsReportModal from './SavingsReportModal';

const SavingsManagementModal = ({ onClose }) => {
    const [selectedGrade, setSelectedGrade] = React.useState('p1');
    const [students, setStudents] = React.useState([]);
    const [savings, setSavings] = React.useState({});
    const [isLoading, setIsLoading] = React.useState(true);
    const [selectedStudent, setSelectedStudent] = React.useState(null);
    const [isReportModalOpen, setIsReportModalOpen] = React.useState(false);
    
    const rosterBasePath = `artifacts/${appId}/public/data/rosters/${selectedGrade}`;
    const savingsBasePath = `artifacts/${appId}/public/data/savings/${selectedGrade}/students`;

    React.useEffect(() => {
        if (!db || !selectedGrade) return;
        setIsLoading(true);

        const studentsQuery = query(collection(db, `${rosterBasePath}/students`), orderBy("studentNumber"));
        const unsubStudents = onSnapshot(studentsQuery, (snapshot) => {
            setStudents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setIsLoading(false);
        });

        const savingsQuery = collection(db, savingsBasePath);
        const unsubSavings = onSnapshot(savingsQuery, (snapshot) => {
            const savingsData = {};
            snapshot.docs.forEach(doc => {
                savingsData[doc.id] = doc.data();
            });
            setSavings(savingsData);
        });

        return () => {
            unsubStudents();
            unsubSavings();
        };
    }, [selectedGrade, rosterBasePath, savingsBasePath]);

    return (
        <>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
                <div className="bg-gray-800/80 backdrop-blur-xl border border-white/20 rounded-2xl w-full max-w-2xl h-[90vh] flex flex-col shadow-2xl shadow-black/50" onClick={(e) => e.stopPropagation()}>
                    <header className="flex items-center justify-between p-4 border-b border-white/10 flex-shrink-0">
                        <h2 className="text-2xl font-bold text-white flex items-center gap-3"><Icon name="PiggyBank" />ระบบออมทรัพย์นักเรียน</h2>
                        <div className="flex items-center gap-2">
                             <button onClick={() => setIsReportModalOpen(true)} className="flex items-center gap-2 text-sm bg-transparent hover:bg-white/10 text-white font-bold py-2 px-3 rounded-lg border border-gray-600">
                                <Icon name="BookOpen" size={16} />
                                ดูรายงาน
                            </button>
                            <button onClick={onClose} className="text-gray-400 hover:text-white"><Icon name="X" size={28} /></button>
                        </div>
                    </header>
                    <div className="p-6 flex-shrink-0 border-b border-white/10">
                        <div className="flex items-center gap-2 flex-wrap">
                            {grades.map((gradeId, index) => (
                                <button
                                    key={gradeId}
                                    onClick={() => setSelectedGrade(gradeId)}
                                    className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${selectedGrade === gradeId ? 'bg-emerald-500 text-white' : 'bg-gray-700/50 hover:bg-gray-700 text-gray-300'}`}
                                >
                                    ป.{index + 1}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="p-6 flex-grow overflow-auto">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-full"><Icon name="Loader2" className="animate-spin text-emerald-400" size={40} /></div>
                        ) : (
                            <table className="w-full text-left">
                                <thead>
                                    <tr>
                                        <th className="p-3 text-sm font-semibold text-white">เลขที่</th>
                                        <th className="p-3 text-sm font-semibold text-white">ชื่อ-สกุล</th>
                                        <th className="p-3 text-sm font-semibold text-white text-center">ยอดเงินออม (บาท)</th>
                                        <th className="p-3 text-sm font-semibold text-white text-center">จัดการ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {students.map(student => (
                                        <tr key={student.id} className="border-b border-gray-700/50 hover:bg-white/5">
                                            <td className="p-3 text-gray-200">{student.studentNumber}</td>
                                            <td className="p-3 text-gray-200">{`${student.firstName} ${student.lastName}`}</td>
                                            <td className="p-3 text-center font-mono text-emerald-300">
                                                {(savings[student.id]?.totalBalance || 0).toFixed(2)}
                                            </td>
                                            <td className="p-2 text-center">
                                                <button onClick={() => setSelectedStudent(student)} className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-xs rounded-md">
                                                    ทำรายการ
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
            
            {selectedStudent && (
                <StudentSavingsDetailModal 
                    student={selectedStudent} 
                    grade={selectedGrade}
                    onClose={() => setSelectedStudent(null)} 
                />
            )}

            {isReportModalOpen && (
                <SavingsReportModal onClose={() => setIsReportModalOpen(false)} />
            )}
        </>
    );
};

export default SavingsManagementModal;