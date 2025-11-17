import React from 'react';
import { addDoc, collection, doc, onSnapshot, orderBy, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { db, appId } from '../../firebase/firebase';
import Icon from '../../icons/Icon';

const quizSetsPath = `artifacts/${appId}/public/data/quiz_sets`;
const quizSessionsPath = `artifacts/${appId}/public/data/quiz_sessions`;

const defaultQuestionDraft = {
  text: '',
  optionA: '',
  optionB: '',
  optionC: '',
  optionD: '',
  answerIndex: '0',
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
  const [isStartingSession, setIsStartingSession] = React.useState(false);
  const [error, setError] = React.useState('');
  const [copySuccess, setCopySuccess] = React.useState(false);

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

  // Subscribe session doc and answers of current question when hosting
  React.useEffect(() => {
    if (!db || !activeSession) {
      setSessionDoc(null);
      setAnswerCounts([]);
      return undefined;
    }
    const sessionRef = doc(db, `${quizSessionsPath}/${activeSession.id}`);
    const unsubSession = onSnapshot(sessionRef, (snap) => {
      if (snap.exists()) {
        setSessionDoc({ id: snap.id, ...snap.data() });
      }
    });
    return () => {
      unsubSession();
      setAnswerCounts([]);
    };
  }, [db, activeSession]);

  React.useEffect(() => {
    if (!db || !activeSession || sessionDoc?.currentQuestionIndex === null || sessionDoc?.currentQuestionIndex === undefined) {
      setAnswerCounts([]);
      return undefined;
    }
    const answersRef = collection(db, `${quizSessionsPath}/${activeSession.id}/answers`);
    const answersQuery = query(answersRef, where('questionIndex', '==', sessionDoc.currentQuestionIndex));
    const unsub = onSnapshot(answersQuery, (snapshot) => {
      const counts = {};
      snapshot.docs.forEach((docSnap) => {
        const optionIndex = docSnap.data().optionIndex;
        counts[optionIndex] = (counts[optionIndex] || 0) + 1;
      });
      setAnswerCounts(
        Object.keys(counts)
          .sort((a, b) => Number(a) - Number(b))
          .map((key) => ({ optionIndex: Number(key), count: counts[key] })),
      );
    });
    return () => unsub();
  }, [db, activeSession, sessionDoc?.currentQuestionIndex]);

  const handleChangeSetForm = (e) => {
    const { name, value } = e.target;
    setSetForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleChangeDraft = (e) => {
    const { name, value } = e.target;
    setQuestionDraft((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddQuestion = () => {
    if (!questionDraft.text.trim()) return;
    const options = [questionDraft.optionA, questionDraft.optionB, questionDraft.optionC, questionDraft.optionD]
      .map((opt) => opt.trim())
      .filter(Boolean);
    if (options.length < 2) return;
    const newQuestion = {
      text: questionDraft.text.trim(),
      options,
      answerIndex: Math.min(Number(questionDraft.answerIndex || 0), options.length - 1),
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

  const handleCreateSet = async () => {
    if (!db || !setForm.title.trim() || setForm.questions.length === 0) return;
    setIsSavingSet(true);
    setError('');
    try {
      await addDoc(collection(db, quizSetsPath), {
        title: setForm.title.trim(),
        topic: setForm.topic.trim(),
        instructions: setForm.instructions.trim(),
        questions: setForm.questions,
        questionCount: setForm.questions.length,
        createdAt: serverTimestamp(),
      });
      setSetForm({
        title: '',
        topic: '',
        instructions: '',
        questions: [],
      });
      setQuestionDraft(defaultQuestionDraft);
      setCreatingSet(false);
    } catch (err) {
      console.error('Error creating quiz set', err);
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
      const docRef = await addDoc(collection(db, quizSessionsPath), {
        quizSetId: selectedSet.id,
        quizTitle: selectedSet.title,
        questions: selectedSet.questions || [],
        sessionCode: code,
        questionCount: selectedSet.questions?.length || 0,
        status: 'waiting',
        currentQuestionIndex: null,
        startedAt: serverTimestamp(),
      });
      setActiveSession({
        id: docRef.id,
        sessionCode: code,
        quizTitle: selectedSet.title,
      });
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
  };

  const joinBaseUrl = React.useMemo(() => {
    if (typeof window === 'undefined') return '/quiz';
    return `${window.location.origin}/quiz`;
  }, []);

  const handleNextQuestion = async () => {
    if (!db || !activeSession || !sessionDoc || !sessionDoc.questions) return;
    const nextIndex =
      sessionDoc.currentQuestionIndex === null || sessionDoc.currentQuestionIndex === undefined
        ? 0
        : sessionDoc.currentQuestionIndex + 1;
    if (nextIndex >= (sessionDoc.questions?.length || 0)) {
      await updateDoc(doc(db, quizSessionsPath, activeSession.id), { status: 'completed', currentQuestionIndex: null });
      return;
    }
    await updateDoc(doc(db, quizSessionsPath, activeSession.id), {
      status: 'running',
      currentQuestionIndex: nextIndex,
      questionStartedAt: serverTimestamp(),
    });
  };

  const handleEndSession = async () => {
    if (!db || !activeSession) return;
    await updateDoc(doc(db, quizSessionsPath, activeSession.id), { status: 'completed', currentQuestionIndex: null });
  };

  const handleCopyJoinLink = () => {
    if (!activeSession) return;
    const link = `${joinBaseUrl}?pin=${activeSession.sessionCode}`;
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="flex w-full max-w-6xl flex-col rounded-3xl border border-white/15 bg-[#0b1327]/95 text-white shadow-2xl max-h-[90vh]"
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

        <div className="grid flex-1 min-h-0 grid-cols-1 gap-6 overflow-y-auto p-6 lg:grid-cols-[0.95fr_1.05fr]">
          <section className="flex min-h-0 flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-5">
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

                <button
                  type="button"
                  onClick={handleCreateSet}
                  disabled={isSavingSet || !setForm.title.trim() || setForm.questions.length === 0}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500/90 py-2.5 text-sm font-semibold text-black transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-white/30"
                >
                  {isSavingSet ? <Icon name="Loader2" className="animate-spin" size={16} /> : <Icon name="Save" size={16} />}
                  บันทึกชุดคำถาม
                </button>
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
                  {quizSets.map((set) => (
                    <li
                      key={set.id}
                      className={`cursor-pointer px-4 py-3 transition hover:bg-white/10 ${selectedSetId === set.id ? 'bg-white/10' : ''}`}
                      onClick={() => setSelectedSetId(set.id)}
                    >
                      <p className="font-semibold text-white">{set.title}</p>
                      <p className="text-xs text-white/70">{set.topic || 'ไม่มีคำอธิบาย'} · {set.questionCount || set.questions?.length || 0} ข้อ</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section className="flex min-h-0 flex-col rounded-2xl border border-white/10 bg-black/40">
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
                    <p className="text-sm font-semibold text-white">รายละเอียดชุด</p>
                    <p className="text-xs text-white/60">{selectedSet.instructions || '—'}</p>
                    <ul className="mt-3 space-y-1 text-xs text-white/70 max-h-28 overflow-y-auto">
                      {selectedSet.questions?.map((question, index) => (
                        <li key={index}>
                          {index + 1}. {question.text}
                        </li>
                      ))}
                    </ul>
                  </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm font-semibold text-white">เริ่มเกม</p>
                  {activeSession ? (
                    <div className="mt-3 space-y-3 text-white">
                      <p className="text-4xl font-bold tracking-[0.3em] text-purple-200">{activeSession.sessionCode}</p>
                      <p className="text-sm text-white/70">ให้เด็กเข้า <span className="font-semibold text-white">quiz.krukit</span> แล้วใส่ PIN ข้างต้น (อยู่ระหว่างพัฒนา)</p>
                      <div className="flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={handleNextQuestion}
                          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 py-2 text-sm font-semibold transition hover:opacity-90"
                        >
                          <Icon name="PlayCircle" size={18} />
                          ถามคำถามถัดไป
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
                      <div className="mt-3 flex items-center gap-3 rounded-xl border border-dashed border-white/15 bg-black/40 px-3 py-2 text-xs text-white/70">
                        <div className="flex-1">
                          <p>ลิงก์เข้าร่วม: <span className="font-semibold text-white">{joinBaseUrl}</span></p>
                          {copySuccess && <p className="text-emerald-300">คัดลอกแล้ว!</p>}
                        </div>
                          <button
                            type="button"
                            onClick={handleCopyJoinLink}
                            className="rounded-lg border border-white/20 px-3 py-1 text-white/80 transition hover:bg-white/10"
                          >
                            คัดลอก
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={handleStartSession}
                        disabled={isStartingSession}
                        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 py-3 text-sm font-semibold uppercase tracking-[0.3em] transition hover:opacity-90 disabled:opacity-60"
                      >
                        {isStartingSession ? <Icon name="Loader2" className="animate-spin" size={18} /> : <Icon name="Bolt" size={18} />}
                        {isStartingSession ? 'กำลังเปิด' : 'สร้าง PIN & เริ่ม'}
                      </button>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-sm font-semibold text-white">Live Scoreboard</p>
                    {sessionDoc?.currentQuestionIndex !== null && sessionDoc?.currentQuestionIndex !== undefined ? (
                      <div className="mt-3 space-y-3">
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
                          <Icon name="Users" size={32} className="mx-auto text-white/40" />
                          <p>จะแสดงผลเมื่อเริ่มคำถาม</p>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {error && <p className="text-sm text-rose-300">{error}</p>}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default LightningQuizModal;
