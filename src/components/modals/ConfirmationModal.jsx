import React from 'react';
import Icon from '../../icons/Icon';

const ConfirmationModal = ({ onClose, onConfirm, item }) => {
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-gray-800 border border-red-500/50 rounded-2xl p-6 w-full max-w-md shadow-2xl text-center">
                <Icon name="AlertTriangle" className="text-red-400 mx-auto mb-4" size={48} />
                <h3 className="text-xl font-bold mb-2">ยืนยันการลบ</h3>
                <p className="text-gray-300 mb-6">คุณแน่ใจหรือไม่ว่าต้องการลบ "{item.name}"? <br/><span className="text-red-400 font-semibold">การกระทำนี้ไม่สามารถย้อนกลับได้</span></p>
                <div className="flex justify-center gap-4"><button onClick={onClose} className="py-2 px-6 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-lg transition-colors">ยกเลิก</button><button onClick={() => { onConfirm(); onClose(); }} className="py-2 px-6 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors">ยืนยันการลบ</button></div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
