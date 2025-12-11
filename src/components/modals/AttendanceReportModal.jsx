// src/components/modals/AttendanceReportModal.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { collection, getDocs } from 'firebase/firestore';
import Papa from 'papaparse';
import { db, appId } from '../../firebase/firebase';
import { grades } from '../../constants/data';
import Icon from '../../icons/Icon';

const AttendanceReportModal = ({ onClose }) => {
    const [selectedGrade, setSelectedGrade] = React.useState('p1');
    const [selectedMonth, setSelectedMonth] = React.useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });
    const [students, setStudents] = React.useState([]);
    const [reportData, setReportData] = React.useState([]);
    const [isLoading, setIsLoading] = React.useState(false);

    // โหลดรายชื่อนักเรียน
    React.useEffect(() => {
        const loadStudents = async () => {
            if (!db || !selectedGrade) return;
            const rosterPath = `artifacts/${appId}/public/data/rosters/${selectedGrade}/students`;
            const snapshot = await getDocs(collection(db, rosterPath));
            const studentList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            studentList.sort((a, b) => (a.studentNumber || 0) - (b.studentNumber || 0));
            setStudents(studentList);
        };
        loadStudents();
    }, [selectedGrade]);

    // สร้างรายงานเมื่อเลือกเดือน
    const generateReport = async () => {
        if (!db || !selectedGrade || students.length === 0) return;
        setIsLoading(true);

        try {
            const [year, month] = selectedMonth.split('-');
            const attendanceCollectionRef = collection(db, `artifacts/${appId}/public/data/attendance`);
            const snapshot = await getDocs(attendanceCollectionRef);

            // สร้าง object สำหรับเก็บสถิติ
            const stats = {};
            students.forEach(s => {
                stats[s.id] = {
                    studentNumber: s.studentNumber,
                    name: `${s.firstName} ${s.lastName}`,
                    gender: s.gender || '-',
                    มาเรียน: 0,
                    ขาด: 0,
                    ลา: 0,
                    สาย: 0,
                    totalDays: 0,
                };
            });

            // นับสถานะจาก attendance docs ของเดือนนั้น
            snapshot.docs.forEach(docSnap => {
                const docId = docSnap.id;
                // ตรวจสอบว่าเป็นของ grade และเดือนที่เลือก
                if (docId.startsWith(`${selectedGrade}-${year}-${month}`)) {
                    const data = docSnap.data();
                    Object.entries(data).forEach(([studentId, status]) => {
                        if (stats[studentId] && ['มาเรียน', 'ขาด', 'ลา', 'สาย'].includes(status)) {
                            stats[studentId][status] += 1;
                            stats[studentId].totalDays += 1;
                        }
                    });
                }
            });

            // แปลงเป็น array และเรียงตามเลขที่
            const reportArray = Object.values(stats).sort((a, b) => a.studentNumber - b.studentNumber);
            setReportData(reportArray);
        } catch (error) {
            console.error('Error generating report:', error);
        } finally {
            setIsLoading(false);
        }
    };

    React.useEffect(() => {
        if (students.length > 0) {
            generateReport();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedMonth, students]);

    // Export CSV
    const handleExportCsv = () => {
        const rows = reportData.map(r => ({
            'เลขที่': r.studentNumber,
            'ชื่อ': r.name,
            'เพศ': r.gender,
            'มาเรียน': r.มาเรียน,
            'ขาด': r.ขาด,
            'ลา': r.ลา,
            'สาย': r.สาย,
            'รวม': r.totalDays,
        }));
        const csv = Papa.unparse(rows);
        const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `attendance_report_${selectedGrade}_${selectedMonth}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    // Print
    const handlePrint = () => {
        const tableRows = reportData.map((r, idx) =>
            `<tr>
                <td>${idx + 1}</td>
                <td>${r.studentNumber}</td>
                <td>${r.name}</td>
                <td>${r.gender}</td>
                <td>${r.มาเรียน}</td>
                <td>${r.ขาด}</td>
                <td>${r.ลา}</td>
                <td>${r.สาย}</td>
                <td>${r.totalDays}</td>
            </tr>`
        ).join('');

        const html = `
        <html>
        <head><title>รายงานเช็คชื่อรายเดือน</title>
        <style>
          body { font-family: "Sarabun", Arial, sans-serif; padding: 16px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #333; padding: 6px; font-size: 12px; text-align: center; }
          th { background: #f1f5f9; }
          h3 { text-align: center; }
        </style>
        </head>
        <body>
          <h3>รายงานเช็คชื่อรายเดือน ชั้น ป.${selectedGrade.replace('p', '')} - ${selectedMonth}</h3>
          <table>
            <thead><tr><th>#</th><th>เลขที่</th><th>ชื่อ</th><th>เพศ</th><th>มาเรียน</th><th>ขาด</th><th>ลา</th><th>สาย</th><th>รวม</th></tr></thead>
            <tbody>${tableRows}</tbody>
          </table>
        </body>
        </html>`;

        const w = window.open('', '_blank');
        if (w) {
            w.document.write(html);
            w.document.close();
            w.focus();
            w.print();
        }
    };

    const monthOptions = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const label = `${d.toLocaleString('th-TH', { month: 'long' })} ${d.getFullYear() + 543}`;
        monthOptions.push({ value, label });
    }

    return (
        <div className="flex flex-col h-full gap-4">
            <div className="rounded-3xl border border-white/10 bg-gradient-to-r from-slate-900/80 via-slate-900/50 to-slate-900/80 p-5 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.8)]">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-black font-bold text-xl shadow-lg shadow-purple-500/30">
                            <Icon name="BarChart3" size={24} />
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">รายงาน</p>
                            <p className="text-2xl font-extrabold text-white">สถิติเช็คชื่อรายเดือน</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300">
                        <Icon name="X" size={20} />
                    </button>
                </div>

                <div className="flex flex-wrap gap-3 mb-4">
                    <select
                        value={selectedGrade}
                        onChange={e => setSelectedGrade(e.target.value)}
                        className="bg-slate-900 border border-white/20 rounded-xl px-3 py-2 text-slate-100"
                        data-testid="report-grade-select"
                    >
                        {grades.map((g, i) => (
                            <option key={g} value={g} className="bg-slate-900 text-slate-100">
                                ประถมศึกษาปีที่ {i + 1}
                            </option>
                        ))}
                    </select>
                    <select
                        value={selectedMonth}
                        onChange={e => setSelectedMonth(e.target.value)}
                        className="bg-slate-900 border border-white/20 rounded-xl px-3 py-2 text-slate-100"
                        data-testid="report-month-select"
                    >
                        {monthOptions.map(opt => (
                            <option key={opt.value} value={opt.value} className="bg-slate-900 text-slate-100">
                                {opt.label}
                            </option>
                        ))}
                    </select>
                    <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-2 py-1">
                        <button onClick={handleExportCsv} className="flex items-center gap-1 text-xs px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200">
                            <Icon name="Download" size={14} /> CSV
                        </button>
                        <button onClick={handlePrint} className="flex items-center gap-1 text-xs px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200">
                            <Icon name="Printer" size={14} /> พิมพ์
                        </button>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Icon name="Loader2" className="animate-spin text-teal-400" size={40} />
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-2xl border border-white/10">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-800/80">
                                <tr>
                                    <th className="px-3 py-2 text-left text-slate-400">เลขที่</th>
                                    <th className="px-3 py-2 text-left text-slate-400">ชื่อ</th>
                                    <th className="px-3 py-2 text-center text-slate-400">เพศ</th>
                                    <th className="px-3 py-2 text-center text-emerald-400">มาเรียน</th>
                                    <th className="px-3 py-2 text-center text-rose-400">ขาด</th>
                                    <th className="px-3 py-2 text-center text-amber-400">ลา</th>
                                    <th className="px-3 py-2 text-center text-sky-400">สาย</th>
                                    <th className="px-3 py-2 text-center text-slate-400">รวม</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reportData.map((row, idx) => (
                                    <tr key={idx} className="border-t border-white/10 hover:bg-white/5">
                                        <td className="px-3 py-2 text-white">{row.studentNumber}</td>
                                        <td className="px-3 py-2 text-white">{row.name}</td>
                                        <td className="px-3 py-2 text-center text-slate-300">{row.gender}</td>
                                        <td className="px-3 py-2 text-center text-emerald-300">{row.มาเรียน}</td>
                                        <td className="px-3 py-2 text-center text-rose-300">{row.ขาด}</td>
                                        <td className="px-3 py-2 text-center text-amber-300">{row.ลา}</td>
                                        <td className="px-3 py-2 text-center text-sky-300">{row.สาย}</td>
                                        <td className="px-3 py-2 text-center text-slate-300">{row.totalDays}</td>
                                    </tr>
                                ))}
                                {reportData.length === 0 && (
                                    <tr>
                                        <td colSpan={8} className="px-3 py-8 text-center text-slate-500">
                                            ไม่พบข้อมูลเช็คชื่อในเดือนที่เลือก
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

AttendanceReportModal.propTypes = {
    onClose: PropTypes.func.isRequired,
};

export default AttendanceReportModal;
