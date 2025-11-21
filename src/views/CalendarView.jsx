import React from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db, appId } from '../firebase/firebase';
import { grades } from '../constants/data';
import { colorThemes } from '../constants/theme';
import Icon from '../icons/Icon';

const categoryLabel = (category) => {
  switch (category) {
    case 'quiz':
      return 'เก็บคะแนน';
    case 'midterm':
      return 'สอบกลางภาค';
    case 'final':
      return 'สอบปลายภาค';
    default:
      return 'งาน';
  }
};

const CalendarView = ({ subjects }) => {
  const [selectedGrade, setSelectedGrade] = React.useState(grades[0]);
  const [events, setEvents] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  const toDate = (value) => {
    if (!value) return null;
    if (value.toDate) return value.toDate();
    if (value instanceof Date) return value;
    if (typeof value === 'string') return new Date(value);
    return null;
  };

  React.useEffect(() => {
    const load = async () => {
      if (!db || !subjects?.length) {
        setEvents([]);
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError('');
      try {
        const tasks = subjects.map(async (subject) => {
          const path = `artifacts/${appId}/public/data/subjects/${subject.id}/grades/${selectedGrade}/assignments`;
          const snap = await getDocs(query(collection(db, path), orderBy('createdAt')));
          return snap.docs.map((docSnap) => {
            const data = docSnap.data();
            const due = toDate(data.dueDate) || toDate(data.createdAt);
            return {
              id: docSnap.id,
              subjectId: subject.id,
              subjectName: subject.name,
              category: data.category,
              maxScore: data.maxScore,
              name: data.name,
              dueAt: due,
            };
          });
        });

        const results = (await Promise.all(tasks)).flat().filter((e) => e.dueAt);
        results.sort((a, b) => a.dueAt - b.dueAt);
        setEvents(results);
      } catch (err) {
        console.error('Error loading calendar events:', err);
        setError('โหลดข้อมูลปฏิทินไม่สำเร็จ');
        setEvents([]);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [selectedGrade, subjects]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcoming = events.filter((e) => e.dueAt >= today);
  const past = events.filter((e) => e.dueAt < today);

  const renderEventCard = (evt) => {
    const theme = colorThemes[subjects.find((s) => s.id === evt.subjectId)?.colorTheme || 'teal'] || colorThemes.teal;
    const dueText = evt.dueAt.toLocaleDateString('th-TH', { dateStyle: 'medium' });
    const isDueToday = evt.dueAt.toDateString() === today.toDateString();
    const isOverdue = evt.dueAt < today;
    return (
      <div key={`${evt.subjectId}-${evt.id}`} className="rounded-2xl border border-white/10 bg-white/5 p-4 flex flex-col gap-2 shadow-lg">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${theme.bg}`} />
            <p className="text-sm font-bold text-white">{evt.subjectName}</p>
          </div>
          <span className="text-[11px] uppercase tracking-wide text-slate-400">{categoryLabel(evt.category)}</span>
        </div>
        <p className="text-base font-semibold text-white">{evt.name}</p>
        <div className="flex items-center gap-2 text-sm text-slate-300">
          <Icon name="CalendarClock" className="text-sky-300" size={16} />
          <span>{dueText}</span>
          {isDueToday && <span className="px-2 py-0.5 text-xs rounded-full bg-amber-500/20 text-amber-200">กำหนดส่งวันนี้</span>}
          {isOverdue && <span className="px-2 py-0.5 text-xs rounded-full bg-rose-500/20 text-rose-200">เลยกำหนด</span>}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">เครื่องมือครู</p>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-2">
            <Icon name="CalendarDays" className="text-sky-300" />
            ปฏิทินงาน/สอบรวม
          </h1>
          <p className="text-sm text-slate-400 mt-1">รวมงาน/สอบทุกวิชาของชั้นเดียว</p>
        </div>
        <div className="flex items-center gap-2">
          {grades.map((g, idx) => (
            <button
              key={g}
              onClick={() => setSelectedGrade(g)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition ${selectedGrade === g ? 'bg-sky-500 text-white' : 'bg-white/5 text-slate-300 hover:bg-white/10'}`}
            >
              ป.{idx + 1}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-rose-100 text-sm">{error}</div>}

      {isLoading ? (
        <div className="flex items-center justify-center h-64 text-slate-400">
          <Icon name="Loader2" className="animate-spin" size={32} />
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Icon name="Clock" className="text-emerald-300" />
              <h3 className="text-white font-bold">ใกล้ถึงกำหนด</h3>
            </div>
            {upcoming.length === 0 ? (
              <p className="text-sm text-slate-400">ยังไม่มีกำหนดการ</p>
            ) : (
              <div className="space-y-3 max-h-[520px] overflow-y-auto custom-scrollbar">
                {upcoming.map(renderEventCard)}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Icon name="History" className="text-slate-300" />
              <h3 className="text-white font-bold">กำหนดการที่ผ่านมา</h3>
            </div>
            {past.length === 0 ? (
              <p className="text-sm text-slate-400">ยังไม่มีรายการย้อนหลัง</p>
            ) : (
              <div className="space-y-3 max-h-[520px] overflow-y-auto custom-scrollbar">
                {past.slice(-20).map(renderEventCard)}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
};

export default CalendarView;
