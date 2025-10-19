// src/components/modals/SubjectSelectionView.jsx

import React from 'react';
import ClassCard from '../shared/ClassCard';

const SubjectSelectionView = ({ subjects, onSubjectClick }) => {
    return (
        <div className="p-4 sm:p-6 md:p-8">
            <header className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Subject Library</p>
                    <h1 className="text-3xl md:text-4xl font-semibold text-white">เลือกรายวิชา</h1>
                    <p className="mt-2 text-sm text-slate-400">สำรวจรายวิชาพร้อมข้อมูลครูผู้สอนและระดับชั้น</p>
                </div>
            </header>
            <div className="flex-grow overflow-y-auto">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                    {subjects.map((subject) => (
                        <ClassCard key={subject.id} subject={subject} onClick={() => onSubjectClick(subject)} />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SubjectSelectionView;
