// Utilities to aggregate per-student progress data across Firestore collections.
// Focused on read-only queries for academic, behavior, health, and attendance.
import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
} from 'firebase/firestore';
import { db, appId } from '../firebase/firebase';

// Helpers
const toDate = (value) => {
  if (!value) return null;
  if (value.toDate) return value.toDate();
  if (value instanceof Date) return value;
  return null;
};

const formatDate = (date) => date.toISOString().slice(0, 10);

// Academic trend by subject, sorted by assignment createdAt.
export const fetchAcademicTrend = async (studentId, grade, subjects) => {
  if (!db || !studentId || !grade || !subjects?.length) return [];

  const results = [];
  for (const subject of subjects) {
    const basePath = `artifacts/${appId}/public/data/subjects/${subject.id}/grades/${grade}`;
    const assignmentsSnap = await getDocs(query(collection(db, `${basePath}/assignments`), orderBy('createdAt')));
    const scoresSnap = await getDoc(doc(db, `${basePath}/scores`, studentId));

    const scoreMap = scoresSnap.exists() ? scoresSnap.data() : {};
    const timeline = [];
    let submitted = 0;
    let missing = 0;

    assignmentsSnap.forEach((aDoc) => {
      const data = aDoc.data();
      const created = toDate(data.createdAt);
      const score = scoreMap[aDoc.id];
      const hasScore = typeof score === 'number';
      if (hasScore) submitted += 1;
      else missing += 1;

      timeline.push({
        assignmentId: aDoc.id,
        assignment: data.name,
        date: created ? formatDate(created) : '',
        percentage: hasScore && data.maxScore ? (score / data.maxScore) * 100 : null,
        maxScore: data.maxScore,
        score: hasScore ? score : null,
      });
    });

    results.push({
      subjectId: subject.id,
      subjectName: subject.name,
      timeline,
      submitted,
      missing,
      total: submitted + missing,
    });
  }

  return results;
};

// Behavior stats for a recent window (daysBack).
export const fetchBehaviorStats = async (studentId, grade, daysBack = 30) => {
  if (!db || !studentId || !grade) return { positive: 0, needsAttention: 0, logs: [] };
  const logPath = `artifacts/${appId}/public/data/rosters/${grade}/students/${studentId}/behavior_logs`;
  const logsSnap = await getDocs(query(collection(db, logPath), orderBy('timestamp', 'desc')));

  const since = new Date();
  since.setDate(since.getDate() - daysBack);

  const logs = [];
  let positive = 0;
  let needsAttention = 0;
  logsSnap.forEach((docSnap) => {
    const data = docSnap.data();
    const ts = toDate(data.timestamp);
    if (!ts || ts < since) return;
    logs.push({ id: docSnap.id, ...data, timestamp: ts });
    if (data.type === 'positive') positive += 1;
    else needsAttention += 1;
  });

  return { positive, needsAttention, logs };
};

// Health series across terms (current academic year, term1/term2).
export const fetchHealthSeries = async (studentId, grade) => {
  if (!db || !studentId || !grade) return [];

  const today = new Date();
  const buddhistYear = today.getFullYear() + 543;
  const terms = ['term1', 'term2'];
  const series = [];

  for (const term of terms) {
    const path = `artifacts/${appId}/public/data/health_records/${grade}-${buddhistYear}-${term}/records/${studentId}`;
    const snap = await getDoc(doc(db, path));
    if (snap.exists()) {
      const data = snap.data();
      series.push({
        term,
        label: term === 'term1' ? `เทอม 1/${buddhistYear}` : `เทอม 2/${buddhistYear}`,
        weight: data.weight ?? null,
        height: data.height ?? null,
        updatedAt: toDate(data.lastUpdated),
      });
    }
  }

  return series;
};

// Attendance stats for the recent N days.
export const fetchAttendanceStats = async (studentId, grade, daysBack = 30) => {
  if (!db || !studentId || !grade) return { stats: {}, absentDays: [] };

  const stats = { มาเรียน: 0, ขาด: 0, ลา: 0, สาย: 0 };
  const absentDays = [];
  const today = new Date();

  const dateStrings = [];
  for (let i = 0; i < daysBack; i += 1) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    dateStrings.push(formatDate(d));
  }

  const docPromises = dateStrings.map((ds) =>
    getDoc(doc(db, `artifacts/${appId}/public/data/attendance`, `${grade}-${ds}`)),
  );
  const docs = await Promise.all(docPromises);

  docs.forEach((docSnap, idx) => {
    if (!docSnap.exists()) return;
    const data = docSnap.data();
    const status = data[studentId];
    if (!status) return;
    stats[status] = (stats[status] || 0) + 1;
    if (status === 'ขาด' || status === 'ลา') {
      absentDays.push(dateStrings[idx]);
    }
  });

  return { stats, absentDays };
};
