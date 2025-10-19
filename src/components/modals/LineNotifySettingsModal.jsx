// src/components/modals/LineNotifySettingsModal.jsx (Final Version for Messaging API)
import React from 'react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db, appId } from '../../firebase/firebase';
import { grades } from '../../constants/data';
import Icon from '../../icons/Icon';

const LineNotifySettingsModal = ({ onClose }) => {
    const [settings, setSettings] = React.useState({});
    const [isLoading, setIsLoading] = React.useState(true);
    const [isSaving, setIsSaving] = React.useState(false);

    React.useEffect(() => {
        const fetchSettings = async () => {
            setIsLoading(true);
            const fetchedSettings = {};
            for (const grade of grades) {
                const docRef = doc(db, `artifacts/${appId}/public/data/line_notify_tokens`, grade);
                const docSnap = await getDoc(docRef);
                fetchedSettings[grade] = docSnap.exists() ? docSnap.data() : { channelToken: '', groupId: '' };
            }
            setSettings(fetchedSettings);
            setIsLoading(false);
        };
        fetchSettings();
    }, []);

    const handleChange = (grade, field, value) => {
        setSettings(prev => ({
            ...prev,
            [grade]: { ...prev[grade], [field]: value }
        }));
    };

    const handleSave = async (grade) => {
        setIsSaving(grade);
        const gradeSetting = settings[grade];
        try {
            const docRef = doc(db, `artifacts/${appId}/public/data/line_notify_tokens`, grade);
            await setDoc(docRef, gradeSetting);
            alert(`บันทึกการตั้งค่าสำหรับ ป.${grade.replace('p','')} เรียบร้อยแล้ว`);
        } catch (error) {
            console.error("Error saving settings:", error);
            alert('เกิดข้อผิดพลาดในการบันทึก');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-gray-800/80 backdrop-blur-xl border border-white/20 rounded-2xl w-full max-w-2xl h-[90vh] flex flex-col shadow-2xl shadow-black/50" onClick={(e) => e.stopPropagation()}>
                <header className="flex items-center justify-between p-4 border-b border-white/10 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <Icon name="Bell" className="text-lime-300" />
                        <h2 className="text-2xl font-bold text-white">ตั้งค่าแจ้งเตือน LINE (Messaging API)</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><Icon name="X" size={28} /></button>
                </header>
                <div className="p-6 flex-grow overflow-auto space-y-4">
                     <div className="bg-lime-500/10 border border-lime-500/30 text-lime-200 p-4 rounded-lg mb-6">
                        <p className="font-bold">คำแนะนำ:</p>
                        <ul className="list-disc list-inside text-sm">
                            <li>นำ <span className="font-bold">Channel Access Token</span> ที่ได้จาก LINE Developers มาใส่ในช่องแรก</li>
                            <li>นำ <span className="font-bold">Group ID</span> (ที่ขึ้นต้นด้วย 'C...') มาใส่ในช่องที่สอง</li>
                        </ul>
                    </div>
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full"><Icon name="Loader2" className="animate-spin text-lime-400" size={40} /></div>
                    ) : (
                        grades.map((grade, index) => (
                            <div key={grade} className="bg-gray-900/50 p-4 rounded-lg">
                                <label className="block text-lg font-bold text-white mb-2">ชั้นประถมศึกษาปีที่ {index + 1}</label>
                                <div className="space-y-2">
                                    <input
                                        type="text"
                                        value={settings[grade]?.channelToken || ''}
                                        onChange={(e) => handleChange(grade, 'channelToken', e.target.value)}
                                        placeholder="วาง Channel Access Token ที่นี่..."
                                        className="w-full bg-gray-700/50 border border-gray-600 rounded-lg p-2 text-white"
                                    />
                                    <input
                                        type="text"
                                        value={settings[grade]?.groupId || ''}
                                        onChange={(e) => handleChange(grade, 'groupId', e.target.value)}
                                        placeholder="วาง Group ID ที่นี่..."
                                        className="w-full bg-gray-700/50 border border-gray-600 rounded-lg p-2 text-white"
                                    />
                                </div>
                                <button
                                    onClick={() => handleSave(grade)}
                                    disabled={isSaving === grade}
                                    className="mt-3 flex items-center justify-center w-full bg-lime-500 hover:bg-lime-600 text-black font-bold py-2 rounded-lg transition-colors disabled:bg-gray-500"
                                >
                                    {isSaving === grade ? <Icon name="Loader2" className="animate-spin" size={20}/> : `บันทึก ป.${index+1}`}
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default LineNotifySettingsModal;