// src/components/dashboard/RecentActivityFeed.jsx (The "Timeline" Version)
import React from 'react';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db, appId } from '../../firebase/firebase';
import Icon from '../../icons/Icon';

const RecentActivityFeed = () => {
    const [activities, setActivities] = React.useState([]);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        if (!db) return;
        const logPath = `artifacts/${appId}/public/data/activity_log`;
        const q = query(collection(db, logPath), orderBy("timestamp", "desc"), limit(10));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const activitiesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setActivities(activitiesData);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching activity log:", error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const timeSince = (date) => {
        if (!date || !date.toDate) return '';
        const seconds = Math.floor((new Date() - date.toDate()) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return `${Math.floor(interval)} ปีที่แล้ว`;
        interval = seconds / 2592000;
        if (interval > 1) return `${Math.floor(interval)} เดือนที่แล้ว`;
        interval = seconds / 86400;
        if (interval > 1) return `${Math.floor(interval)} วันที่แล้ว`;
        interval = seconds / 3600;
        if (interval > 1) return `${Math.floor(interval)} ชั่วโมงที่แล้ว`;
        interval = seconds / 60;
        if (interval > 1) return `${Math.floor(interval)} นาทีที่แล้ว`;
        return "เมื่อสักครู่";
    };

    const iconMap = {
        SUBJECT_CREATE: { icon: 'BookPlus', color: 'text-teal-400', bg: 'bg-teal-500/10' },
        SUBJECT_UPDATE: { icon: 'BookUp', color: 'text-sky-400', bg: 'bg-sky-500/10' },
        SUBJECT_DELETE: { icon: 'BookX', color: 'text-red-400', bg: 'bg-red-500/10' },
        STUDENT_ADD: { icon: 'UserPlus', color: 'text-green-400', bg: 'bg-green-500/10' },
        STUDENT_UPDATE: { icon: 'UserCog', color: 'text-blue-400', bg: 'bg-blue-500/10' },
        STUDENT_DELETE: { icon: 'UserMinus', color: 'text-orange-400', bg: 'bg-orange-500/10' },
        ASSIGNMENT_CREATE: { icon: 'FilePlus2', color: 'text-lime-400', bg: 'bg-lime-500/10' },
        ASSIGNMENT_UPDATE: { icon: 'FilePenLine', color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
        ASSIGNMENT_DELETE: { icon: 'FileX2', color: 'text-rose-400', bg: 'bg-rose-500/10' },
        SCORE_UPDATE: { icon: 'Save', color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
        ATTENDANCE_SAVE: { icon: 'CheckSquare', color: 'text-green-400', bg: 'bg-green-500/10' },
        SAVINGS_TRANSACTION: { icon: 'Wallet', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
        BEHAVIOR_LOG: { icon: 'HeartHandshake', color: 'text-amber-400', bg: 'bg-amber-500/10' },
        DEFAULT: { icon: 'History', color: 'text-gray-400', bg: 'bg-gray-700/50' }
    };

    return (
        <div className="flex min-h-[260px] max-h-[360px] flex-col rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-lg shadow-[0_25px_55px_-35px_rgba(15,23,42,0.8)]">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Icon name="History" className="text-gray-300" />
                รายการเคลื่อนไหวล่าสุด
            </h3>
            <div className="flex-grow overflow-y-auto pr-2">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <Icon name="Loader2" className="animate-spin text-gray-400" size={32} />
                    </div>
                ) : activities.length === 0 ? (
                    <div className="text-center py-10 h-full flex flex-col justify-center items-center">
                        <Icon name="History" className="mx-auto text-gray-500" size={40}/>
                        <p className="mt-2 text-sm text-gray-500">ยังไม่มีรายการเคลื่อนไหว</p>
                    </div>
                ) : (
                    <ul className="space-y-4">
                        {activities.map(activity => {
                            const style = iconMap[activity.type] || iconMap.DEFAULT;
                            return (
                                <li key={activity.id} className="flex items-start gap-3">
                                    <div className={`p-2 rounded-full mt-1 ${style.bg}`}>
                                        <Icon name={style.icon} size={16} className={style.color} />
                                    </div>
                                    <div>
                                        <p className="text-sm text-white leading-tight" dangerouslySetInnerHTML={{ __html: activity.message }}></p>
                                        <p className="text-xs text-gray-400 mt-0.5">{timeSince(activity.timestamp)}</p>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default RecentActivityFeed;
