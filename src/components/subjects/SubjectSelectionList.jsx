import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import ClassCard from '../shared/ClassCard';
import Icon from '../../icons/Icon';

const SubjectSelectionList = ({ subjects, onSubjectClick }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredSubjects = useMemo(() => {
        if (!searchTerm) return subjects;
        const lowerTerm = searchTerm.toLowerCase();
        return subjects.filter(subject =>
            subject.name.toLowerCase().includes(lowerTerm) ||
            subject.teacherName?.toLowerCase().includes(lowerTerm)
        );
    }, [subjects, searchTerm]);

    return (
        <div className="p-4 sm:p-6 md:p-8 flex flex-col h-full">
            <header className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Subject Library</p>
                    <h1 className="text-3xl md:text-4xl font-semibold text-white">เลือกรายวิชา</h1>
                    <p className="mt-2 text-sm text-slate-400">สำรวจรายวิชาพร้อมข้อมูลครูผู้สอนและระดับชั้น</p>
                </div>

                {/* Search Bar */}
                <div className="w-full sm:w-72 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Icon name="Search" className="text-slate-500" size={18} />
                    </div>
                    <input
                        type="text"
                        placeholder="ค้นหาวิชา หรือ ชื่อครู..."
                        className="w-full bg-white/5 border border-white/10 text-slate-200 text-sm rounded-xl py-2.5 pl-10 pr-4 focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 outline-none transition-all placeholder:text-slate-600"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm('')}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300"
                        >
                            <Icon name="X" size={14} />
                        </button>
                    )}
                </div>
            </header>

            <div className="flex-grow overflow-y-auto min-h-0 pr-2 custom-scrollbar">
                {filteredSubjects.length > 0 ? (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 pb-10">
                        {filteredSubjects.map((subject) => (
                            <ClassCard key={subject.id} subject={subject} onClick={() => onSubjectClick(subject)} />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                        <Icon name="SearchX" size={48} className="mb-4 opacity-50" />
                        <p>ไม่พบรายวิชาที่ค้นหา</p>
                    </div>
                )}
            </div>
        </div>
    );
};

SubjectSelectionList.propTypes = {
    subjects: PropTypes.array.isRequired,
    onSubjectClick: PropTypes.func.isRequired
};

export default SubjectSelectionList;
