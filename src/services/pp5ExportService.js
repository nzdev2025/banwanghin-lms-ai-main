// src/services/pp5ExportService.js
// Service for exporting data from Firebase to PP5 Excel template

import { collection, getDocs, doc, getDoc, query, orderBy } from 'firebase/firestore';
import { db, appId } from '../firebase/firebase';
import {
    writeDataToSheet,
    writeCellValue,
    exportWorkbook,
    downloadBlob,
    columnLetterToNumber,
} from '../utils/excelParser';

/**
 * Fetch all students for a specific grade
 * @param {string} grade - Grade ID (e.g., 'p1', 'p2')
 * @returns {Promise<Object[]>} - Array of student objects
 */
export const fetchStudents = async (grade) => {
    if (!db || !grade) return [];

    const path = `artifacts/${appId}/public/data/rosters/${grade}/students`;
    const q = query(collection(db, path), orderBy('studentNumber'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data(),
    }));
};

/**
 * Fetch scores for all subjects for a grade
 * @param {string} grade - Grade ID
 * @param {Object[]} subjects - Array of subject objects
 * @returns {Promise<Object>} - { subjectId: { studentId: { assignmentId: score } } }
 */
export const fetchAllScores = async (grade, subjects) => {
    if (!db || !grade || !subjects?.length) return {};

    const allScores = {};

    for (const subject of subjects) {
        const scoresPath = `artifacts/${appId}/public/data/subjects/${subject.id}/grades/${grade}/scores`;
        const snapshot = await getDocs(collection(db, scoresPath));

        allScores[subject.id] = {};
        snapshot.docs.forEach(docSnap => {
            allScores[subject.id][docSnap.id] = docSnap.data();
        });
    }

    return allScores;
};

/**
 * Fetch assignments for all subjects for a grade
 * @param {string} grade - Grade ID
 * @param {Object[]} subjects - Array of subject objects
 * @returns {Promise<Object>} - { subjectId: Assignment[] }
 */
export const fetchAllAssignments = async (grade, subjects) => {
    if (!db || !grade || !subjects?.length) return {};

    const allAssignments = {};

    for (const subject of subjects) {
        const path = `artifacts/${appId}/public/data/subjects/${subject.id}/grades/${grade}/assignments`;
        const q = query(collection(db, path), orderBy('createdAt'));
        const snapshot = await getDocs(q);

        allAssignments[subject.id] = snapshot.docs.map(docSnap => ({
            id: docSnap.id,
            ...docSnap.data(),
        }));
    }

    return allAssignments;
};

/**
 * Fetch attendance records for a grade within a date range
 * @param {string} grade - Grade ID
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Promise<Object>} - { date: { studentId: status } }
 */
export const fetchAttendance = async (grade, startDate, endDate) => {
    if (!db || !grade) return {};

    const attendance = {};
    const start = new Date(startDate);
    const end = new Date(endDate);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        const docId = `${grade}-${dateStr}`;

        try {
            const docRef = doc(db, `artifacts/${appId}/public/data/attendance`, docId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                attendance[dateStr] = docSnap.data();
            }
        } catch (error) {
            console.warn(`Error fetching attendance for ${dateStr}:`, error);
        }
    }

    return attendance;
};

/**
 * Fetch health records for students in a grade
 * @param {string} grade - Grade ID
 * @returns {Promise<Object>} - { studentId: HealthRecord[] }
 */
export const fetchHealthRecords = async (grade) => {
    if (!db || !grade) return {};

    const students = await fetchStudents(grade);
    const healthRecords = {};

    for (const student of students) {
        const path = `artifacts/${appId}/public/data/rosters/${grade}/students/${student.id}/healthRecords`;
        const snapshot = await getDocs(collection(db, path));

        healthRecords[student.id] = snapshot.docs.map(docSnap => ({
            id: docSnap.id,
            ...docSnap.data(),
        }));
    }

    return healthRecords;
};

/**
 * Fill student data into the template
 */
export const fillStudentData = (workbook, mapping, students) => {
    if (!mapping?.sheetName || !students?.length) return;

    const data = students.map(student => ({
        studentNumber: student.studentNumber,
        studentId: student.studentId || '',
        fullName: `${student.firstName || ''} ${student.lastName || ''}`.trim(),
        nationalId: student.nationalId || '',
        nickname: student.nickname || '',
        birthDate: student.birthDate || '',
    }));

    writeDataToSheet(workbook, mapping.sheetName, mapping, data);
};

/**
 * Fill score data into the template
 */
export const fillScoreData = (workbook, mapping, students, scores) => {
    if (!mapping?.sheetName || !students?.length) return;

    const data = students.map(student => {
        const studentScores = scores[student.id] || {};
        let term1Total = 0;

        Object.entries(studentScores).forEach(([, score]) => {
            if (typeof score === 'number') {
                term1Total += score;
            }
        });

        return {
            studentNumber: student.studentNumber,
            fullName: `${student.firstName || ''} ${student.lastName || ''}`.trim(),
            term1Midterm: term1Total,
            term1Total: term1Total,
        };
    });

    writeDataToSheet(workbook, mapping.sheetName, mapping, data);
};

