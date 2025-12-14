import React, { useState, useMemo } from 'react';
import { doc, setDoc, addDoc, serverTimestamp, deleteDoc, collection } from 'firebase/firestore';
import { db, logActivity, appId } from '../../firebase/firebase';
import Icon from '../../icons/Icon';
import SubjectEditForm from './SubjectEditForm'; // Keep using the existing form for now, or move it later
import SubjectList from './subject_management/SubjectList';

const SubjectManagementModal = ({ subjects, onClose }) => {
    const [editingSubject, setEditingSubject] = React.useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredSubjects = useMemo(() => {
        if (!searchTerm) return subjects;
        const lowerTerm = searchTerm.toLowerCase();
        return subjects.filter(sub =>
            sub.name.toLowerCase().includes(lowerTerm) ||
            sub.teacherName?.toLowerCase().includes(lowerTerm)
        );
    }, [subjects, searchTerm]);

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
        if (!confirm('คุณต้องการลบวิชานี้ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้')) return;
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
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <div className="bg-gray-800/90 backdrop-blur-xl border border-white/20 rounded-2xl w-full max-w-3xl h-[85vh] flex flex-col shadow-2xl shadow-black/50 overflow-hidden">
                <header className="flex flex-col gap-4 p-6 border-b border-white/10 bg-gray-900/50">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                <Icon name="Settings" className="text-teal-400" />
                                จัดการรายวิชา
                            </h2>
                            <p className="text-sm text-gray-400 mt-1">เพิ่ม ลบ หรือแก้ไขข้อมูลรายวิชาในระบบ</p>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-white transition-transform hover:rotate-90"><Icon name="X" size={28} /></button>
                    </div>

                    {/* Search Bar */}
                    <div className="relative">
                        <Icon name="Search" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                        <input
                            type="text"
                            placeholder="ค้นหาวิชา..."
                            className="w-full bg-gray-900 border border-gray-700 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:ring-2 focus:ring-teal-500/50 outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </header>

                <div className="p-6 flex-grow overflow-y-auto custom-scrollbar">
                    <SubjectList
                        subjects={subjects}
                        filteredSubjects={filteredSubjects}
                        setEditingSubject={setEditingSubject}
                        handleDelete={handleDelete}
                    />
                </div>

                <footer className="p-5 border-t border-white/10 bg-gray-900/50">
                    <button onClick={() => setEditingSubject({})} className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-teal-500/20 transition-all transform hover:-translate-y-0.5">
                        <Icon name="PlusCircle" size={20} /> เพิ่มวิชาใหม่
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default SubjectManagementModal;