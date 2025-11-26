import React, { useRef } from 'react';
import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { db, appId, logActivity } from '../../firebase/firebase';
import Icon from '../../icons/Icon';
import AIQuizSetGeneratorModal from './AIQuizSetGeneratorModal';
/* eslint-disable react-hooks/exhaustive-deps */

const quizSetsPath = `artifacts/${appId}/public/data/quiz_sets`;
const quizSessionsPath = `artifacts/${appId}/public/data/quiz_sessions`;

const defaultQuestionDraft = {
  text: '',
  optionA: '',
  optionB: '',
  optionC: '',
  optionD: '',
  answerIndex: '0',
  duration: 20,
};

const LightningQuizModal = ({ onClose }) => {
  const [quizSets, setQuizSets] = React.useState([]);
  const [isLoadingSets, setIsLoadingSets] = React.useState(true);
  const [creatingSet, setCreatingSet] = React.useState(false);
  const [isSavingSet, setIsSavingSet] = React.useState(false);
  const [setForm, setSetForm] = React.useState({
    title: '',
    topic: '',
    instructions: '',
    questions: [],
  });
  const [questionDraft, setQuestionDraft] = React.useState(defaultQuestionDraft);
  const [selectedSetId, setSelectedSetId] = React.useState(null);
  const [activeSession, setActiveSession] = React.useState(null);
  const [sessionDoc, setSessionDoc] = React.useState(null);
  const [answerCounts, setAnswerCounts] = React.useState([]);
  const [editingSetId, setEditingSetId] = React.useState(null);
  const [participantCount, setParticipantCount] = React.useState(0);
  const [scoreboard, setScoreboard] = React.useState([]);
  const [exporting, setExporting] = React.useState(false);
  const [isRevealing, setIsRevealing] = React.useState(false);
  const [timeLeft, setTimeLeft] = React.useState(null);
  const autoRevealKey = useRef(null);
  const POINTS_PER_CORRECT = 10;
  const [questionDuration, setQuestionDuration] = React.useState(20);
  const [questionStats, setQuestionStats] = React.useState([]);
  const [isAiModalOpen, setIsAiModalOpen] = React.useState(false);
  const [isStartingSession, setIsStartingSession] = React.useState(false);
  const [error, setError] = React.useState('');
  const [copySuccess, setCopySuccess] = React.useState(false);
  const [shareError, setShareError] = React.useState('');
  const [showQr, setShowQr] = React.useState(false);
  const [respondedCount, setRespondedCount] = React.useState(0);
  const [participants, setParticipants] = React.useState([]);
  const [advanceMode, setAdvanceMode] = React.useState('manual');
  const [autoAdvanceSeconds, setAutoAdvanceSeconds] = React.useState(20);
  const autoAdvanceRef = useRef(null);
  const isAutoAdvance = advanceMode === 'auto';
  const currentQuestionIndex = sessionDoc?.currentQuestionIndex;
  const currentQuestion =
    sessionDoc?.questions && currentQuestionIndex !== null && currentQuestionIndex !== undefined && currentQuestionIndex >= 0
      ? sessionDoc.questions[currentQuestionIndex]
      : null;

  React.useEffect(() => {
    if (!db) {
      setIsLoadingSets(false);
      return;
    }
    const setsQuery = query(collection(db, quizSetsPath), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(
      setsQuery,
      (snapshot) => {
        setQuizSets(snapshot.docs.map((docSnapshot) => ({ id: docSnapshot.id, ...docSnapshot.data() })));
        setIsLoadingSets(false);
      },
      () => setIsLoadingSets(false),
    );
    return () => unsub();
  }, []);

  const selectedSet = React.useMemo(() => quizSets.find((set) => set.id === selectedSetId), [quizSets, selectedSetId]);

  React.useEffect(() => {
    if (!selectedSet) return;
    const firstDuration = selectedSet.questions?.[0]?.duration || 20;
    setQuestionDuration(isAutoAdvance ? autoAdvanceSeconds : firstDuration);
  }, [selectedSet, isAutoAdvance, autoAdvanceSeconds]);

  // Subscribe session doc and answers of current question when hosting
  // Subscribe session & participants
  React.useEffect(() => {
    if (!db || !activeSession) {
      setSessionDoc(null);
      setAnswerCounts([]);
      setParticipantCount(0);
      setScoreboard([]);
      setTimeLeft(null);
      setQuestionStats([]);
      setParticipants([]);
      autoAdvanceRef.current = null;
      return undefined;
    }
    const sessionRef = doc(db, `${quizSessionsPath}/${activeSession.id}`);
    const unsubSession = onSnapshot(sessionRef, (snap) => {
      if (snap.exists()) {
        setSessionDoc({ id: snap.id, ...snap.data() });
      }
    });
    const participantsRef = collection(db, `${quizSessionsPath}/${activeSession.id}/participants`);
    const participantsQuery = query(participantsRef, orderBy('joinedAt', 'asc'));
    const unsubParticipants = onSnapshot(participantsQuery, (snap) => {
      setParticipantCount(snap.size);
      setParticipants(
        snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })),
      );
    });
    return () => {
      unsubSession();
     unsubParticipants();
      setAnswerCounts([]);
      setParticipantCount(0);
      setScoreboard([]);
      setTimeLeft(null);
      setQuestionStats([]);
    };
  }, [db, activeSession]);

  React.useEffect(() => {
    if (sessionDoc?.advanceMode === 'auto' || sessionDoc?.advanceMode === 'manual') {
      setAdvanceMode(sessionDoc.advanceMode);
    }
    if (sessionDoc?.autoAdvanceSeconds) {
      setAutoAdvanceSeconds(sessionDoc.autoAdvanceSeconds);
    }
  }, [sessionDoc?.advanceMode, sessionDoc?.autoAdvanceSeconds]);

  // Subscribe answers for scoring/statistics based on latest questions
  React.useEffect(() => {
    if (!db || !activeSession || !sessionDoc?.questions) return undefined;
    if (currentQuestionIndex === null || currentQuestionIndex === undefined) return undefined;
    const answersAllRef = collection(db, `${quizSessionsPath}/${activeSession.id}/answers`);
    const unsubAnswersAll = onSnapshot(answersAllRef, (snap) => {
      const scores = {};
      const stats = (sessionDoc.questions || []).map(() => ({}));
      const tokens = sessionDoc.questionTokens || [];
      snap.docs.forEach((docSnap) => {
        const data = docSnap.data();
        const qIndex = data.questionIndex;
        if (qIndex === null || qIndex === undefined) return;
        const tokenForQuestion = tokens[qIndex];
        if (tokenForQuestion && data.questionToken !== tokenForQuestion) return;
        const alias = data.alias || 'ไม่ระบุ';
        const optionIndex = data.optionIndex;
        const question = sessionDoc.questions?.[qIndex];
        const isCorrect = question && Number(optionIndex) === Number(question.answerIndex);
        if (stats[qIndex]) {
          stats[qIndex][optionIndex] = (stats[qIndex][optionIndex] || 0) + 1;
        }
        scores[alias] = {
          answered: (scores[alias]?.answered || 0) + 1,
          score: (scores[alias]?.score || 0) + (isCorrect ? POINTS_PER_CORRECT : 0),
        };
      });
      const ranking = Object.entries(scores)
        .map(([name, info]) => ({ alias: name, ...info }))
        .sort((a, b) => b.score - a.score || b.answered - a.answered);
      setScoreboard(ranking);
      setQuestionStats(stats);
    });
    return () => {
      unsubAnswersAll();
      setAnswerCounts([]);
      setScoreboard([]);
      setQuestionStats([]);
    };
  }, [db, activeSession, sessionDoc?.questions]);

  // Reset timers/counts whenเปลี่ยนคำถาม
  React.useEffect(() => {
    setTimeLeft(null);
    setAnswerCounts([]);
    setRespondedCount(0);
    setIsRevealing(false);
    autoRevealKey.current = null;
    autoAdvanceRef.current = null;
  }, [currentQuestionIndex]);

  // Countdown timer for current question (host side)
  React.useEffect(() => {
    if (currentQuestionIndex === null || currentQuestionIndex === undefined) {
      setTimeLeft(null);
      return undefined;
    }
    const interval = setInterval(() => {
      const start = sessionDoc?.questionStartedAt?.toDate
        ? sessionDoc.questionStartedAt.toDate()
        : sessionDoc?.questionStartedAt
          ? new Date(sessionDoc.questionStartedAt)
          : null;
      const duration =
        sessionDoc?.questionDuration ||
        currentQuestion?.duration ||
        (isAutoAdvance ? autoAdvanceSeconds : questionDuration) ||
        20;
      let endMs;
      if (start) {
        endMs = start.getTime() + duration * 1000;
      } else if (sessionDoc?.questionEndsAt) {
        const end = sessionDoc.questionEndsAt.toDate ? sessionDoc.questionEndsAt.toDate() : new Date(sessionDoc.questionEndsAt);
        endMs = end.getTime();
      }
      if (!endMs) {
        setTimeLeft(null);
        return;
      }
      const ms = endMs - Date.now();
      setTimeLeft(Math.max(0, Math.floor(ms / 1000)));
    }, 500);
    return () => clearInterval(interval);
  }, [
    sessionDoc?.questionStartedAt,
    sessionDoc?.questionEndsAt,
    currentQuestionIndex,
    sessionDoc?.questionDuration,
    questionDuration,
    currentQuestion?.duration,
    isAutoAdvance,
    autoAdvanceSeconds,
  ]);

  // Auto-reveal when time is up
  React.useEffect(() => {
    if (!db || !activeSession || !sessionDoc || sessionDoc.status !== 'running') return;
    if (timeLeft === null || timeLeft !== 0) return;
    if (sessionDoc.revealAnswer) return;
    if (!sessionDoc?.questionStartedAt) return;
    const key = `${activeSession.id}-${currentQuestionIndex ?? 'none'}-${sessionDoc?.questionTokens?.[currentQuestionIndex || 0] || 'notoken'}`;
    if (autoRevealKey.current === key) return;
    autoRevealKey.current = key;
    updateDoc(doc(db, quizSessionsPath, activeSession.id), { revealAnswer: true }).catch((err) =>
      console.error('auto reveal failed', err),
    );
  }, [db, activeSession, sessionDoc, timeLeft]);

  // Auto-advance to next question (optional)
  React.useEffect(() => {
    if (!isAutoAdvance || !db || !activeSession || !sessionDoc || sessionDoc.status !== 'running') return;
    if (timeLeft === null) return;
    const idx = currentQuestionIndex;
    if (idx === null || idx === undefined) return;
    if (!sessionDoc.revealAnswer || timeLeft !== 0) return;
    const token = sessionDoc?.questionTokens?.[idx] || 'notoken';
    const key = `${sessionDoc.id || activeSession.id}-${idx}-${token}`;
    if (autoAdvanceRef.current === key) return;
    autoAdvanceRef.current = key;
    const t = setTimeout(() => {
      handleNextQuestion();
    }, 800);
    return () => clearTimeout(t);
  }, [isAutoAdvance, db, activeSession, sessionDoc, currentQuestionIndex, timeLeft]);

  React.useEffect(() => {
    if (!db || !activeSession || currentQuestionIndex === null || currentQuestionIndex === undefined) {
      setAnswerCounts([]);
      setRespondedCount(0);
      return undefined;
    }
    const answersRef = collection(db, `${quizSessionsPath}/${activeSession.id}/answers`);
    const answersQuery = query(answersRef, where('questionIndex', '==', currentQuestionIndex));
    const tokenForQuestion = sessionDoc?.questionTokens?.[currentQuestionIndex] || null;
    const unsub = onSnapshot(answersQuery, (snapshot) => {
      const counts = {};
      const responders = new Set();
      snapshot.docs.forEach((docSnap) => {
        const optionIndex = docSnap.data().optionIndex;
        if (tokenForQuestion && docSnap.data().questionToken !== tokenForQuestion) return;
        counts[optionIndex] = (counts[optionIndex] || 0) + 1;
        const dev = docSnap.data().deviceId || `anon-${docSnap.id}`;
        responders.add(dev);
      });
      setAnswerCounts(
        Object.keys(counts)
          .sort((a, b) => Number(a) - Number(b))
          .map((key) => ({ optionIndex: Number(key), count: counts[key] })),
      );
      setRespondedCount(responders.size);
    });
    return () => unsub();
  }, [db, activeSession, sessionDoc?.currentQuestionIndex]);

  const handleChangeSetForm = (e) => {
    const { name, value } = e.target;
    setSetForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleChangeQuestionDuration = (val) => {
    const num = Number(val);
    if (Number.isNaN(num)) return;
    const clamped = Math.max(5, Math.min(180, num));
    setQuestionDuration(clamped);
  };

  const handleChangeAutoAdvanceSeconds = (val) => {
    const num = Number(val);
    if (Number.isNaN(num)) return;
    const clamped = Math.max(5, Math.min(180, num));
    setAutoAdvanceSeconds(clamped);
    setQuestionDuration(clamped);
  };

  const handleChangeDraft = (e) => {
    const { name, value } = e.target;
    if (name === 'duration') {
      const next = Math.max(10, Math.min(120, Number(value || 20)));
      setQuestionDraft((prev) => ({ ...prev, duration: next }));
      return;
    }
    setQuestionDraft((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddQuestion = () => {
    if (!questionDraft.text.trim()) return;
    const options = [questionDraft.optionA, questionDraft.optionB, questionDraft.optionC, questionDraft.optionD]
      .map((opt) => opt.trim())
      .filter(Boolean);
    if (options.length < 2) return;
    const duration = Math.max(10, Math.min(120, Number(questionDraft.duration || 20)));
    const newQuestion = {
      text: questionDraft.text.trim(),
      options,
      answerIndex: Math.min(Number(questionDraft.answerIndex || 0), options.length - 1),
      duration,
    };
    setSetForm((prev) => ({ ...prev, questions: [...prev.questions, newQuestion] }));
    setQuestionDraft(defaultQuestionDraft);
  };

  const handleRemoveQuestion = (index) => {
    setSetForm((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, idx) => idx !== index),
    }));
  };

  const handleSaveSet = async () => {
    if (!db || !setForm.title.trim() || setForm.questions.length === 0) return;
    setIsSavingSet(true);
    setError('');
    try {
      if (editingSetId) {
        const docRef = doc(db, quizSetsPath, editingSetId);
        await setDoc(
          docRef,
          {
            title: setForm.title.trim(),
            topic: setForm.topic.trim(),
            instructions: setForm.instructions.trim(),
            questions: setForm.questions,
            questionCount: setForm.questions.length,
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        );
        logActivity('QUIZ_SET_UPDATE', `อัปเดตชุดคำถาม <strong>${setForm.title}</strong>`);
        setSelectedSetId(editingSetId);
      } else {
        const docRef = await addDoc(collection(db, quizSetsPath), {
          title: setForm.title.trim(),
          topic: setForm.topic.trim(),
          instructions: setForm.instructions.trim(),
          questions: setForm.questions,
          questionCount: setForm.questions.length,
          createdAt: serverTimestamp(),
        });
        logActivity('QUIZ_SET_CREATE', `สร้างชุดคำถามใหม่ <strong>${setForm.title}</strong>`);
        setSelectedSetId(docRef.id);
      }
      setSetForm({
        title: '',
        topic: '',
        instructions: '',
        questions: [],
      });
      setQuestionDraft(defaultQuestionDraft);
      setCreatingSet(false);
      setEditingSetId(null);
    } catch (err) {
      console.error('Error saving quiz set', err);
      setError('บันทึกชุดคำถามไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setIsSavingSet(false);
    }
  };

  const generateSessionCode = () => Math.random().toString(10).slice(-6).padStart(6, '0');

  const handleStartSession = async () => {
    if (!db || !selectedSet) return;
    setIsStartingSession(true);
    setError('');
    const code = generateSessionCode();
    try {
      const baseDuration = isAutoAdvance ? autoAdvanceSeconds : questionDuration || 20;
      const normalizedQuestions = (selectedSet.questions || []).map((q) => ({
        ...q,
        duration: isAutoAdvance ? baseDuration : q.duration || baseDuration,
      }));
      const docRef = await addDoc(collection(db, quizSessionsPath), {
        quizSetId: selectedSet.id,
        quizTitle: selectedSet.title,
        questions: normalizedQuestions,
        sessionCode: code,
        questionCount: selectedSet.questions?.length || 0,
        status: 'waiting',
        currentQuestionIndex: null,
        questionTokens: new Array(normalizedQuestions.length).fill(null),
        startedAt: serverTimestamp(),
        advanceMode,
        autoAdvanceSeconds: baseDuration,
      });
      setQuestionDuration(baseDuration);
      setActiveSession({
        id: docRef.id,
        sessionCode: code,
        quizTitle: selectedSet.title,
      });
      logActivity('QUIZ_SESSION_START', `เริ่มเกม Lightning Quiz: <strong>${selectedSet.title}</strong> (PIN ${code})`);
    } catch (err) {
      console.error('Error starting quiz session', err);
      setError('ไม่สามารถเริ่มเกมได้ กรุณาลองใหม่');
    } finally {
      setIsStartingSession(false);
    }
  };

  const handleResetSession = () => {
    setActiveSession(null);
    setCopySuccess(false);
    autoAdvanceRef.current = null;
  };

  const joinBaseUrl = React.useMemo(() => {
    if (typeof window === 'undefined') return '/quiz';
    return `${window.location.origin}/quiz`;
  }, []);
  const joinLinkWithPin = React.useMemo(() => {
    if (!activeSession) return joinBaseUrl;
    return `${joinBaseUrl}?pin=${activeSession.sessionCode}`;
  }, [activeSession, joinBaseUrl]);
  const joinQrUrl = React.useMemo(() => {
    if (!activeSession) return null;
    return `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(joinLinkWithPin)}&margin=0`;
  }, [activeSession, joinLinkWithPin]);

  const handleNextQuestion = async () => {
    if (!db || !activeSession || !sessionDoc || !sessionDoc.questions) return;
    const nextIndex =
      sessionDoc.currentQuestionIndex === null || sessionDoc.currentQuestionIndex === undefined
        ? 0
        : sessionDoc.currentQuestionIndex + 1;
    if (nextIndex >= (sessionDoc.questions?.length || 0)) {
      await updateDoc(doc(db, quizSessionsPath, activeSession.id), { status: 'completed', currentQuestionIndex: null });
      logActivity('QUIZ_SESSION_END', `จบเกม PIN ${activeSession.sessionCode}`);
      return;
    }
    const durationForQuestion =
      (isAutoAdvance ? autoAdvanceSeconds : null) ||
      sessionDoc.questions?.[nextIndex]?.duration ||
      questionDuration ||
      20;
    const questionTokens = [...(sessionDoc.questionTokens || new Array(sessionDoc.questions.length).fill(null))];
    if (questionTokens.length < sessionDoc.questions.length) {
      questionTokens.length = sessionDoc.questions.length;
    }
    const token = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    questionTokens[nextIndex] = token;
    setQuestionDuration(durationForQuestion);

    await updateDoc(doc(db, quizSessionsPath, activeSession.id), {
      status: 'running',
      currentQuestionIndex: nextIndex,
      questionStartedAt: serverTimestamp(),
      revealAnswer: false,
      questionEndsAt: null, // ใช้เวลาเริ่มต้น + duration ในฝั่งนักเรียนเพื่อลดปัญหา clock เพี้ยน
      questionDuration: durationForQuestion,
      questionTokens,
      advanceMode,
      autoAdvanceSeconds: isAutoAdvance ? autoAdvanceSeconds : sessionDoc?.autoAdvanceSeconds || durationForQuestion,
    });
    logActivity('QUIZ_QUESTION_START', `เริ่มข้อที่ ${nextIndex + 1} ใน PIN ${activeSession.sessionCode}`);
  };

  const handleEndSession = async () => {
    if (!db || !activeSession) return;
    await updateDoc(doc(db, quizSessionsPath, activeSession.id), {
      status: 'completed',
      currentQuestionIndex: null,
      revealAnswer: false,
      questionEndsAt: null,
    });
    logActivity('QUIZ_SESSION_END', `จบเกม PIN ${activeSession.sessionCode}`);
  };

  const handleRevealAnswer = async () => {
    if (!db || !activeSession) return;
    setIsRevealing(true);
    try {
      await updateDoc(doc(db, quizSessionsPath, activeSession.id), { revealAnswer: true });
      logActivity('QUIZ_QUESTION_REVEAL', `เฉลยคำถามขณะ PIN ${activeSession.sessionCode}`);
    } catch (err) {
      console.error('reveal failed', err);
    } finally {
      setIsRevealing(false);
    }
  };

  const handleExportSummary = () => {
    if (!sessionDoc || scoreboard.length === 0) return;
    setExporting(true);
    try {
      const headers = ['alias', 'score', 'answered', 'sessionCode', 'quizTitle'];
      const rows = scoreboard.map((row) => [
        `"${row.alias.replace(/"/g, '""')}"`,
        row.score,
        row.answered,
        sessionDoc.sessionCode || '',
        `"${(sessionDoc.quizTitle || '').replace(/"/g, '""')}"`,
      ]);
      const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `quiz_summary_${sessionDoc.sessionCode || 'session'}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  const handleCopyJoinLink = () => {
    if (!activeSession) return;
    const link = joinLinkWithPin;
    if (!navigator?.clipboard) {
      setCopySuccess(false);
      return;
    }
    navigator.clipboard
      .writeText(link)
      .then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      })
      .catch(() => setCopySuccess(false));
  };

  const handleShareLink = async () => {
    if (!activeSession) return;
    setShareError('');
    const link = joinLinkWithPin;
    if (navigator?.share) {
      try {
        await navigator.share({
          title: `Lightning Quiz • PIN ${activeSession.sessionCode}`,
          text: 'กดลิงก์นี้แล้วใส่ PIN เพื่อเข้าห้องตอบคำถาม',
          url: link,
        });
      } catch (err) {
        if (err?.name !== 'AbortError') {
          setShareError('แชร์ไม่สำเร็จ ลองอีกครั้ง หรือคัดลอกลิงก์แทน');
        }
      }
      return;
    }
    handleCopyJoinLink();
  };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 backdrop-blur-lg" onClick={onClose}>
        <div
          className="flex h-[96vh] w-[98vw] max-w-[1500px] flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#0b1327]/95 text-white shadow-[0_25px_80px_-35px_rgba(0,0,0,0.85)]"
          onClick={(e) => e.stopPropagation()}
        >
        <header className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div className="flex items-center gap-3">
            <Icon name="Bolt" size={26} className="text-purple-300" />
            <div>
              <h2 className="text-2xl font-bold">Lightning Quiz (Beta)</h2>
              <p className="text-sm text-white/60">ตั้งโจทย์ ติดตามคะแนน และแชร์ PIN ให้นักเรียนตอบแบบเรียลไทม์</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/70 transition hover:text-white">
            <Icon name="X" size={28} />
          </button>
        </header>

        <div className="grid flex-1 min-h-0 grid-cols-1 gap-6 overflow-hidden p-6 xl:grid-cols-[1.05fr_1.35fr]">
          <section className="flex min-h-0 flex-col gap-4 overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 shadow-inner shadow-black/30">
                  <div className="flex items-center justify-between">
                    <h3 className="flex items-center gap-2 text-lg font-semibold">
                      <Icon name="ArchiveRestore" size={18} className="text-purple-200" />
                      คลังชุดคำถาม
                    </h3>
                    <button
                      type="button"
                      onClick={() => setCreatingSet((prev) => !prev)}
                      className="flex items-center gap-2 rounded-xl border border-white/15 px-3 py-1.5 text-xs font-semibold text-white/90 transition hover:bg-white/10"
                    >
                      <Icon name={creatingSet ? 'ChevronUp' : 'Plus'} size={16} />
                      {creatingSet ? 'ซ่อนแบบฟอร์ม' : 'สร้างชุดใหม่'}
                    </button>
                  </div>

            {creatingSet && (
              <div className="rounded-2xl border border-white/10 bg-black/40 p-4 text-sm">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setIsAiModalOpen(true)}
                    className="flex items-center gap-2 rounded-xl border border-amber-300/50 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-200 transition hover:bg-amber-500/20"
                  >
                    <Icon name="Sparkles" size={14} />
                    ให้ AI สร้างชุดคำถาม
                  </button>
                  {selectedSet && (
                    <span className="text-[11px] text-white/60">หรือกรอกเองด้านล่าง</span>
                  )}
                </div>
                <div className="grid gap-3">
                  <div>
                    <label className="text-white/70">ชื่อชุด</label>
                    <input
                      type="text"
                      name="title"
                      value={setForm.title}
                      onChange={handleChangeSetForm}
                      className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 p-2 text-white focus:border-purple-300 focus:outline-none"
                      placeholder="เช่น วิทย์ ป.5 - ระบบนิเวศ"
                    />
                  </div>
                  <div>
                    <label className="text-white/70">หัวข้อ/คำอธิบาย</label>
                    <input
                      type="text"
                      name="topic"
                      value={setForm.topic}
                      onChange={handleChangeSetForm}
                      className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 p-2 text-white focus:border-purple-300 focus:outline-none"
                      placeholder="สั้นๆ ว่าชุดนี้เกี่ยวกับอะไร"
                    />
                  </div>
                  <div>
                    <label className="text-white/70">คำแนะนำ</label>
                    <textarea
                      name="instructions"
                      value={setForm.instructions}
                      onChange={handleChangeSetForm}
                      rows={2}
                      className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 p-2 text-white focus:border-purple-300 focus:outline-none"
                      placeholder="แจ้งนักเรียนควรรู้อะไรเป็นพิเศษ"
                    />
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3">
                  <p className="text-xs uppercase tracking-[0.3em] text-white/60">เพิ่มคำถาม</p>
                  <div className="mt-3 space-y-2 text-sm">
                    <input
                      type="text"
                      name="text"
                      value={questionDraft.text}
                      onChange={handleChangeDraft}
                      placeholder="คำถาม"
                      className="w-full rounded-lg border border-white/10 bg-black/30 p-2 text-white focus:border-purple-300 focus:outline-none"
                    />
                    {['optionA', 'optionB', 'optionC', 'optionD'].map((key, idx) => (
                      <input
                        key={key}
                        type="text"
                        name={key}
                        value={questionDraft[key]}
                        onChange={handleChangeDraft}
                        placeholder={`ตัวเลือกที่ ${idx + 1}`}
                        className="w-full rounded-lg border border-white/10 bg-black/30 p-2 text-white focus:border-purple-300 focus:outline-none"
                      />
                    ))}
                    <label className="flex items-center gap-2 text-white/70">
                      เฉลย (0-3)
                      <input
                        type="number"
                        min="0"
                        max="3"
                        name="answerIndex"
                        value={questionDraft.answerIndex}
                        onChange={handleChangeDraft}
                        className="w-20 rounded-lg border border-white/10 bg-black/30 p-1 text-center text-white focus:border-purple-300 focus:outline-none"
                      />
                    </label>
                    <label className="flex items-center gap-2 text-white/70">
                      เวลา/ข้อ (วินาที)
                      <input
                        type="number"
                        min="10"
                        max="120"
                        name="duration"
                        value={questionDraft.duration}
                        onChange={handleChangeDraft}
                        className="w-24 rounded-lg border border-white/10 bg-black/30 p-1 text-center text-white focus:border-purple-300 focus:outline-none"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={handleAddQuestion}
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 py-2 text-sm font-semibold transition hover:opacity-90"
                    >
                      <Icon name="PlusCircle" size={16} />
                      เพิ่มไปยังชุด
                    </button>
                  </div>
                  {setForm.questions.length > 0 && (
                    <ul className="mt-3 max-h-32 overflow-auto text-white/80">
                      {setForm.questions.map((question, index) => (
                        <li key={index} className="flex items-center justify-between rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs">
                          <span className="line-clamp-1">
                            {index + 1}. {question.text}
                          </span>
                          <button onClick={() => handleRemoveQuestion(index)} className="text-rose-300 transition hover:text-rose-200">
                            <Icon name="Trash2" size={14} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="mt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={handleSaveSet}
                    disabled={isSavingSet || !setForm.title.trim() || setForm.questions.length === 0}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500/90 py-2.5 text-sm font-semibold text-black transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-white/30"
                  >
                    {isSavingSet ? <Icon name="Loader2" className="animate-spin" size={16} /> : <Icon name="Save" size={16} />}
                    {editingSetId ? 'อัปเดตชุดคำถาม' : 'บันทึกชุดคำถาม'}
                  </button>
                  {editingSetId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingSetId(null);
                        setSetForm({ title: '', topic: '', instructions: '', questions: [] });
                        setQuestionDraft(defaultQuestionDraft);
                      }}
                      className="rounded-xl border border-white/20 px-4 py-2 text-sm text-white/80 transition hover:bg-white/10"
                    >
                      ยกเลิกแก้ไข
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto rounded-2xl border border-white/10 bg-black/30">
              {isLoadingSets ? (
                <div className="flex h-48 items-center justify-center">
                  <Icon name="Loader2" className="animate-spin text-purple-300" size={32} />
                </div>
              ) : quizSets.length === 0 ? (
                <div className="flex h-48 flex-col items-center justify-center gap-2 text-sm text-white/60">
                  <Icon name="Inbox" size={28} />
                  ยังไม่มีชุดคำถาม
                </div>
              ) : (
                <ul className="divide-y divide-white/5 text-sm">
                  {quizSets.map((set) => {
                    const isActive = selectedSetId === set.id;
                    return (
                      <li
                        key={set.id}
                        className={`px-4 py-3 transition hover:bg-white/10 ${isActive ? 'bg-white/10' : 'cursor-pointer'}`}
                        onClick={() => setSelectedSetId(set.id)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold text-white">{set.title}</p>
                            <p className="text-xs text-white/70">{set.topic || 'ไม่มีคำอธิบาย'} · {set.questionCount || set.questions?.length || 0} ข้อ</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setCreatingSet(true);
                                setEditingSetId(set.id);
                                setSetForm({
                                  title: set.title || '',
                                  topic: set.topic || '',
                                  instructions: set.instructions || '',
                                  questions: (set.questions || []).map((q) => ({ ...q, duration: q.duration || 20 })),
                                });
                                setQuestionDraft(defaultQuestionDraft);
                              }}
                              className="rounded-lg border border-white/15 px-2 py-1 text-[11px] text-white/80 transition hover:bg-white/10"
                            >
                              แก้ไข
                            </button>
                            <button
                              type="button"
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (!window.confirm('ยืนยันลบชุดคำถามนี้?')) return;
                                try {
                                  await deleteDoc(doc(db, quizSetsPath, set.id));
                                  if (selectedSetId === set.id) setSelectedSetId(null);
                                  if (editingSetId === set.id) setEditingSetId(null);
                                } catch (err) {
                                  console.error('delete set failed', err);
                                  alert('ลบไม่สำเร็จ');
                                }
                              }}
                              className="rounded-lg border border-rose-400/40 bg-rose-500/10 px-2 py-1 text-[11px] text-rose-200 transition hover:bg-rose-500/20"
                            >
                              ลบ
                            </button>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </section>

          <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-black/40 shadow-inner shadow-black/30">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/70">Host Console</p>
              {selectedSet && <span className="text-xs text-white/60">{selectedSet.title}</span>}
            </div>
            <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-5">
              {!selectedSet ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-3 text-white/60">
                  <Icon name="MousePointerSquare" size={40} className="text-white/30" />
                  <p>เลือกชุดคำถามจากด้านซ้ายก่อน</p>
                </div>
              ) : (
                <>
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-white">รายละเอียดชุด</p>
                          <span className="text-[11px] uppercase tracking-[0.25em] text-white/60">{sessionDoc?.status || 'waiting'}</span>
                        </div>
                        <p className="text-xs text-white/60">{selectedSet.instructions || '—'}</p>
                        <ul className="mt-3 max-h-28 space-y-1 overflow-y-auto text-xs text-white/70">
                          {selectedSet.questions?.map((question, index) => (
                            <li key={index}>
                              {index + 1}. {question.text}
                            </li>
                          ))}
                        </ul>
                        {sessionDoc?.status === 'running' && timeLeft !== null && (
                          <p className="mt-2 text-xs text-amber-200">เวลาที่เหลือ: {timeLeft}s</p>
                        )}
                        {sessionDoc?.status === 'completed' && (
                          <div className="mt-3 rounded-xl border border-white/10 bg-black/30 p-3 text-xs text-white/70">
                            <p className="font-semibold text-white">สรุปผล</p>
                            <p>ผู้เข้าร่วม: {participantCount} คน</p>
                            <p>ตอบรวม: {scoreboard.reduce((sum, s) => sum + (s.answered || 0), 0)} ครั้ง</p>
                        <button
                          type="button"
                          onClick={handleExportSummary}
                          disabled={scoreboard.length === 0 || exporting}
                          className="mt-2 flex items-center justify-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-white/80 transition hover:bg-white/10 disabled:opacity-60"
                        >
                          {exporting ? <Icon name="Loader2" className="animate-spin" size={14} /> : <Icon name="Download" size={14} />}
                          ส่งออก CSV
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-sm font-semibold text-white">ควบคุมการเล่น</p>
                    {activeSession ? (
                      <div className="mt-3 space-y-4 text-white">
                        <div className="grid gap-3 lg:grid-cols-[1.15fr_1fr]">
                          <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div>
                                <p className="text-[11px] uppercase tracking-[0.3em] text-white/60">Session PIN</p>
                                <p className="text-4xl font-bold tracking-[0.3em] text-purple-200">{activeSession.sessionCode}</p>
                                <p className="text-sm text-white/70">
                                  ให้เด็กเข้า <span className="font-semibold text-white">quiz.krukit</span> แล้วใส่ PIN ข้างต้น
                                </p>
                              </div>
                              <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-right text-[11px] text-white/70">
                                <p className="text-white">
                                  สถานะ: <span className="font-semibold">{sessionDoc?.status || 'waiting'}</span>
                                </p>
                                <p>
                                  เข้าร่วมแล้ว: <span className="font-semibold text-white">{participantCount}</span> คน
                                </p>
                                {sessionDoc?.status === 'running' && (
                                  <p>ตอบแล้ว {respondedCount}/{participantCount} คน</p>
                                )}
                              </div>
                            </div>
                            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                              <button
                                type="button"
                                onClick={handleNextQuestion}
                                className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 px-3 py-2 text-sm font-semibold transition hover:opacity-90"
                              >
                                <Icon name={sessionDoc?.currentQuestionIndex === null ? 'PlayCircle' : 'StepForward'} size={18} />
                                {sessionDoc?.currentQuestionIndex === null ? 'เริ่มถามคำถาม' : 'คำถามถัดไป'}
                              </button>
                              <button
                                type="button"
                                onClick={handleRevealAnswer}
                                disabled={sessionDoc?.revealAnswer || sessionDoc?.currentQuestionIndex === null}
                                className="flex items-center justify-center gap-2 rounded-xl border border-amber-300/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-200 transition hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {isRevealing ? <Icon name="Loader2" className="animate-spin" size={16} /> : <Icon name="Lightbulb" size={16} />}
                                เฉลยคำตอบ
                              </button>
                              <button
                                type="button"
                                onClick={handleEndSession}
                                className="flex items-center justify-center gap-2 rounded-xl border border-white/15 px-3 py-2 text-sm text-white/80 transition hover:bg-white/10"
                              >
                                <Icon name="StopCircle" size={16} />
                                จบเกม
                              </button>
                              <button
                                type="button"
                                onClick={handleResetSession}
                                className="flex items-center justify-center gap-2 rounded-xl border border-white/15 px-3 py-2 text-sm text-white/80 transition hover:bg-white/10"
                              >
                                <Icon name="RotateCw" size={16} />
                                รีเซ็ต
                              </button>
                            </div>
                          </div>
                          <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
                            <div className="flex items-center justify-between text-xs text-white/70">
                              <span className="uppercase tracking-[0.25em]">ผู้เล่นในห้อง</span>
                              <span>{participants.length} คน</span>
                            </div>
                            {participants.length === 0 ? (
                              <p className="mt-2 text-[11px] text-white/60">รอผู้เล่นเข้าร่วม...</p>
                            ) : (
                              <div className="mt-2 max-h-44 space-y-1 overflow-auto pr-1">
                                {participants.slice(0, 12).map((p) => (
                                  <div
                                    key={p.id}
                                    className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80"
                                  >
                                    <span className="truncate font-semibold">{p.alias || 'ไม่ระบุชื่อ'}</span>
                                    <span className="text-white/50">{p.lastAnswerAt ? 'ตอบแล้ว' : 'ยังไม่ตอบ'}</span>
                                  </div>
                                ))}
                                {participants.length > 12 && (
                                  <p className="pt-1 text-[11px] text-white/60">+ {participants.length - 12} คน</p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="rounded-xl border border-dashed border-white/15 bg-black/40 px-3 py-2 text-xs text-white/70">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="flex-1 break-all">
                              ลิงก์เข้าร่วม: <span className="font-semibold text-white">{joinLinkWithPin}</span>
                            </p>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={handleCopyJoinLink}
                                className="rounded-lg border border-white/20 px-3 py-1 text-white/80 transition hover:bg-white/10"
                              >
                                คัดลอก
                              </button>
                              <button
                                type="button"
                                onClick={handleShareLink}
                                className="flex items-center gap-1 rounded-lg border border-blue-300/40 bg-blue-500/10 px-3 py-1 text-white/90 transition hover:bg-blue-500/20"
                              >
                                <Icon name="Send" size={14} />
                                แชร์
                              </button>
                              <button
                                type="button"
                                onClick={() => setShowQr((prev) => !prev)}
                                className="flex items-center gap-1 rounded-lg border border-white/20 px-3 py-1 text-white/80 transition hover:bg-white/10"
                              >
                                <Icon name="QrCode" size={14} />
                                QR
                              </button>
                            </div>
                          </div>
                          {copySuccess && <p className="text-emerald-300">คัดลอกแล้ว!</p>}
                          {shareError && <p className="text-amber-300">{shareError}</p>}
                          {showQr && joinQrUrl && (
                            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
                              <img
                                src={joinQrUrl}
                                alt="QR สำหรับเข้าร่วม Lightning Quiz"
                                className="h-28 w-28 rounded-lg border border-white/10 bg-white/70 p-1"
                              />
                              <div className="text-xs text-white/70">
                                <p className="font-semibold text-white">สแกน QR เพื่อเข้าห้องทันที</p>
                                <p>แชร์ให้นักเรียนเปิดกล้อง/แอปสแกนแล้วจะนำไปหน้ากรอก PIN อัตโนมัติ</p>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-xs text-white/80">
                          <p className="text-[11px] uppercase tracking-[0.25em] text-white/60">โหมดเดินเกม</p>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setAdvanceMode('manual')}
                              className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                                !isAutoAdvance ? 'bg-white/20 text-white' : 'border border-white/20 text-white/80 hover:bg-white/10'
                              }`}
                            >
                              กดเองทีละข้อ
                            </button>
                            <button
                              type="button"
                              onClick={() => setAdvanceMode('auto')}
                              className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                                isAutoAdvance ? 'bg-gradient-to-r from-amber-400 to-pink-500 text-black' : 'border border-white/20 text-white/80 hover:bg-white/10'
                              }`}
                            >
                              อัตโนมัติ
                            </button>
                            <div
                              className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${
                                isAutoAdvance ? 'border-amber-300/60 bg-amber-500/10' : 'border-white/10 bg-black/30'
                              }`}
                            >
                              <span>เวลาต่อข้อ</span>
                              <input
                                type="number"
                                min="5"
                                max="180"
                                value={autoAdvanceSeconds}
                                onChange={(e) => handleChangeAutoAdvanceSeconds(e.target.value)}
                                disabled={!isAutoAdvance}
                                className="w-16 rounded-md border border-white/15 bg-black/40 px-2 py-1 text-center text-white focus:border-amber-300 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                              />
                              <span className="text-white/60">วินาที</span>
                            </div>
                          </div>
                          <p className="mt-2 text-[11px] text-white/60">
                            เลือกว่าจะกดเองทีละข้อ หรือให้ระบบเดินคำถาม-เฉลยอัตโนมัติจนจบชุด (อัตโนมัติจะเดินต่อเองหลังครูกดเริ่ม)
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-xs text-white/80">
                          <p className="text-[11px] uppercase tracking-[0.25em] text-white/60">โหมดเดินเกม</p>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setAdvanceMode('manual')}
                              className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                                !isAutoAdvance ? 'bg-white/20 text-white' : 'border border-white/20 text-white/80 hover:bg-white/10'
                              }`}
                            >
                              กดเองทีละข้อ
                            </button>
                            <button
                              type="button"
                              onClick={() => setAdvanceMode('auto')}
                              className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                                isAutoAdvance ? 'bg-gradient-to-r from-amber-400 to-pink-500 text-black' : 'border border-white/20 text-white/80 hover:bg-white/10'
                              }`}
                            >
                              อัตโนมัติ
                            </button>
                            <div
                              className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${
                                isAutoAdvance ? 'border-amber-300/60 bg-amber-500/10' : 'border-white/10 bg-black/30'
                              }`}
                            >
                              <span>เวลาต่อข้อ</span>
                              <input
                                type="number"
                                min="5"
                                max="180"
                                value={autoAdvanceSeconds}
                                onChange={(e) => handleChangeAutoAdvanceSeconds(e.target.value)}
                                disabled={!isAutoAdvance}
                                className="w-16 rounded-md border border-white/15 bg-black/40 px-2 py-1 text-center text-white focus:border-amber-300 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                              />
                              <span className="text-white/60">วินาที</span>
                            </div>
                          </div>
                          <p className="mt-2 text-[11px] text-white/60">
                            ค่าเริ่มต้นจะนำไปกำหนดเวลาของทุกข้อเมื่อเริ่มเกม (อัตโนมัติจะเดินต่อเองหลังครูกดเริ่ม)
                          </p>
                        </div>
                        <label className="text-xs text-white/70 flex items-center gap-2">
                          เวลา/คำถาม (วินาที)
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleChangeQuestionDuration(questionDuration - 5)}
                              disabled={isAutoAdvance}
                              className="h-8 w-8 rounded-lg border border-white/15 bg-white/5 text-white/80 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              -
                            </button>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={questionDuration}
                              onChange={(e) => handleChangeQuestionDuration(e.target.value)}
                              disabled={isAutoAdvance}
                              className="w-20 rounded-lg border border-white/15 bg-white/5 px-2 py-1 text-center text-white text-sm focus:border-purple-300 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                            />
                            <button
                              type="button"
                              onClick={() => handleChangeQuestionDuration(questionDuration + 5)}
                              disabled={isAutoAdvance}
                              className="h-8 w-8 rounded-lg border border-white/15 bg-white/5 text-white/80 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              +
                            </button>
                          </div>
                        </label>
                        <button
                          type="button"
                          onClick={handleStartSession}
                          disabled={isStartingSession}
                          className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 py-3 text-sm font-semibold uppercase tracking-[0.3em] transition hover:opacity-90 disabled:opacity-60"
                        >
                          {isStartingSession ? <Icon name="Loader2" className="animate-spin" size={18} /> : <Icon name="Bolt" size={18} />}
                          {isStartingSession ? 'กำลังเปิด' : 'สร้าง PIN & เริ่ม'}
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-white">
                        {sessionDoc?.status === 'completed' ? 'สรุปผลหลังเกม' : 'Live Scoreboard'}
                      </p>
                      {sessionDoc?.status === 'running' && timeLeft !== null && (
                        <span className="text-[11px] text-amber-200">เหลือเวลา {timeLeft}s</span>
                      )}
                    </div>
                    <div className="grid gap-4 lg:grid-cols-2">
                      <div className="rounded-xl border border-white/10 bg-black/25 p-3">
                        <p className="mb-2 text-xs uppercase tracking-[0.3em] text-white/60">
                          {sessionDoc?.status === 'completed' ? 'สรุปคำตอบแต่ละข้อ' : 'คำตอบปัจจุบัน'}
                        </p>
                        {sessionDoc?.status === 'completed' ? (
                          <div className="space-y-3 max-h-64 overflow-auto pr-1">
                            {sessionDoc?.questions?.map((q, idx) => {
                              const counts = questionStats?.[idx] || {};
                              const total = Object.values(counts).reduce((sum, v) => sum + v, 0);
                              return (
                                <div key={idx} className="rounded-xl border border-white/10 bg-black/20 p-3">
                                  <p className="text-xs text-white/70">ข้อ {idx + 1}: {q.text}</p>
                                  <div className="mt-2 space-y-1">
                                    {(q.options || []).map((opt, optIdx) => {
                                      const count = counts[optIdx] || 0;
                                      const percent = total ? Math.round((count / total) * 100) : 0;
                                      const isCorrect = Number(q.answerIndex) === optIdx;
                                      return (
                                        <div key={optIdx} className="text-[11px] text-white/75">
                                          <div className="flex items-center justify-between">
                                            <span className="flex items-center gap-2">
                                              {isCorrect && <Icon name="Crown" size={12} className="text-amber-300" />}
                                              {opt}
                                            </span>
                                            <span className="text-white/60">{count} ({percent}%)</span>
                                          </div>
                                          <div className="mt-1 h-1.5 rounded-full bg-white/10">
                                            <div
                                              className={`h-1.5 rounded-full ${isCorrect ? 'bg-emerald-400' : 'bg-white/30'}`}
                                              style={{ width: `${percent}%` }}
                                            />
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : sessionDoc?.currentQuestionIndex !== null && sessionDoc?.currentQuestionIndex !== undefined && sessionDoc?.questions?.length ? (
                          <div className="space-y-3">
                            {(sessionDoc.questions?.[sessionDoc.currentQuestionIndex]?.options || []).map((opt, idx) => {
                              const count = answerCounts.find((c) => c.optionIndex === idx)?.count || 0;
                              return (
                                <div key={idx} className="rounded-xl border border-white/10 bg-black/20 p-3">
                                  <div className="flex items-center justify-between text-sm text-white/85">
                                    <span className="flex items-center gap-2">
                                      <Icon name="CheckCircle" size={14} className="text-emerald-300" />
                                      {opt}
                                    </span>
                                    <span className="text-xs text-white/70">{count} ตอบ</span>
                                  </div>
                                  <div className="mt-2 h-2 rounded-full bg-white/10">
                                    <div
                                      className="h-2 rounded-full bg-gradient-to-r from-purple-400 to-blue-400"
                                      style={{
                                        width: `${Math.min(100, count * 20)}%`,
                                      }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                            {answerCounts.length === 0 && (
                              <p className="text-xs text-white/60">ยังไม่มีคำตอบเข้ามา</p>
                            )}
                          </div>
                        ) : (
                          <div className="flex flex-1 items-center justify-center text-xs text-white/70">
                            <div className="text-center">
                              <Icon name="Users" size={24} className="mx-auto text-white/40" />
                              <p>จะแสดงผลเมื่อเริ่มคำถาม</p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="rounded-xl border border-white/10 bg-black/25 p-3">
                        <div className="flex items-center justify-between">
                          <p className="text-xs uppercase tracking-[0.3em] text-white/60">Scoreboard</p>
                          <p className="text-[11px] text-white/60">Top 5</p>
                        </div>
                        {sessionDoc?.status === 'running' && (
                          <p className="text-[11px] text-amber-200 mt-1">
                            ตอบแล้ว {respondedCount}/{participantCount} คน
                          </p>
                        )}
                        {scoreboard.length === 0 ? (
                          <p className="text-xs text-white/60">ยังไม่มีคะแนน</p>
                        ) : (
                          <div className="space-y-3">
                            <ul className="space-y-2">
                              {scoreboard.slice(0, 5).map((item, idx) => (
                                <li
                                  key={item.alias + idx}
                                  className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80"
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/15 text-[11px] font-bold text-white">
                                      #{idx + 1}
                                    </span>
                                    <span className="font-semibold text-white">{item.alias}</span>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-sm font-bold text-amber-200">{item.score} pts</p>
                                    <p className="text-[11px] text-white/60">{item.answered} ข้อ</p>
                                  </div>
                                </li>
                              ))}
                            </ul>

                            <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                              <p className="mb-2 text-[11px] uppercase tracking-[0.3em] text-white/60">ภาพรวมคะแนน (Top 5)</p>
                              <div className="h-56">
                                <ResponsiveContainer width="100%" height="100%">
                                  <BarChart data={scoreboard.slice(0, 5)} margin={{ top: 5, right: 10, left: -15, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                    <XAxis
                                      dataKey="alias"
                                      tick={{ fill: '#cbd5e1', fontSize: 11 }}
                                      angle={-20}
                                      textAnchor="end"
                                      height={40}
                                    />
                                    <YAxis tick={{ fill: '#cbd5e1', fontSize: 11 }} />
                                    <Tooltip
                                      contentStyle={{ backgroundColor: 'rgba(9,12,24,0.9)', border: '1px solid rgba(255,255,255,0.1)' }}
                                      labelStyle={{ color: '#fff' }}
                                    />
                                    <Bar dataKey="score" fill="#fbbf24" radius={[6, 6, 0, 0]} />
                                  </BarChart>
                                </ResponsiveContainer>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="rounded-lg border border-white/10 bg-white/5 p-3 mt-3">
                          <div className="flex items-center justify-between text-xs text-white/70">
                            <span className="uppercase tracking-[0.25em]">ผู้เล่นในห้อง</span>
                            <span>{participants.length} คน</span>
                          </div>
                          {participants.length === 0 ? (
                            <p className="mt-2 text-[11px] text-white/60">รอผู้เล่นเข้าร่วม...</p>
                          ) : (
                            <div className="mt-2 max-h-40 overflow-auto space-y-1">
                              {participants.map((p) => (
                                <div
                                  key={p.id}
                                  className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 px-3 py-1.5 text-xs text-white/75"
                                >
                                  <span className="truncate font-semibold">{p.alias || 'ไม่ระบุชื่อ'}</span>
                                  <span className="text-white/50">
                                    {p.lastAnswerAt ? 'ตอบแล้ว' : 'ยังไม่ตอบ'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {error && <p className="text-sm text-rose-300">{error}</p>}
            </div>
          </section>
        </div>
        </div>

        {isAiModalOpen && (
          <AIQuizSetGeneratorModal
            onClose={() => setIsAiModalOpen(false)}
            onApply={(aiSet) => {
              setSetForm({
                title: aiSet.title,
                topic: aiSet.topic,
                instructions: aiSet.instructions,
                questions: aiSet.questions,
              });
              setQuestionDraft(defaultQuestionDraft);
              setCreatingSet(true);
              setEditingSetId(null);
              setIsAiModalOpen(false);
            }}
          />
        )}
      </div>
    );
  };

export default LightningQuizModal;
