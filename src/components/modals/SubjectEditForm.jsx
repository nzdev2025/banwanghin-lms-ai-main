// src/components/modals/SubjectEditForm.jsx (Upgraded for Icon Picker & Live Preview)
import React from 'react';
import { colorThemes } from '../../constants/theme';
import Icon from '../../icons/Icon';
import ClassCard from '../shared/ClassCard';
import { useToast } from '../../context/ToastContext';

// Available icons for selection
// Available icons for selection
const AVAILABLE_ICONS = [
    // General / Base
    'BookOpen', 'Book', 'BookA', 'Bookmark', 'GraduationCap', 'School',
    // Math & Science
    'Calculator', 'Divide', 'Pi', 'Sigma', 'FunctionSquare',
    'FlaskConical', 'Microscope', 'Atom', 'Dna', 'TestTube', 'Zap',
    // Arts & Music
    'Palette', 'Music', 'Drama', 'Headphones', 'Mic', 'Image', 'Camera',
    // Technology
    'Computer', 'Laptop', 'Cpu', 'Code', 'Database', 'Keyboard', 'Wifi',
    // Sports & Health
    'Dumbbell', 'Trophy', 'Medal', 'Activity', 'Heart', 'HeartPulse',
    // Social / People
    'User', 'Users', 'MessagesSquare', 'Globe', 'Languages', 'Flag',
    // Tools & Objects
    'PenTool', 'Pencil', 'Briefcase', 'Folder', 'FileText', 'ClipboardList',
    'Map', 'Compass', 'Clock', 'Calendar', 'Sun', 'Moon', 'Cloud', 'Star'
];

