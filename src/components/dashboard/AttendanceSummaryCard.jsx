import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db, appId } from '../../firebase/firebase';
import Icon from '../../icons/Icon';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

const AttendanceSummaryCard = ({ totalStudents = 0 }) => {
    const [stats, setStats] = useState({ present: 0, absent: 0, late: 0, leave: 0, totalChecked: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAttendance = async () => {
            if (!db || !appId) return;
            try {
                const today = new Date().toISOString().slice(0, 10);
                const ref = collection(db, `artifacts/${appId}/public/data/attendance`);
                const snapshot = await getDocs(ref);

                let p = 0, a = 0, l = 0, le = 0;

                snapshot.docs.forEach(doc => {
                    if (doc.id.endsWith(`-${today}`)) {
                        const data = doc.data();
                        Object.values(data).forEach(status => {
                            if (status === 'มาเรียน') p++;
                            else if (status === 'ขาด') a++;
                            else if (status === 'สาย') l++;
                            else if (status === 'ลา') le++;
                        });
                    }
                });

                setStats({
                    present: p,
                    absent: a,
                    late: l,
                    leave: le,
                    totalChecked: p + a + l + le
                });
            } catch (error) {
                console.error("Error fetching attendance summary:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAttendance();
    }, []);

    const data = [
        { name: 'มาเรียน', value: stats.present, color: '#ec4899' }, // Pink-500
        { name: 'สาย', value: stats.late, color: '#f59e0b' }, // Amber-500
        { name: 'ลา', value: stats.leave, color: '#0ea5e9' }, // Sky-500
        { name: 'ขาด', value: stats.absent, color: '#ef4444' }, // Red-500
    ].filter(d => d.value > 0);

    // If no data, show gray ring
    const chartData = data.length > 0 ? data : [{ name: 'รอเช็คชื่อ', value: 1, color: 'rgba(255,255,255,0.1)' }];

    const percentage = stats.totalChecked > 0
        ? Math.round(((stats.present + stats.late) / stats.totalChecked) * 100)
        : 0;

    if (loading) {
        return (
            <div className="relative overflow-hidden rounded-3xl p-1 bg-white/5 border border-white/10 shadow-xl h-full animate-pulse">
                <div className="h-full rounded-[20px] bg-slate-900/40 p-4 flex flex-col justify-between">
                    <div className="flex gap-2">
                        <div className="h-10 w-10 bg-white/10 rounded-xl"></div>
                        <div className="flex-1 space-y-2">
                            <div className="h-4 w-20 bg-white/10 rounded"></div>
                            <div className="h-3 w-12 bg-white/10 rounded"></div>
                        </div>
                    </div>
                    <div className="h-20 w-full bg-white/5 rounded-full mt-2"></div>
                </div>
            </div>
        );
    }


    return (
        <div className="relative overflow-hidden rounded-3xl p-[1px] bg-gradient-to-br from-slate-700 to-slate-800 shadow-xl h-full group">
            <div className="absolute inset-0 bg-gradient-to-r from-pink-500/20 via-rose-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

            <div className="relative h-full rounded-[23px] bg-slate-900/90 backdrop-blur-xl p-3 flex flex-col justify-between border border-white/5">

                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-gradient-to-br from-pink-500 to-rose-600 rounded-lg shadow-lg shadow-pink-500/20">
                            <Icon name="Users" size={16} className="text-white" />
                        </div>
                        <div>
                            <h3 className="text-xs font-bold text-white">การมาเรียนวันนี้</h3>
                            <p className="text-[10px] text-slate-400">เช็คแล้ว {stats.totalChecked} คน</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-rose-400">
                            {percentage}%
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium">เข้าเรียน</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 flex-1">
                    <div className="h-16 w-16 flex-shrink-0 relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    innerRadius={20}
                                    outerRadius={28}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', fontSize: '10px', color: '#fff', padding: '4px' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 rounded-full border-2 border-white/5 m-[8px]"></div>
                    </div>

                    <div className="flex-1 grid grid-cols-2 gap-1.5">
                        <div className="bg-white/5 rounded-lg p-1.5 flex flex-col items-center hover:bg-white/10 transition-colors border border-white/5">
                            <span className="text-[9px] text-slate-400 mb-0.5">มาเรียน</span>
                            <span className="text-sm font-black text-pink-400">{stats.present}</span>
                        </div>
                        <div className="bg-white/5 rounded-lg p-1.5 flex flex-col items-center hover:bg-white/10 transition-colors border border-white/5">
                            <span className="text-[9px] text-slate-400 mb-0.5">สาย</span>
                            <span className="text-sm font-black text-amber-400">{stats.late}</span>
                        </div>
                        <div className="bg-white/5 rounded-lg p-1.5 flex flex-col items-center hover:bg-white/10 transition-colors border border-white/5">
                            <span className="text-[9px] text-slate-400 mb-0.5">ลา</span>
                            <span className="text-sm font-black text-sky-400">{stats.leave}</span>
                        </div>
                        <div className="bg-white/5 rounded-lg p-1.5 flex flex-col items-center hover:bg-white/10 transition-colors border border-white/5">
                            <span className="text-[9px] text-slate-400 mb-0.5">ขาด</span>
                            <span className="text-sm font-black text-red-400">{stats.absent}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AttendanceSummaryCard;
