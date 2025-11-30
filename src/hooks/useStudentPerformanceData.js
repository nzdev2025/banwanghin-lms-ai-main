import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db, appId } from '../firebase/firebase';
import { grades } from '../constants/data';

// ดึงข้อมูลนักเรียน งาน และคะแนน แบบรวมศูนย์ แล้วแชร์แคชให้หลายคอมโพเนนต์ใช้ร่วมกัน
// ลดจำนวนรอบเรียก Firestore ซ้ำซ้อน (เช่น TopStudents + AtRisk แสดงพร้อมกัน)
const CACHE_TTL_MS = 60 * 1000;
let cacheKey = '';
let cacheAt = 0;
let cacheData = null;
let cachePromise = null;

const buildKey = (subjects) => subjects.map((s) => s.id).sort().join(',');

const fetchPerformanceData = async (subjects) => {
  if (!db || !subjects.length) {
    return { students: new Map(), assignments: new Map() };
  }

  const students = new Map();
  const assignments = new Map();

  // 1) ดึงรายชื่อนักเรียนทุกชั้นพร้อมกัน
  await Promise.all(
    grades.map(async (grade) => {
      const snap = await getDocs(collection(db, `artifacts/${appId}/public/data/rosters/${grade}/students`));
      snap.forEach((doc) => {
        const data = doc.data();
        students.set(doc.id, { ...data, id: doc.id, grade, scores: {} });
      });
    }),
  );

  // 2) ดึงงานและคะแนนทั้งหมดแบบขนาน เพื่อไม่ให้รอทีละชุด
  const assignmentTasks = [];
  const scoreTasks = [];

  subjects.forEach((subject) => {
    grades.forEach((grade) => {
      const basePath = `artifacts/${appId}/public/data/subjects/${subject.id}/grades/${grade}`;

      assignmentTasks.push(
        getDocs(collection(db, `${basePath}/assignments`)).then((snap) => {
          snap.forEach((doc) => {
            assignments.set(doc.id, {
              ...doc.data(),
              subjectName: subject.name,
              subjectId: subject.id,
              grade,
            });
          });
        }),
      );

      scoreTasks.push(
        getDocs(collection(db, `${basePath}/scores`)).then((snap) => {
          snap.forEach((scoreDoc) => {
            const student = students.get(scoreDoc.id);
            if (student) {
              student.scores = { ...student.scores, ...scoreDoc.data() };
            }
          });
        }),
      );
    });
  });

  await Promise.all([...assignmentTasks, ...scoreTasks]);

  return { students, assignments };
};

export const useStudentPerformanceData = (subjects = []) => {
  const [state, setState] = useState({
    students: new Map(),
    assignments: new Map(),
    loading: true,
    error: null,
  });

  useEffect(() => {
    const key = buildKey(subjects);
    const now = Date.now();
    const cacheValid = cacheData && cacheKey === key && now - cacheAt < CACHE_TTL_MS;

    if (!subjects.length || !db) {
      setState((s) => ({ ...s, loading: false }));
      return;
    }

    if (cacheValid) {
      setState((s) => ({ ...s, ...cacheData, loading: false, error: null }));
      return;
    }

    if (!cachePromise || cacheKey !== key || now - cacheAt >= CACHE_TTL_MS) {
      cacheKey = key;
      cachePromise = fetchPerformanceData(subjects)
        .then((data) => {
          cacheData = data;
          cacheAt = Date.now();
          return data;
        })
        .catch((error) => {
          console.error('fetchPerformanceData error', error);
          throw error;
        });
    }

    setState((s) => ({ ...s, loading: true, error: null }));

    cachePromise
      .then((data) => setState({ ...data, loading: false, error: null }))
      .catch((error) => setState((s) => ({ ...s, loading: false, error })));
  }, [subjects]);

  return state;
};

export default useStudentPerformanceData;
