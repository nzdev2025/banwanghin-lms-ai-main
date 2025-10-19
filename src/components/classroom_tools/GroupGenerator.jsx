// src/components/classroom_tools/GroupGenerator.jsx (The "Dynamic Grid" Version)
import React from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db, appId } from '../../firebase/firebase';
import { grades } from '../../constants/data';
import Icon from '../../icons/Icon';

const GroupGenerator = () => {
    const [selectedGrade, setSelectedGrade] = React.useState('p1');
    const [students, setStudents] = React.useState([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [numGroups, setNumGroups] = React.useState(2);
    const [generatedGroups, setGeneratedGroups] = React.useState([]);

    React.useEffect(() => {
        if (!db || !selectedGrade) return;
        setIsLoading(true);
        setGeneratedGroups([]);
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
    
    const shuffleArray = (array) => {
        let currentIndex = array.length, randomIndex;
        while (currentIndex !== 0) {
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;
            [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
        }
        return array;
    };

    const handleGenerateGroups = () => {
        if (students.length === 0 || numGroups <= 0) return;
        const shuffledStudents = shuffleArray([...students]);
        const newGroups = Array.from({ length: numGroups }, () => []);
        shuffledStudents.forEach((student, index) => {
            newGroups[index % numGroups].push(student);
        });
        setGeneratedGroups(newGroups);
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex-shrink-0 flex flex-wrap items-end justify-between gap-4 mb-6">
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
                        <label className="block text-sm font-medium text-gray-300 mb-1">จำนวนกลุ่ม</label>
                        <input 
                            type="number"
                            value={numGroups}
                            onChange={e => setNumGroups(Math.max(1, parseInt(e.target.value) || 1))}
                            min="1"
                            max={students.length || 1}
                            className="bg-gray-700/50 border border-gray-600 rounded-lg p-2 text-white h-[42px] w-24"
                        />
                    </div>
                </div>
                <button 
                    onClick={handleGenerateGroups}
                    disabled={students.length === 0}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:opacity-90 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 disabled:opacity-50"
                >
                    <Icon name="UsersRound" size={20}/>
                    สร้างกลุ่ม
                </button>
            </div>

            <div className="flex-grow bg-gray-900/50 rounded-xl p-4 overflow-auto">
                 {isLoading ? (
                    <div className="flex items-center justify-center h-full"><Icon name="Loader2" className="animate-spin text-amber-400" size={48} /></div>
                ) : generatedGroups.length > 0 ? (
                    // --- 🚀 UPGRADE: ใช้ CSS Grid ที่ปรับคอลัมน์อัตโนมัติ ---
                    <div 
                        className="grid gap-4"
                        style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}
                    >
                        {generatedGroups.map((group, index) => (
                            <div key={index} className="bg-gray-800/60 border border-white/10 rounded-lg p-3">
                                <h4 className="font-bold text-amber-300 mb-2">กลุ่มที่ {index + 1}</h4>
                                <ul className="space-y-1">
                                    {group.map(student => (
                                        <li key={student.id} className="text-sm text-white truncate">{student.firstName} {student.lastName}</li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full text-center text-gray-500">
                        <p>มีนักเรียนทั้งหมด {students.length} คนในห้องนี้<br/>กำหนดจำนวนกลุ่มแล้วกด "สร้างกลุ่ม"</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GroupGenerator;