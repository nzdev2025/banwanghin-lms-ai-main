import React from 'react';
import { assignmentCategories } from '../../constants/data';
import Icon from '../../icons/Icon';
import AIAssignmentGeneratorModal from './AIAssignmentGeneratorModal';

const AssignmentModal = ({ onClose, onSave, initialData = null }) => {
    const [formData, setFormData] = React.useState({
        name: initialData?.name || '',
        maxScore: initialData?.maxScore || 10,
        category: initialData?.category || 'quiz',
    });
    const [isAiModalOpen, setIsAiModalOpen] = React.useState(false);

    const isEditMode = !!initialData;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'maxScore' ? parseInt(value, 10) : value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({ ...formData, id: initialData?.id });
    };

    const handleApplyFromAI = (aiData) => {
        setFormData(prev => ({
            ...prev,
            name: aiData.name,
            maxScore: aiData.maxScore,
        }));
        setIsAiModalOpen(false);
    };

    return (
        <>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[55] flex items-center justify-center p-4" onClick={onClose}>
                <div className="bg-gray-800 border border-white/20 rounded-2xl p-6 w-full max-w-lg shadow-2xl" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-between items-start">
                        <h3 className="text-xl font-bold mb-4">{isEditMode ? 'แก้ไขรายการเก็บคะแนน' : 'เพิ่มรายการเก็บคะแนน'}</h3>
                        <button 
                            type="button" 
                            onClick={() => setIsAiModalOpen(true)}
                            className="flex items-center gap-2 text-xs bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 font-bold py-1 px-3 rounded-full transition-all duration-300 border border-purple-500/40"
                        >
                            <Icon name="Sparkles" size={14}/>
                            <span>ผู้ช่วย AI</span>
                        </button>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">ชื่องาน/การสอบ</label>
                            <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} className="w-full bg-gray-900/50 border border-gray-600 rounded-lg p-2 text-white" required />
                        </div>
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div>
                                <label htmlFor="maxScore" className="block text-sm font-medium text-gray-300 mb-1">คะแนนเต็ม</label>
                                <input type="number" id="maxScore" name="maxScore" value={formData.maxScore} onChange={handleChange} className="w-full bg-gray-900/50 border border-gray-600 rounded-lg p-2 text-white" required min="1" />
                            </div>
                            <div>
                                <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-1">ประเภท</label>
                                <select id="category" name="category" value={formData.category} onChange={handleChange} className="w-full bg-gray-900/50 border border-gray-600 rounded-lg p-2 text-white">
                                    {Object.keys(assignmentCategories).map(key => (
                                        <option key={key} value={key}>{assignmentCategories[key].label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-end gap-4 mt-8">
                            <button type="button" onClick={onClose} className="py-2 px-4 text-gray-300 hover:text-white">ยกเลิก</button>
                            <button type="submit" className="py-2 px-4 bg-teal-500 hover:bg-teal-600 text-white font-bold rounded-lg transition-colors">{isEditMode ? 'บันทึกการแก้ไข' : 'เพิ่มรายการ'}</button>
                        </div>
                    </form>
                </div>
            </div>
            {isAiModalOpen && <AIAssignmentGeneratorModal onClose={() => setIsAiModalOpen(false)} onApply={handleApplyFromAI} />}
        </>
    );
};

export default AssignmentModal;