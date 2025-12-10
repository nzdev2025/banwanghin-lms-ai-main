import React from 'react';
import { collection, doc, onSnapshot, query, orderBy, deleteDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, appId } from '../../firebase/firebase';
import { callGeminiAPI } from '../../api/gemini';
import Icon from '../../icons/Icon';
import BehaviorLoggerModal from './BehaviorLoggerModal';
import ConfirmationModal from './ConfirmationModal';

const DEFAULT_HEALTH_DATA = { weight: '', height: '' };

const subjectCardStyles = [
  { bg: 'from-cyan-500/15 to-blue-500/10', border: 'border-cyan-500/40' },
  { bg: 'from-emerald-500/15 to-teal-500/10', border: 'border-emerald-500/40' },
  { bg: 'from-amber-500/15 to-orange-500/10', border: 'border-amber-500/40' },
  { bg: 'from-purple-500/15 to-indigo-500/10', border: 'border-purple-500/40' },
  { bg: 'from-pink-500/15 to-rose-500/10', border: 'border-rose-500/40' },
];

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

const toJsDate = (value) => {
  if (!value) return null;
  if (value.toDate) return value.toDate();
  if (value instanceof Date) return value;
  return null;
};

const formatDate = (timestamp) => {
  const dateValue = toJsDate(timestamp);
  if (!dateValue) return '...';
  return dateValue.toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' });
};

const parseMetric = (value) => {
  if (value === '' || value === undefined || value === null) return '';
  const parsed = parseFloat(value);
  return Number.isNaN(parsed) ? '' : parsed;
};

const filterBehaviorLogs = (behaviorLogs, startDate, endDate) => {
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
};

const groupAssignmentsBySubject = (studentScores) => {
  if (!studentScores) return [];
  return Object.values(studentScores).map(({ name: subjectName, assignments = [] }) => {
    const submitted = [];
    const missing = [];
    assignments.forEach((assignment) => {
      if (assignment.score !== undefined && assignment.score !== null && assignment.score !== '') {
        submitted.push(assignment);
      } else {
        missing.push(assignment);
      }
    });
    return { subjectName, submitted, missing };
  });
};

const summarizeAssignmentStats = (studentScores) => {
  if (!studentScores) return { totalAssignments: 0, missing: 0, submitted: 0, subjectCount: 0 };

  return Object.values(studentScores).reduce(
    (acc, { assignments = [] }) => {
      acc.subjectCount += 1;
      assignments.forEach((assignment) => {
        acc.totalAssignments += 1;
        if (assignment.score !== undefined && assignment.score !== null && assignment.score !== '') {
          acc.submitted += 1;
        } else {
          acc.missing += 1;
        }
      });
      return acc;
    },
    { totalAssignments: 0, missing: 0, submitted: 0, subjectCount: 0 },
  );
};

const getCompletionRate = (stats) => {
  return stats.totalAssignments > 0 ? Math.round((stats.submitted / stats.totalAssignments) * 100) : 0;
};

const deriveBehaviorStats = (logs) => {
  const positives = logs.filter((log) => log.type === 'positive').length;
  const negatives = logs.filter((log) => log.type !== 'positive').length;
  const total = logs.length;
  let status = 'ยังไม่มีบันทึก';
  if (total > 0) {
    if (positives > negatives) status = 'ดี';
    else if (negatives > positives) status = 'ควรปรับปรุง';
    else status = 'ควรจับตา';
  }
  return { positives, negatives, total, status };
};

const buildBehaviorSummary = (behaviorLogs) => {
  if (!behaviorLogs.length) return 'ไม่มีบันทึกพฤติกรรม';
  return behaviorLogs
    .map((log) => `- ${log.tag} (${log.type === 'positive' ? 'เชิงบวก' : 'ควรส่งเสริม'})`)
    .join('\n');
};

const buildScoreSummary = (studentScores) => {
  if (!studentScores) return '';
  let scoreDetails = '';
  Object.values(studentScores).forEach(({ name: subjectName, assignments }) => {
    const scoresText = (assignments || [])
      .map((assignment) => `${assignment.name}: ${assignment.score !== undefined ? assignment.score : 'ขาดส่ง'}/${assignment.maxScore}`)
      .join(', ');
    scoreDetails += `- วิชา${subjectName}: ${scoresText}\n`;
  });
  return scoreDetails;
};

