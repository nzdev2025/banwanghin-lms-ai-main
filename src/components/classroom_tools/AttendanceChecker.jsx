// src/components/classroom_tools/AttendanceChecker.jsx (The Absolutely Final Version)
import React from 'react';
import { collection, onSnapshot, query, orderBy, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import Papa from 'papaparse';
import { db, appId, logActivity } from '../../firebase/firebase';
import { grades } from '../../constants/data';
import Icon from '../../icons/Icon';

const AttendanceChecker = () => {
    const [selectedGrade, setSelectedGrade] = React.useState('p1');
    const [students, setStudents] = React.useState([]);
    const [attendance, setAttendance] = React.useState({});
    const [isLoading, setIsLoading] = React.useState(true);
    const [isSaving, setIsSaving] = React.useState(false);
    const [sessionToken, setSessionToken] = React.useState('');
    const [qrUrl, setQrUrl] = React.useState('');

    const today = new Date().toISOString().slice(0, 10);

    const summary = React.useMemo(() => {
        const groups = {
            total: { count: 0 },
            male: { count: 0 },
            female: { count: 0 },
        };
        const statusCount = { 'มาเรียน': 0, 'ขาด': 0, 'ลา': 0, 'สาย': 0 };

        students.forEach((stu) => {
            const status = attendance[stu.id] || 'มาเรียน';
            statusCount[status] = (statusCount[status] || 0) + 1;
            const groupKey = stu.gender === 'หญิง' ? 'female' : 'male';
            groups[groupKey].count += 1;
            groups[groupKey][status] = (groups[groupKey][status] || 0) + 1;
            groups.total.count += 1;
        });
        groups.total = { ...groups.total, ...statusCount };
        return { groups, statusCount };
    }, [attendance, students]);

    const summaryCards = [
        { title: 'มาทั้งหมด', value: summary.statusCount['มาเรียน'], color: 'text-emerald-300', bg: 'bg-emerald-500/10', icon: 'Check' },
        { title: 'ขาด', value: summary.statusCount['ขาด'], color: 'text-rose-300', bg: 'bg-rose-500/10', icon: 'X' },
        { title: 'ลา', value: summary.statusCount['ลา'], color: 'text-amber-300', bg: 'bg-amber-500/10', icon: 'FileText' },
        { title: 'สาย', value: summary.statusCount['สาย'], color: 'text-sky-300', bg: 'bg-sky-500/10', icon: 'Clock' },
    ];

    React.useEffect(() => {
        if (!db || !selectedGrade) return;
        setIsLoading(true);

        const rosterBasePath = `artifacts/${appId}/public/data/rosters/${selectedGrade}`;
        const q = query(collection(db, `${rosterBasePath}/students`), orderBy("studentNumber"));

        const unsubscribeStudents = onSnapshot(q, (snapshot) => {
            const studentList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setStudents(studentList);
            
            const initialAttendance = {};
            studentList.forEach(s => { initialAttendance[s.id] = 'มาเรียน'; });
            
            const attendanceDocRef = doc(db, `artifacts/${appId}/public/data/attendance`, `${selectedGrade}-${today}`);
            
            getDoc(attendanceDocRef)
                .then(docSnap => {
                    if (docSnap.exists()) {
                        setAttendance(prev => ({ ...initialAttendance, ...docSnap.data() }));
                    } else {
                        setAttendance(initialAttendance);
                    }
                })
                .catch(error => {
                    console.error("Error fetching attendance doc:", error);
                    setAttendance(initialAttendance);
                })
                .finally(() => {
                    setIsLoading(false);
                });

        }, (error) => {
            console.error("Error fetching students:", error);
            setIsLoading(false);
        });

        const sessionRef = doc(db, `artifacts/${appId}/public/data/attendance_sessions`, `${selectedGrade}-${today}`);
        getDoc(sessionRef).then((sessionSnap) => {
            if (sessionSnap.exists()) {
                const data = sessionSnap.data();
                if (data?.token) {
                    setSessionToken(data.token);
                    const link = `${window.location.origin}/attendance/join/${selectedGrade}/${today}/${data.token}`;
                    setQrUrl(`https://chart.googleapis.com/chart?chs=300x300&cht=qr&chl=${encodeURIComponent(link)}`);
                }
            }
        });

        return () => unsubscribeStudents();
    }, [selectedGrade, today]);

    const handleStatusChange = (studentId, status) => {
        setAttendance(prev => ({ ...prev, [studentId]: status }));
    };

    const handleSaveAndNotify = async () => {
        setIsSaving(true);
        try {
            const attendanceDocRef = doc(db, `artifacts/${appId}/public/data/attendance`, `${selectedGrade}-${today}`);
            const checkedAt = {};
            students.forEach((s) => { checkedAt[s.id] = serverTimestamp(); });
            await setDoc(attendanceDocRef, { ...attendance, checkedAt }, { merge: true });
            logActivity('ATTENDANCE_SAVE', `บันทึกการเช็คชื่อชั้น ป.${selectedGrade.replace('p','')} ประจำวันที่ ${today}`);

            const settingsRef = doc(db, `artifacts/${appId}/public/data/line_notify_tokens`, selectedGrade);
            const settingsSnap = await getDoc(settingsRef);
            if (!settingsSnap.exists() || !settingsSnap.data().channelToken || !settingsSnap.data().groupId) {
                throw new Error(`ยังไม่ได้ตั้งค่า Channel Token และ Group ID สำหรับชั้น ป.${selectedGrade.replace('p','')}`);
            }
            const { channelToken, groupId } = settingsSnap.data();

            const absentees = [];
            const onLeave = [];
            students.forEach(student => {
                const status = attendance[student.id];
                const fullName = `- ${student.firstName} ${student.lastName}`;
                if (status === 'ขาด') absentees.push(fullName);
                else if (status === 'ลา') onLeave.push(fullName);
            });
            
            if (absentees.length === 0 && onLeave.length === 0) {
                 alert('บันทึกข้อมูลเรียบร้อย! (ไม่มีนักเรียนขาดหรือลา จึงไม่ส่งแจ้งเตือน)');
                 setIsSaving(false);
                 return;
            }

            const payload = { grade: selectedGrade, date: today, absentees, onLeave, channelToken, groupId };

            // **ที่อยู่ของบุรุษไปรษณีย์ Google ที่ถูกต้อง**
            const appsScriptUrl = "https://script.google.com/macros/s/AKfycbzWJyw2wxLufyqbCQnCvFFz2xsA7OH858vK7yC-JTFV8_Qh3NY-pB83zo2yC2kKWOnGSw/exec";
            
            await fetch(appsScriptUrl, {
                method: "POST",
                mode: 'no-cors',
                headers: { "Content-Type": "text/plain" },
                body: JSON.stringify(payload)
            });
            
            alert('บันทึกข้อมูลและส่งแจ้งเตือนเรียบร้อยแล้ว!');

        } catch (error) {
            console.error("Error saving attendance and notifying:", error);
            alert('เกิดข้อผิดพลาด: ' + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const buildRows = () => {
        return students.map((s) => ({
            เลขที่: s.studentNumber || '',
            ชื่อ: `${s.firstName || ''} ${s.lastName || ''}`,
            เพศ: s.gender || '',
            สถานะ: attendance[s.id] || 'มาเรียน',
        }));
    };

    const handleExportCsv = () => {
        const csv = Papa.unparse(buildRows());
        const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `attendance_${selectedGrade}_${today}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const handleExportXls = () => {
        const csv = Papa.unparse(buildRows());
        const blob = new Blob([`\uFEFF${csv}`], { type: 'application/vnd.ms-excel' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `attendance_${selectedGrade}_${today}.xls`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const handlePrint = () => {
        const rows = buildRows();
        const tableRows = rows.map((r, idx) =>
            `<tr><td>${idx + 1}</td><td>${r['เลขที่']}</td><td>${r['ชื่อ']}</td><td>${r['เพศ']}</td><td>${r['สถานะ']}</td></tr>`
        ).join('');
        const html = `
        <html>
        <head><title>รายงานเช็คชื่อ ${selectedGrade} ${today}</title>
        <style>
          body { font-family: "Sarabun", Arial, sans-serif; padding: 16px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #333; padding: 6px; font-size: 12px; }
          th { background: #f1f5f9; }
        </style>
        </head>
        <body>
          <h3>บันทึกการมาเรียน ชั้น ป.${selectedGrade.replace('p','')} ประจำวันที่ ${today}</h3>
          <table>
            <thead><tr><th>#</th><th>เลขที่</th><th>ชื่อ</th><th>เพศ</th><th>สถานะ</th></tr></thead>
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
    
    const statusOptions = {
        'มาเรียน': { label: 'มาเรียน', icon: 'Check', color: 'bg-green-500/20 text-green-300', ring: 'ring-green-500' },
        'ขาด': { label: 'ขาด', icon: 'X', color: 'bg-red-500/20 text-red-300', ring: 'ring-red-500' },
        'ลา': { label: 'ลา', icon: 'FileText', color: 'bg-yellow-500/20 text-yellow-300', ring: 'ring-yellow-500' },
        'สาย': { label: 'สาย', icon: 'Clock', color: 'bg-sky-500/20 text-sky-300', ring: 'ring-sky-500' },
    };

    const generateSession = async () => {
        if (!db) return;
        const token = Math.random().toString(36).slice(2, 10);
        const sessionRef = doc(db, `artifacts/${appId}/public/data/attendance_sessions`, `${selectedGrade}-${today}`);
        const link = `${window.location.origin}/attendance/join/${selectedGrade}/${today}/${token}`;
        await setDoc(sessionRef, { token, grade: selectedGrade, date: today, createdAt: serverTimestamp() });
        setSessionToken(token);
        setQrUrl(`https://chart.googleapis.com/chart?chs=300x300&cht=qr&chl=${encodeURIComponent(link)}`);
    };

    return (
        <div className="flex flex-col h-full gap-4">
            <div className="rounded-3xl border border-white/10 bg-gradient-to-r from-slate-900/80 via-slate-900/50 to-slate-900/80 p-5 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.8)]">
                <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-black font-bold text-xl shadow-lg shadow-emerald-500/30">A</div>
                    <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">เช็คชื่อรายชั้น</p>
                        <p className="text-2xl font-extrabold text-white">ชั้น ป.{selectedGrade.replace('p','')}</p>
                        <p className="text-sm text-slate-400">วันที่ {today}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                    <select 
                        value={selectedGrade}
                        onChange={e => setSelectedGrade(e.target.value)}
                        data-testid="grade-select"
                        className="bg-slate-900 border border-white/20 rounded-xl px-3 py-2 text-slate-100 shadow-inner focus:border-emerald-300 focus:outline-none"
                    >
                        {grades.map((g, i) => (
                            <option key={g} value={g} className="bg-slate-900 text-slate-100">
                                ประถมศึกษาปีที่ {i+1}
                            </option>
                        ))}
                    </select>
                    <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-2 py-1">
                        <button onClick={handleExportCsv} className="flex items-center gap-1 text-xs px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200">
                            <Icon name="Download" size={14}/> CSV
                        </button>
                        <button onClick={handleExportXls} className="flex items-center gap-1 text-xs px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200">
                            <Icon name="Download" size={14}/> XLS
                        </button>
                        <button onClick={handlePrint} className="flex items-center gap-1 text-xs px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200">
                            <Icon name="Printer" size={14}/> พิมพ์
                        </button>
                    </div>
                    <button 
                        onClick={handleSaveAndNotify}
                        disabled={isSaving || isLoading || students.length === 0}
                        className="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-400 to-green-500 hover:opacity-90 text-black font-bold py-3 px-5 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-wait shadow-lg shadow-emerald-500/30"
                    >
                            <Icon name="Send" size={20}/>
                            {isSaving ? 'กำลังบันทึก...' : 'บันทึกและแจ้งเตือนผู้ปกครอง'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-grow bg-white/5 rounded-3xl border border-white/10 p-5 overflow-auto">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full"><Icon name="Loader2" className="animate-spin text-lime-400" size={48} /></div>
                ) : (
                <>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
                        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-sky-500/10 p-4 flex flex-col gap-3 shadow-inner shadow-black/40">
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <Icon name="QrCode" className="text-emerald-300" />
                                    <p className="font-bold text-white">QR เช็คชื่อ (นักเรียน)</p>
                                </div>
                                <button onClick={generateSession} className="text-xs px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30">
                                    {sessionToken ? 'สร้างใหม่' : 'สร้าง QR'}
                                </button>
                            </div>
                            {qrUrl ? (
                                <div className="flex items-center gap-3">
                                    <img src={qrUrl} alt="Attendance QR" className="w-28 h-28 rounded-xl border border-white/10 bg-white p-2" />
                                    <div className="text-xs text-slate-200 break-all leading-relaxed">
                                        ส่งลิงก์ให้เด็ก:<br />
                                        <span className="text-sky-300">{window.location.origin}/attendance/join/{selectedGrade}/{today}/{sessionToken}</span>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-slate-400">กดสร้าง QR เพื่อให้นักเรียนสแกนเช็คชื่อ</p>
                            )}
                        </div>
                        <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-3">
                        {summaryCards.map((card) => (
                            <div key={card.title} className={`rounded-xl border border-white/10 ${card.bg} p-3 flex items-center gap-3 shadow-lg shadow-black/20`}>
                                <span className="p-2 rounded-lg bg-white/10"><Icon name={card.icon} className={card.color.replace('text','text')} /></span>
                                <div>
                                    <p className="text-xs text-slate-400">{card.title}</p>
                                    <p className={`text-xl font-bold ${card.color}`}>{card.value}</p>
                                </div>
                            </div>
                        ))}
                        <div className="rounded-xl border border-white/10 bg-white/5 p-3 flex flex-col gap-1 shadow-lg shadow-black/20">
                            <p className="text-xs text-slate-400">สรุปชาย/หญิง</p>
                            <p className="text-sm text-white">ชาย {summary.groups.male.count || 0} (มา {summary.groups.male['มาเรียน'] || 0}, ขาด {summary.groups.male['ขาด'] || 0})</p>
                            <p className="text-sm text-white">หญิง {summary.groups.female.count || 0} (มา {summary.groups.female['มาเรียน'] || 0}, ขาด {summary.groups.female['ขาด'] || 0})</p>
                        </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                        {students.map(student => (
                            <div key={student.id} className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-white/10 rounded-2xl p-4 space-y-3 shadow-lg shadow-black/30">
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <span className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center text-sm font-bold text-white">{student.studentNumber || '?'}</span>
                                        <div>
                                            <p className="font-bold text-white truncate">{student.firstName} {student.lastName}</p>
                                            <p className="text-xs text-slate-400">{student.gender || '-'}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-4 gap-1">
                                    {Object.keys(statusOptions).map(status => {
                                        const option = statusOptions[status];
                                        const isActive = attendance[student.id] === status;
                                        return (
                                            <button
                                                key={status}
                                                onClick={() => handleStatusChange(student.id, status)}
                                                className={`p-2 rounded-md transition-all text-xs ${option.color} ${isActive ? `ring-2 ${option.ring} scale-[1.03]` : 'opacity-50 hover:opacity-100'}`}
                                                title={option.label}
                                            >
                                                <Icon name={option.icon} size={16} className="mx-auto" />
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </>
                )}
            </div>
        </div>
    );
};

export default AttendanceChecker;
