// src/components/modals/HealthRecordModal.jsx (V5 - Smart Logic Update)
import React from 'react';
import { collection, onSnapshot, query, orderBy, doc, writeBatch } from 'firebase/firestore';
import { db, logActivity, appId } from '../../firebase/firebase';
import { grades } from '../../constants/data';
import Icon from '../../icons/Icon';
import Papa from 'papaparse';

// --- UPGRADED UTILITY FUNCTIONS ---

const calculateAge = (birthDateString) => {
    if (!birthDateString) return { years: null, months: null, totalMonths: null, display: 'N/A' };
    const birthDate = new Date(birthDateString);
    const today = new Date();
    let years = today.getFullYear() - birthDate.getFullYear();
    let months = today.getMonth() - birthDate.getMonth();
    if (months < 0 || (months === 0 && today.getDate() < birthDate.getDate())) {
        years--;
        months += 12;
    }
    const totalMonths = years * 12 + months;
    return { years, months, totalMonths, display: `${years} ปี ${months} ด.` };
};

// ** NEW: More realistic (but simplified) growth standards **
// Note: These are simplified averages. A clinical app would use detailed percentile charts.
const growthStandards = {
    // ageInYears: { boy: { h: heightCm, w: weightKg }, girl: { h: heightCm, w: weightKg } }
    '6':  { boy: { h: 115, w: 20 }, girl: { h: 114, w: 19.5 } },
    '7':  { boy: { h: 121, w: 23 }, girl: { h: 120, w: 22.5 } },
    '8':  { boy: { h: 127, w: 26 }, girl: { h: 126, w: 25.5 } },
    '9':  { boy: { h: 132, w: 29 }, girl: { h: 132, w: 29 } },
    '10': { boy: { h: 137, w: 32 }, girl: { h: 138, w: 33 } },
    '11': { boy: { h: 143, w: 36 }, girl: { h: 144, w: 38 } },
    '12': { boy: { h: 149, w: 41 }, girl: { h: 151, w: 43 } },
};

const getDetailedGrowthStatus = (gender, ageInYears, weight, height) => {
    if (!gender || !ageInYears || (!weight && !height)) {
        return { weightForAge: '-', heightForAge: '-', weightForHeight: '-' };
    }

    const standard = growthStandards[ageInYears];
    const genderKey = gender === 'ชาย' ? 'boy' : 'girl';
    const standardData = standard ? standard[genderKey] : null;

    let statuses = { weightForAge: '-', heightForAge: '-', weightForHeight: '-' };

    if (standardData) {
        // Weight for Age
        if (weight) {
            if (weight < standardData.w * 0.8) statuses.weightForAge = 'น้ำหนักน้อย';
            else if (weight > standardData.w * 1.2) statuses.weightForAge = 'น้ำหนักเกิน';
            else statuses.weightForAge = 'ตามเกณฑ์';
        }
        // Height for Age
        if (height) {
            if (height < standardData.h * 0.9) statuses.heightForAge = 'เตี้ย';
            else if (height > standardData.h * 1.1) statuses.heightForAge = 'สูง';
            else statuses.heightForAge = 'ตามเกณฑ์';
        }
    }
    
    // Weight for Height (BMI based)
    if (weight && height) {
        const heightInMeters = height / 100;
        const bmi = weight / (heightInMeters * heightInMeters);
        if (bmi < 15) statuses.weightForHeight = 'ผอม';
        else if (bmi >= 15 && bmi < 18.5) statuses.weightForHeight = 'ค่อนข้างผอม';
        else if (bmi >= 18.5 && bmi < 23) statuses.weightForHeight = 'สมส่วน';
        else if (bmi >= 23 && bmi < 25) statuses.weightForHeight = 'ท้วม';
        else if (bmi >= 25) statuses.weightForHeight = 'อ้วน';
    }

    return statuses;
};