const SubjectEditForm = ({ subject, onSave, onCancel }) => {
    const toast = useToast();
    const [formData, setFormData] = React.useState({
        name: subject.name || '',
        teacherName: subject.teacherName || '',
        gradeRange: subject.gradeRange || 'ป.1-ป.6',
        iconName: subject.iconName || 'BookOpen',
        colorTheme: subject.colorTheme || 'teal',
        midtermWeight: subject.midtermWeight || 70,
        finalWeight: subject.finalWeight || 30,
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        const numericValue = (name === 'midtermWeight' || name === 'finalWeight') ? parseInt(value, 10) || 0 : value;
        setFormData(prev => ({ ...prev, [name]: numericValue }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (formData.midtermWeight + formData.finalWeight !== 100) {
            toast.warning('สัดส่วนคะแนนระหว่างภาคและปลายภาคต้องรวมกันได้ 100 คะแนนพอดีครับ');
            return;
        }
        onSave({ ...formData, id: subject.id });
    };

    const totalWeight = formData.midtermWeight + formData.finalWeight;

    // Create a mock subject object for the live preview
    const previewSubject = {
        id: 'preview',
        ...formData,
        studentCount: 0 // Mock data for preview
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[55] flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-gray-900 border border-white/10 rounded-3xl w-full max-w-4xl shadow-2xl flex flex-col md:flex-row overflow-hidden max-h-[90vh]">

                {/* LEFT: Form Inputs */}
                <div className="flex-1 p-6 md:p-8 overflow-y-auto custom-scrollbar">
                    <h3 className="text-2xl font-bold mb-6 text-white flex items-center gap-3">
                        <span className={`p-2 rounded-xl bg-${formData.colorTheme}-500/20 text-${formData.colorTheme}-400`}>
                            <Icon name={subject.id ? 'Pencil' : 'PlusCircle'} size={24} />
                        </span>
                        {subject.id ? 'แก้ไขรายวิชา' : 'สร้างวิชาใหม่'}
                    </h3>

                    <form id="subject-form" onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1.5">ชื่อวิชา</label>
                                <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full bg-gray-800/50 border border-gray-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-teal-500/50 outline-none transition" placeholder="เช่น คณิตศาสตร์" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1.5">ชื่อครูผู้สอน</label>
                                <input type="text" name="teacherName" value={formData.teacherName} onChange={handleChange} className="w-full bg-gray-800/50 border border-gray-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-teal-500/50 outline-none transition" placeholder="เช่น ครูใจดี" required />
                            </div>
                        </div>

                        {/* Icon Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">สัญลักษณ์ประจำวิชา</label>
                            <div className="grid grid-cols-5 sm:grid-cols-8 gap-2 bg-gray-800/30 p-3 rounded-xl border border-gray-700/50">
                                {AVAILABLE_ICONS.map(icon => (
                                    <button
                                        key={icon}
                                        type="button"
                                        onClick={() => setFormData(d => ({ ...d, iconName: icon }))}
                                        className={`aspect-square flex items-center justify-center rounded-lg transition-all ${formData.iconName === icon
                                            ? `bg-${formData.colorTheme}-500 text-white shadow-lg shadow-${formData.colorTheme}-500/30 scale-110`
                                            : 'text-gray-500 hover:bg-white/5 hover:text-gray-300'
                                            }`}
                                    >
                                        <Icon name={icon} size={20} />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Color Theme */}
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">ธีมสี (Color Theme)</label>
                            <div className="flex flex-wrap gap-3">
                                {Object.keys(colorThemes).map(themeKey => (
                                    <button
                                        type="button"
                                        key={themeKey}
                                        onClick={() => setFormData(p => ({ ...p, colorTheme: themeKey }))}
                                        className={`w-10 h-10 rounded-full transition-transform ${colorThemes[themeKey].bg} flex items-center justify-center ${formData.colorTheme === themeKey
                                            ? `ring-2 ring-offset-2 ring-offset-gray-900 ring-white scale-110`
                                            : 'hover:scale-105 opacity-70 hover:opacity-100'
                                            }`}
                                    >
                                        {formData.colorTheme === themeKey && <Icon name="Check" size={16} className="text-white drop-shadow-md" />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Score Weights */}
                        <div className="pt-4 border-t border-white/10">
                            <label className="block text-sm font-medium text-gray-300 mb-3">โครงสร้างคะแนน (ปพ.5)</label>
                            <div className="flex items-center gap-3 bg-gray-800/50 p-4 rounded-xl border border-gray-700/50">
                                <div className="flex-1 text-center">
                                    <label className="block text-xs text-gray-400 mb-1">ระหว่างภาค</label>
                                    <div className="relative">
                                        <input type="number" name="midtermWeight" value={formData.midtermWeight} onChange={handleChange} className="w-full bg-gray-700 border-transparent rounded-lg p-2 text-white text-center font-mono font-bold focus:bg-gray-600 focus:ring-2 focus:ring-teal-500/50 outline-none" min="0" max="100" />
                                        <span className="absolute right-2 top-2 text-xs text-gray-500">%</span>
                                    </div>
                                </div>
                                <div className="text-gray-500 font-bold text-xl mt-4">+</div>
                                <div className="flex-1 text-center">
                                    <label className="block text-xs text-gray-400 mb-1">ปลายภาค</label>
                                    <div className="relative">
                                        <input type="number" name="finalWeight" value={formData.finalWeight} onChange={handleChange} className="w-full bg-gray-700 border-transparent rounded-lg p-2 text-white text-center font-mono font-bold focus:bg-gray-600 focus:ring-2 focus:ring-teal-500/50 outline-none" min="0" max="100" />
                                        <span className="absolute right-2 top-2 text-xs text-gray-500">%</span>
                                    </div>
                                </div>
                                <div className="text-gray-500 font-bold text-xl mt-4">=</div>
                                <div className="flex-1 text-center">
                                    <label className="block text-xs text-gray-400 mb-1">รวม</label>
                                    <div className={`w-full p-2 rounded-lg text-center font-mono font-bold border ${totalWeight === 100
                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                        : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                                        }`}>
                                        {totalWeight}%
                                    </div>
                                </div>
                            </div>
                            {totalWeight !== 100 && (
                                <p className="text-xs text-rose-400 mt-2 flex items-center gap-1.5 animate-pulse">
                                    <Icon name="AlertTriangle" size={14} />
                                    ผลรวมคะแนนต้องเท่ากับ 100%
                                </p>
                            )}
                        </div>
                    </form>
                </div>

                {/* RIGHT: Live Preview */}
                <div className="w-full md:w-[320px] bg-black/20 p-6 md:p-8 flex flex-col items-center justify-center border-t md:border-t-0 md:border-l border-white/10 relative">
                    <div className="absolute top-6 left-6 text-xs font-bold uppercase tracking-widest text-slate-500">Live Preview</div>
                    <div className="w-full pointer-events-none transform scale-100 hover:scale-105 transition-transform duration-500">
                        <ClassCard subject={previewSubject} />
                    </div>
                    <p className="mt-8 text-center text-xs text-slate-500 px-4">
                        นี่คือตัวอย่างการแสดงผลของการ์ดรายวิชา<br />เมื่อนำไปแสดงบนหน้า Dashboard
                    </p>

                    <div className="mt-auto w-full flex flex-col gap-3 pt-8">
                        <button type="submit" form="subject-form" className="w-full py-3 px-4 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white font-bold rounded-xl shadow-lg shadow-teal-500/20 transition-all transform hover:-translate-y-0.5">
                            บันทึกข้อมูล
                        </button>
                        <button type="button" onClick={onCancel} className="w-full py-3 px-4 bg-white/5 hover:bg-white/10 text-slate-300 font-medium rounded-xl transition-colors">
                            ยกเลิก
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SubjectEditForm;