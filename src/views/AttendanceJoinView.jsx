import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, doc, getDoc, onSnapshot, orderBy, query, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, appId } from '../firebase/firebase';
import Icon from '../icons/Icon';

const AttendanceJoinView = () => {
  const { grade, date, token } = useParams();
  const navigate = useNavigate();
  const [students, setStudents] = React.useState([]);
  const [sessionValid, setSessionValid] = React.useState(null);
  const [selectedStudentId, setSelectedStudentId] = React.useState('');
  const [studentNumber, setStudentNumber] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [message, setMessage] = React.useState('');

  React.useEffect(() => {
    const validateSession = async () => {
      if (!db || !grade || !date || !token) return;
      const key = `${grade}-${date}`;
      const sessionRef = doc(db, `artifacts/${appId}/public/data/attendance_sessions`, key);
      const snap = await getDoc(sessionRef);
      if (!snap.exists() || snap.data().token !== token) {
        setSessionValid(false);
      } else {
        setSessionValid(true);
      }
    };
    validateSession();
  }, [grade, date, token]);

  React.useEffect(() => {
    if (!db || !grade) return;
    const rosterPath = `artifacts/${appId}/public/data/rosters/${grade}/students`;
    const unsub = onSnapshot(query(collection(db, rosterPath), orderBy('studentNumber')), (snapshot) => {
      setStudents(snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() })));
    });
    return () => unsub();
  }, [grade]);

  const handleSelectFromNumber = (num) => {
    const found = students.find((s) => String(s.studentNumber) === num.trim());
    if (found) {
      setSelectedStudentId(found.id);
      setStudentNumber(num);
      setMessage('');
    } else {
      setSelectedStudentId('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudentId) {
      setMessage('กรุณาเลือกชื่อนักเรียนหรือกรอกเลขที่ให้ถูกต้อง');
      return;
    }
    setIsSubmitting(true);
    try {
      const attendanceRef = doc(db, `artifacts/${appId}/public/data/attendance`, `${grade}-${date}`);

      // ตรวจสอบว่าเช็คชื่อไปแล้วหรือยัง
      const existingDoc = await getDoc(attendanceRef);
      if (existingDoc.exists()) {
        const existingData = existingDoc.data();
        if (existingData[selectedStudentId]) {
          const stu = students.find((s) => s.id === selectedStudentId);
          setMessage(`${stu?.firstName || ''} ${stu?.lastName || ''} เช็คชื่อไปแล้ว`);
          setIsSubmitting(false);
          return;
        }
      }

      await setDoc(attendanceRef, {
        [selectedStudentId]: 'มาเรียน',
        checkedAt: { [selectedStudentId]: serverTimestamp() },
      }, { merge: true });
      const stu = students.find((s) => s.id === selectedStudentId);
      setMessage(`เช็คชื่อสำเร็จ: ${stu?.firstName || ''} ${stu?.lastName || ''}`);
    } catch (err) {
      console.error(err);
      setMessage('เกิดข้อผิดพลาดในการเช็คชื่อ กรุณาลองใหม่');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (sessionValid === false) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white gap-4">
        <Icon name="ShieldAlert" className="text-rose-400" size={48} />
        <p className="text-lg font-bold">ลิงก์ไม่ถูกต้องหรือหมดอายุ</p>
        <button onClick={() => navigate('/')} className="text-sky-400 underline">กลับสู่หน้าหลัก</button>
      </div>
    );
  }

  if (sessionValid === null) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Icon name="Loader2" className="animate-spin text-teal-400" size={40} />
      </div>
    );
  }

  const studentLinkOptions = students.map((s) => ({
    label: `เลขที่ ${s.studentNumber || '-'} • ${s.firstName} ${s.lastName}`,
    value: s.id,
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-3xl rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <Icon name="QrCode" className="text-emerald-300" size={28} />
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">เช็คชื่อ</p>
            <h1 className="text-2xl font-extrabold">ชั้น ป.{grade?.replace('p', '')} ({date})</h1>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-slate-300">เลือกชื่อนักเรียน</label>
            <div className="mt-2 bg-slate-900/60 border border-white/10 rounded-2xl p-3">
              <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto custom-scrollbar">
                {studentLinkOptions.map((opt) => (
                  <label key={opt.value} className={`flex items-center gap-2 cursor-pointer rounded-xl px-3 py-2 transition ${selectedStudentId === opt.value ? 'bg-emerald-500/10 border border-emerald-500/30' : 'hover:bg-white/5'}`}>
                    <input
                      type="radio"
                      name="student"
                      value={opt.value}
                      checked={selectedStudentId === opt.value}
                      onChange={() => { setSelectedStudentId(opt.value); setMessage(''); }}
                      className="accent-emerald-400"
                    />
                    <span className="text-sm">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <div className="md:col-span-2">
              <label className="text-sm text-slate-300">หรือกรอกเลขที่นักเรียน</label>
              <input
                type="number"
                value={studentNumber}
                onChange={(e) => { setStudentNumber(e.target.value); handleSelectFromNumber(e.target.value); }}
                className="mt-1 w-full rounded-xl bg-slate-900/60 border border-white/10 px-3 py-2 text-white"
                placeholder="เช่น 5"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-black font-bold disabled:opacity-60"
            >
              {isSubmitting ? 'กำลังบันทึก...' : 'เช็คชื่อ'}
            </button>
          </div>
        </form>
        {message && <p className="mt-3 text-sm text-sky-200">{message}</p>}
      </div>
    </div>
  );
};

export default AttendanceJoinView;