const buildStudentSummaryPrompt = (student, grade, studentScores, behaviorLogs) => {
  const behaviorDetails = buildBehaviorSummary(behaviorLogs);
  const scoreDetails = buildScoreSummary(studentScores);
  const gradeLabel = grade.replace('p', '');

  return `
      ในฐานะผู้ช่วยครูมืออาชีพ จงวิเคราะห์ข้อมูลของนักเรียนชื่อ '${student.firstName} ${student.lastName}' ชั้น ป.${gradeLabel}'
      
      ข้อมูลคะแนน:
      ${scoreDetails}

      ข้อมูลพฤติกรรมล่าสุด:
      ${behaviorDetails}

      จงสรุปภาพรวมการเรียนโดยเชื่อมโยงกับพฤติกรรม, ระบุจุดแข็ง, และแนะนำจุดที่ควรพัฒนา 1-2 ข้อ
      เขียนสรุปเป็นภาษาไทยที่กระชับ, เข้าใจง่าย, และให้กำลังใจสำหรับคุณครูเพื่อนำไปใช้พัฒนาการสอน
    `;
};

const buildParentCommentPrompt = (aiSummary) => `
      ในฐานะครูที่ปรึกษาที่เชี่ยวชาญด้านการสื่อสารเชิงบวก จงนำบทวิเคราะห์ผลการเรียนต่อไปนี้:
      "${aiSummary}"

      แล้วเรียบเรียงใหม่เป็น "ข้อความคอมเมนต์สำหรับผู้ปกครอง" โดยใช้หลักการต่อไปนี้:
      1. ใช้ภาษาที่เป็นทางการ สุภาพ และเข้าใจง่ายสำหรับผู้ปกครอง
      2. ขึ้นต้นด้วยจุดแข็งหรือด้านที่น่าชื่นชมของนักเรียนเสมอ (เช่น ด้านการเรียน, น้ำใจ, ความคิดสร้างสรรค์)
      3. กล่าวถึงจุดที่ควรพัฒนาในเชิง "ข้อเสนอแนะเพื่อส่งเสริม" ไม่ใช่ "ข้อตำหนิ"
      4. จบด้วยประโยคที่แสดงถึงความร่วมมือระหว่างโรงเรียนและผู้ปกครอง
      5. มีความยาวไม่เกิน 3-4 ประโยค
    `;




