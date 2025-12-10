// src/components/modals/AttendanceModal.jsx
import React from 'react';
import Icon from '../../icons/Icon';
import AttendanceChecker from '../classroom_tools/AttendanceChecker';

const AttendanceModal = ({ onClose }) => {
    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-lime-500/50 rounded-3xl w-full max-w-6xl h-[90vh] flex flex-col shadow-[0_25px_80px_-25px_rgba(0,0,0,0.9)] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <header className="flex items-center justify-between p-4 border-b border-white/10 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <Icon name="CheckSquare" className="text-lime-300" />
                        <h2 className="text-2xl font-bold text-white">ระบบเช็คชื่อนักเรียน</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><Icon name="X" size={28} /></button>
                </header>
                <div className="flex-grow p-6 overflow-auto">
                    <AttendanceChecker />
                </div>
            </div>
        </div>
    );
};

export default AttendanceModal;
