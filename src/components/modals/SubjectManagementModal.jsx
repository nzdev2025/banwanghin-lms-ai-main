import React from 'react';
import { doc, setDoc, addDoc, serverTimestamp, deleteDoc, collection } from 'firebase/firestore';
import { db, logActivity, appId } from '../../firebase/firebase';
import Icon from '../../icons/Icon';
import SubjectEditForm from './SubjectEditForm';

const SubjectManagementModal = ({subjects, onClose}) => {
    const [editingSubject, setEditingSubject] = React.useState(null);

    const handleSave = async (subjectData) => {
        if (!db) return;
        const subjectsMetaPath = `artifacts/${appId}/public/data/subjects_meta`;
        try {
            if (subjectData.id) {
                const docRef = doc(db, subjectsMetaPath, subjectData.id);
                // eslint-disable-next-line no-unused-vars
                const { id, ...dataToUpdate } = subjectData;
                await setDoc(docRef, dataToUpdate, { merge: true });
                logActivity('SUBJECT_UPDATE', `แก้ไขข้อมูลวิชา: <strong>${dataToUpdate.name}</strong>`);
            } else {
                // eslint-disable-next-line no-unused-vars
                const { id, ...dataToAdd } = subjectData;
                await addDoc(collection(db, subjectsMetaPath), { ...dataToAdd, createdAt: serverTimestamp() });
                logActivity('SUBJECT_CREATE', `สร้างวิชาใหม่: <strong>${dataToAdd.name}</strong>`);
            }
            setEditingSubject(null);
        } catch (error) {
            console.error("Error saving subject:", error);
        }
    };

    const handleDelete = async (id) => {
        if (!db) return;
        const subjectToDelete = subjects.find(s => s.id === id);
        if (!subjectToDelete) return;
        try {
            const subjectsMetaPath = `artifacts/${appId}/public/data/subjects_meta`;
            await deleteDoc(doc(db, subjectsMetaPath, id));
            logActivity('SUBJECT_DELETE', `ลบวิชา <strong>${subjectToDelete.name}</strong>`);
        } catch (error) {
            console.error("Error deleting subject:", error);
        }
    }

    if (editingSubject) {
        return <SubjectEditForm subject={editingSubject} onSave={handleSave} onCancel={() => setEditingSubject(null)} />
    }

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-800/80 backdrop-blur-xl border border-white/20 rounded-2xl w-full max-w-2xl h-[80vh] flex flex-col shadow-2xl shadow-black/50">
                <header className="flex items-center justify-between p-4 border-b border-white/10">
                    <h2 className="text-2xl font-bold text-white">จัดการรายวิชา</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><Icon name="X" size={28} /></button>
                </header>
                <div className="p-6 flex-grow overflow-y-auto">
                    <ul className="space-y-3">
                        {subjects.map(sub => (
                            <li key={sub.id} className="flex items-center justify-between bg-white/5 p-3 rounded-lg">
                                <div>
                                    <p className="font-bold text-white">{sub.name}</p>
                                    <p className="text-sm text-gray-400">{sub.teacherName}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => setEditingSubject(sub)} className="p-2 text-sky-400 hover:bg-sky-500/20 rounded"><Icon name="Pencil" size={18}/></button>
                                    <button onClick={() => handleDelete(sub.id)} className="p-2 text-red-400 hover:bg-red-500/20 rounded"><Icon name="Trash2" size={18}/></button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
                <footer className="p-4 border-t border-white/10">
                    <button onClick={() => setEditingSubject({})} className="w-full flex items-center justify-center gap-2 bg-teal-500/80 hover:bg-teal-500 text-white font-bold py-3 px-4 rounded-lg transition-colors">
                        <Icon name="PlusCircle" size={20}/> เพิ่มวิชาใหม่
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default SubjectManagementModal;