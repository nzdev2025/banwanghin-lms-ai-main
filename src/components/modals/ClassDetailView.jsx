import React from 'react';
import { collection, doc, onSnapshot, setDoc, addDoc, serverTimestamp, query, orderBy, deleteDoc, writeBatch, getDocs, deleteField } from 'firebase/firestore';
import { db, logActivity, appId } from '../../firebase/firebase';
import { assignmentCategories } from '../../constants/data';
import Icon from '../../icons/Icon';
import AnalyticsDashboard from '../analytics/AnalyticsDashboard';
import AssignmentModal from './AssignmentModal';
import ConfirmationModal from './ConfirmationModal';

const ClassDetailView = ({ subject, grade, onClose, onStudentClick }) => {
    const [students, setStudents] = React.useState([]);
    const [assignments, setAssignments] = React.useState([]);
    const [scores, setScores] = React.useState({});
    const [isLoading, setIsLoading] = React.useState(true);
    const [isSaving, setIsSaving] = React.useState(false);
    const [modal, setModal] = React.useState({ type: null, data: null });

    const subjectBasePath = `artifacts/${appId}/public/data/subjects/${subject.id}/grades/${grade}`;
    const rosterBasePath = `artifacts/${appId}/public/data/rosters/${grade}`;

    React.useEffect(() => {
        if (!db) return;
        setIsLoading(true);
        const studentsQuery = query(collection(db, `${rosterBasePath}/students`), orderBy("studentNumber"));
        const assignmentsQuery = query(collection(db, `${subjectBasePath}/assignments`), orderBy("createdAt"));
        const scoresQuery = collection(db, `${subjectBasePath}/scores`);

        const unsubscribers = [
            onSnapshot(studentsQuery, (snapshot) => setStudents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))),
            onSnapshot(assignmentsQuery, (snapshot) => setAssignments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))),
            onSnapshot(scoresQuery, (snapshot) => {
                const scoreData = {};
                snapshot.docs.forEach(doc => { scoreData[doc.id] = doc.data(); });
                setScores(scoreData);
                setIsLoading(false);
            })
        ];
        return () => unsubscribers.forEach(unsub => unsub());
    }, [subjectBasePath, rosterBasePath]);

    const handleScoreChange = (studentId, assignmentId, value) => {
        const newScores = JSON.parse(JSON.stringify(scores));
        if (!newScores[studentId]) newScores[studentId] = {};
        newScores[studentId][assignmentId] = value === '' ? null : parseInt(value, 10);
        setScores(newScores);
    };

    const handleSaveAll = async () => {
        if (!db) return;
        setIsSaving(true);
        try {
            const batch = writeBatch(db);
            Object.keys(scores).forEach(studentId => {
                const studentScores = scores[studentId];
                const docRef = doc(db, `${subjectBasePath}/scores`, studentId);
                batch.set(docRef, studentScores, { merge: true });
            });
            await batch.commit();
            logActivity('SCORE_UPDATE', `บันทึกคะแนนในวิชา <strong>${subject.name}</strong> (ป.${grade.replace('p','')})`);
        } catch (error) { console.error("Error saving scores:", error); }
        finally { setIsSaving(false); }
    };

    const handleAddOrEditAssignment = async (data) => {
        if (!db) return;
        try {
            if (data.id) {
                const docRef = doc(db, `${subjectBasePath}/assignments`, data.id);
                // eslint-disable-next-line no-unused-vars
                const { id, ...dataToUpdate } = data;
                await setDoc(docRef, dataToUpdate, { merge: true });
                logActivity('ASSIGNMENT_UPDATE', `แก้ไขงาน <strong>"${data.name}"</strong> ในวิชา <strong>${subject.name}</strong>`);
            } else {
                // eslint-disable-next-line no-unused-vars
                const { id, ...dataToAdd } = data;
                await addDoc(collection(db, `${subjectBasePath}/assignments`), { ...dataToAdd, createdAt: serverTimestamp() });
                logActivity('ASSIGNMENT_CREATE', `เพิ่มงานใหม่ <strong>"${data.name}"</strong> ในวิชา <strong>${subject.name}</strong>`);
            }
            setModal({ type: null, data: null });
        } catch (error) { console.error(`Error saving assignment:`, error); }
    };

    const handleDeleteAssignment = async (id) => {
        if (!id || !db) return;
        const assignmentToDelete = assignments.find(a => a.id === id);
        if(!assignmentToDelete) return;
        try {
            await deleteDoc(doc(db, `${subjectBasePath}/assignments`, id));

            const scoresQuery = query(collection(db, `${subjectBasePath}/scores`));
            const scoresSnapshot = await getDocs(scoresQuery);
            const batch = writeBatch(db);
            scoresSnapshot.forEach(scoreDoc => {
                batch.update(scoreDoc.ref, { [id]: deleteField() });
            });
            await batch.commit();
            logActivity('ASSIGNMENT_DELETE', `ลบงาน <strong>"${assignmentToDelete.name}"</strong> จากวิชา <strong>${subject.name}</strong>`);
            setModal({ type: null, data: null });
        } catch (error) { console.error(`Error deleting assignment:`, error); }
    };

    const handleExportData = () => {
        const headers = ['เลขที่', 'ชื่อ', 'สกุล', ...assignments.map(a => `${a.name} (${a.maxScore})`)];
        const rows = students.map(student => {
            const studentScores = assignments.map(assign => scores[student.id]?.[assign.id] ?? '');
            return [student.studentNumber, student.firstName, student.lastName, ...studentScores];
        });

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `${subject.name}_ป${grade.replace('p','')}_scores.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (isLoading) return <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center"><Icon name="Loader2" className="animate-spin text-teal-500" size={48} /></div>;

    return (
        <>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-gray-800/80 backdrop-blur-xl border border-white/20 rounded-2xl w-full max-w-7xl h-[90vh] flex flex-col shadow-2xl shadow-black/50">
                    <header className="flex items-center justify-between p-4 border-b border-white/10 flex-shrink-0">
                        <div><h2 className="text-2xl font-bold text-white">{subject.name} - (ป.{grade.replace('p','')})</h2><p className="text-gray-400">ตารางบันทึกคะแนน</p></div>
                        <button onClick={onClose} className="text-gray-400 hover:text-white"><Icon name="X" size={28} /></button>
                    </header>
                    <div className="p-6 flex-grow overflow-auto">
                        <AnalyticsDashboard students={students} assignments={assignments} scores={scores} />

                        <table className="w-full min-w-[900px] text-left border-collapse">
                            <thead className="sticky top-0 bg-gray-800/80 backdrop-blur-xl z-10">
                                <tr>
                                    <th className="p-3 text-sm font-semibold text-white border-b border-r border-gray-700 w-16 text-center">เลขที่</th>
                                    <th className="p-3 text-sm font-semibold text-white border-b border-r border-gray-700 min-w-[250px]">ชื่อ-สกุล</th>
                                    {assignments.map(assign => {
                                        const category = assignmentCategories[assign.category] || assignmentCategories.quiz;
                                        return (
                                            <th key={assign.id} className={`p-3 text-sm text-white border-b border-r border-gray-700 text-center w-40 group relative`}>
                                                <div className="flex flex-col items-center justify-center gap-1">
                                                    <span className="font-semibold w-full truncate" title={assign.name}>{assign.name}</span>
                                                    <span className="text-xs text-gray-400 font-normal">({assign.maxScore} คะแนน)</span>
                                                    <span className={`mt-1 text-xs font-medium px-2 py-0.5 rounded-full ${category.color}`}>{category.label}</span>
                                                </div>
                                                <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => setModal({ type: 'editAssignment', data: assign })} className="p-1 bg-sky-500/50 hover:bg-sky-500 rounded"><Icon name="Pencil" size={12}/></button>
                                                    <button onClick={() => setModal({ type: 'deleteConfirmation', data: { type: 'assignment', id: assign.id, name: assign.name }})} className="p-1 bg-red-500/50 hover:bg-red-500 rounded"><Icon name="Trash2" size={12}/></button>
                                                </div>
                                            </th>
                                        );
                                    })}
                                    <th className="p-3 text-sm font-semibold text-white border-b border-r border-gray-700 text-center w-28">คะแนนรวม</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map(student => {
                                   const totalScore = assignments.reduce((sum, assign) => (sum + (scores[student.id]?.[assign.id] ?? 0)), 0);
                                   return (
                                    <tr key={student.id} className="hover:bg-white/5">
                                        <td className="p-2 text-center border-b border-r border-gray-700 text-gray-200">{student.studentNumber}</td>
                                        <td className="p-2 font-medium text-gray-200 border-b border-r border-gray-700 cursor-pointer hover:text-teal-300" onClick={() => onStudentClick(student, grade)}>{`${student.firstName} ${student.lastName}`}</td>
                                        {assignments.map(assign => (
                                            <td key={assign.id} className="p-0 border-b border-r border-gray-700">
                                                <input type="number" max={assign.maxScore} min="0" value={scores[student.id]?.[assign.id] ?? ''} onChange={(e) => handleScoreChange(student.id, assign.id, e.target.value)} className="w-full h-full bg-transparent text-center text-white p-3 outline-none focus:bg-sky-500/20" placeholder="-"/>
                                            </td>
                                        ))}
                                        <td className="p-3 text-center border-b border-r border-gray-700 font-bold text-teal-300">{totalScore}</td>
                                    </tr>
                                   );
                                })}
                            </tbody>
                        </table>
                    </div>
                    <footer className="flex items-center justify-between p-4 border-t border-white/10 flex-shrink-0 gap-4">
                        <div className="flex gap-4">
                            <button onClick={() => setModal({ type: 'addAssignment' })} className="flex items-center gap-2 text-sm bg-transparent hover:bg-white/10 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 border border-gray-600"><Icon name="FilePlus" size={16} />เพิ่มรายการเก็บคะแนน</button>
                            <button onClick={handleExportData} className="flex items-center gap-2 text-sm bg-transparent hover:bg-white/10 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 border border-gray-600"><Icon name="Download" size={16} />ส่งออกคะแนน</button>
                        </div>
                        <button onClick={handleSaveAll} disabled={isSaving} className="flex items-center gap-2 text-sm bg-teal-500/80 hover:bg-teal-500 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 shadow-lg shadow-teal-500/20 disabled:bg-gray-500 disabled:cursor-not-allowed">
                            {isSaving ? <Icon name="Loader2" className="animate-spin" size={16} /> : <Icon name="Save" size={16} />}{isSaving ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
                        </button>
                    </footer>
                </div>
            </div>

            {modal.type === 'addAssignment' && <AssignmentModal onClose={() => setModal({type: null})} onSave={handleAddOrEditAssignment} />}
            {modal.type === 'editAssignment' && <AssignmentModal onClose={() => setModal({type: null})} onSave={handleAddOrEditAssignment} initialData={modal.data} />}
            {modal.type === 'deleteConfirmation' && <ConfirmationModal onClose={() => setModal({type: null})} onConfirm={() => handleDeleteAssignment(modal.data.id)} item={modal.data} />}
        </>
    );
};

export default ClassDetailView;
