import React from 'react';
import { addDoc, collection, doc, getDocs, limit, onSnapshot, query, where } from 'firebase/firestore';
import { db, appId } from '../firebase/firebase';
import Icon from '../icons/Icon';

const quizSessionsPath = `artifacts/${appId}/public/data/quiz_sessions`;

const LightningQuizJoinView = () => {
  const [pin, setPin] = React.useState('');
  const [session, setSession] = React.useState(null);
  const [sessionDetail, setSessionDetail] = React.useState(null);
  const [isJoining, setIsJoining] = React.useState(false);
  const [error, setError] = React.useState('');
  const [alias, setAlias] = React.useState('');
  const [selectedOption, setSelectedOption] = React.useState(null);
  const [submittedForQuestion, setSubmittedForQuestion] = React.useState(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handlePinChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setPin(value);
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    if (pin.length < 4 || !db) return;
    setIsJoining(true);
    setError('');
    try {
      const pinQuery = query(collection(db, quizSessionsPath), where('sessionCode', '==', pin), limit(1));
      const snapshot = await getDocs(pinQuery);
      if (snapshot.empty) {
        setError('ไม่พบ PIN นี้ในระบบ กรุณาตรวจสอบอีกครั้ง');
        setSession(null);
        setSessionDetail(null);
      } else {
        const docData = snapshot.docs[0].data();
        const joined = {
          id: snapshot.docs[0].id,
          ...docData,
        };
        setSession(joined);
      }
    } catch (err) {
      console.error('Join quiz error', err);
      setError('ไม่สามารถเชื่อมต่อได้ กรุณาลองใหม่');
    } finally {
      setIsJoining(false);
    }
  };

  const handleReset = () => {
    setSession(null);
    setSessionDetail(null);
    setPin('');
    setAlias('');
    setSelectedOption(null);
    setSubmittedForQuestion(null);
  };

  // Subscribe session detail once joined
  React.useEffect(() => {
    if (!db || !session) return undefined;
    const sessionRef = doc(db, `${quizSessionsPath}/${session.id}`);
    const unsub = onSnapshot(sessionRef, (snap) => {
      if (snap.exists()) {
        setSessionDetail({ id: snap.id, ...snap.data() });
        const currentIndex = snap.data().currentQuestionIndex;
        if (currentIndex !== submittedForQuestion) {
          setSelectedOption(null);
          setSubmittedForQuestion(null);
        }
      }
    });
    return () => unsub();
  }, [db, session]);

  const currentQuestion =
    sessionDetail?.questions && sessionDetail.currentQuestionIndex !== null && sessionDetail.currentQuestionIndex >= 0
      ? sessionDetail.questions[sessionDetail.currentQuestionIndex]
      : null;

  const handleSubmitAnswer = async () => {
    if (!db || !sessionDetail || selectedOption === null || !alias.trim()) return;
    setIsSubmitting(true);
    setError('');
    try {
      const answersRef = collection(db, `${quizSessionsPath}/${sessionDetail.id}/answers`);
      await addDoc(answersRef, {
        alias: alias.trim(),
        optionIndex: selectedOption,
        questionIndex: sessionDetail.currentQuestionIndex,
        submittedAt: new Date(),
      });
      setSubmittedForQuestion(sessionDetail.currentQuestionIndex);
    } catch (err) {
      console.error('submit answer failed', err);
      setError('ส่งคำตอบไม่สำเร็จ');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0b102a] via-[#111b3e] to-[#162b6a] text-white">
      <div className="absolute inset-0 overflow-hidden">
        <div className="pointer-events-none absolute -left-10 top-10 h-72 w-72 rounded-full bg-gradient-to-br from-pink-500/35 via-purple-500/25 to-blue-500/25 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-gradient-to-br from-cyan-400/25 via-emerald-400/25 to-yellow-300/20 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-10">
        <header className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1 text-xs uppercase tracking-[0.4em] text-white/80 shadow-[0_6px_30px_-18px_rgba(0,0,0,0.6)]">
            <Icon name="Bolt" size={16} className="text-yellow-300" />
            Lightning Quiz
          </div>
          <h1 className="mt-5 text-3xl font-bold sm:text-4xl">เข้าร่วมเกมตอบเร็ว</h1>
          <p className="mt-2 text-sm text-white/70">สนุกแบบสดใส สไตล์ 2025 — ปลอดภัย และพร้อมลุยได้ทุกอุปกรณ์</p>
        </header>

        {!session ? (
          <section className="mx-auto w-full max-w-md rounded-3xl border border-white/10 bg-white/10 p-6 text-center backdrop-blur-xl shadow-[0_28px_60px_-36px_rgba(0,0,0,0.8)]">
            <div className="mb-4 flex items-center justify-center gap-2 text-xs uppercase tracking-[0.3em] text-white/70">
              <Icon name="Scan" size={16} className="text-cyan-300" />
              ใส่ PIN หรือสแกน QR (เร็วๆ นี้)
            </div>
            <form onSubmit={handleJoin} className="space-y-6">
              <div>
                <label className="text-sm text-white/80">ป้อน PIN</label>
                <div className="mt-3 flex justify-center">
                  <input
                    type="text"
                    value={pin}
                    onChange={handlePinChange}
                    className="w-52 rounded-2xl border border-white/20 bg-gradient-to-r from-[#1f2b52] to-[#132044] px-4 py-3 text-center text-3xl tracking-[0.5em] shadow-[0_15px_35px_-25px_rgba(0,0,0,0.8)] focus:border-yellow-300 focus:outline-none"
                    placeholder="• • • • • •"
                    inputMode="numeric"
                  />
                </div>
              </div>
              {error && <p className="text-sm text-rose-300">{error}</p>}
              <button
                type="submit"
                disabled={pin.length < 4 || isJoining}
                className="w-full rounded-xl bg-gradient-to-r from-amber-400 via-pink-500 to-indigo-500 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-black shadow-[0_18px_45px_-28px_rgba(0,0,0,0.7)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isJoining ? 'กำลังเข้าร่วม...' : 'เข้าร่วม'}
              </button>
            </form>
            <p className="mt-4 text-xs text-white/60">หมายเหตุ: ระบบตอบคำถามแบบเต็มกำลังพัฒนา</p>
          </section>
        ) : (
          <section className="flex-1 rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur-xl shadow-[0_28px_60px_-36px_rgba(0,0,0,0.8)]">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-white/60">Session PIN</p>
                <p className="text-4xl font-semibold tracking-[0.35em] text-yellow-200 drop-shadow-sm">{session.sessionCode}</p>
                <p className="text-sm text-white/70">{session.quizTitle || 'Lightning Quiz'}</p>
              </div>
              <button
                type="button"
                onClick={handleReset}
                className="rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-sm text-white/80 shadow-[0_10px_30px_-28px_rgba(0,0,0,0.7)] transition hover:bg-white/10"
              >
                เปลี่ยน PIN
              </button>
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-gradient-to-br from-[#111a34] via-[#0d1732] to-[#13254f] p-5 shadow-[0_20px_50px_-40px_rgba(0,0,0,0.8)]">
              {currentQuestion ? (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-white/50">Question #{sessionDetail.currentQuestionIndex + 1}</p>
                      <p className="text-lg font-semibold text-white">{currentQuestion.text}</p>
                    </div>
                    <div className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/70">ตอบได้ทันที</div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {currentQuestion.options?.map((opt, idx) => {
                      const isSelected = selectedOption === idx;
                      const isLocked = submittedForQuestion === sessionDetail.currentQuestionIndex;
                      return (
                        <button
                          key={idx}
                          type="button"
                          disabled={isLocked}
                          onClick={() => setSelectedOption(idx)}
                          className={[
                            'flex min-h-[72px] items-center gap-3 rounded-xl border px-3 py-3 text-left text-sm transition',
                            isSelected
                              ? 'border-amber-300 bg-amber-400/20 text-white shadow-[0_12px_30px_-20px_rgba(0,0,0,0.8)]'
                              : 'border-white/10 bg-white/5 text-white/85 hover:border-white/25 hover:bg-white/10',
                            isLocked ? 'opacity-70 cursor-not-allowed' : '',
                          ].join(' ')}
                        >
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 text-xs font-bold text-white">
                            {String.fromCharCode(65 + idx)}
                          </span>
                          <span className="flex-1">{opt}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                    <input
                      type="text"
                      value={alias}
                      onChange={(e) => setAlias(e.target.value.slice(0, 20))}
                      placeholder="ตั้งชื่อเล่น/ฉายา"
                      className="rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-amber-300 focus:outline-none"
                      disabled={submittedForQuestion === sessionDetail.currentQuestionIndex}
                    />
                    <button
                      type="button"
                      onClick={handleSubmitAnswer}
                      disabled={
                        selectedOption === null ||
                        submittedForQuestion === sessionDetail.currentQuestionIndex ||
                        !alias.trim() ||
                        isSubmitting
                      }
                      className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 via-pink-500 to-indigo-500 px-4 py-3 text-xs font-semibold uppercase tracking-[0.25em] text-black shadow-[0_12px_30px_-20px_rgba(0,0,0,0.8)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSubmitting ? <Icon name="Loader2" className="animate-spin" size={16} /> : <Icon name="Send" size={16} />}
                      ส่งคำตอบ
                    </button>
                  </div>
                  {submittedForQuestion === sessionDetail.currentQuestionIndex && (
                    <p className="text-xs text-emerald-300">รับคำตอบแล้ว รอคำถามถัดไป</p>
                  )}
                </div>
              ) : (
                <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-dashed border-white/10 bg-black/10">
                  <div className="text-center text-white/70">
                    <Icon name="Hourglass" size={36} className="mx-auto text-white/40" />
                    <p className="mt-2">โปรดรอครูเริ่มคำถามแรก</p>
                    <p className="text-xs text-white/50">ระบบตอบกลับนักเรียนจะค่อยๆ เปิดให้ใช้งาน</p>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        <footer className="mt-10 text-center text-xs text-white/50">
          KruKit Lightning Quiz • ปรับโฉมสไตล์สดใส เตรียมระบบตอบ real-time เร็วๆ นี้
        </footer>
      </div>
    </div>
  );
};

export default LightningQuizJoinView;
