// src/components/shared/SavingsCard.jsx (Center Watermark Version)
import React from 'react';
import Icon from '../../icons/Icon';
import { colorThemes } from '../../constants/theme';

const SavingsCard = ({ onClick }) => {
    const theme = colorThemes.emerald;

    return (
        <div 
            onClick={onClick} 
            className={`relative flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_25px_55px_-35px_rgba(16,185,129,0.55)] backdrop-blur-lg transition-all duration-300 hover:-translate-y-2 ${theme.bg} ${theme.border} ${theme.glow} cursor-pointer`}
        >
            {/* Centered Background Icon */}
            <div className="absolute inset-0 flex items-center justify-center">
                <Icon name="PiggyBank" className={`w-32 h-32 ${theme.text} opacity-10`} />
            </div>
            
            <div className="flex-grow z-10">
                <div className="flex justify-between items-start">
                    <div className="flex-grow">
                        <h3 className="text-xl font-bold text-white truncate">ระบบออมทรัพย์</h3>
                        <p className="text-sm text-gray-400 truncate">บันทึกเงินออมนักเรียน</p>
                    </div>
                    <div className="p-3 rounded-lg bg-white/5">
                        <Icon name="PiggyBank" className={theme.text} size={24} />
                    </div>
                </div>
            </div>

            <div className="mt-6 flex items-center justify-center text-sm text-emerald-200 bg-emerald-500/20 py-2 px-4 rounded-lg z-10">
                <Icon name="Wallet" size={16} className="mr-2"/>
                <span className="truncate">จัดการการออม</span>
            </div>
        </div>
    );
};

export default SavingsCard;
