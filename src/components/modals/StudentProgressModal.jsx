import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, PieChart, Pie, Cell, CartesianGrid } from 'recharts';
import { fetchAcademicTrend, fetchBehaviorStats, fetchHealthSeries, fetchAttendanceStats } from '../../api/studentProgress';
import Icon from '../../icons/Icon';
import { colorThemes } from '../../constants/theme';

const toJsDate = (value) => {
  if (!value) return null;
  if (value.toDate) return value.toDate();
  if (value instanceof Date) return value;
  return null;
};

const emptyStats = { มาเรียน: 0, ขาด: 0, ลา: 0, สาย: 0 };
const attendanceColors = {
  มาเรียน: '#22c55e',
  ขาด: '#f43f5e',
  ลา: '#f59e0b',
  สาย: '#38bdf8',
};

const StudentProgressModal = ({ student, grade, subjects, onClose }) => {
  const [loading, setLoading] = React.useState(true);
  const [academic, setAcademic] = React.useState([]);
  const [behavior, setBehavior] = React.useState({ positive: 0, needsAttention: 0, logs: [] });
  const [health, setHealth] = React.useState([]);
  const [attendance, setAttendance] = React.useState({ stats: emptyStats, absentDays: [] });
  const [error, setError] = React.useState('');
  const [aiSummary, setAiSummary] = React.useState('');
  const [parentComment, setParentComment] = React.useState('');
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [isGeneratingParent, setIsGeneratingParent] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [academicData, behaviorData, healthData, attendanceData] = await Promise.all([
          fetchAcademicTrend(student.id, grade, subjects),
          fetchBehaviorStats(student.id, grade, 30),
          fetchHealthSeries(student.id, grade),
          fetchAttendanceStats(student.id, grade, 30),
        ]);
        if (!mounted) return;
        setAcademic(academicData || []);
        setBehavior(behaviorData || behavior);
        setHealth(healthData || []);
        setAttendance(attendanceData || { stats: emptyStats, absentDays: [] });
      } catch (err) {
        console.error('Error loading progress data:', err);
        if (mounted) setError('โหลดข้อมูลไม่สำเร็จ โปรดลองใหม่อีกครั้ง');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [student.id, grade, subjects]);

  const attendanceChartData = React.useMemo(() => {
    const stats = attendance.stats || emptyStats;
    return Object.keys(stats).map((key) => ({ name: key, value: stats[key], color: attendanceColors[key] }));
  }, [attendance]);

  const academicTrend = React.useMemo(() => {
    const rows = [];
    academic.forEach((subject) => {
      subject.timeline.forEach((item) => {
        if (item.percentage === null) return;
        rows.push({
          subject: subject.subjectName,
          date: item.date || item.assignment,
          percentage: item.percentage,
        });
      });
    });
    return rows;
  }, [academic]);

  const behaviorSeries = React.useMemo(() => ([
    { name: 'เชิงบวก', value: behavior.positive, color: '#22c55e' },
    { name: 'ควรส่งเสริม', value: behavior.needsAttention, color: '#f97316' },
  ]), [behavior]);

  const handleGenerateAI = async () => {
    if (!academic?.length) return;
    setIsGenerating(true);
    setAiSummary('');
    setParentComment('');
    try {
      const behaviorText = behavior.logs.slice(0, 5).map((log) => `- ${log.tag} (${log.type === 'positive' ? 'เชิงบวก' : 'ควรส่งเสริม'})`).join('\n') || 'ไม่มีบันทึก';
      const subjectText = academic.map((sub) => {
        const done = sub.timeline.filter((t) => t.percentage !== null);
        const avg = done.length ? (done.reduce((s, t) => s + t.percentage, 0) / done.length).toFixed(1) : '-';
        return `วิชา${sub.subjectName}: ส่งแล้ว ${sub.submitted}/${sub.total} | ค่าเฉลี่ย ${avg}%`;
      }).join('\n');
      const attendanceText = attendanceChartData.map((s) => `${s.name} ${s.value} วัน`).join(', ');
      const healthText = health.map((h) => `${h.label}: ${h.weight || '-'}kg / ${h.height || '-'}cm`).join('; ') || 'ไม่มีข้อมูล';

      const prompt = `
      ช่วยสรุปภาพรวมรายบุคคลแบบสั้น 4-5 ประโยค
      ชื่อนักเรียน: ${student.firstName} ${student.lastName} ชั้น ป.${grade.replace('p','')}
      ผลการเรียน:
      ${subjectText}
      พฤติกรรมล่าสุด:
      ${behaviorText}
      การมาเรียน (30 วันที่ผ่านมา): ${attendanceText}
      สุขภาพ: ${healthText}
      ให้ระบุจุดเด่นและข้อแนะนำถัดไปที่เป็นเชิงบวก ใช้ภาษาไทยเข้าใจง่าย
      `;

      const { callGeminiAPI } = await import('../../api/gemini');
      const summary = await callGeminiAPI(prompt);
      setAiSummary(summary);
    } catch (err) {
      console.error('AI summary error:', err);
      setAiSummary('เกิดข้อผิดพลาดในการเรียก AI');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateParent = async () => {
    if (!aiSummary) return;
    setIsGeneratingParent(true);
    try {
      const { callGeminiAPI } = await import('../../api/gemini');
      const prompt = `
      นำข้อความนี้ไปเขียนใหม่เป็นคอมเมนต์ถึงผู้ปกครอง 3-4 ประโยค
      เน้นชมก่อน เสนอสิ่งที่ควรช่วยสนับสนุน และปิดท้ายด้วยความร่วมมือ
      ข้อความต้นฉบับ:
      "${aiSummary}"
      `;
      const result = await callGeminiAPI(prompt);
      setParentComment(result);
    } catch (err) {
      console.error('Parent comment error:', err);
      setParentComment('สร้างข้อความไม่สำเร็จ');
    } finally {
      setIsGeneratingParent(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[80] flex items-center justify-center p-3" onClick={onClose}>
      <div className="bg-[#0b1020] border border-slate-700 rounded-3xl w-full max-w-6xl h-[94vh] flex flex-col shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <header className="p-5 border-b border-slate-700 flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="text-xs text-slate-400 uppercase">ความคืบหน้าเชิงรายบุคคล</p>
            <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
              <Icon name="Sparkles" className="text-amber-400" /> {student.firstName} {student.lastName}
              <span className="text-sm font-normal text-slate-400">ป.{grade.replace('p','')}</span>
            </h2>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={handleGenerateAI} disabled={loading || isGenerating} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white text-sm font-bold px-4 py-2 rounded-xl shadow-lg transition">
              {isGenerating ? <Icon name="Loader2" className="animate-spin" size={16} /> : <Icon name="BrainCircuit" size={16} />}
              สรุปด้วย AI
            </button>
            {aiSummary && (
              <button onClick={handleGenerateParent} disabled={isGeneratingParent} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-100 text-sm font-bold px-4 py-2 rounded-xl border border-slate-600 transition">
                {isGeneratingParent ? <Icon name="Loader2" className="animate-spin" size={16} /> : <Icon name="MessageSquare" size={16} />}
                ข้อความถึงผู้ปกครอง
              </button>
            )}
            <button onClick={onClose} className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300">
              <Icon name="X" size={20} />
            </button>
          </div>
        </header>

        <div className="flex-grow overflow-y-auto p-5 space-y-4 custom-scrollbar">
          {error && <div className="bg-rose-500/10 text-rose-200 border border-rose-500/30 rounded-xl p-3 text-sm">{error}</div>}
          {loading ? (
            <div className="flex items-center justify-center h-full text-slate-400"><Icon name="Loader2" className="animate-spin" size={36} /></div>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <section className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon name="LineChart" className="text-teal-300" />
                    <h3 className="font-bold text-white">แนวโน้มคะแนน (ทุกวิชา)</h3>
                  </div>
                  {academicTrend.length === 0 ? (
                    <p className="text-sm text-slate-400">ยังไม่มีคะแนน</p>
                  ) : (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={academicTrend}>
                          <defs>
                            <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.8} />
                              <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.1} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                          <XAxis dataKey="date" tick={{ fill: '#cbd5e1', fontSize: 11 }} />
                          <YAxis domain={[0, 100]} tick={{ fill: '#cbd5e1', fontSize: 11 }} />
                          <Tooltip />
                          <Area type="monotone" dataKey="percentage" stroke="#22d3ee" fill="url(#scoreGradient)" strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-300">
                    {academic.map((sub, idx) => (
                      <div key={sub.subjectId} className="flex items-center gap-2 bg-slate-900/50 rounded-lg px-3 py-2 border border-white/5">
                        <span className={`w-2 h-2 rounded-full`} style={{ background: colorThemes[Object.keys(colorThemes)[idx % Object.keys(colorThemes).length]].hex }} />
                        <span className="truncate">{sub.subjectName}</span>
                        <span className="ml-auto text-slate-400">ส่ง {sub.submitted}/{sub.total}</span>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <Icon name="Activity" className="text-amber-300" />
                    <h3 className="font-bold text-white">พฤติกรรม 30 วันที่ผ่านมา</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="h-40">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={behaviorSeries} dataKey="value" nameKey="name" outerRadius={70} label>
                            {behaviorSeries.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="text-sm text-slate-200 space-y-2 max-h-40 overflow-y-auto">
                      {behavior.logs.length === 0 ? (
                        <p className="text-slate-400">ไม่มีบันทึกพฤติกรรม</p>
                      ) : (
                        behavior.logs.slice(0, 6).map((log) => (
                          <div key={log.id} className="flex items-start gap-2 text-xs bg-slate-900/50 rounded-lg p-2 border border-white/5">
                            <Icon name={log.icon || 'Dot'} className={log.type === 'positive' ? 'text-emerald-300' : 'text-amber-300'} size={14} />
                            <div>
                              <p className="text-slate-100">{log.tag}</p>
                              <p className="text-slate-500">{toJsDate(log.timestamp)?.toLocaleString('th-TH', { dateStyle: 'medium' })}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </section>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <section className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon name="HeartPulse" className="text-rose-300" />
                    <h3 className="font-bold text-white">สุขภาพ</h3>
                  </div>
                  {health.length === 0 ? (
                    <p className="text-sm text-slate-400">ยังไม่มีข้อมูลน้ำหนัก/ส่วนสูง</p>
                  ) : (
                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={health}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                          <XAxis dataKey="label" tick={{ fill: '#cbd5e1', fontSize: 11 }} />
                          <YAxis tick={{ fill: '#cbd5e1', fontSize: 11 }} />
                          <Tooltip />
                          <Bar dataKey="weight" name="น้ำหนัก (kg)" fill="#22d3ee" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="height" name="ส่วนสูง (cm)" fill="#f472b6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </section>

                <section className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon name="CheckSquare" className="text-lime-300" />
                    <h3 className="font-bold text-white">การมาเรียน 30 วันที่ผ่านมา</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={attendanceChartData} dataKey="value" nameKey="name" outerRadius={80} label>
                            {attendanceChartData.map((entry, index) => (
                              <Cell key={index} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="text-sm text-slate-200 space-y-2">
                      {attendanceChartData.map((d) => (
                        <div key={d.name} className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full" style={{ background: d.color }} />
                          <span>{d.name}</span>
                          <span className="ml-auto text-slate-400">{d.value} วัน</span>
                        </div>
                      ))}
                      {attendance.absentDays?.length > 0 && (
                        <div className="mt-2 text-xs text-rose-200">
                          วันที่ขาด/ลา: {attendance.absentDays.slice(0, 5).join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                </section>
              </div>

              {aiSummary && (
                <section className="bg-gradient-to-r from-indigo-900/60 to-purple-900/50 border border-indigo-500/30 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-2 text-white font-bold">
                    <Icon name="Sparkles" className="text-indigo-200" /> สรุปด้วย AI
                  </div>
                  <p className="text-slate-100 text-sm leading-relaxed whitespace-pre-wrap">{aiSummary}</p>
                  {parentComment && (
                    <div className="bg-slate-900/60 border border-teal-500/30 rounded-xl p-3">
                      <p className="text-teal-100 text-sm leading-relaxed whitespace-pre-wrap">{parentComment}</p>
                    </div>
                  )}
                </section>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentProgressModal;
