// src/components/classroom_tools/AttendanceChecker.jsx (The Absolutely Final Version)
import React from 'react';
import { collection, onSnapshot, query, orderBy, doc, getDoc, setDoc } from 'firebase/firestore';
import { db, appId, logActivity } from '../../firebase/firebase';
import { grades } from '../../constants/data';
import Icon from '../../icons/Icon';

const AttendanceChecker = () => {
    const [selectedGrade, setSelectedGrade] = React.useState('p1');
    const [students, setStudents] = React.useState([]);
    const [attendance, setAttendance] = React.useState({});
    const [isLoading, setIsLoading] = React.useState(true);
    const [isSaving, setIsSaving] = React.useState(false);

    const today = new Date().toISOString().slice(0, 10);

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

        return () => unsubscribeStudents();
    }, [selectedGrade, today]);

    const handleStatusChange = (studentId, status) => {
        setAttendance(prev => ({ ...prev, [studentId]: status }));
    };

    const handleSaveAndNotify = async () => {
        setIsSaving(true);
        try {
            const attendanceDocRef = doc(db, `artifacts/${appId}/public/data/attendance`, `${selectedGrade}-${today}`);
            await setDoc(attendanceDocRef, attendance, { merge: true });
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
    
    const statusOptions = {
        'มาเรียน': { label: 'มาเรียน', icon: 'Check', color: 'bg-green-500/20 text-green-300', ring: 'ring-green-500' },
        'ขาด': { label: 'ขาด', icon: 'X', color: 'bg-red-500/20 text-red-300', ring: 'ring-red-500' },
        'ลา': { label: 'ลา', icon: 'FileText', color: 'bg-yellow-500/20 text-yellow-300', ring: 'ring-yellow-500' },
        'สาย': { label: 'สาย', icon: 'Clock', color: 'bg-sky-500/20 text-sky-300', ring: 'ring-sky-500' },
    };

    return (
        <div className="flex flex-col h-full">
             <div className="flex-shrink-0 flex flex-wrap items-center justify-between gap-4 mb-6">
                <div className="flex flex-wrap items-end gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">เลือกชั้นเรียน</label>
                        <select 
                            value={selectedGrade}
                            onChange={e => setSelectedGrade(e.target.value)}
                            className="bg-gray-700/50 border border-gray-600 rounded-lg p-2 text-white h-[42px]"
                        >
                            {grades.map((g, i) => <option key={g} value={g}>ประถมศึกษาปีที่ {i+1}</option>)}
                        </select>
                    </div>
                     <p className="text-gray-400 h-[42px] flex items-center">วันที่: {today}</p>
                </div>
                <button 
                    onClick={handleSaveAndNotify}
                    disabled={isSaving || isLoading || students.length === 0}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-lime-500 to-green-500 hover:opacity-90 text-black font-bold py-3 px-6 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-wait"
                >
                    <Icon name="Send" size={20}/>
                    {isSaving ? 'กำลังบันทึก...' : 'บันทึกและแจ้งเตือนผู้ปกครอง'}
                </button>
            </div>
            <div className="flex-grow bg-gray-900/50 rounded-xl p-4 overflow-auto">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full"><Icon name="Loader2" className="animate-spin text-lime-400" size={48} /></div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {students.map(student => (
                            <div key={student.id} className="bg-gray-800/60 border border-white/10 rounded-lg p-4 space-y-3">
                                <p className="font-bold text-white truncate text-center">{student.firstName} {student.lastName}</p>
                                <div className="grid grid-cols-4 gap-1">
                                    {Object.keys(statusOptions).map(status => {
                                        const option = statusOptions[status];
                                        const isActive = attendance[student.id] === status;
                                        return (
                                            <button
                                                key={status}
                                                onClick={() => handleStatusChange(student.id, status)}
                                                className={`p-2 rounded-md transition-all ${option.color} ${isActive ? `ring-2 ${option.ring}` : 'opacity-50 hover:opacity-100'}`}
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
                )}
            </div>
        </div>
    );
};

export default AttendanceChecker;