const HealthRecordModal = ({ onClose }) => {
    const [selectedGrade, setSelectedGrade] = React.useState('p1');
    const [students, setStudents] = React.useState([]);
    const [healthData, setHealthData] = React.useState({});
    const [isLoading, setIsLoading] = React.useState(true);
    const [isSaving, setIsSaving] = React.useState(false);
    const [term, setTerm] = React.useState('term1');

    const today = new Date();
    const currentYear = today.getFullYear() + 543;
    const currentMonth = today.toLocaleString('th-TH', { month: 'long' });

    React.useEffect(() => {
        if (!db || !selectedGrade) return;
        setIsLoading(true);

        const rosterBasePath = `artifacts/${appId}/public/data/rosters/${selectedGrade}`;
        const healthCollectionPath = `artifacts/${appId}/public/data/health_records/${selectedGrade}-${currentYear}-${term}/records`;

        const studentsQuery = query(collection(db, `${rosterBasePath}/students`), orderBy("studentNumber"));
        const unsubStudents = onSnapshot(studentsQuery, (snapshot) => {
            const studentList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setStudents(studentList);

            const healthQuery = query(collection(db, healthCollectionPath));
            const unsubHealth = onSnapshot(healthQuery, (healthSnapshot) => {
                const data = {};
                healthSnapshot.docs.forEach(doc => { data[doc.id] = doc.data(); });
                setHealthData(data);
                setIsLoading(false);
            }, () => {
                setHealthData({});
                setIsLoading(false);
            });
            return () => unsubHealth();
        }, (error) => {
            console.error("Error fetching students:", error);
            setIsLoading(false);
        });
        return () => unsubStudents();
    }, [selectedGrade, currentYear, term]);
    
    const handleDataChange = (studentId, field, value) => {
        const parsedValue = value === '' ? null : parseFloat(value);
        setHealthData(prev => ({ ...prev, [studentId]: { ...prev[studentId], [field]: parsedValue } }));
    };

    const handleSaveAll = async () => {
        setIsSaving(true);
        try {
            const healthCollectionPath = `artifacts/${appId}/public/data/health_records/${selectedGrade}-${currentYear}-${term}/records`;
            const batch = writeBatch(db);
            
            Object.keys(healthData).forEach(studentId => {
                const data = healthData[studentId];
                if(data && (data.weight || data.height)) {
                     const docRef = doc(db, healthCollectionPath, studentId);
                     batch.set(docRef, { ...data, lastUpdated: new Date() }, { merge: true });
                }
            });
            
            await batch.commit();
            logActivity('HEALTH_RECORD_SAVE', `บันทึกข้อมูลสุขภาพ ป.${selectedGrade.replace('p','')} ปีการศึกษา ${currentYear} เทอม ${term.replace('term','')}`);
            alert('บันทึกข้อมูลเรียบร้อย!');
        } catch (error) {
            console.error("Error saving health data:", error);
            alert('เกิดข้อผิดพลาด: ' + error.message);
        } finally {
            setIsSaving(false);
        }
    };
    
    const handlePrint = () => { window.print(); };

    const handleExport = () => {
        const exportData = students.map(student => {
            const studentHealth = healthData[student.id] || {};
            const age = calculateAge(student.birthDate);
            const statuses = getDetailedGrowthStatus(student.gender, age.years, studentHealth.weight, studentHealth.height);

            return {
                'ลำดับที่': student.studentNumber,
                'ชื่อ - สกุล': `${student.firstName} ${student.lastName}`,
                'เพศ': student.gender === 'ชาย' ? '1' : '2',
                'อายุ(ปี)': age.years || '',
                'อายุ(เดือน)': age.months || '',
                'น้ำหนัก(กก.)': studentHealth.weight || '',
                'ส่วนสูง(ซม.)': studentHealth.height || '',
                'น้ำหนักเทียบอายุ': statuses.weightForAge,
                'ส่วนสูงเทียบอายุ': statuses.heightForAge,
                'น้ำหนักเทียบส่วนสูง': statuses.weightForHeight
            };
        });

        const csv = Papa.unparse(exportData);
        const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `health_record_p${selectedGrade.replace('p','')}_${currentYear}_${term}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:bg-white print:block print:p-8">
            <div className="bg-gray-800/80 backdrop-blur-xl border border-rose-500/50 rounded-2xl w-full max-w-6xl h-[90vh] flex flex-col shadow-2xl print:hidden" onClick={(e) => e.stopPropagation()}>
                <header className="flex items-center justify-between p-4 border-b border-white/10 flex-shrink-0">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3"><Icon name="HeartPulse" />บันทึกข้อมูลสุขภาพ</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><Icon name="X" size={28} /></button>
                </header>
                
                <div className="p-4 flex flex-wrap items-center justify-between gap-4 border-b border-white/10">
                    <div className="flex items-center gap-2">
                         {grades.map((gradeId, index) => (
                            <button key={gradeId} onClick={() => setSelectedGrade(gradeId)} className={`px-3 py-1.5 text-sm font-bold rounded-lg transition-colors ${selectedGrade === gradeId ? 'bg-rose-500 text-white' : 'bg-gray-700/50 hover:bg-gray-700 text-gray-300'}`}>
                                ป.{index + 1}
                            </button>
                        ))}
                    </div>
                     <div className="flex items-center gap-2 bg-gray-900/50 p-1 rounded-lg">
                        <span className="text-sm font-bold text-gray-300 px-2">ปีการศึกษา {currentYear}</span>
                        <button onClick={() => setTerm('term1')} className={`px-3 py-1 text-xs rounded ${term === 'term1' ? 'bg-rose-500' : ''}`}>เทอม 1</button>
                        <button onClick={() => setTerm('term2')} className={`px-3 py-1 text-xs rounded ${term === 'term2' ? 'bg-rose-500' : ''}`}>เทอม 2</button>
                    </div>
                </div>

                <div className="p-6 flex-grow overflow-auto">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full"><Icon name="Loader2" className="animate-spin text-rose-400" size={40} /></div>
                    ) : (
                        <table className="w-full text-left table-auto">
                            <thead>
                                <tr>
                                    <th className="p-2 text-sm text-white w-16">เลขที่</th>
                                    <th className="p-2 text-sm text-white">ชื่อ-สกุล</th>
                                    <th className="p-2 text-sm text-white text-center w-24">เพศ</th>
                                    <th className="p-2 text-sm text-white text-center w-32">อายุ</th>
                                    <th className="p-2 text-sm text-white text-center w-32">น้ำหนัก (kg)</th>
                                    <th className="p-2 text-sm text-white text-center w-32">ส่วนสูง (cm)</th>
                                    <th className="p-2 text-sm text-white text-center w-32">เกณฑ์ (สูง/น้ำหนัก)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map(student => {
                                    const studentHealth = healthData[student.id] || {};
                                    const age = calculateAge(student.birthDate);
                                    const statuses = getDetailedGrowthStatus(student.gender, age.years, studentHealth.weight, studentHealth.height);
                                    return (
                                        <tr key={student.id} className="border-b border-gray-700/50 hover:bg-white/5">
                                            <td className="p-2 text-center">{student.studentNumber}</td>
                                            <td className="p-2 truncate">{`${student.firstName} ${student.lastName}`}</td>
                                            <td className="p-2 text-center text-xs">{student.gender || 'N/A'}</td>
                                            <td className="p-2 text-center text-xs">{age.display}</td>
                                            <td className="p-1"><input type="number" step="0.1" value={studentHealth.weight || ''} onChange={(e) => handleDataChange(student.id, 'weight', e.target.value)} className="w-full bg-gray-700/50 rounded p-1.5 text-center" /></td>
                                            <td className="p-1"><input type="number" step="0.1" value={studentHealth.height || ''} onChange={(e) => handleDataChange(student.id, 'height', e.target.value)} className="w-full bg-gray-700/50 rounded p-1.5 text-center" /></td>
                                            <td className="p-2 text-center text-xs">{statuses.weightForHeight}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
                 <footer className="p-4 border-t border-white/10 flex justify-between items-center">
                    <div>
                        <button onClick={handleExport} className="flex items-center gap-2 text-sm bg-transparent hover:bg-white/10 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 border border-gray-600"><Icon name="Download" size={16} />Export to CSV</button>
                        <button onClick={handlePrint} className="ml-2 flex items-center gap-2 text-sm bg-transparent hover:bg-white/10 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 border border-gray-600"><Icon name="Printer" size={16} />พิมพ์รายงาน</button>
                    </div>
                    <button onClick={handleSaveAll} disabled={isSaving} className="flex items-center gap-2 py-2 px-6 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg transition-colors">
                        <Icon name="Save" size={18} />
                        {isSaving ? 'กำลังบันทึก...' : 'บันทึกข้อมูลทั้งหมด'}
                    </button>
                </footer>
            </div>

            <div className="hidden print:block font-sarabun text-black">
                <div className="text-center mb-4">
                    <h1 className="font-bold text-lg">แบบบันทึกน้ำหนัก - ส่วนสูง</h1>
                    <h2 className="text-base">ชั้นประถมศึกษาปีที่ {selectedGrade.replace('p','')} ปีการศึกษา {currentYear} โรงเรียนบ้านวังหิน</h2>
                    <h3 className="text-base">ประจำเดือน {currentMonth} พ.ศ. {currentYear}</h3>
                </div>
                <table className="w-full border-collapse border border-black text-xs print-table">
                    <thead>
                         <tr className="bg-gray-200">
                            <th className="border border-black p-1">ที่</th>
                            <th className="border border-black p-1">ชื่อ - สกุล</th>
                            <th className="border border-black p-1">เพศ</th>
                            <th className="border border-black p-1">อายุ (ปี)</th>
                            <th className="border border-black p-1">อายุ (เดือน)</th>
                            <th className="border border-black p-1">น้ำหนัก (กก.)</th>
                            <th className="border border-black p-1">ส่วนสูง (ซม.)</th>
                            <th className="border border-black p-1">น้ำหนักเทียบอายุ</th>
                            <th className="border border-black p-1">ส่วนสูงเทียบอายุ</th>
                            <th className="border border-black p-1">น้ำหนักเทียบส่วนสูง</th>
                        </tr>
                    </thead>
                    <tbody>
                        {students.map(student => {
                             const studentHealth = healthData[student.id] || {};
                             const age = calculateAge(student.birthDate);
                             const statuses = getDetailedGrowthStatus(student.gender, age.years, studentHealth.weight, studentHealth.height);
                             return (
                                <tr key={student.id}>
                                    <td className="border border-black p-1 text-center">{student.studentNumber}</td>
                                    <td className="border border-black p-1">{`${student.firstName} ${student.lastName}`}</td>
                                    <td className="border border-black p-1 text-center">{student.gender === 'ชาย' ? 'ช' : 'ญ'}</td>
                                    <td className="border border-black p-1 text-center">{age.years || ''}</td>
                                    <td className="border border-black p-1 text-center">{age.months || ''}</td>
                                    <td className="border border-black p-1 text-center">{studentHealth.weight || ''}</td>
                                    <td className="border border-black p-1 text-center">{studentHealth.height || ''}</td>
                                    <td className="border border-black p-1 text-center">{statuses.weightForAge}</td>
                                    <td className="border border-black p-1 text-center">{statuses.heightForAge}</td>
                                    <td className="border border-black p-1 text-center">{statuses.weightForHeight}</td>
                                </tr>
                             );
                        })}
                    </tbody>
                </table>
                 <div className="mt-12 flex justify-around text-center text-sm">
                    <div>
                        <p>ลงชื่อ..................................................</p>
                        <p>(..................................................)</p>
                        <p>ครูประจำชั้น</p>
                    </div>
                    <div>
                        <p>ลงชื่อ..................................................</p>
                        <p>(..................................................)</p>
                        <p>ผู้อำนวยการโรงเรียน</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HealthRecordModal;