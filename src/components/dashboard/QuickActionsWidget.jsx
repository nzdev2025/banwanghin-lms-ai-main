import React from 'react';
import { useApp } from '../../context/AppContext';
import Icon from '../../icons/Icon';

const QuickActionsWidget = () => {
    const { openModal } = useApp();

    const actions = [
        {
            id: 'attendance',
            label: 'เช็คชื่อ',
            icon: 'CheckSquare',
            modalType: 'manageAttendance',
            color: 'bg-teal-500/10 text-teal-300 hover:bg-teal-500/20 border-teal-500/30'
        },
        {
            id: 'toolkit',
            label: 'เครื่องมือคุมชั้นเรียน',
            icon: 'BrainCircuit',
            modalType: 'classroomToolkit',
            color: 'bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border-amber-500/30'
        },
        {
            id: 'savings',
            label: 'ออมทรัพย์',
            icon: 'PiggyBank',
            modalType: 'manageSavings',
            color: 'bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 border-emerald-500/30'
        },
        {
            id: 'worksheet',
            label: 'สร้างใบงาน AI',
            icon: 'Sparkles',
            modalType: 'aiWorksheet',
            color: 'bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 border-purple-500/30'
        }
    ];

    return (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-lg shadow-lg">
            <div className="grid grid-cols-4 gap-2">
                {actions.map((action) => (
                    <button
                        key={action.id}
                        onClick={() => openModal(action.modalType)}
                        className={`flex items-center justify-center gap-2 rounded-xl border py-2 px-3 transition-all hover:scale-105 active:scale-95 ${action.color}`}
                    >
                        <Icon name={action.icon} size={16} />
                        <span className="text-xs font-bold truncate">{action.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default QuickActionsWidget;
