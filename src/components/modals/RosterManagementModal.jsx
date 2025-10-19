import React from 'react';
import { collection, onSnapshot, query, orderBy, setDoc, addDoc, doc, writeBatch, getDocs } from 'firebase/firestore';
import { db, logActivity, appId } from '../../firebase/firebase';
import { grades } from '../../constants/data';
import Icon from '../../icons/Icon';
import StudentModal from './StudentModal';
import ConfirmationModal from './ConfirmationModal';
import ImportStudentsModal from './ImportStudentsModal';


const RosterManagementModal = ({ onClose }) => {
    const [selectedGrade, setSelectedGrade] = React.useState('p1');
    const [students, setStudents] = React.useState([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [modal, setModal] = React.useState({ type: null, data: null });
    const rosterBasePath = `artifacts/${appId}/public/data/rosters/${selectedGrade}`;

    React.useEffect(() => {
        if (!db || !selectedGrade) return;
        setIsLoading(true);
        const q = query(collection(db, `${rosterBasePath}/students`), orderBy("studentNumber"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setStudents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching students:", error);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, [selectedGrade, rosterBasePath]);

    const handleAddOrEditStudent = async (data) => {
        if (!db) return;
        try {
            const collectionRef = collection(db, `${rosterBasePath}/students`);
            if (data.id) {
                const docRef = doc(collectionRef, data.id);
                // eslint-disable-next-line no-unused-vars
                const { id, ...dataToUpdate } = data;
                await setDoc(docRef, dataToUpdate, { merge: true });
                logActivity('STUDENT_UPDATE', `แก้ไขข้อมูลนักเรียน <strong>${data.firstName}</strong> ในชั้น ป.${selectedGrade.replace('p','')}`);
            } else {
                // This is the fix for the final bug we found.
                // The 'id' field with 'undefined' value is removed before adding the document.
                // eslint-disable-next-line no-unused-vars
                const { id, ...dataToAdd } = data;
                await addDoc(collectionRef, dataToAdd);
                logActivity('STUDENT_ADD', `เพิ่มนักเรียนใหม่ <strong>${data.firstName}</strong> เข้าชั้น ป.${selectedGrade.replace('p','')}`);
            }
            setModal({ type: null, data: null });
        } catch (error) {
            console.error("Error saving student:", error);
            alert('เกิดข้อผิดพลาด: ' + error.message);
        }
    };

    const handleDeleteStudent = async (id) => {
        if (!id || !db) return;
        const studentToDelete = students.find(s => s.id === id);
        if(!studentToDelete) return;

        // --- START: โค้ดที่เพิ่มเข้ามาเพื่อลบข้อมูลที่เกี่ยวข้อง ---
        const savingsBasePath = `artifacts/${appId}/public/data/savings/${selectedGrade}`;
        const savingsDocRef = doc(db, `${savingsBasePath}/students`, id);
        const transactionsColRef = collection(db, `${savingsBasePath}/students/${id}/transactions`);

        try {
            const batch = writeBatch(db);

            // 1. ลบข้อมูลนักเรียนออกจากทะเบียน
            const studentDocRef = doc(db, `${rosterBasePath}/students`, id);
            batch.delete(studentDocRef);

            // 2. ลบประวัติการทำรายการออมทรัพย์ทั้งหมด (Subcollection)
            const transactionsSnap = await getDocs(transactionsColRef);
            transactionsSnap.forEach(doc => {
                batch.delete(doc.ref);
            });

            // 3. ลบเอกสารสรุปยอดออมทรัพย์
            batch.delete(savingsDocRef);

            // 4. ทำการลบทั้งหมดในครั้งเดียว
            await batch.commit();
            
            logActivity('STUDENT_DELETE', `ลบนักเรียน <strong>${studentToDelete.firstName}</strong> และข้อมูลการออมทรัพย์ทั้งหมด ออกจากชั้น ป.${selectedGrade.replace('p','')}`);
            setModal({ type: null, data: null });

        } catch (error) { 
            console.error("Error deleting student and related data:", error); 
            alert("เกิดข้อผิดพลาดในการลบข้อมูล: " + error.message);
        }
    };

    const handleImportStudents = async (newStudents) => {
        if (!db) return;
        const collectionRef = collection(db, `${rosterBasePath}/students`);
        try {
            const batch = writeBatch(db);
            newStudents.forEach(student => {
                const newDocRef = doc(collectionRef);
                batch.set(newDocRef, student);
            });
            await batch.commit();
            logActivity('STUDENT_ADD', `นำเข้ารายชื่อนักเรียน <strong>${newStudents.length}</strong> คน เข้าสู่ชั้น ป.${selectedGrade.replace('p','')}`);
            setModal({ type: null });
        } catch (error) {
            console.error("Error importing students:", error);
        }
    };

    return (
        <>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
                <div className="bg-gray-800/80 backdrop-blur-xl border border-white/20 rounded-2xl w-full max-w-4xl h-[90vh] flex flex-col shadow-2xl shadow-black/50" onClick={(e) => e.stopPropagation()}>
                    <header className="flex items-center justify-between p-4 border-b border-white/10 flex-shrink-0">
                        <h2 className="text-2xl font-bold text-white">ทะเบียนนักเรียน</h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-white"><Icon name="X" size={28} /></button>
                    </header>
                    <div className="p-6 flex-shrink-0 border-b border-white/10">
                        <div className="flex items-center gap-2 flex-wrap">
                            {grades.map((gradeId, index) => (
                                <button
                                    key={gradeId}
                                    onClick={() => setSelectedGrade(gradeId)}
                                    className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${selectedGrade === gradeId ? 'bg-sky-500 text-white' : 'bg-gray-700/50 hover:bg-gray-700 text-gray-300'}`}
                                >
                                    ป.{index + 1}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="p-6 flex-grow overflow-auto">
                        {isLoading ? (
                             <div className="flex items-center justify-center h-full"><Icon name="Loader2" className="animate-spin text-sky-400" size={40} /></div>
                        ) : (
                            <table className="w-full text-left">
                                <thead>
                                    <tr>
                                        <th className="p-3 text-sm font-semibold text-white">เลขที่</th>
                                        <th className="p-3 text-sm font-semibold text-white">ชื่อ</th>
                                        <th className="p-3 text-sm font-semibold text-white">นามสกุล</th>
                                        <th className="p-3 text-sm font-semibold text-white text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {students.map(student => (
                                        <tr key={student.id} className="border-b border-gray-700/50 hover:bg-white/5">
                                            <td className="p-3 text-gray-200">{student.studentNumber}</td>
                                            <td className="p-3 text-gray-200">{student.firstName}</td>
                                            <td className="p-3 text-gray-200">{student.lastName}</td>
                                            <td className="p-3 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => setModal({ type: 'editStudent', data: student })} className="p-1.5 text-sky-400 hover:bg-sky-500/20 rounded"><Icon name="Pencil" size={16}/></button>
                                                    <button onClick={() => setModal({ type: 'deleteConfirmation', data: { type: 'student', id: student.id, name: `${student.firstName} ${student.lastName}` }})} className="p-1.5 text-red-400 hover:bg-red-500/20 rounded"><Icon name="Trash2" size={16}/></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                    <footer className="flex items-center justify-end p-4 border-t border-white/10 flex-shrink-0 gap-4">
                        <button onClick={() => setModal({ type: 'addStudent' })} className="flex items-center gap-2 text-sm bg-transparent hover:bg-white/10 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 border border-gray-600"><Icon name="UserPlus" size={16} />เพิ่มนักเรียน</button>
                        <button onClick={() => setModal({ type: 'importStudents' })} className="flex items-center gap-2 text-sm bg-teal-500/80 hover:bg-teal-500 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300"><Icon name="Upload" size={16} />นำเข้ารายชื่อ</button>
                    </footer>
                </div>
            </div>
            {modal.type === 'addStudent' && <StudentModal onClose={() => setModal({type: null})} onSave={handleAddOrEditStudent} />}
            {modal.type === 'editStudent' && <StudentModal onClose={() => setModal({type: null})} onSave={handleAddOrEditStudent} initialData={modal.data} />}
            {modal.type === 'deleteConfirmation' && <ConfirmationModal onClose={() => setModal({type: null})} onConfirm={() => handleDeleteStudent(modal.data.id)} item={modal.data} />}
            {modal.type === 'importStudents' && <ImportStudentsModal onClose={() => setModal({type: null})} onImport={handleImportStudents} />}
        </>
    );
};

export default RosterManagementModal;
