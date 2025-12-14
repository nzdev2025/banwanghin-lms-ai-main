import React from 'react';
import PropTypes from 'prop-types';
import Icon from '../../../icons/Icon';

const StudentList = ({ students, isLoading, onEdit, onDelete }) => {
    if (isLoading) {
        return <div className="flex items-center justify-center h-full"><Icon name="Loader2" className="animate-spin text-sky-400" size={40} /></div>;
    }

    if (students.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <Icon name="UserX" size={48} className="mb-4 opacity-50" />
                <p>ไม่พบรายชื่อนักเรียน</p>
            </div>
        );
    }

    return (
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
                                <button onClick={() => onEdit(student)} className="p-1.5 text-sky-400 hover:bg-sky-500/20 rounded" title="แก้ไข"><Icon name="Pencil" size={16} /></button>
                                <button onClick={() => onDelete(student)} className="p-1.5 text-red-400 hover:bg-red-500/20 rounded" title="ลบ"><Icon name="Trash2" size={16} /></button>
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

StudentList.propTypes = {
    students: PropTypes.array.isRequired,
    isLoading: PropTypes.bool,
    onEdit: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired
};

export default StudentList;