const StudentProfileModal = ({ student, grade, subjects, onClose, openModal, testOverrides = {} }) => {
  const { initialScores, initialBehaviorLogs, initialHealthData, skipLiveSync } = testOverrides;

  const [studentScores, setStudentScores] = React.useState(initialScores ?? null);
  const [aiSummary, setAiSummary] = React.useState('');
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [parentComment, setParentComment] = React.useState('');
  const [isGeneratingParentComment, setIsGeneratingParentComment] = React.useState(false);
  const [isCopied, setIsCopied] = React.useState(false);
  const [isLoggerOpen, setIsLoggerOpen] = React.useState(false);
  const [behaviorLogs, setBehaviorLogs] = React.useState(initialBehaviorLogs ?? []);
  const [startDate, setStartDate] = React.useState('');
  const [endDate] = React.useState('');
  const [confirmModal, setConfirmModal] = React.useState({ isOpen: false, data: null });
  const [healthData, setHealthData] = React.useState(initialHealthData ?? DEFAULT_HEALTH_DATA);
  const [isEditingHealth, setIsEditingHealth] = React.useState(false);
  const [isSavingHealth, setIsSavingHealth] = React.useState(false);
  const [expandedSubjectId, setExpandedSubjectId] = React.useState(null);
  const [isSubjectsOpen, setIsSubjectsOpen] = React.useState(false);
  const [isBehaviorOpen, setIsBehaviorOpen] = React.useState(false);

  React.useEffect(() => {
    if (initialScores) {
      setStudentScores(initialScores);
    }
  }, [initialScores]);

  React.useEffect(() => {
    if (initialHealthData) {
      setHealthData(initialHealthData);
    }
  }, [initialHealthData]);

  React.useEffect(() => {
    if (initialBehaviorLogs) {
      setBehaviorLogs(initialBehaviorLogs);
    }
  }, [initialBehaviorLogs]);

  const today = new Date();
  const currentYear = today.getFullYear() + 543;
  const currentMonth = today.getMonth() + 1;
  const currentTerm = currentMonth >= 5 && currentMonth <= 10 ? 'term1' : 'term2';
  const gradeLabel = grade.replace('p', '');

  React.useEffect(() => {
    if (!db || !subjects || skipLiveSync) return;
    if (subjects.length === 0) {
      setStudentScores({});
      return;
    }

    let isActive = true;
    const unsubscribers = [];

    subjects.forEach((subject) => {
      const scoresPath = `artifacts/${appId}/public/data/subjects/${subject.id}/grades/${grade}/scores`;
      const assignmentsPath = `artifacts/${appId}/public/data/subjects/${subject.id}/grades/${grade}/assignments`;

      let latestAssignments = [];
      let latestScores = {};

      const syncSubjectData = () => {
        if (!isActive) return;
        const normalizedAssignments = (latestAssignments || [])
          .filter((assignment) => assignment.createdAt && assignment.name)
          .map((assignment) => ({
            name: assignment.name,
            score: latestScores?.[assignment.id],
            maxScore: assignment.maxScore,
            category: assignment.category,
          }));

        setStudentScores((prev) => ({
          ...prev,
          [subject.id]: {
            name: subject.name,
            assignments: normalizedAssignments,
          },
        }));
      };

      const assignmentsUnsub = onSnapshot(query(collection(db, assignmentsPath), orderBy('createdAt')), (snapshot) => {
        latestAssignments = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
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
        setHealthData(DEFAULT_HEALTH_DATA);
      }
    });
    unsubscribers.push(healthUnsub);

    return () => {
      isActive = false;
      unsubscribers.forEach((unsub) => unsub && unsub());
    };
  }, [student.id, grade, subjects, currentYear, currentTerm, skipLiveSync]);

  React.useEffect(() => {
    if (!db || skipLiveSync) return;
    const logPath = `artifacts/${appId}/public/data/rosters/${grade}/students/${student.id}/behavior_logs`;
    const behaviorQuery = query(collection(db, logPath), orderBy('timestamp', 'desc'));
    const unsubscribeLogs = onSnapshot(behaviorQuery, (snapshot) => {
      setBehaviorLogs(snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() })));
    });

    return () => unsubscribeLogs();
  }, [student.id, grade, skipLiveSync]);

  const handleSaveHealthData = async () => {
    setIsSavingHealth(true);
    try {
      const healthPath = `artifacts/${appId}/public/data/health_records/${grade}-${currentYear}-${currentTerm}/records/${student.id}`;
      await setDoc(
        doc(db, healthPath),
        {
          weight: parseMetric(healthData.weight),
          height: parseMetric(healthData.height),
          measuredAt: serverTimestamp(),
          lastUpdated: serverTimestamp(),
        },
        { merge: true },
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

    try {
      const prompt = buildStudentSummaryPrompt(student, grade, studentScores, behaviorLogs);
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

    try {
      const prompt = buildParentCommentPrompt(aiSummary);
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

  const filteredBehaviorLogs = React.useMemo(
    () => filterBehaviorLogs(behaviorLogs, startDate, endDate),
    [behaviorLogs, startDate, endDate],
  );

  const groupedAssignments = React.useMemo(() => groupAssignmentsBySubject(studentScores), [studentScores]);
  const assignmentStats = React.useMemo(() => summarizeAssignmentStats(studentScores), [studentScores]);
  const completionRate = getCompletionRate(assignmentStats);
  const behaviorStats = React.useMemo(() => deriveBehaviorStats(filteredBehaviorLogs), [filteredBehaviorLogs]);
  const age = React.useMemo(() => calculateAge(student.birthDate), [student.birthDate]);

  const toggleSubject = (id) => {
    setExpandedSubjectId((prev) => (prev === id ? null : id));
  };

  return (
    <>
      <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-lg z-[200] flex items-center justify-center p-3 sm:p-6" onClick={onClose}>
        <div
          className="relative w-full max-w-6xl h-[96vh] bg-gradient-to-br from-[#0c1020] via-[#0b1328] to-[#0b1024] border border-slate-800/70 rounded-3xl shadow-2xl shadow-black/50 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -left-10 -top-24 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl" />
            <div className="absolute -right-10 top-10 h-48 w-48 rounded-full bg-sky-500/10 blur-3xl" />
          </div>

          <div className="relative flex flex-col h-full">
            <header className="p-6 pb-4 border-b border-white/5 bg-white/5 backdrop-blur-md">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-4 sm:gap-6">
                  <div
                    className={`w-16 sm:w-20 h-16 sm:h-20 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl font-extrabold shadow-lg ring-4 ring-white/10 ${
                      student.gender === 'female' ? 'bg-gradient-to-br from-rose-500 to-fuchsia-500' : 'bg-gradient-to-br from-blue-500 to-cyan-500'
                    } text-white`}
                  >
                    {student.studentNumber}
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs uppercase tracking-[0.2em]">โปรไฟล์นักเรียน</p>
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white leading-tight mt-1">
                      {student.firstName} {student.lastName}
                    </h2>
                    <div className="flex flex-wrap items-center gap-2 mt-3 text-xs sm:text-sm">
                      <span className="px-3 py-1 rounded-full bg-slate-900/70 border border-slate-700/60 text-slate-100">ชั้น ป.{gradeLabel}</span>
                      <span className="px-3 py-1 rounded-full bg-slate-900/70 border border-slate-700/60 text-slate-300">รหัส {student.studentId || '-'}</span>
                      <span className="px-3 py-1 rounded-full bg-slate-900/70 border border-slate-700/60 text-slate-300 capitalize">{student.gender}</span>
                      <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-200">อายุ {age.display}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 sm:gap-3 justify-end">
                  {openModal && (
                    <button
                      onClick={() => openModal('studentProgress', { student, grade })}
                      className="flex items-center gap-2 bg-sky-500/15 hover:bg-sky-500/25 text-sky-100 font-semibold py-2.5 px-4 rounded-xl transition-all border border-sky-500/30 hover:border-sky-500/50"
                    >
                      <Icon name="LineChart" size={18} />
                      ดูความคืบหน้า
                    </button>
                  )}
                  <button
                    onClick={() => setIsLoggerOpen(true)}
                    className="flex items-center gap-2 bg-amber-500/15 hover:bg-amber-500/25 text-amber-100 font-semibold py-2.5 px-4 rounded-xl transition-all border border-amber-500/30 hover:border-amber-500/50"
                  >
                    <Icon name="PlusCircle" size={18} />
                    บันทึกพฤติกรรม
                  </button>
                  <button
                    onClick={onClose}
                    className="w-11 h-11 rounded-full bg-slate-900/80 hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                    aria-label="ปิด"
                  >
                    <Icon name="X" size={22} />
                  </button>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'วันเกิด', value: student.birthDate ? new Date(student.birthDate).toLocaleDateString('th-TH', { dateStyle: 'medium' }) : '-' },
                  { label: 'อายุ', value: age.display },
                  { label: 'น้ำหนัก', value: healthData.weight ? `${healthData.weight} กก.` : '-' },
                  { label: 'ส่วนสูง', value: healthData.height ? `${healthData.height} ซม.` : '-' },
                ].map((item, idx) => (
                  <div key={idx} className="rounded-xl bg-slate-900/50 border border-slate-700/60 px-3 py-2.5">
                    <p className="text-[11px] uppercase tracking-wider text-slate-500">{item.label}</p>
                    <p className="text-white font-semibold mt-1 text-sm sm:text-base">{item.value}</p>
                  </div>
                ))}
              </div>
            </header>
            <div className="flex-1 overflow-y-auto p-6 pt-4 space-y-6 custom-scrollbar">
              <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-6">
                  <section className="bg-slate-900/60 rounded-2xl border border-slate-800/70 p-5 shadow-inner shadow-black/20">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">ข้อมูลส่วนตัว & สุขภาพ</p>
                        <h3 className="text-lg font-semibold text-white mt-1 flex items-center gap-2">
                          <Icon name="User" size={18} className="text-teal-300" />
                          โปรไฟล์นักเรียน
                        </h3>
                      </div>
                      {!isEditingHealth && (
                        <button
                          onClick={() => setIsEditingHealth(true)}
                          className="text-xs text-sky-300 hover:text-sky-200 flex items-center gap-1"
                        >
                          <Icon name="Pencil" size={12} /> แก้ไข
                        </button>
                      )}
                    </div>

                    <div className="mt-4 space-y-3 text-sm text-slate-200">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-xl bg-slate-800/60 border border-slate-700/60 p-3">
                          <p className="text-[11px] uppercase tracking-wide text-slate-500">วันเกิด</p>
                          <p className="font-semibold mt-1">
                            {student.birthDate ? new Date(student.birthDate).toLocaleDateString('th-TH', { dateStyle: 'long' }) : '-'}
                          </p>
                        </div>
                        <div className="rounded-xl bg-slate-800/60 border border-slate-700/60 p-3">
                          <p className="text-[11px] uppercase tracking-wide text-slate-500">รหัสนักเรียน</p>
                          <p className="font-semibold mt-1">{student.studentId || '-'}</p>
                        </div>
                      </div>

                      <div className="rounded-xl bg-slate-800/60 border border-slate-700/60 p-3">
                        <div className="grid grid-cols-2 gap-4 items-start">
                          <div>
                            <p className="text-[11px] uppercase tracking-wide text-slate-500">น้ำหนัก (กก.)</p>
                            {isEditingHealth ? (
                              <input
                                type="number"
                                value={healthData.weight}
                                onChange={(e) => setHealthData({ ...healthData, weight: e.target.value })}
                                className="mt-2 w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-white text-sm focus:border-teal-400 outline-none"
                              />
                            ) : (
                              <p className="text-2xl font-bold text-teal-300 mt-1">{healthData.weight || '-'}</p>
                            )}
                          </div>
                          <div>
                            <p className="text-[11px] uppercase tracking-wide text-slate-500">ส่วนสูง (ซม.)</p>
                            {isEditingHealth ? (
                              <input
                                type="number"
                                value={healthData.height}
                                onChange={(e) => setHealthData({ ...healthData, height: e.target.value })}
                                className="mt-2 w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-white text-sm focus:border-teal-400 outline-none"
                              />
                            ) : (
                              <p className="text-2xl font-bold text-teal-300 mt-1">{healthData.height || '-'}</p>
                            )}
                          </div>
                        </div>
                        {healthData.measuredAt && <p className="mt-2 text-[11px] text-slate-500">บันทึกเมื่อ {formatDate(healthData.measuredAt)}</p>}
                      </div>

                      {isEditingHealth && (
                        <div className="flex gap-2">
                          <button
                            onClick={handleSaveHealthData}
                            disabled={isSavingHealth}
                            className="flex-1 bg-teal-600 hover:bg-teal-500 text-white text-xs py-2 rounded-lg transition-colors disabled:opacity-60"
                          >
                            {isSavingHealth ? 'บันทึก...' : 'บันทึก'}
                          </button>
                          <button
                            onClick={() => setIsEditingHealth(false)}
                            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white text-xs py-2 rounded-lg transition-colors"
                          >
                            ยกเลิก
                          </button>
                        </div>
                      )}
                    </div>
                  </section>

                  <section className="bg-gradient-to-br from-indigo-900/50 via-slate-900/60 to-purple-900/50 rounded-2xl border border-indigo-500/20 p-5 shadow-inner shadow-black/30">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Icon name="Sparkles" size={18} className="text-purple-300" />
                        AI Coach
                      </h3>
                      <span className="text-[11px] text-slate-400">สรุปและส่งต่อผู้ปกครอง</span>
                    </div>

                    <button
                      onClick={handleGenerateSummary}
                      disabled={isGenerating}
                      className="w-full mt-4 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 px-4 rounded-xl transition-all shadow-lg shadow-indigo-900/50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isGenerating ? <Icon name="Loader2" className="animate-spin" size={18} /> : <Icon name="BrainCircuit" size={18} />}
                      {isGenerating ? 'กำลังวิเคราะห์...' : 'วิเคราะห์ผลการเรียน'}
                    </button>

                    <div className="mt-4 space-y-3">
                      {aiSummary ? (
                        <div className="bg-slate-950/40 border border-indigo-500/20 rounded-xl p-4 space-y-3">
                          <p className="text-slate-100 text-sm leading-relaxed whitespace-pre-line">{aiSummary}</p>
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={handleGenerateParentComment}
                              disabled={isGeneratingParentComment}
                              className="flex-1 min-w-[180px] py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm rounded-lg border border-slate-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                            >
                              {isGeneratingParentComment ? <Icon name="Loader2" className="animate-spin" size={14} /> : <Icon name="MessageSquare" size={14} />}
                              ข้อความถึงผู้ปกครอง
                            </button>
                            {parentComment && (
                              <button
                                onClick={() => handleCopy(parentComment)}
                                className="px-3 py-2 bg-emerald-500/15 border border-emerald-500/30 rounded-lg text-emerald-100 text-sm flex items-center gap-2 hover:bg-emerald-500/25"
                              >
                                {isCopied ? <Icon name="Check" size={14} /> : <Icon name="Copy" size={14} />}
                                คัดลอกคอมเมนต์
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="bg-slate-950/40 border border-dashed border-indigo-500/30 rounded-xl p-4 text-sm text-slate-400">
                          กดปุ่ม "วิเคราะห์ผลการเรียน" เพื่อให้ AI สรุปแนวโน้มการเรียนและข้อเสนอแนะสำหรับห้องเรียนนี้
                        </div>
                      )}

                      {parentComment && (
                        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
                          <p className="text-emerald-50 text-sm leading-relaxed whitespace-pre-line">"{parentComment}"</p>
                        </div>
                      )}
                    </div>
                  </section>
                </div>

                <div className="lg:col-span-2 space-y-6">
                  <section className="bg-slate-900/60 rounded-2xl border border-slate-800/70 p-5 shadow-inner shadow-black/20">
                    <button
                      type="button"
                      onClick={() => setIsSubjectsOpen((open) => !open)}
                      className="group w-full text-left"
                      aria-expanded={isSubjectsOpen}
                    >
                      <div className="relative overflow-hidden rounded-xl border border-slate-700/60 bg-gradient-to-r from-slate-900/80 via-sky-900/40 to-indigo-900/40 p-4 flex flex-col gap-4 shadow-lg shadow-black/20 hover:-translate-y-0.5 transition-transform">
                        <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-sky-500/20 blur-3xl" />
                        <div className="absolute right-4 bottom-3 h-16 w-16 rounded-2xl bg-gradient-to-br from-cyan-300/40 via-emerald-300/30 to-indigo-400/40 blur-xl" />
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div
                              data-testid="overview-hero-icon"
                              className="h-12 w-12 rounded-2xl bg-gradient-to-br from-sky-500 via-cyan-400 to-emerald-400 flex items-center justify-center text-white font-extrabold shadow-lg shadow-black/30 ring-4 ring-white/10"
                            >
                              <Icon name="Gauge" size={22} />
                            </div>
                            <div>
                              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">ภาพรวมการเรียน</p>
                              <h3 className="text-xl font-semibold text-white">อัตราการส่งงานล่าสุด</h3>
                              <p className="text-xs text-slate-400">คลิกการ์ดนี้เพื่อดูรายละเอียดแยกตามวิชา</p>
                            </div>
                          </div>
                          <div
                            data-testid="overview-hero-art"
                            className="relative h-16 w-24 overflow-hidden rounded-3xl border border-white/10 bg-slate-950/60 shadow-inner shadow-black/30"
                          >
                            <div className="absolute inset-0 bg-gradient-to-br from-sky-500/30 via-indigo-500/15 to-emerald-400/25 blur-[1px]" />
                            <div className="absolute left-2 top-2 h-4 w-12 rounded-full bg-white/20" />
                            <div className="absolute right-2 bottom-2 h-12 w-16 rounded-[18px] bg-gradient-to-br from-emerald-300/40 via-sky-300/30 to-indigo-400/40 shadow-lg shadow-emerald-500/20" />
                            <div className="absolute inset-1 rounded-2xl border border-white/20" />
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 text-xs">
                          <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-100">
                            ส่งแล้ว {assignmentStats.submitted}
                          </span>
                          <span className="px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-100">
                            ค้างส่ง {assignmentStats.missing}
                          </span>
                          <span className="px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-100">
                            ทั้งหมด {assignmentStats.totalAssignments}
                          </span>
                          <span className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-200">
                            วิชา {assignmentStats.subjectCount}
                          </span>
                        </div>

                        <div className="mt-1">
                          <div className="flex items-center justify-between text-sm text-slate-200 mb-2">
                            <span className="flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" /> อัตราการส่งงาน
                            </span>
                            <span className="font-bold text-white">{completionRate}%</span>
                          </div>
                          <div className="h-3 w-full rounded-full bg-slate-800 overflow-hidden border border-slate-700/70">
                            <div
                              className="h-full bg-gradient-to-r from-emerald-300 via-sky-400 to-indigo-400 rounded-full transition-all"
                              style={{ width: `${Math.min(completionRate, 100)}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-sm text-sky-200/90">
                          <span className="flex items-center gap-2">
                            <Icon name="Sparkles" size={14} /> คลิกเพื่อ{isSubjectsOpen ? 'ย่อรายละเอียด' : 'ดูรายละเอียดวิชา'}
                          </span>
                          <Icon name={isSubjectsOpen ? 'ChevronUp' : 'ChevronDown'} size={18} className="text-slate-100" />
                        </div>
                      </div>
                    </button>

                    {isSubjectsOpen &&
                      (groupedAssignments.length === 0 ? (
                        <div className="text-center py-10 text-slate-500 text-sm">ยังไม่มีข้อมูลงานในวิชานี้</div>
                      ) : (
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[520px] overflow-y-auto pr-1 custom-scrollbar">
                          {groupedAssignments.map(({ subjectName, submitted, missing }, idx) => {
                            const totalAssignments = submitted.length + missing.length;
                            const style = subjectCardStyles[idx % subjectCardStyles.length];
                            const cardId = `${subjectName}-${idx}`;
                            return (
                              <div
                                key={cardId}
                                className={`rounded-xl border ${style.border} bg-gradient-to-br ${style.bg} p-4 space-y-3 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/20`}
                              >
                                <button
                                  type="button"
                                  onClick={() => toggleSubject(cardId)}
                                  className="w-full text-left flex items-start justify-between gap-3"
                                  aria-expanded={expandedSubjectId === cardId}
                                >
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-white font-semibold text-lg">
                                      <Icon name="NotebookText" size={18} className="text-sky-200" />
                                      {subjectName}
                                    </div>
                                    <div className="flex items-center gap-2 text-[11px] flex-wrap">
                                      <span className="px-2 py-1 rounded-full bg-white/10 text-slate-100 border border-white/15">ทั้งหมด {totalAssignments}</span>
                                      <span className="px-2 py-1 rounded-full bg-rose-500/20 text-rose-50 border border-rose-500/30">ค้างส่ง {missing.length}</span>
                                      <span className="px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-50 border border-emerald-500/30">ส่งแล้ว {submitted.length}</span>
                                    </div>
                                  </div>
                                  <Icon name={expandedSubjectId === cardId ? 'ChevronUp' : 'ChevronDown'} size={18} className="text-slate-100" />
                                </button>

                                {expandedSubjectId === cardId && (
                                  <div className="space-y-3">
                                    {missing.length > 0 && (
                                      <div className="space-y-2">
                                        <p className="text-rose-50 text-sm flex items-center gap-1">
                                          <Icon name="AlertCircle" size={14} /> งานที่ค้างส่ง
                                        </p>
                                        {missing.map((assign, i) => (
                                          <div key={i} className="bg-rose-500/15 border border-rose-500/30 rounded-lg p-3 flex items-center justify-between text-sm text-rose-50">
                                            <div>
                                              <p className="font-semibold">{assign.name}</p>
                                              <p className="text-xs text-rose-100/80">-{assign.maxScore} คะแนน</p>
                                            </div>
                                            <span className="text-[11px] uppercase tracking-wide">ยังไม่ส่ง</span>
                                          </div>
                                        ))}
                                      </div>
                                    )}

                                    <div className="space-y-2">
                                      <p className="text-emerald-50 text-sm flex items-center gap-1">
                                        <Icon name="CheckCircle2" size={14} /> งานที่ส่งแล้ว
                                      </p>
                                      {submitted.length > 0 ? (
                                        submitted.map((assign, i) => (
                                          <div key={i} className="bg-slate-900/60 border border-slate-800 rounded-lg p-3 space-y-2">
                                            <div className="flex items-center justify-between text-sm text-slate-100">
                                              <p className="font-semibold">{assign.name}</p>
                                              <span className="font-bold text-emerald-300">
                                                {assign.score}/{assign.maxScore}
                                              </span>
                                            </div>
                                            <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                                              <div
                                                className="h-full bg-gradient-to-r from-teal-300 to-emerald-500 rounded-full"
                                                style={{ width: `${Math.min(100, (assign.score / assign.maxScore) * 100)}%` }}
                                              />
                                            </div>
                                          </div>
                                        ))
                                      ) : (
                                        <p className="text-xs text-slate-200/70 bg-slate-900/60 border border-slate-800 rounded-lg p-3">
                                          ยังไม่มีงานที่ส่งในวิชานี้
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ))}
                  </section>

                  <section className="bg-slate-900/60 rounded-2xl border border-slate-800/70 p-5 shadow-inner shadow-black/20">
                    <button
                      type="button"
                      onClick={() => setIsBehaviorOpen((open) => !open)}
                      className="group w-full text-left"
                      aria-expanded={isBehaviorOpen}
                    >
                      <div className="relative overflow-hidden rounded-xl border border-amber-500/25 bg-gradient-to-r from-slate-950/80 via-amber-900/20 to-rose-900/30 p-4 flex flex-col gap-4 shadow-lg shadow-black/20 hover:-translate-y-0.5 transition-transform">
                        <div className="absolute -right-8 -top-10 h-32 w-32 rounded-full bg-amber-500/20 blur-3xl" />
                        <div className="absolute left-4 bottom-4 h-16 w-16 rounded-full bg-rose-400/20 blur-2xl" />
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-amber-400 via-orange-400 to-rose-400 flex items-center justify-center text-slate-900 font-extrabold shadow-lg shadow-black/30">
                              <Icon name="Activity" size={22} />
                            </div>
                            <div>
                              <p className="text-[11px] uppercase tracking-[0.18em] text-amber-200/80">ภาพรวมพฤติกรรม</p>
                              <h3 className="text-xl font-semibold text-white">สถานะ: {behaviorStats.status}</h3>
                              <p className="text-xs text-slate-300">
                                {behaviorStats.total > 0
                                  ? `เชิงบวก ${behaviorStats.positives} | ควรปรับปรุง ${behaviorStats.negatives}`
                                  : 'ยังไม่มีบันทึกพฤติกรรม'}
                              </p>
                            </div>
                          </div>
                          <div className="relative h-16 w-24 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/60">
                            <div className="absolute inset-0 bg-gradient-to-br from-amber-400/25 via-rose-300/20 to-emerald-300/20" />
                            <div className="absolute inset-2 border border-white/15 rounded-xl" />
                            <div className="absolute top-2 left-2 h-8 w-8 rounded-xl bg-white/10" />
                            <div className="absolute bottom-2 right-2 h-6 w-10 rounded-xl bg-gradient-to-br from-emerald-300/30 via-sky-300/20 to-indigo-400/30" />
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-sm text-amber-100/90">
                          <span className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-amber-300 animate-pulse" /> คลิกเพื่อ{isBehaviorOpen ? 'ย่อบันทึก' : 'ดูบันทึกรายละเอียด'}
                          </span>
                          <Icon name={isBehaviorOpen ? 'ChevronUp' : 'ChevronDown'} size={18} className="text-slate-100" />
                        </div>
                      </div>
                    </button>

                    {isBehaviorOpen && (
                      <div className="mt-4 space-y-3">
                        <div className="flex flex-wrap gap-2">
                          <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                          />
                          {startDate && (
                            <button
                              onClick={() => setStartDate('')}
                              className="text-xs px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800"
                            >
                              ล้างตัวกรอง
                            </button>
                          )}
                          <button
                            onClick={() => setIsLoggerOpen(true)}
                            className="text-xs px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-100 hover:bg-amber-500/25"
                          >
                            + เพิ่มบันทึก
                          </button>
                        </div>

                        <div className="max-h-[320px] overflow-y-auto pr-1 custom-scrollbar space-y-3">
                          {filteredBehaviorLogs.length > 0 ? (
                            filteredBehaviorLogs.map((log) => (
                              <div
                                key={log.id}
                                className={`group p-3 rounded-xl border flex items-start gap-3 transition-all ${
                                  log.type === 'positive'
                                    ? 'bg-emerald-500/5 border-emerald-500/20 hover:bg-emerald-500/10'
                                    : 'bg-rose-500/5 border-rose-500/20 hover:bg-rose-500/10'
                                }`}
                              >
                                <div
                                  className={`mt-1 p-2 rounded-lg ${
                                    log.type === 'positive' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-200'
                                  }`}
                                >
                                  <Icon name={log.icon} size={16} />
                                </div>
                                <div className="flex-grow min-w-0">
                                  <div className="flex justify-between items-start gap-2">
                                    <p className={`font-semibold text-sm ${log.type === 'positive' ? 'text-emerald-100' : 'text-rose-100'}`}>
                                      {log.tag}
                                    </p>
                                    <span className="text-[10px] text-slate-400 whitespace-nowrap">{formatDate(log.timestamp)}</span>
                                  </div>
                                  {log.note && <p className="text-xs text-slate-300 mt-1">"{log.note}"</p>}
                                </div>
                                <button
                                  onClick={() => setConfirmModal({ isOpen: true, data: { id: log.id, name: log.tag } })}
                                  className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 transition-all p-1"
                                  aria-label="ลบบันทึก"
                                >
                                  <Icon name="Trash2" size={14} />
                                </button>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-8 border border-dashed border-slate-700 rounded-xl bg-slate-950/40">
                              <div className="bg-slate-900/60 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 border border-slate-800">
                                <Icon name="ClipboardList" size={28} className="text-slate-600" />
                              </div>
                              <p className="text-slate-400 text-sm">ไม่พบบันทึกพฤติกรรม</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </section>
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

