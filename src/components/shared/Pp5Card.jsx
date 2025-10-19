// src/components/shared/Pp5Card.jsx
import React from 'react';
import Icon from '../../icons/Icon';

const Pp5Card = ({ onClick }) => {

    return (
        <div
            onClick={onClick}
            className="relative flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_25px_55px_-35px_rgba(59,130,246,0.55)] backdrop-blur-lg transition-all duration-300 hover:-translate-y-2 bg-blue-500/10 border-blue-500/30 shadow-glow-blue cursor-pointer"
        >
            <div className="absolute inset-0 flex items-center justify-center">
                <Icon name="FileSpreadsheet" className={`w-32 h-32 text-blue-300 opacity-10`} />
            </div>

            <div className="flex-grow z-10">
                <div className="flex justify-between items-start">
                    <div className="flex-grow">
                        <h3 className="text-xl font-bold text-white truncate">สร้างเอกสาร ปพ.5</h3>
                        <p className="text-sm text-gray-400 truncate">ส่งออกข้อมูลไปยัง Google Sheets</p>
                    </div>
                    <div className="p-3 rounded-lg bg-white/5">
                        <Icon name="FileSpreadsheet" className="text-blue-300" size={24} />
                    </div>
                </div>
            </div>

            <div className="mt-6 flex items-center justify-center text-sm text-blue-200 bg-blue-500/20 py-2 px-4 rounded-lg z-10">
                <Icon name="Download" size={16} className="mr-2"/>
                <span className="truncate">ส่งออกข้อมูล</span>
            </div>
        </div>
    );
};

export default Pp5Card;
