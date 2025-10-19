// src/components/classroom_tools/StudentPicker.jsx (The "Truly Responsive" Version)
import React from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db, appId } from '../../firebase/firebase';
import { grades } from '../../constants/data';
import Icon from '../../icons/Icon';

const StudentPicker = ({ size }) => { // รับ prop 'size'
    const [selectedGrade, setSelectedGrade] = React.useState('p1');
    const [students, setStudents] = React.useState([]);
    const [isLoading, setIsLoading] = React.useState(true);
    
    const [isPicking, setIsPicking] = React.useState(false);
    const [pickedStudent, setPickedStudent] = React.useState(null);
    const [allowDuplicates, setAllowDuplicates] = React.useState(true);
    const [pickedHistory, setPickedHistory] = React.useState([]);

    React.useEffect(() => {
        if (!db || !selectedGrade) return;
        setIsLoading(true);
        setPickedStudent(null);
        setPickedHistory([]); 
        const rosterBasePath = `artifacts/${appId}/public/data/rosters/${selectedGrade}`;
        const q = query(collection(db, `${rosterBasePath}/students`), orderBy("studentNumber"));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setStudents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching students:", error);
            setIsLoading(false);
        });
        
        return () => unsubscribe();
    }, [selectedGrade]);

    const handlePickStudent = () => {
        const availableStudents = allowDuplicates 
            ? students 
            : students.filter(s => !pickedHistory.includes(s.id));

        if (availableStudents.length === 0) {
            alert("สุ่มครบทุกคนแล้ว! กรุณากด 'เริ่มรอบใหม่'");
            return;
        }
        
        setIsPicking(true);
        setPickedStudent(null);

        let shuffleCount = 0;
        const shuffleInterval = setInterval(() => {
            const randomIndex = Math.floor(Math.random() * availableStudents.length);
            const chosenOne = availableStudents[randomIndex];
            setPickedStudent(chosenOne);
            
            shuffleCount++;
            if (shuffleCount > 20) {
                clearInterval(shuffleInterval);
                setIsPicking(false);
                if (!allowDuplicates) {
                    setPickedHistory(prev => [...prev, chosenOne.id]);
                }
            }
        }, 100);
    };
    
    const handleReset = () => {
        setPickedHistory([]);
        setPickedStudent(null);
    };

    const remainingCount = students.length - pickedHistory.length;
    
    const getResponsiveClass = (baseClass, largeClass, threshold = 600) => {
        return `transition-all duration-300 ${size?.width > threshold ? largeClass : baseClass}`;
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
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">ตัวเลือกการสุ่ม</label>
                        <div className="flex bg-gray-700/50 p-1 rounded-lg">
                            <button onClick={() => setAllowDuplicates(true)} className={`px-3 py-1 text-xs rounded ${allowDuplicates ? 'bg-amber-500' : ''}`}>สุ่มซ้ำได้</button>
                            <button onClick={() => setAllowDuplicates(false)} className={`px-3 py-1 text-xs rounded ${!allowDuplicates ? 'bg-amber-500' : ''}`}>ไม่ซ้ำ</button>
                        </div>
                    </div>
                    {!allowDuplicates && (
                        <button onClick={handleReset} className="flex items-center gap-2 text-sm text-sky-300 hover:text-sky-200 h-[42px]">
                            <Icon name="RotateCw" size={16}/> เริ่มรอบใหม่ ({remainingCount} คน)
                        </button>
                    )}
                </div>
                <button 
                    onClick={handlePickStudent}
                    disabled={isPicking || students.length === 0}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:opacity-90 text-white font-bold py-3 px-8 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-wait"
                >
                    <Icon name="Shuffle" size={20}/>
                    {isPicking ? 'กำลังสุ่ม...' : 'สุ่มเลือกนักเรียน'}
                </button>
            </div>

            <div className="flex-grow bg-gray-900/50 rounded-xl p-6 flex items-center justify-center text-center">
                 {isLoading ? (
                    <Icon name="Loader2" className="animate-spin text-amber-400" size={48} />
                ) : pickedStudent ? (
                    <div className="animate-fade-in">
                        <p className={getResponsiveClass('text-xl', 'text-2xl')}>ผู้โชคดีคือ...</p>
                        <h2 className={`font-bold text-amber-300 my-2 duration-100 ${isPicking ? 'blur-md' : 'blur-0'} ${getResponsiveClass('text-4xl', 'text-6xl', 550)}`}>
                            {pickedStudent.firstName} {pickedStudent.lastName}
                        </h2>
                        <p className={getResponsiveClass('text-lg', 'text-xl')}>เลขที่ {pickedStudent.studentNumber}</p>
                    </div>
                ) : (
                    <div className="text-center text-gray-500">
                        <p>มีนักเรียนทั้งหมด {students.length} คนในห้องนี้</p>
                        {!allowDuplicates && <p>เหลือให้สุ่มอีก {remainingCount} คน</p>}
                        <p className="mt-4">คลิกปุ่ม "สุ่มเลือกนักเรียน" เพื่อเริ่ม</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentPicker;