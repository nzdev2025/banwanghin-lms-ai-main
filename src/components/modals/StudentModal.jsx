// src/components/modals/StudentModal.jsx

import React from 'react';

const StudentModal = ({ onClose, onSave, initialData = null }) => {
    // ... (ส่วน state เหมือนเดิม) ...
    const [studentNumber, setStudentNumber] = React.useState(initialData?.studentNumber || '');
    const [firstName, setFirstName] = React.useState(initialData?.firstName || '');
    const [lastName, setLastName] = React.useState(initialData?.lastName || '');
    const [birthDate, setBirthDate] = React.useState(initialData?.birthDate || '');
    const [gender, setGender] = React.useState(initialData?.gender || 'ชาย');

    const isEditMode = !!initialData;
    
    const handleSubmit = (e) => { 
        e.preventDefault(); 
        // --- ACE's MODIFICATION START ---
        // เปลี่ยนเงื่อนไข: ตรวจสอบแค่ชื่อจริงและนามสกุลเท่านั้น
        if (firstName.trim() && lastName.trim()) { 
            onSave({ 
                id: initialData?.id, 
                // ส่งค่า studentNumber เป็น null ถ้าไม่ได้กรอก เพื่อไม่ให้เกิด Error
                studentNumber: studentNumber ? parseInt(studentNumber, 10) : null, 
                firstName: firstName.trim(), 
                lastName: lastName.trim(),
                birthDate, // ส่งค่าว่างไปถ้าไม่ได้กรอก
                gender     
            }); 
        } else {
            // ปรับข้อความแจ้งเตือนให้ชัดเจนขึ้น
            alert("กรุณากรอก 'ชื่อจริง' และ 'นามสกุล' เป็นอย่างน้อยครับ");
        }
        // --- ACE's MODIFICATION END ---
    };

    return (
        // ... (ส่วน JSX ที่เหลือเหมือนเดิม) ...
        // **ข้อเสนอแนะ:** ลบ attribute `required` ออกจาก input ที่ไม่ต้องการบังคับ
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-gray-800 border border-white/20 rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-xl font-bold mb-4 text-white">{isEditMode ? 'แก้ไขข้อมูลนักเรียน' : 'เพิ่มนักเรียนใหม่'}</h3>
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="mb-4">
                            <label htmlFor="studentNumber" className="block text-sm font-medium text-gray-300 mb-1">เลขที่</label>
                            {/* ลบ required ออก */}
                            <input type="number" id="studentNumber" value={studentNumber} onChange={(e) => setStudentNumber(e.target.value)} className="w-full bg-gray-900/50 border border-gray-600 rounded-lg p-2 text-white focus:outline-none focus:ring-2 focus:ring-teal-500" min="1" />
                        </div>
                         <div className="mb-4">
                            <label htmlFor="birthDate" className="block text-sm font-medium text-gray-300 mb-1">วันเกิด</label>
                            {/* ลบ required ออก */}
                            <input type="date" id="birthDate" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className="w-full bg-gray-900/50 border border-gray-600 rounded-lg p-2 text-white focus:outline-none focus:ring-2 focus:ring-teal-500" />
                        </div>
                    </div>
                    {/* `firstName` และ `lastName` ยังคง `required` ไว้ */}
                    <div className="mb-4"><label htmlFor="firstName" className="block text-sm font-medium text-gray-300 mb-1">ชื่อจริง</label><input type="text" id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full bg-gray-900/50 border border-gray-600 rounded-lg p-2 text-white focus:outline-none focus:ring-2 focus:ring-teal-500" required /></div>
                    <div className="mb-4"><label htmlFor="lastName" className="block text-sm font-medium text-gray-300 mb-1">นามสกุล</label><input type="text" id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full bg-gray-900/50 border border-gray-600 rounded-lg p-2 text-white focus:outline-none focus:ring-2 focus:ring-teal-500" required /></div>
                    <div className="mb-6">
                        <label htmlFor="gender" className="block text-sm font-medium text-gray-300 mb-1">เพศ</label>
                        <select id="gender" value={gender} onChange={(e) => setGender(e.target.value)} className="w-full bg-gray-900/50 border border-gray-600 rounded-lg p-2 text-white focus:outline-none focus:ring-2 focus:ring-teal-500">
                            <option value="ชาย">ชาย</option>
                            <option value="หญิง">หญิง</option>
                        </select>
                    </div>
                    <div className="flex justify-end gap-4 mt-8">
                        <button type="button" onClick={onClose} className="py-2 px-4 text-gray-300 hover:text-white">ยกเลิก</button>
                        <button type="submit" className="py-2 px-4 bg-teal-500 hover:bg-teal-600 text-white font-bold rounded-lg transition-colors">{isEditMode ? 'บันทึกการแก้ไข' : 'เพิ่มนักเรียน'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default StudentModal;