/**
 * Fill attendance data into the template
 */
export const fillAttendanceData = (workbook, mapping, students, attendance) => {
    if (!mapping?.sheetName || !students?.length) return;

    const sheet = workbook.getWorksheet(mapping.sheetName);
    if (!sheet) return;

    const dates = Object.keys(attendance).sort();
    const dayStartCol = columnLetterToNumber(mapping.dayColumnsStart || 'F');

    students.forEach((student, studentIndex) => {
        const rowNum = mapping.startRow + studentIndex;
        const row = sheet.getRow(rowNum);

        if (mapping.columns.studentNumber) {
            row.getCell(columnLetterToNumber(mapping.columns.studentNumber)).value = student.studentNumber;
        }
        if (mapping.columns.fullName) {
            row.getCell(columnLetterToNumber(mapping.columns.fullName)).value =
                `${student.firstName || ''} ${student.lastName || ''}`.trim();
        }

        dates.forEach((date, dateIndex) => {
            const colNum = dayStartCol + dateIndex;
            const status = attendance[date]?.[student.id] || '';

            let symbol = '';
            switch (status) {
                case 'มาเรียน': symbol = '/'; break;
                case 'ขาด': symbol = 'ข'; break;
                case 'ลา': symbol = 'ล'; break;
                case 'ป่วย': symbol = 'ป'; break;
                case 'สาย': symbol = 'ส'; break;
                default: symbol = '';
            }

            row.getCell(colNum).value = symbol;
        });

        row.commit();
    });
};

/**
 * Fill health data into the template
 */
export const fillHealthData = (workbook, mapping, students, healthRecords) => {
    if (!mapping?.sheetName || !students?.length) return;

    const data = students.map(student => {
        const records = healthRecords[student.id] || [];
        const latestRecord = records.sort((a, b) =>
            (b.updatedAt?.toMillis?.() || 0) - (a.updatedAt?.toMillis?.() || 0)
        )[0] || {};

        return {
            studentNumber: student.studentNumber,
            fullName: `${student.firstName || ''} ${student.lastName || ''}`.trim(),
            weight1: latestRecord.weight || '',
            height1: latestRecord.height || '',
        };
    });

    writeDataToSheet(workbook, mapping.sheetName, mapping, data);
};

/**
 * Fill basic school/class info into the template
 */
export const fillBasicInfo = (workbook, mapping, info) => {
    if (!mapping?.sheetName || !info) return;

    const cells = mapping.cells || {};

    Object.entries(cells).forEach(([fieldName, cellAddress]) => {
        if (cellAddress && info[fieldName]) {
            writeCellValue(workbook, mapping.sheetName, cellAddress, info[fieldName]);
        }
    });
};

/**
 * Export complete PP5 document
 */
export const exportPp5 = async (workbook, mapping, grade, subjects, options = {}) => {
    const {
        includeStudentInfo = true,
        includeScores = true,
        includeAttendance = true,
        includeHealth = true,
        basicInfo = {},
        dateRange = {},
    } = options;

    const students = await fetchStudents(grade);

    if (students.length === 0) {
        throw new Error(`ไม่พบข้อมูลนักเรียนในชั้น ${grade.replace('p', 'ป.')}`);
    }

    if (mapping.sheets?.basicInfo?.sheetName) {
        fillBasicInfo(workbook, mapping.sheets.basicInfo, {
            academicYear: new Date().getFullYear() + 543,
            gradeLevel: `ประถมศึกษาปีที่ ${grade.replace('p', '')}`,
            ...basicInfo,
        });
    }

    if (includeStudentInfo && mapping.sheets?.studentInfo?.sheetName) {
        fillStudentData(workbook, mapping.sheets.studentInfo, students);
    }

    if (includeScores && mapping.sheets?.scores?.sheetName && subjects?.length) {
        const scores = await fetchAllScores(grade, subjects);
        const firstSubjectScores = scores[subjects[0]?.id] || {};
        fillScoreData(workbook, mapping.sheets.scores, students, firstSubjectScores);
    }

    if (includeAttendance && mapping.sheets?.attendance?.sheetName) {
        const { startDate, endDate } = dateRange;
        if (startDate && endDate) {
            const attendance = await fetchAttendance(grade, startDate, endDate);
            fillAttendanceData(workbook, mapping.sheets.attendance, students, attendance);
        }
    }

    if (includeHealth && mapping.sheets?.health?.sheetName) {
        const healthRecords = await fetchHealthRecords(grade);
        fillHealthData(workbook, mapping.sheets.health, students, healthRecords);
    }

    return exportWorkbook(workbook);
};

/**
 * Export PP5 and trigger download
 */
export const exportAndDownloadPp5 = async (workbook, mapping, grade, subjects, options = {}, filename = null) => {
    const blob = await exportPp5(workbook, mapping, grade, subjects, options);

    const defaultFilename = `ปพ5_${grade.replace('p', 'ป')}_${new Date().toISOString().split('T')[0]}.xlsx`;
    downloadBlob(blob, filename || defaultFilename);

    return blob;
};
