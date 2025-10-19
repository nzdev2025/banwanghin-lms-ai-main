import React from 'react';
import { getDocs, collection } from 'firebase/firestore';
import { db, appId } from '../../firebase/firebase';
import { grades } from '../../constants/data';
import { gradeStyles } from '../../constants/theme';
import Icon from '../../icons/Icon';

const GradeSelectionModal = ({ subject, onSelect, onClose }) => {
    const [gradeCounts, setGradeCounts] = React.useState({});
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchCounts = async () => {
            if (!db) return;
            setIsLoading(true);
            const counts = {};
            const gradePromises = grades.map(async (gradeId) => {
                const studentsPath = `artifacts/${appId}/public/data/rosters/${gradeId}/students`;
                try {
                    const snapshot = await getDocs(collection(db, studentsPath));
                    counts[gradeId] = snapshot.size;
                } catch (error) { console.error(error); counts[gradeId] = 0; }
            });
            await Promise.all(gradePromises);
            setGradeCounts(counts);
            setIsLoading(false);
        };
        fetchCounts();
    }, [subject.id]);

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-gray-800/80 backdrop-blur-xl border border-white/20 rounded-2xl w-full max-w-3xl shadow-2xl shadow-black/50 p-8 text-center" onClick={(e) => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white"><Icon name="X" size={28} /></button>
                <h2 className="text-3xl font-bold text-white mb-2">เลือกชั้นเรียนสำหรับวิชา</h2>
                <p className="text-lg text-gray-300 mb-8">{subject.name}</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
                    {grades.map((gradeId, index) => {
                        const style = gradeStyles[gradeId];
                        return (
                            <button key={gradeId} onClick={() => onSelect(subject, gradeId)} className={`group w-full p-6 bg-white/5 hover:bg-white/10 border border-white/20 rounded-xl transition-all duration-300 transform hover:scale-105 flex flex-col items-center justify-center`}>
                                <Icon name={style.icon} className={`w-12 h-12 mb-3 transition-colors ${style.color}`} />
                                <span className="text-xl font-bold text-white">ป.{index + 1}</span>
                                <div className="flex items-center text-sm font-normal text-gray-400 mt-1">
                                    {isLoading ? <Icon name="Loader2" size={16} className="animate-spin" /> : <><Icon name="User" size={16} className="mr-1.5"/><span>{gradeCounts[gradeId] || 0} คน</span></>}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default GradeSelectionModal;
