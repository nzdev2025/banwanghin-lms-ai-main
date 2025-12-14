import React from 'react';
import { collection, doc, onSnapshot, query, orderBy, deleteDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, appId } from '../../firebase/firebase';
import { callGeminiAPI } from '../../api/gemini';
import Icon from '../../icons/Icon';
import BehaviorLoggerModal from './BehaviorLoggerModal';
import ConfirmationModal from './ConfirmationModal';
import { useToast } from '../../context/ToastContext';

// Tabs
import OverviewTab from './StudentProfile/tabs/OverviewTab';
import SubjectsTab from './StudentProfile/tabs/SubjectsTab';
import BehaviorTab from './StudentProfile/tabs/BehaviorTab';

const DEFAULT_HEALTH_DATA = { weight: '', height: '' };

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
  const toast = useToast();
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
      toast.error('บันทึกข้อมูลสุขภาพไม่สำเร็จ');
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
      toast.error('เกิดข้อผิดพลาดในการลบ');
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
                    className={`w-16 sm:w-20 h-16 sm:h-20 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl font-extrabold shadow-lg ring-4 ring-white/10 ${student.gender === 'female' ? 'bg-gradient-to-br from-rose-500 to-fuchsia-500' : 'bg-gradient-to-br from-blue-500 to-cyan-500'}
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
                  <OverviewTab
                    student={student}
                    healthData={healthData}
                    age={age}
                    isEditingHealth={isEditingHealth}
                    setIsEditingHealth={setIsEditingHealth}
                    isSavingHealth={isSavingHealth}
                    handleSaveHealthData={handleSaveHealthData}
                    setHealthData={setHealthData}
                    aiSummary={aiSummary}
                    parentComment={parentComment}
                    isGenerating={isGenerating}
                    isGeneratingParentComment={isGeneratingParentComment}
                    handleGenerateSummary={handleGenerateSummary}
                    handleGenerateParentComment={handleGenerateParentComment}
                    isCopied={isCopied}
                    handleCopy={handleCopy}
                  />
                </div>

                <div className="lg:col-span-2 space-y-6">
                  <SubjectsTab
                    isSubjectsOpen={isSubjectsOpen}
                    setIsSubjectsOpen={setIsSubjectsOpen}
                    assignmentStats={assignmentStats}
                    completionRate={completionRate}
                    groupedAssignments={groupedAssignments}
                    expandedSubjectId={expandedSubjectId}
                    toggleSubject={toggleSubject}
                  />

                  <BehaviorTab
                    isBehaviorOpen={isBehaviorOpen}
                    setIsBehaviorOpen={setIsBehaviorOpen}
                    behaviorStats={behaviorStats}
                    startDate={startDate}
                    setStartDate={setStartDate}
                    setIsLoggerOpen={setIsLoggerOpen}
                    filteredBehaviorLogs={filteredBehaviorLogs}
                    formatDate={formatDate}
                    setConfirmModal={setConfirmModal}
                  />
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