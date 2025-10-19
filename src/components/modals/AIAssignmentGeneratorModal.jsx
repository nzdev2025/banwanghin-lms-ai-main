import React from 'react';
import { callGeminiAPI } from '../../api/gemini';
import Icon from '../../icons/Icon';

const AIAssignmentGeneratorModal = ({ onClose, onApply }) => {
    const [topic, setTopic] = React.useState('');
    const [type, setType] = React.useState('multiple_choice');
    const [count, setCount] = React.useState(5);
    const [result, setResult] = React.useState('');
    const [isGenerating, setIsGenerating] = React.useState(false);

    const handleGenerate = async () => {
        if (!topic) return;
        setIsGenerating(true);
        setResult('');

        const prompt = `
            ในฐานะผู้ช่วยสร้างแบบทดสอบสำหรับครูประถม จงสร้างแบบทดสอบจากหัวข้อต่อไปนี้:
            - หัวข้อ: "${topic}"
            - ประเภท: ${type === 'multiple_choice' ? 'ปรนัย 3 ตัวเลือก' : 'ถูก-ผิด'}
            - จำนวน: ${count} ข้อ

            จงสร้างชุดคำถามพร้อมตัวเลือกและเฉลยที่ชัดเจน (เช่น *ก. คำตอบ) สำหรับนักเรียนชั้นประถม
            ผลลัพธ์ให้ตอบเป็นข้อความธรรมดาเท่านั้น
        `;

        try {
            const generatedText = await callGeminiAPI(prompt);
            setResult(generatedText);
        } catch (error) {
            console.error("Error calling Gemini API for assignment generation:", error);
            setResult("เกิดข้อผิดพลาดในการสร้างแบบทดสอบ โปรดลองอีกครั้ง");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleApply = () => {
        onApply({ name: topic, maxScore: count });
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-gray-800 border border-purple-500/50 rounded-2xl w-full max-w-xl flex flex-col shadow-2xl shadow-black/50" onClick={(e) => e.stopPropagation()}>
                <header className="flex items-center justify-between p-4 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <Icon name="Lightbulb" className="text-purple-300" />
                        <h3 className="text-xl font-bold text-white">ผู้ช่วยสร้างแบบทดสอบ</h3>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><Icon name="X" size={24} /></button>
                </header>
                <div className="p-6 space-y-4 overflow-y-auto">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">1. บอกหัวข้อที่ต้องการ</label>
                        <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="เช่น ส่วนประกอบของพืช, การบวกลบเลข..." className="w-full bg-gray-900/50 border border-gray-600 rounded-lg p-2 text-white" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">2. เลือกประเภท</label>
                            <select value={type} onChange={(e) => setType(e.target.value)} className="w-full bg-gray-900/50 border border-gray-600 rounded-lg p-2 text-white">
                                <option value="multiple_choice">ปรนัย (ก, ข, ค)</option>
                                <option value="true_false">ถูก-ผิด</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">3. จำนวนข้อ</label>
                            <input type="number" value={count} onChange={(e) => setCount(parseInt(e.target.value, 10))} min="1" max="20" className="w-full bg-gray-900/50 border border-gray-600 rounded-lg p-2 text-white" />
                        </div>
                    </div>
                     <button onClick={handleGenerate} disabled={isGenerating || !topic} className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-indigo-500 hover:opacity-90 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-wait">
                        {isGenerating ? <Icon name="Loader2" className="animate-spin" size={20}/> : <Icon name="Sparkles" size={20}/>}
                        {isGenerating ? 'กำลังสร้าง...' : 'สร้างแบบทดสอบ'}
                    </button>
                    {result && (
                        <div className="p-4 bg-gray-900/50 border border-gray-700 rounded-lg max-h-60 overflow-y-auto">
                            <p className="text-white whitespace-pre-wrap">{result}</p>
                        </div>
                    )}
                </div>
                <footer className="p-4 border-t border-white/10 flex justify-end">
                     <button onClick={handleApply} disabled={!result || isGenerating} className="py-2 px-6 bg-teal-500 hover:bg-teal-600 text-white font-bold rounded-lg transition-colors disabled:bg-gray-600">
                        นำไปใช้
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default AIAssignmentGeneratorModal;
