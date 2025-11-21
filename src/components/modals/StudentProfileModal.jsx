import React from 'react';
import { collection, doc, onSnapshot, query, orderBy, deleteDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, appId } from '../../firebase/firebase';
import { callGeminiAPI } from '../../api/gemini';
import Icon from '../../icons/Icon';
import BehaviorLoggerModal from './BehaviorLoggerModal';
import ConfirmationModal from './ConfirmationModal';

const calculateAge = (birthDateString) => {
  if (!birthDateString) return { years: '-', months: '-', display: '-' };
  const birthDate = new Date(birthDateString);
  const today = new Date();
  let years = today.getFullYear() - birthDate.getFullYear();
  let months = today.getMonth() - birthDate.getMonth();
  if (months < 0 || (months === 0 && today.getDate() < birthDate.getDate())) {
    years--;
    months += 12;
  }
  return { years, months, display: `${years} ปี ${months} เดือน` };
};

const StudentProfileModal = ({ student, grade, subjects, onClose, openModal }) => {
  const [studentScores, setStudentScores] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [aiSummary, setAiSummary] = React.useState('');
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [parentComment, setParentComment] = React.useState('');
  const [isGeneratingParentComment, setIsGeneratingParentComment] = React.useState(false);
  const [isCopied, setIsCopied] = React.useState(false);
  const [isLoggerOpen, setIsLoggerOpen] = React.useState(false);
  const [behaviorLogs, setBehaviorLogs] = React.useState([]);
  const [startDate, setStartDate] = React.useState('');
  const [endDate, setEndDate] = React.useState('');
  const [confirmModal, setConfirmModal] = React.useState({ isOpen: false, data: null });

  // Health Data State
  const [healthData, setHealthData] = React.useState({ weight: '', height: '' });
  const [isEditingHealth, setIsEditingHealth] = React.useState(false);
  const [isSavingHealth, setIsSavingHealth] = React.useState(false);

  const today = new Date();
  const currentYear = today.getFullYear() + 543;
  // Simple term logic: May-Oct = Term 1, Nov-Apr = Term 2
  const currentMonth = today.getMonth() + 1;
  const currentTerm = currentMonth >= 5 && currentMonth <= 10 ? 'term1' : 'term2';

  // Live-sync scores and assignments so the profile always reflects the latest Firestore data
  React.useEffect(() => {
    if (!db || !subjects) return;
    if (subjects.length === 0) {
      setStudentScores({});
      setIsLoading(false);
      return;
    }

    let isActive = true;
    const unsubscribers = [];
    setIsLoading(true);
    setStudentScores({});

    subjects.forEach((subject) => {
      const scoresPath = `artifacts/${appId}/public/data/subjects/${subject.id}/grades/${grade}/scores`;
      const assignmentsPath = `artifacts/${appId}/public/data/subjects/${subject.id}/grades/${grade}/assignments`;

      let latestAssignments = [];
      let latestScores = {};

      const syncSubjectData = () => {
        if (!isActive) return;
        const normalizedAssignments = (latestAssignments || [])
          .filter((a) => a.createdAt && a.name)
          .map((assign) => ({
            name: assign.name,
            score: latestScores?.[assign.id], // undefined if not submitted
            maxScore: assign.maxScore,
            category: assign.category,
          }));

        setStudentScores((prev) => ({
          ...prev,
          [subject.id]: {
            name: subject.name,
            assignments: normalizedAssignments,
          },
        }));
        setIsLoading(false);
      };

      const assignmentsUnsub = onSnapshot(query(collection(db, assignmentsPath), orderBy('createdAt')), (snapshot) => {
        latestAssignments = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        syncSubjectData();
      });

      const scoresUnsub = onSnapshot(doc(db, `${scoresPath}/${student.id}`), (docSnap) => {
        latestScores = docSnap.exists() ? docSnap.data() : {};
        syncSubjectData();
      });

      unsubscribers.push(assignmentsUnsub, scoresUnsub);
    });

    const healthPath = `artifacts/${appId}/public/data/health_records/${grade}-${currentYear}-${currentTerm}/records/${student.id}`;
    const healthUnsub = onSnapshot(doc(db, healthPath), (docSnap) => {
      if (docSnap.exists()) {
        setHealthData(docSnap.data());
      } else {
        setHealthData({ weight: '', height: '' });
      }
    });
    unsubscribers.push(healthUnsub);

    return () => {
      isActive = false;
      unsubscribers.forEach((unsub) => unsub && unsub());
    };
  }, [student.id, grade, subjects, currentYear, currentTerm]);

  React.useEffect(() => {
    if (!db) return;
    const logPath = `artifacts/${appId}/public/data/rosters/${grade}/students/${student.id}/behavior_logs`;
    const q = query(collection(db, logPath), orderBy('timestamp', 'desc'));
    const unsubscribeLogs = onSnapshot(q, (snapshot) => {
      setBehaviorLogs(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsubscribeLogs();
  }, [student.id, grade]);

  const handleSaveHealthData = async () => {
    setIsSavingHealth(true);
    try {
      const healthPath = `artifacts/${appId}/public/data/health_records/${grade}-${currentYear}-${currentTerm}/records/${student.id}`;
      await setDoc(
        doc(db, healthPath),
        {
          weight: parseFloat(healthData.weight),
          height: parseFloat(healthData.height),
          lastUpdated: serverTimestamp(),
        },
        { merge: true }
      );
      setIsEditingHealth(false);
    } catch (error) {
      console.error('Error saving health data:', error);
      alert('บันทึกข้อมูลสุขภาพไม่สำเร็จ');
    } finally {
      setIsSavingHealth(false);
    }
  };

  const handleDeleteBehaviorLog = async (logId) => {
    if (!logId) return;
    const logPath = `artifacts/${appId}/public/data/rosters/${grade}/students/${student.id}/behavior_logs`;
    try {
      await deleteDoc(doc(db, logPath, logId));
    } catch (error) {
      console.error('Error deleting behavior log:', error);
      alert('เกิดข้อผิดพลาดในการลบ');
    }
  };

  const handleGenerateSummary = async () => {
    if (!studentScores) return;
    setIsGenerating(true);
    setAiSummary('');
    setParentComment('');

    let behaviorDetails = 'ไม่มีบันทึกพฤติกรรม';
    if (behaviorLogs.length > 0) {
      behaviorDetails = behaviorLogs
        .map((log) => `- ${log.tag} (${log.type === 'positive' ? 'เชิงบวก' : 'ควรส่งเสริม'})`)
        .join('\n');
    }

    let scoreDetails = '';
    for (const subjectId in studentScores) {
      const { name: subjectName, assignments } = studentScores[subjectId];
      const scoresText = assignments
        .map((s) => `${s.name}: ${s.score !== undefined ? s.score : 'ขาดส่ง'}/${s.maxScore}`)
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
      console.error('Error calling Gemini API for summary:', error);
      setAiSummary('เกิดข้อผิดพลาดในการเรียก AI เพื่อสรุปผล โปรดลองอีกครั้ง');
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
      console.error('Error calling Gemini API for parent comment:', error);
      setParentComment('เกิดข้อผิดพลาดในการสร้างคอมเมนต์สำหรับผู้ปกครอง โปรดลองอีกครั้ง');
    } finally {
      setIsGeneratingParentComment(false);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  const filteredBehaviorLogs = React.useMemo(() => {
    const toJsDate = (value) => {
      if (!value) return null;
      if (value.toDate) return value.toDate();
      if (value instanceof Date) return value;
      return null;
    };
    const start = startDate ? new Date(`${startDate}T00:00:00`) : null;
    const end = endDate ? new Date(`${endDate}T23:59:59`) : null;
    return [...behaviorLogs]
      .filter((log) => {
        const logDate = toJsDate(log.timestamp);
        if (!logDate) return false;
        if (start && logDate < start) return false;
        if (end && logDate > end) return false;
        return true;
      })
      .sort((a, b) => {
        const aDate = toJsDate(a.timestamp)?.getTime() || 0;
        const bDate = toJsDate(b.timestamp)?.getTime() || 0;
        return bDate - aDate;
      });
  }, [behaviorLogs, startDate, endDate]);

  const formatDate = (timestamp) => {
    const dateValue = timestamp?.toDate ? timestamp.toDate() : timestamp instanceof Date ? timestamp : null;
    if (!dateValue) return '...';
    return dateValue.toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' });
  };

  const age = calculateAge(student.birthDate);

  // Group assignments by subject so we can show status per subject
  const groupedAssignments = React.useMemo(() => {
    if (!studentScores) return [];
    return Object.values(studentScores).map(({ name: subjectName, assignments }) => {
      const submitted = [];
      const missing = [];
      assignments.forEach((assign) => {
        if (assign.score !== undefined && assign.score !== null && assign.score !== '') {
          submitted.push(assign);
        } else {
          missing.push(assign);
        }
      });
      return { subjectName, submitted, missing };
    });
  }, [studentScores]);

  const [expandedSubjectId, setExpandedSubjectId] = React.useState(null);
  const subjectCardStyles = [
    { bg: 'from-cyan-500/15 to-blue-500/10', border: 'border-cyan-500/40' },
    { bg: 'from-emerald-500/15 to-teal-500/10', border: 'border-emerald-500/40' },
    { bg: 'from-amber-500/15 to-orange-500/10', border: 'border-amber-500/40' },
    { bg: 'from-purple-500/15 to-indigo-500/10', border: 'border-purple-500/40' },
    { bg: 'from-pink-500/15 to-rose-500/10', border: 'border-rose-500/40' },
  ];

  const toggleSubject = (id) => {
    setExpandedSubjectId((prev) => (prev === id ? null : id));
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4" onClick={onClose}>
        <div className="bg-[#0c1224] border border-slate-700 rounded-3xl w-full max-w-[1500px] h-[96vh] flex flex-col shadow-2xl shadow-black/40 overflow-hidden" onClick={(e) => e.stopPropagation()}>
          <header className="bg-slate-900/50 p-6 border-b border-slate-700 flex items-center justify-between gap-4 flex-wrap backdrop-blur-xl">
            <div className="flex items-center gap-6">
              <div className={`w-24 h-24 rounded-2xl flex items-center justify-center text-4xl font-bold shadow-lg ${student.gender === 'female' ? 'bg-gradient-to-br from-pink-500 to-rose-600' : 'bg-gradient-to-br from-blue-500 to-cyan-600'} text-white ring-4 ring-white/10`}>
                {student.studentNumber}
              </div>
              <div>
                <h2 className="text-3xl lg:text-4xl font-extrabold text-white mb-2 tracking-tight">{student.firstName} {student.lastName}</h2>
                <div className="flex flex-wrap items-center gap-2 text-slate-300 text-sm">
                  <span className="px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700">ชั้น ป.{grade.replace('p', '')}</span>
                  <span className="px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700">รหัส {student.studentId || '-'}</span>
                  <span className="px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700">{student.gender}</span>
                  <span className="px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700">อายุ {age.display}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-3 flex-wrap">
              {openModal && (
                <button
                  onClick={() => openModal('studentProgress', { student, grade })}
                  className="flex items-center gap-2 bg-sky-500/15 hover:bg-sky-500/25 text-sky-200 font-bold py-2.5 px-4 rounded-xl transition-all border border-sky-500/30 hover:border-sky-500/50"
                >
                  <Icon name="LineChart" size={18} />
                  <span>ดูความคืบหน้า</span>
                </button>
              )}
              <button onClick={() => setIsLoggerOpen(true)} className="flex items-center gap-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-bold py-2.5 px-4 rounded-xl transition-all border border-amber-500/30 hover:border-amber-500/50">
                <Icon name="PlusCircle" size={18} />
                <span>บันทึกพฤติกรรม</span>
              </button>
              <button onClick={onClose} className="w-11 h-11 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                <Icon name="X" size={26} />
              </button>
            </div>
          </header>

          <div className="flex-grow overflow-y-auto p-6 custom-scrollbar">
            <div className="grid grid-cols-12 gap-6">
              {/* Column 1: Personal Info & AI */}
              <div className="col-span-12 lg:col-span-4 space-y-6">
                <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2"><Icon name="User" size={20} className="text-teal-400" /> ข้อมูลส่วนตัว</h3>
                    {!isEditingHealth && (
                      <button onClick={() => setIsEditingHealth(true)} className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1">
                        <Icon name="Pencil" size={12} /> แก้ไข
                      </button>
                    )}
                  </div>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-slate-400 text-xs uppercase tracking-wider">วันเกิด</p>
                        <p className="text-white font-medium">{student.birthDate ? new Date(student.birthDate).toLocaleDateString('th-TH', { dateStyle: 'long' }) : '-'}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-xs uppercase tracking-wider">อายุ</p>
                        <p className="text-white font-medium">{age.display}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-700/50">
                      <div>
                        <p className="text-slate-400 text-xs uppercase tracking-wider">น้ำหนัก (กก.)</p>
                        {isEditingHealth ? (
                          <input
                            type="number"
                            value={healthData.weight}
                            onChange={(e) => setHealthData({ ...healthData, weight: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-white text-sm mt-1 focus:border-teal-500 outline-none"
                          />
                        ) : (
                          <p className="text-2xl font-bold text-teal-400">{healthData.weight || '-'}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-slate-400 text-xs uppercase tracking-wider">ส่วนสูง (ซม.)</p>
                        {isEditingHealth ? (
                          <input
                            type="number"
                            value={healthData.height}
                            onChange={(e) => setHealthData({ ...healthData, height: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-white text-sm mt-1 focus:border-teal-500 outline-none"
                          />
                        ) : (
                          <p className="text-2xl font-bold text-teal-400">{healthData.height || '-'}</p>
                        )}
                      </div>
                    </div>
                    {isEditingHealth && (
                      <div className="flex gap-2 mt-2">
                        <button onClick={handleSaveHealthData} disabled={isSavingHealth} className="flex-1 bg-teal-600 hover:bg-teal-500 text-white text-xs py-1.5 rounded transition-colors">
                          {isSavingHealth ? 'บันทึก...' : 'บันทึก'}
                        </button>
                        <button onClick={() => setIsEditingHealth(false)} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white text-xs py-1.5 rounded transition-colors">
                          ยกเลิก
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-gradient-to-b from-indigo-900/40 to-purple-900/40 rounded-2xl p-5 border border-indigo-500/30">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Icon name="Sparkles" size={20} className="text-purple-400" /> AI วิเคราะห์</h3>
                  <button onClick={handleGenerateSummary} disabled={isGenerating} className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-4 rounded-xl transition-all shadow-lg shadow-indigo-900/50 mb-4 disabled:opacity-50 disabled:cursor-wait">
                    {isGenerating ? <Icon name="Loader2" className="animate-spin" size={18} /> : <Icon name="BrainCircuit" size={18} />}
                    {isGenerating ? 'กำลังวิเคราะห์...' : 'วิเคราะห์ผลการเรียน'}
                  </button>

                  {aiSummary && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="bg-slate-900/60 rounded-xl p-4 border border-indigo-500/20">
                        <p className="text-slate-200 text-sm leading-relaxed">{aiSummary}</p>
                      </div>
                      <button onClick={handleGenerateParentComment} disabled={isGeneratingParentComment} className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm rounded-lg border border-slate-600 transition-colors flex items-center justify-center gap-2">
                        {isGeneratingParentComment ? <Icon name="Loader2" className="animate-spin" size={14} /> : <Icon name="MessageSquare" size={14} />}
                        สร้างข้อความถึงผู้ปกครอง
                      </button>
                      {parentComment && (
                        <div className="bg-slate-900/60 rounded-xl p-4 border border-teal-500/20 relative group">
                          <p className="text-teal-100 text-sm leading-relaxed italic">"{parentComment}"</p>
                          <button onClick={() => handleCopy(parentComment)} className="absolute top-2 right-2 p-1.5 bg-slate-800 text-slate-400 hover:text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                            {isCopied ? <Icon name="Check" size={14} /> : <Icon name="Copy" size={14} />}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Column 2: Academic Performance grouped by subject */}
              <div className="col-span-12 lg:col-span-8">
                <div className="bg-slate-800/40 rounded-2xl border border-slate-700 p-5">
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2">
                      <Icon name="GraduationCap" size={20} className="text-sky-400" />
                      <h3 className="text-lg font-bold text-white">ผลการส่งงานแยกตามวิชา</h3>
                    </div>
                    <span className="text-xs text-slate-400">อัปเดตอัตโนมัติแบบเรียลไทม์</span>
                  </div>
                  {groupedAssignments.length === 0 ? (
                    <div className="text-center py-10 text-slate-500 text-sm">ยังไม่มีข้อมูลงานในวิชานี้</div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[620px] overflow-y-auto custom-scrollbar">
                      {groupedAssignments.map(({ subjectName, submitted, missing }, idx) => {
                        const totalAssignments = submitted.length + missing.length;
                        const style = subjectCardStyles[idx % subjectCardStyles.length];
                        const cardId = `${subjectName}-${idx}`;
                        return (
                        <div
                          key={cardId}
                          className={`relative overflow-hidden rounded-xl border ${style.border} bg-gradient-to-br ${style.bg} p-4 space-y-3 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/30 cursor-pointer`}
                          onClick={() => toggleSubject(cardId)}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-white font-semibold text-lg flex items-center gap-2">
                                <Icon name="NotebookText" size={18} className="text-sky-300" />
                                {subjectName}
                              </div>
                              <div className="flex items-center gap-2 text-xs mt-2 flex-wrap">
                                <span className="px-2 py-0.5 rounded-full bg-white/10 text-slate-100 border border-white/20">ทั้งหมด {totalAssignments}</span>
                                <span className="px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-100 border border-rose-500/30">ค้างส่ง {missing.length}</span>
                                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-100 border border-emerald-500/30">ส่งแล้ว {submitted.length}</span>
                              </div>
                            </div>
                            <Icon
                              name={expandedSubjectId === cardId ? 'ChevronUp' : 'ChevronDown'}
                              size={18}
                              className="text-slate-200"
                            />
                          </div>

                          {expandedSubjectId === cardId && (
                            <>
                              {missing.length > 0 && (
                                <div className="space-y-2">
                                  <p className="text-rose-100 text-sm flex items-center gap-1">
                                    <Icon name="AlertCircle" size={14} /> งานที่ค้างส่ง
                                  </p>
                                  {missing.map((assign, i) => (
                                    <div key={i} className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-3 flex items-center justify-between">
                                      <div>
                                        <p className="text-rose-100 text-sm font-semibold">{assign.name}</p>
                                        <p className="text-rose-200/70 text-xs">-{assign.maxScore} คะแนน</p>
                                      </div>
                                      <span className="text-[11px] text-rose-200/80">ยังไม่ส่ง</span>
                                    </div>
                                  ))}
                                </div>
                              )}

                              <div className="space-y-2">
                                <p className="text-emerald-100 text-sm flex items-center gap-1">
                                  <Icon name="CheckCircle2" size={14} /> งานที่ส่งแล้ว
                                </p>
                                {submitted.length > 0 ? (
                                  submitted.map((assign, i) => (
                                    <div key={i} className="bg-slate-800/60 border border-slate-700 rounded-lg p-3 space-y-2">
                                      <div className="flex items-center justify-between">
                                        <p className="text-slate-100 text-sm font-semibold">{assign.name}</p>
                                        <span className="text-sm font-bold text-emerald-300">{assign.score}/{assign.maxScore}</span>
                                      </div>
                                      <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                                        <div
                                          className="h-full bg-gradient-to-r from-teal-400 to-emerald-500 rounded-full"
                                          style={{ width: `${Math.min(100, (assign.score / assign.maxScore) * 100)}%` }}
                                        />
                                      </div>
                                    </div>
                                  ))
                                ) : (
                                  <p className="text-xs text-slate-500 bg-slate-900/60 border border-slate-700 rounded-lg p-3">ยังไม่มีงานที่ส่งในวิชานี้</p>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Column 3: Behavior */}
              <div className="col-span-12">
                <div className="bg-slate-800/50 rounded-2xl border border-slate-700 flex flex-col h-full">
                  <div className="p-5 border-b border-slate-700 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2"><Icon name="Activity" size={20} className="text-amber-400" /> พฤติกรรม</h3>
                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs text-white w-32"
                      />
                    </div>
                  </div>
                  <div className="p-5 flex-grow overflow-y-auto max-h-[320px] custom-scrollbar">
                    <div className="space-y-3">
                      {filteredBehaviorLogs.length > 0 ? (
                        filteredBehaviorLogs.map((log) => (
                          <div
                            key={log.id}
                            className={`group p-3 rounded-xl border flex items-start gap-3 transition-all ${log.type === 'positive'
                              ? 'bg-emerald-500/5 border-emerald-500/20 hover:bg-emerald-500/10'
                              : 'bg-rose-500/5 border-rose-500/20 hover:bg-rose-500/10'}`}
                          >
                            <div className={`mt-1 p-1.5 rounded-lg ${log.type === 'positive' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                              <Icon name={log.icon} size={16} />
                            </div>
                            <div className="flex-grow min-w-0">
                              <div className="flex justify-between items-start">
                                <p className={`font-bold text-sm ${log.type === 'positive' ? 'text-emerald-200' : 'text-rose-200'}`}>{log.tag}</p>
                                <span className="text-[10px] text-slate-500 whitespace-nowrap ml-2">{formatDate(log.timestamp)}</span>
                              </div>
                              {log.note && <p className="text-xs text-slate-400 mt-1 line-clamp-2">"{log.note}"</p>}
                            </div>
                            <button
                              onClick={() => setConfirmModal({ isOpen: true, data: { id: log.id, name: log.tag } })}
                              className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 transition-all p-1"
                            >
                              <Icon name="Trash2" size={14} />
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-10">
                          <div className="bg-slate-800/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Icon name="ClipboardList" size={32} className="text-slate-600" />
                          </div>
                          <p className="text-slate-500 text-sm">ไม่พบบันทึกพฤติกรรม</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isLoggerOpen && <BehaviorLoggerModal student={student} grade={grade} onClose={() => setIsLoggerOpen(false)} />}
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
