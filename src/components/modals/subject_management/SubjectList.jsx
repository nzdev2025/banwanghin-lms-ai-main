import React from 'react';
import PropTypes from 'prop-types';
import Icon from '../../../icons/Icon';
import { colorThemes } from '../../../constants/theme';

const SubjectList = ({ subjects, filteredSubjects, setEditingSubject, handleDelete }) => {
    if (filteredSubjects.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <Icon name="SearchX" size={48} className="mb-4 opacity-50" />
                <p>ไม่พบรายวิชาที่ค้นหา</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-3">
            {filteredSubjects.map(sub => {
                const theme = colorThemes[sub.colorTheme] || colorThemes.teal;
                return (
                    <div key={sub.id} className="group flex items-center justify-between bg-gray-900/40 p-3 rounded-xl border border-white/5 hover:border-white/20 transition-all hover:bg-gray-800">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${theme.bg} text-white shadow-lg`}>
                                <Icon name={sub.iconName || 'BookOpen'} size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-white text-lg">{sub.name}</h3>
                                <div className="flex items-center gap-3 text-sm text-gray-400">
                                    <span className="flex items-center gap-1"><Icon name="User" size={12} /> {sub.teacherName}</span>
                                    <span className="w-1 h-1 rounded-full bg-gray-600"></span>
                                    <span>{sub.midtermWeight || 70}:{sub.finalWeight || 30}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => setEditingSubject(sub)} className="p-2 text-sky-400 hover:bg-sky-500/20 rounded-lg transition-colors" title="แก้ไข">
                                <Icon name="Pencil" size={20} />
                            </button>
                            <button onClick={() => handleDelete(sub.id)} className="p-2 text-rose-400 hover:bg-rose-500/20 rounded-lg transition-colors" title="ลบ">
                                <Icon name="Trash2" size={20} />
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

SubjectList.propTypes = {
    subjects: PropTypes.array.isRequired,
    filteredSubjects: PropTypes.array.isRequired,
    setEditingSubject: PropTypes.func.isRequired,
    handleDelete: PropTypes.func.isRequired
};

export default SubjectList;
