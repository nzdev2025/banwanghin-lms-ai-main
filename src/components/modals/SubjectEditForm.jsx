// src/components/modals/SubjectEditForm.jsx (Upgraded for Pp.5 Score Weighting)
import React from 'react';
import { colorThemes } from '../../constants/theme';
import Icon from '../../icons/Icon'; // Import Icon

const SubjectEditForm = ({ subject, onSave, onCancel }) => {
    const [formData, setFormData] = React.useState({
        name: subject.name || '',
        teacherName: subject.teacherName || '',
        gradeRange: subject.gradeRange || 'ป.1-ป.6',
        iconName: subject.iconName || 'BookOpen',
        colorTheme: subject.colorTheme || 'teal',
        // --- NEW: เพิ่ม state สำหรับสัดส่วนคะแนน ---
        midtermWeight: subject.midtermWeight || 70,
        finalWeight: subject.finalWeight || 30,
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        // แปลงค่าเป็นตัวเลขสำหรับช่องคะแนน
        const numericValue = (name === 'midtermWeight' || name === 'finalWeight') ? parseInt(value, 10) || 0 : value;
        setFormData(prev => ({ ...prev, [name]: numericValue }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // --- VALIDATION: ตรวจสอบว่าคะแนนรวมเป็น 100 หรือไม่ ---
        if (formData.midtermWeight + formData.finalWeight !== 100) {
            alert('สัดส่วนคะแนนระหว่างภาคและปลายภาคต้องรวมกันได้ 100 คะแนนพอดีครับ');
            return;
        }
        onSave({ ...formData, id: subject.id });
    };

    const totalWeight = formData.midtermWeight + formData.finalWeight;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[55] flex items-center justify-center p-4">
            <form onSubmit={handleSubmit} className="bg-gray-800 border border-white/20 rounded-2xl w-full max-w-lg shadow-2xl p-6">
                 <h3 className="text-xl font-bold mb-6 text-white">{subject.id ? 'แก้ไขวิชา' : 'สร้างวิชาใหม่'}</h3>
                <div className="space-y-4">
                    {/* --- ชื่อวิชา และ ชื่อครูผู้สอน (เหมือนเดิม) --- */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">ชื่อวิชา</label>
                            <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full bg-gray-900/50 border border-gray-600 rounded-lg p-2 text-white" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">ชื่อครูผู้สอน</label>
                            <input type="text" name="teacherName" value={formData.teacherName} onChange={handleChange} className="w-full bg-gray-900/50 border border-gray-600 rounded-lg p-2 text-white" required />
                        </div>
                    </div>
                    
                    {/* --- NEW: ส่วนกำหนดสัดส่วนคะแนน --- */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">ตั้งค่าการวัดผล (สำหรับ ปพ.5)</label>
                        <div className="flex items-center gap-4 bg-gray-900/50 p-3 rounded-lg">
                            <div className="flex-1">
                                <label className="text-xs text-gray-400">คะแนนระหว่างภาค (%)</label>
                                <input type="number" name="midtermWeight" value={formData.midtermWeight} onChange={handleChange} className="w-full bg-gray-700/50 border border-gray-600 rounded p-2 text-white text-center" min="0" max="100"/>
                            </div>
                            <div className="pt-5 text-xl font-bold text-gray-400">+</div>
                            <div className="flex-1">
                                <label className="text-xs text-gray-400">คะแนนปลายภาค (%)</label>
                                <input type="number" name="finalWeight" value={formData.finalWeight} onChange={handleChange} className="w-full bg-gray-700/50 border border-gray-600 rounded p-2 text-white text-center" min="0" max="100"/>
                            </div>
                             <div className="pt-5 text-xl font-bold text-gray-400">=</div>
                             <div className="flex-1">
                                 <label className="text-xs text-gray-400">รวม</label>
                                 <div className={`w-full p-2 rounded text-center text-lg font-bold ${totalWeight === 100 ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                                    {totalWeight}
                                 </div>
                             </div>
                        </div>
                         {totalWeight !== 100 && (
                            <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                                <Icon name="AlertTriangle" size={14} />
                                ผลรวมต้องเป็น 100
                            </p>
                        )}
                    </div>

                     <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">ชุดสี (Theme)</label>
                        <div className="grid grid-cols-7 gap-2">
                            {Object.keys(colorThemes).map(themeKey => (
                                <button type="button" key={themeKey} onClick={() => setFormData(p => ({...p, colorTheme: themeKey}))} className={`h-10 rounded-lg ${colorThemes[themeKey].bg} ${formData.colorTheme === themeKey ? `ring-2 ring-offset-2 ring-offset-gray-800 ring-white` : ''}`}></button>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="flex justify-end gap-4 mt-8">
                    <button type="button" onClick={onCancel} className="py-2 px-4 text-gray-300 hover:text-white">ยกเลิก</button>
                    <button type="submit" className="py-2 px-4 bg-teal-500 hover:bg-teal-600 text-white font-bold rounded-lg transition-colors">บันทึก</button>
                </div>
            </form>
        </div>
    );
};

export default SubjectEditForm;