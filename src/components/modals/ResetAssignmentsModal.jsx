import React from 'react';
import { collection, getDocs, writeBatch } from 'firebase/firestore';
import { db, appId, logActivity } from '../../firebase/firebase';
import { grades as gradeOptions } from '../../constants/data';
import Icon from '../../icons/Icon';

const ResetAssignmentsModal = ({ subjects, onClose }) => {
  const [selectedGrade, setSelectedGrade] = React.useState('');
  const [selectedSubjectId, setSelectedSubjectId] = React.useState('');
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [isScanning, setIsScanning] = React.useState(false);
  const [status, setStatus] = React.useState({ type: null, message: '' });
  const [scanResult, setScanResult] = React.useState([]);

  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId);

  const handleResetSingle = async () => {
    if (!db) return;
    if (!selectedGrade || !selectedSubject) {
      setStatus({ type: 'error', message: 'กรุณาเลือกชั้นและวิชาให้ครบถ้วน' });
      return;
    }

    const confirm = window.confirm(
      `ยืนยันล้างงานและคะแนนทั้งหมดของวิชา "${selectedSubject.name}" ชั้น ป.${selectedGrade.replace(
        'p',
        ''
      )}?\nการกระทำนี้จะลบหัวข้องานและคะแนนทุกคนถาวร`
    );
    if (!confirm) return;

    setIsProcessing(true);
    setStatus({ type: null, message: '' });

    try {
      const basePath = `artifacts/${appId}/public/data/subjects/${selectedSubject.id}/grades/${selectedGrade}`;
      const assignmentsSnap = await getDocs(collection(db, `${basePath}/assignments`));
      const scoresSnap = await getDocs(collection(db, `${basePath}/scores`));

      const batch = writeBatch(db);
      assignmentsSnap.forEach((docSnap) => batch.delete(docSnap.ref));
      scoresSnap.forEach((docSnap) => batch.delete(docSnap.ref));
      await batch.commit();

      logActivity(
        'ASSIGNMENT_RESET',
        `ล้างงานและคะแนนทั้งหมดของวิชา <strong>${selectedSubject.name}</strong> (ป.${selectedGrade.replace('p', '')})`
      );

      setStatus({ type: 'success', message: 'ล้างงานและคะแนนเรียบร้อยแล้ว' });
      setScanResult((prev) =>
        prev.map((item) =>
          item.subjectId === selectedSubject.id ? { ...item, assignments: [], count: 0 } : item
        )
      );
    } catch (error) {
      console.error('Error resetting assignments:', error);
      setStatus({ type: 'error', message: 'ล้างข้อมูลไม่สำเร็จ โปรดลองอีกครั้ง' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResetAllSubjects = async () => {
    if (!db) return;
    if (!selectedGrade) {
      setStatus({ type: 'error', message: 'กรุณาเลือกชั้นเรียนก่อนล้างทุกวิชา' });
      return;
    }

    const confirm = window.confirm(
      `ยืนยันล้างงานและคะแนนของทุกวิชาในชั้น ป.${selectedGrade.replace(
        'p',
        ''
      )}?\nหัวข้องานและคะแนนทั้งหมดจะหายถาวร`
    );
    if (!confirm) return;

    setIsProcessing(true);
    setStatus({ type: null, message: '' });

    try {
      for (const subject of subjects) {
        const basePath = `artifacts/${appId}/public/data/subjects/${subject.id}/grades/${selectedGrade}`;
        const assignmentsSnap = await getDocs(collection(db, `${basePath}/assignments`));
        const scoresSnap = await getDocs(collection(db, `${basePath}/scores`));

        if (assignmentsSnap.empty && scoresSnap.empty) continue;

        const batch = writeBatch(db);
        assignmentsSnap.forEach((docSnap) => batch.delete(docSnap.ref));
        scoresSnap.forEach((docSnap) => batch.delete(docSnap.ref));
        await batch.commit();
      }

      logActivity(
        'ASSIGNMENT_RESET_ALL',
        `ล้างงานและคะแนนทุกวิชาในชั้น ป.${selectedGrade.replace('p', '')}`
      );

      setStatus({ type: 'success', message: 'ล้างงานและคะแนนทุกวิชาเรียบร้อยแล้ว' });
      setScanResult([]);
    } catch (error) {
      console.error('Error resetting all assignments:', error);
      setStatus({ type: 'error', message: 'ล้างข้อมูลทุกวิชาไม่สำเร็จ โปรดลองอีกครั้ง' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleScan = async () => {
    if (!db) return;
    if (!selectedGrade) {
      setStatus({ type: 'error', message: 'กรุณาเลือกชั้นเรียนก่อนสแกน' });
      return;
    }
    setIsScanning(true);
    setStatus({ type: null, message: '' });
    const result = [];

    try {
      for (const subject of subjects) {
        const assignmentsSnap = await getDocs(
          collection(db, `artifacts/${appId}/public/data/subjects/${subject.id}/grades/${selectedGrade}/assignments`)
        );
        if (!assignmentsSnap.empty) {
          const assignments = assignmentsSnap.docs.map((d) => ({ id: d.id, name: d.data().name || '(ไม่มีชื่อ)' }));
          result.push({
            subjectId: subject.id,
            subjectName: subject.name,
            count: assignments.length,
            assignments,
          });
          console.log(
            `[SCAN] พบงานในวิชา ${subject.name} ชั้น ${selectedGrade}:`,
            assignments.map((a) => `${a.name} (${a.id})`)
          );
        }
      }
      setScanResult(result);
      if (result.length === 0) {
        setStatus({ type: 'success', message: 'ไม่พบน้ำหนักงานค้างในชั้นนี้' });
      }
    } catch (error) {
      console.error('Error scanning assignments:', error);
      setStatus({ type: 'error', message: 'สแกนไม่สำเร็จ โปรดลองอีกครั้ง' });
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <header className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/50 flex items-center justify-center">
              <Icon name="Eraser" className="text-rose-300" size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">ล้างงานและคะแนน</h2>
              <p className="text-sm text-slate-400">ใช้เมื่อขึ้นเทอมใหม่เพื่อล้างหัวข้องานและคะแนนทั้งหมด</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <Icon name="X" size={22} />
          </button>
        </header>

        <div className="p-5 space-y-4">
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-amber-200 text-sm">
            การล้างจะ <strong>ลบหัวข้องานทั้งหมด</strong> และ <strong>ลบคะแนนทุกคน</strong> ในวิชา/ชั้นที่เลือกทันที โปรดตรวจสอบให้แน่ใจก่อนดำเนินการ
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">ชั้น</label>
              <select
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                value={selectedGrade}
                onChange={(e) => {
                  setSelectedGrade(e.target.value);
                  setScanResult([]);
                }}
              >
                <option value="">เลือกชั้นเรียน</option>
                {gradeOptions.map((g) => (
                  <option key={g} value={g}>{`ป.${g.replace('p', '')}`}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">วิชา (สำหรับล้างรายวิชา)</label>
              <select
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
              >
                <option value="">เลือกวิชา</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={handleScan}
                className="w-full px-3 py-2 rounded-lg border border-slate-700 text-slate-200 hover:bg-slate-800 flex items-center justify-center gap-2"
                disabled={isScanning || !selectedGrade}
              >
                {isScanning ? <Icon name="Loader2" className="animate-spin" size={16} /> : <Icon name="Search" size={16} />}
                {isScanning ? 'กำลังสแกน...' : 'สแกนงานค้าง'}
              </button>
            </div>
          </div>

          {scanResult.length > 0 && (
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Icon name="Info" size={16} className="text-amber-300" />
                <p className="text-sm text-slate-200">รายการงานที่ยังอยู่ในชั้น ป.{selectedGrade.replace('p', '')}</p>
              </div>
              <div className="space-y-3 max-h-56 overflow-y-auto">
                {scanResult.map((item) => (
                  <div key={item.subjectId} className="p-3 rounded-lg border border-slate-700 bg-slate-900/40">
                    <div className="flex items-center justify-between">
                      <p className="text-white font-semibold">{item.subjectName}</p>
                      <span className="text-xs text-slate-400">{item.count} งาน</span>
                    </div>
                    <ul className="mt-2 text-sm text-slate-300 space-y-1">
                      {item.assignments.map((a) => (
                        <li key={a.id} className="flex items-center justify-between">
                          <span>{a.name}</span>
                          <span className="text-[10px] text-slate-500">{a.id}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {status.message && (
            <div
              className={`rounded-lg px-3 py-2 text-sm ${
                status.type === 'success'
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-200'
                  : 'bg-rose-500/10 border border-rose-500/30 text-rose-200'
              }`}
            >
              {status.message}
            </div>
          )}
        </div>

        <footer className="flex flex-col gap-3 px-5 py-4 border-t border-slate-800">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleResetSingle}
                disabled={isProcessing}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold flex items-center gap-2 disabled:opacity-60"
              >
                {isProcessing ? <Icon name="Loader2" className="animate-spin" size={16} /> : <Icon name="Trash2" size={16} />}
                {isProcessing ? 'กำลังล้าง...' : 'ล้างวิชาที่เลือก'}
              </button>
              <button
                onClick={handleResetAllSubjects}
                disabled={isProcessing}
                className="px-4 py-2 rounded-lg bg-rose-700/80 hover:bg-rose-600 text-white font-bold flex items-center gap-2 disabled:opacity-60"
              >
                {isProcessing ? <Icon name="Loader2" className="animate-spin" size={16} /> : <Icon name="Trash" size={16} />}
                {isProcessing ? 'กำลังล้างทุกวิชา...' : 'ล้างทุกวิชาชั้นนี้'}
              </button>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800"
              disabled={isProcessing}
            >
              ปิด
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default ResetAssignmentsModal;
