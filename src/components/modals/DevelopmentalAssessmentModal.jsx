// src/components/modals/DevelopmentalAssessmentModal.jsx (Upgraded with Secret Randomizer Button)
import React from 'react';
import { collection, onSnapshot, query, orderBy, doc, getDoc, setDoc } from 'firebase/firestore';
import { db, appId, logActivity } from '../../firebase/firebase';
import { grades } from '../../constants/data';
import { desirableCharacteristics, readingAndThinkingSkills, keyCompetencies, assessmentLevels } from '../../constants/assessmentData';
import Icon from '../../icons/Icon';

const DevelopmentalAssessmentModal = ({ onClose }) => {
    const [selectedGrade, setSelectedGrade] = React.useState('p1');
    const [selectedTerm, setSelectedTerm] = React.useState('term1');
    const [students, setStudents] = React.useState([]);
    const [assessments, setAssessments] = React.useState({});
    const [isLoading, setIsLoading] = React.useState(true);
    const [isSaving, setIsSaving] = React.useState(false);

    // --- NEW: State สำหรับปุ่มลับ ---
    const [secretClickCount, setSecretClickCount] = React.useState(0);
    const [isSecretButtonVisible, setIsSecretButtonVisible] = React.useState(false);


    const currentYear = new Date().getFullYear() + 543;
    const assessmentDocId = `${selectedGrade}-${currentYear}-${selectedTerm}`;

    React.useEffect(() => {
        if (!db || !selectedGrade) return;
        setIsLoading(true);

        // --- NEW: Reset ปุ่มลับเมื่อเปลี่ยนชั้นเรียนหรือเทอม ---
        setIsSecretButtonVisible(false);
        setSecretClickCount(0);

        const rosterPath = `artifacts/${appId}/public/data/rosters/${selectedGrade}/students`;
        const studentsQuery = query(collection(db, rosterPath), orderBy("studentNumber"));

        const unsubStudents = onSnapshot(studentsQuery, (snapshot) => {
            const studentList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setStudents(studentList);

            const assessmentDocRef = doc(db, `artifacts/${appId}/public/data/assessments`, assessmentDocId);
            getDoc(assessmentDocRef).then(docSnap => {
                if (docSnap.exists()) {
                    setAssessments(docSnap.data());
                } else {
                    const initialAssessments = {};
                    studentList.forEach(s => {
                        initialAssessments[s.id] = {};
                    });
                    setAssessments(initialAssessments);
                }
                setIsLoading(false);
            }).catch(error => {
                console.error("Error fetching assessments:", error);
                setIsLoading(false);
            });
        }, (error) => {
            console.error("Error fetching students:", error);
            setIsLoading(false);
        });

        return () => unsubStudents();
    }, [selectedGrade, selectedTerm, assessmentDocId]);

    const handleAssessmentChange = (studentId, category, itemId, value) => {
        const newAssessments = JSON.parse(JSON.stringify(assessments));
        if (!newAssessments[studentId]) {
            newAssessments[studentId] = {};
        }
        if (!newAssessments[studentId][category]) {
            newAssessments[studentId][category] = {};
        }
        newAssessments[studentId][category][itemId] = parseInt(value, 10);
        setAssessments(newAssessments);
    };

    const handleSaveAll = async () => {
        setIsSaving(true);
        try {
            const assessmentDocRef = doc(db, `artifacts/${appId}/public/data/assessments`, assessmentDocId);
            await setDoc(assessmentDocRef, assessments, { merge: true });
            logActivity('ASSESSMENT_SAVE', `บันทึกข้อมูลประเมินพัฒนาการ ป.${selectedGrade.replace('p','')} เทอม ${selectedTerm.replace('term','')}`);
            alert('บันทึกข้อมูลเรียบร้อย!');
        } catch (error) {
            console.error("Error saving assessments:", error);
            alert('เกิดข้อผิดพลาด: ' + error.message);
        } finally {
            setIsSaving(false);
        }
    };
    
    // --- NEW: ฟังก์ชันสำหรับสุ่มคะแนน ---
    const handleRandomizeScores = () => {
        if (!students.length) return;
        if (!window.confirm('คุณแน่ใจหรือไม่ว่าจะสุ่มกรอกคะแนนทั้งหมด? ข้อมูลเดิม (ถ้ามี) จะถูกเขียนทับ')) {
            return;
        }

        const newAssessments = {};
        const allItems = {
            characteristics: desirableCharacteristics,
            skills: readingAndThinkingSkills,
            competencies: keyCompetencies
        };

        students.forEach(student => {
            newAssessments[student.id] = {};
            Object.keys(allItems).forEach(category => {
                newAssessments[student.id][category] = {};
                allItems[category].forEach(item => {
                    // สุ่มระหว่าง 2 (ดี) กับ 3 (ดีเยี่ยม)
                    const randomScore = Math.floor(Math.random() * 2) + 2;
                    newAssessments[student.id][category][item.id] = randomScore;
                });
            });
        });

        setAssessments(newAssessments);
        alert(`สุ่มกรอกคะแนนให้นักเรียน ${students.length} คนเรียบร้อยแล้ว! กรุณากด "บันทึกข้อมูล" เพื่อยืนยัน`);
    };

    // --- NEW: ฟังก์ชันสำหรับคลิกปุ่มลับ ---
    const handleSecretClick = () => {
        const newCount = secretClickCount + 1;
        setSecretClickCount(newCount);
        if (newCount >= 5) {
            setIsSecretButtonVisible(true);
        }
    };
    
    const allAssessmentItems = [
        ...desirableCharacteristics,
        ...readingAndThinkingSkills,
        ...keyCompetencies
    ];

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-800/80 backdrop-blur-xl border border-blue-500/50 rounded-2xl w-full max-w-7xl h-[90vh] flex flex-col shadow-2xl">
                <header className="flex items-center justify-between p-4 border-b border-white/10 flex-shrink-0">
                    {/* --- UPDATE: เพิ่ม onClick ให้กับ title --- */}
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3 cursor-pointer" onClick={handleSecretClick} title="คลิก 5 ครั้งเพื่อแสดงปุ่มลับ...">
                        <Icon name="ClipboardCheck" />ประเมินพัฒนาการผู้เรียน (สำหรับ ปพ.5)
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><Icon name="X" size={28} /></button>
                </header>
                
                <div className="p-4 flex flex-wrap items-center justify-between gap-4 border-b border-white/10">
                     <div className="flex items-center gap-2">
                        {grades.map((gradeId, index) => (
                            <button key={gradeId} onClick={() => setSelectedGrade(gradeId)} className={`px-3 py-1.5 text-sm font-bold rounded-lg transition-colors ${selectedGrade === gradeId ? 'bg-blue-500 text-white' : 'bg-gray-700/50 hover:bg-gray-700 text-gray-300'}`}>
                                ป.{index + 1}
                            </button>
                        ))}
                    </div>
                     <div className="flex items-center gap-2 bg-gray-900/50 p-1 rounded-lg">
                        <span className="text-sm font-bold text-gray-300 px-2">ปีการศึกษา {currentYear}</span>
                        <button onClick={() => setSelectedTerm('term1')} className={`px-3 py-1 text-xs rounded ${selectedTerm === 'term1' ? 'bg-blue-500' : ''}`}>เทอม 1</button>
                        <button onClick={() => setSelectedTerm('term2')} className={`px-3 py-1 text-xs rounded ${selectedTerm === 'term2' ? 'bg-blue-500' : ''}`}>เทอม 2</button>
                    </div>
                </div>

                <div className="flex-grow overflow-auto p-2">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full"><Icon name="Loader2" className="animate-spin text-blue-400" size={40} /></div>
                    ) : (
                        <table className="w-full min-w-[1200px] text-left table-fixed">
                            <thead>
                                <tr className="sticky top-0 bg-gray-800/80 backdrop-blur-xl z-10">
                                    <th className="p-2 text-sm text-white border-b border-r border-gray-700 w-16 text-center">เลขที่</th>
                                    <th className="p-2 text-sm text-white border-b border-r border-gray-700 w-48">ชื่อ-สกุล</th>
                                    {allAssessmentItems.map(item => (
                                        <th key={item.id} className="p-2 text-xs text-white border-b border-r border-gray-700 text-center w-24 transform -rotate-45" title={item.name}>
                                            <div className="truncate w-full">{item.name}</div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {students.map(student => (
                                    <tr key={student.id} className="border-b border-gray-700/50 hover:bg-white/5">
                                        <td className="p-2 text-center border-r border-gray-700">{student.studentNumber}</td>
                                        <td className="p-2 truncate border-r border-gray-700">{`${student.firstName} ${student.lastName}`}</td>
                                        {allAssessmentItems.map(item => {
                                            const category = desirableCharacteristics.includes(item) ? 'characteristics' : readingAndThinkingSkills.includes(item) ? 'skills' : 'competencies';
                                            const value = assessments[student.id]?.[category]?.[item.id] || '';
                                            return (
                                                <td key={item.id} className="p-1 border-r border-gray-700">
                                                    <select
                                                        value={value}
                                                        onChange={(e) => handleAssessmentChange(student.id, category, item.id, e.target.value)}
                                                        className="w-full bg-gray-700/50 rounded p-1 text-center text-xs"
                                                    >
                                                        <option value="">-</option>
                                                        {Object.keys(assessmentLevels).reverse().map(level => (
                                                            <option key={level} value={level}>{level}</option>
                                                        ))}
                                                    </select>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
                 <footer className="p-4 border-t border-white/10 flex justify-between items-center">
                    {/* --- NEW: ปุ่มลับจะแสดงผลที่นี่ --- */}
                    <div>
                        {isSecretButtonVisible && (
                             <button onClick={handleRandomizeScores} className="flex items-center gap-2 py-2 px-4 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 font-bold rounded-lg transition-colors animate-pulse border border-yellow-500/40">
                                <Icon name="Sparkles" size={18} />
                                ปุ่ม Growth Mindset (สุ่มคะแนน 2-3)
                            </button>
                        )}
                    </div>
                    <button onClick={handleSaveAll} disabled={isSaving} className="flex items-center gap-2 py-2 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors">
                        <Icon name="Save" size={18} />
                        {isSaving ? 'กำลังบันทึก...' : 'บันทึกข้อมูลทั้งหมด'}
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default DevelopmentalAssessmentModal;