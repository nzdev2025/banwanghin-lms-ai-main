// src/components/modals/StudentProfileModal.jsx (REVISED VERSION)
import React from 'react';
import { getDocs, collection, doc, onSnapshot, query, orderBy, deleteDoc } from 'firebase/firestore';
import { db, appId } from '../../firebase/firebase';
import { callGeminiAPI } from '../../api/gemini';
import Icon from '../../icons/Icon';
import BehaviorLoggerModal from './BehaviorLoggerModal';
import ConfirmationModal from './ConfirmationModal'; // ++ IMPORT: Modal ยืนยัน ++

const StudentProfileModal = ({ student, grade, subjects, onClose }) => {
    const [studentScores, setStudentScores] = React.useState(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const [aiSummary, setAiSummary] = React.useState('');
    const [isGenerating, setIsGenerating] = React.useState(false);
    const [parentComment, setParentComment] = React.useState('');
    const [isGeneratingParentComment, setIsGeneratingParentComment] = React.useState(false);
    const [isCopied, setIsCopied] = React.useState(false);
    const [isLoggerOpen, setIsLoggerOpen] = React.useState(false);
    const [behaviorLogs, setBehaviorLogs] = React.useState([]);
    // ++ NEW STATE: สำหรับจัดการ Modal ยืนยันการลบ ++
    const [confirmModal, setConfirmModal] = React.useState({ isOpen: false, data: null });

    React.useEffect(() => {
        const fetchStudentData = async () => {
            if (!db) return;
            setIsLoading(true);
            const scoresData = {};

            for (const subject of subjects) {
                const scoresPath = `artifacts/${appId}/public/data/subjects/${subject.id}/grades/${grade}/scores`;
                const assignmentsPath = `artifacts/${appId}/public/data/subjects/${subject.id}/grades/${grade}/assignments`;

                const [scoresSnap, assignmentsSnap] = await Promise.all([
                    getDocs(collection(db, scoresPath)),
                    getDocs(collection(db, assignmentsPath))
                ]);

                const studentScoresDoc = scoresSnap.docs.find(d => d.id === student.id);

                if (studentScoresDoc) {
                    const scores = studentScoresDoc.data();
                    const assignments = assignmentsSnap.docs.map(d => ({id: d.id, ...d.data()}));

                    scoresData[subject.name] = assignments.map(assign => ({
                        name: assign.name,
                        score: scores[assign.id] ?? 'N/A',
                        maxScore: assign.maxScore
                    }));
                }
            }
            setStudentScores(scoresData);
            setIsLoading(false);
        };
        
        const logPath = `artifacts/${appId}/public/data/rosters/${grade}/students/${student.id}/behavior_logs`;
        const q = query(collection(db, logPath), orderBy("timestamp", "desc"));
        const unsubscribeLogs = onSnapshot(q, (snapshot) => {
            setBehaviorLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        fetchStudentData();

        return () => {
            unsubscribeLogs(); 
        };
    }, [student, grade, subjects]);

    // ++ NEW FUNCTION: จัดการการลบบันทึกพฤติกรรม ++
    const handleDeleteBehaviorLog = async (logId) => {
        if (!logId) return;
        const logPath = `artifacts/${appId}/public/data/rosters/${grade}/students/${student.id}/behavior_logs`;
        try {
            await deleteDoc(doc(db, logPath, logId));
            // ไม่ต้อง log activity การลบเพื่อความเรียบง่าย
        } catch (error) {
            console.error("Error deleting behavior log:", error);
            alert("เกิดข้อผิดพลาดในการลบ");
        }
    };


    const handleGenerateSummary = async () => {
        if (!studentScores) return;
        setIsGenerating(true);
        setAiSummary('');
        setParentComment('');
        
        let behaviorDetails = "ไม่มีบันทึกพฤติกรรม";
        if (behaviorLogs.length > 0) {
            behaviorDetails = behaviorLogs.map(log => `- ${log.tag} (${log.type === 'positive' ? 'เชิงบวก' : 'ควรส่งเสริม'})`).join('\n');
        }

        let scoreDetails = "";
        for (const subjectName in studentScores) {
            const scoresText = studentScores[subjectName]
                .map(s => `${s.name}: ${s.score}/${s.maxScore}`)
                .join(', ');
            scoreDetails += `- วิชา${subjectName}: ${scoresText}\n`;
        }

        const prompt = `
            ในฐานะผู้ช่วยครูมืออาชีพ จงวิเคราะห์ข้อมูลของนักเรียนชื่อ '${student.firstName} ${student.lastName}' ชั้น ป.${grade.replace('p', '')}'
            
            ข้อมูลคะแนน:
            ${scoreDetails}

            ข้อมูลพฤติกรรมล่าสุด:
            ${behaviorDetails}

            จงสรุปภาพรวมการเรียนโดยเชื่อมโยงกับพฤติกรรม, ระบุจุดแข็ง, และแนะนำจุดที่ควรพัฒนา 1-2 ข้อ
            เขียนสรุปเป็นภาษาไทยที่กระชับ, เข้าใจง่าย, และให้กำลังใจสำหรับคุณครูเพื่อนำไปใช้พัฒนาการสอน
        `;

        try {
            const summaryText = await callGeminiAPI(prompt);
            setAiSummary(summaryText);
        } catch (error) {
            console.error("Error calling Gemini API for summary:", error);
            setAiSummary("เกิดข้อผิดพลาดในการเรียก AI เพื่อสรุปผล โปรดลองอีกครั้ง");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleGenerateParentComment = async () => {
        if (!aiSummary) return;
        setIsGeneratingParentComment(true);
        setParentComment('');

        const prompt = `
            ในฐานะครูที่ปรึกษาที่เชี่ยวชาญด้านการสื่อสารเชิงบวก จงนำบทวิเคราะห์ผลการเรียนต่อไปนี้:
            "${aiSummary}"

            แล้วเรียบเรียงใหม่เป็น "ข้อความคอมเมนต์สำหรับผู้ปกครอง" โดยใช้หลักการต่อไปนี้:
            1. ใช้ภาษาที่เป็นทางการ สุภาพ และเข้าใจง่ายสำหรับผู้ปกครอง
            2. ขึ้นต้นด้วยจุดแข็งหรือด้านที่น่าชื่นชมของนักเรียนเสมอ (เช่น ด้านการเรียน, น้ำใจ, ความคิดสร้างสรรค์)
            3. กล่าวถึงจุดที่ควรพัฒนาในเชิง "ข้อเสนอแนะเพื่อส่งเสริม" ไม่ใช่ "ข้อตำหนิ"
            4. จบด้วยประโยคที่แสดงถึงความร่วมมือระหว่างโรงเรียนและผู้ปกครอง
            5. มีความยาวไม่เกิน 3-4 ประโยค
        `;

        try {
            const commentText = await callGeminiAPI(prompt);
            setParentComment(commentText);
        } catch (error) {
            console.error("Error calling Gemini API for parent comment:", error);
            setParentComment("เกิดข้อผิดพลาดในการสร้างคอมเมนต์สำหรับผู้ปกครอง โปรดลองอีกครั้ง");
        } finally {
            setIsGeneratingParentComment(false);
        }
    };

    const handleCopy = (text) => {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
        document.body.removeChild(textArea);
    };

    const formatDate = (timestamp) => {
        if (!timestamp || !timestamp.toDate) return '...';
        return timestamp.toDate().toLocaleString('th-TH', { dateStyle: 'medium' });
    };

    return (
        <>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
                <div className="bg-gray-800/80 backdrop-blur-xl border border-white/20 rounded-2xl w-full max-w-4xl h-[90vh] flex flex-col shadow-2xl shadow-black/50" onClick={(e) => e.stopPropagation()}>
                    <header className="flex items-center justify-between p-4 border-b border-white/10 flex-shrink-0">
                        <div>
                            <h2 className="text-2xl font-bold text-white">{student.firstName} {student.lastName}</h2>
                            <p className="text-gray-400">ภาพรวมผลการเรียนและพฤติกรรม - ป.{grade.replace('p','')}</p>
                        </div>
                         <button onClick={() => setIsLoggerOpen(true)} className="flex items-center gap-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold py-2 px-3 rounded-lg transition-colors border border-amber-500/40">
                            <Icon name="PlusCircle" size={16}/>
                            <span>บันทึกพฤติกรรม</span>
                        </button>
                    </header>
                    <div className="p-6 flex-grow overflow-auto grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* --- Left Column --- */}
                        <div className="space-y-6">
                            {isLoading ? (
                                <div className="flex items-center justify-center h-full"><Icon name="Loader2" className="animate-spin text-sky-400" size={40} /></div>
                            ) : (
                                <>
                                    <div>
                                        <h3 className="text-lg font-bold text-white mb-3">บทวิเคราะห์โดย AI</h3>
                                        <button onClick={handleGenerateSummary} disabled={isGenerating} className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-indigo-500 hover:opacity-90 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-wait">
                                            {isGenerating ? <Icon name="Loader2" className="animate-spin" size={20}/> : <Icon name="Sparkles" size={20}/>}
                                            {isGenerating ? 'กำลังวิเคราะห์...' : 'ให้ AI ช่วยวิเคราะห์ (รวมข้อมูลพฤติกรรม)'}
                                        </button>
                                        {aiSummary && (
                                            <div className="mt-4 p-4 bg-gray-900/50 border border-gray-700 rounded-lg space-y-4">
                                                <div>
                                                    <h4 className="font-semibold text-gray-300 text-sm mb-2">สรุปสำหรับคุณครู:</h4>
                                                    <p className="text-white whitespace-pre-wrap">{aiSummary}</p>
                                                </div>

                                                <button onClick={handleGenerateParentComment} disabled={isGeneratingParentComment || isGenerating} className="w-full flex items-center justify-center gap-2 bg-teal-500/80 hover:bg-teal-500 text-white font-bold py-2 px-3 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-wait">
                                                    {isGeneratingParentComment ? <Icon name="Loader2" className="animate-spin" size={20}/> : <Icon name="ClipboardSignature" size={20}/>}
                                                    {isGeneratingParentComment ? 'กำลังเรียบเรียง...' : 'สร้างคอมเมนต์สำหรับผู้ปกครอง'}
                                                </button>

                                                {parentComment && (
                                                    <div className="pt-4 border-t border-gray-700">
                                                        <div className="flex justify-between items-center mb-2">
                                                            <h4 className="font-semibold text-gray-300 text-sm">ข้อความสำหรับผู้ปกครอง:</h4>
                                                            <button onClick={() => handleCopy(parentComment)} className="text-gray-400 hover:text-white">
                                                                {isCopied ? <Icon name="Check" size={18} className="text-green-400"/> : <Icon name="Copy" size={18}/>}
                                                            </button>
                                                        </div>
                                                        <p className="text-white whitespace-pre-wrap">{parentComment}</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    
                                </>
                            )}
                        </div>
                        {/* --- Right Column --- */}
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-bold text-white mb-3">บันทึกพฤติกรรมล่าสุด</h3>
                                <div className="space-y-3 max-h-[28rem] overflow-y-auto pr-2">
                                    {behaviorLogs.length > 0 ? behaviorLogs.map(log => (
                                        <div key={log.id} className={`group p-3 rounded-lg flex items-start gap-3 ${log.type === 'positive' ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                                            <Icon name={log.icon} size={20} className={`mt-1 flex-shrink-0 ${log.type === 'positive' ? 'text-green-300' : 'text-red-300'}`}/>
                                            <div className="flex-grow">
                                                <p className="font-semibold text-white">{log.tag}</p>
                                                {log.note && <p className="text-sm text-gray-400 italic">"{log.note}"</p>}
                                                <p className="text-xs text-gray-500 mt-1">{formatDate(log.timestamp)}</p>
                                            </div>
                                            {/* ++ NEW: Delete Button ++ */}
                                            <button 
                                                onClick={() => setConfirmModal({ isOpen: true, data: { id: log.id, name: log.tag } })} 
                                                className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-opacity"
                                            >
                                                <Icon name="Trash2" size={16} />
                                            </button>
                                        </div>
                                    )) : <p className="text-gray-500 text-center py-4">ยังไม่มีการบันทึกพฤติกรรม</p>}
                                </div>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white mb-3">คะแนนรายวิชา</h3>
                                <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                                    {studentScores && Object.keys(studentScores).length > 0 ? Object.entries(studentScores).map(([subjectName, scores]) => (
                                        <div key={subjectName} className="bg-gray-700/30 p-4 rounded-lg">
                                            <h4 className="font-bold text-teal-300 mb-2">{subjectName}</h4>
                                            <ul className="text-sm text-gray-300 grid grid-cols-2 md:grid-cols-2 gap-x-4 gap-y-1">
                                                {scores.map(s => (
                                                    <li key={s.name} className="flex justify-between">
                                                        <span>{s.name}:</span>
                                                        <span className="font-mono">{s.score}/{s.maxScore}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )) : <p className="text-gray-500">ไม่มีข้อมูลคะแนน</p>}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {isLoggerOpen && <BehaviorLoggerModal student={student} grade={grade} onClose={() => setIsLoggerOpen(false)} />}
            {/* ++ NEW: Render Confirmation Modal ++ */}
            {confirmModal.isOpen && (
                <ConfirmationModal 
                    item={confirmModal.data}
                    onClose={() => setConfirmModal({ isOpen: false, data: null })}
                    onConfirm={() => handleDeleteBehaviorLog(confirmModal.data.id)}
                />
            )}
        </>
    );
};

export default StudentProfileModal;