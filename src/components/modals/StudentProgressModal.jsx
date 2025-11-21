import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from 'recharts';
import { fetchAcademicTrend, fetchBehaviorStats, fetchHealthSeries, fetchAttendanceStats } from '../../api/studentProgress';
import Icon from '../../icons/Icon';
import { colorThemes } from '../../constants/theme';

const toJsDate = (value) => {
  if (!value) return null;
  if (value.toDate) return value.toDate();
  if (value instanceof Date) return value;
  return null;
};

const bmi = (weight, height) => {
  if (!weight || !height) return null;
  const h = height / 100;
  return weight / (h * h);
};

const trendFromDelta = (delta) => {
  if (delta === null || Number.isNaN(delta)) return 'flat';
  if (delta > 5) return 'up';
  if (delta < -5) return 'down';
  return 'flat';
};

const trendCopy = {
  up: { text: 'ดีขึ้น', color: 'text-emerald-300', bg: 'bg-emerald-500/10' },
  flat: { text: 'ทรงตัว', color: 'text-slate-200', bg: 'bg-slate-500/10' },
  down: { text: 'แย่ลง', color: 'text-rose-300', bg: 'bg-rose-500/10' },
};

const attendanceColors = {
  มาเรียน: '#22c55e',
  ขาด: '#f43f5e',
  ลา: '#f59e0b',
  สาย: '#38bdf8',
};

const rangeOptions = [
  { key: '7', label: '7 วัน' },
  { key: '30', label: '30 วัน' },
  { key: '120', label: 'เทอม (120 วัน)' },
];

const formatDeltaText = (delta, unit = '%') => {
  if (delta === null || Number.isNaN(delta)) return '—';
  const sign = delta > 0 ? '+' : '';
  return `${sign}${delta.toFixed(1)}${unit}`;
};

const StudentProgressModal = ({ student, grade, subjects, onClose }) => {
  const [loading, setLoading] = React.useState(true);
  const [academic, setAcademic] = React.useState([]);
  const [behavior, setBehavior] = React.useState({ positive: 0, needsAttention: 0, logs: [] });
  const [health, setHealth] = React.useState([]);
  const [attendance, setAttendance] = React.useState({ stats: { มาเรียน: 0, ขาด: 0, ลา: 0, สาย: 0 }, absentDays: [] });
  const [error, setError] = React.useState('');
  const [aiSummary, setAiSummary] = React.useState('');
  const [parentComment, setParentComment] = React.useState('');
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [isGeneratingParent, setIsGeneratingParent] = React.useState(false);
  const [range, setRange] = React.useState('30');

  React.useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError('');
      const days = parseInt(range, 10) || 30;
      try {
        const [academicData, behaviorData, healthData, attendanceData] = await Promise.all([
          fetchAcademicTrend(student.id, grade, subjects),
          fetchBehaviorStats(student.id, grade, days * 2),
          fetchHealthSeries(student.id, grade),
          fetchAttendanceStats(student.id, grade, days * 2),
        ]);
        if (!mounted) return;
        setAcademic(academicData || []);
        setBehavior(behaviorData || behavior);
        setHealth(healthData || []);
        setAttendance(attendanceData || { stats: { มาเรียน: 0, ขาด: 0, ลา: 0, สาย: 0 }, absentDays: [] });
      } catch (err) {
        console.error('Error loading progress data:', err);
        if (mounted) setError('โหลดข้อมูลไม่สำเร็จ โปรดลองใหม่อีกครั้ง');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [student.id, grade, subjects, range]);

  // Derived computations
  const scoreDelta = React.useMemo(() => {
    const days = parseInt(range, 10) || 30;
    const now = new Date();
    const startCurrent = new Date(now);
    startCurrent.setDate(now.getDate() - days + 1);
    const startPrev = new Date(startCurrent);
    startPrev.setDate(startCurrent.getDate() - days);
    const endPrev = new Date(startCurrent);
    endPrev.setDate(startCurrent.getDate() - 1);

    const getAvg = (items) => {
      const vals = items.filter((x) => typeof x.percentage === 'number').map((x) => x.percentage);
      if (!vals.length) return null;
      const sum = vals.reduce((s, v) => s + v, 0);
      return sum / vals.length;
    };

    const currentItems = [];
    const prevItems = [];
    academic.forEach((sub) => {
      sub.timeline.forEach((t) => {
        const d = t.jsDate || (t.date ? new Date(t.date) : null);
        if (!d || Number.isNaN(d.getTime())) return;
        if (d >= startCurrent) currentItems.push(t);
        else if (d >= startPrev && d <= endPrev) prevItems.push(t);
      });
    });

    const currentAvg = getAvg(currentItems);
    const previousAvg = getAvg(prevItems);
    const delta = currentAvg !== null && previousAvg !== null ? currentAvg - previousAvg : null;
    return { currentAvg, previousAvg, delta };
  }, [academic, range]);

  const behaviorDelta = React.useMemo(() => {
    const days = parseInt(range, 10) || 30;
    const now = new Date();
    const startCurrent = new Date(now);
    startCurrent.setDate(now.getDate() - days + 1);
    const startPrev = new Date(startCurrent);
    startPrev.setDate(startCurrent.getDate() - days);
    const endPrev = new Date(startCurrent);
    endPrev.setDate(startCurrent.getDate() - 1);

    const currentLogs = [];
    const prevLogs = [];
    (behavior.logs || []).forEach((log) => {
      const d = toJsDate(log.timestamp);
      if (!d) return;
      if (d >= startCurrent) currentLogs.push(log);
      else if (d >= startPrev && d <= endPrev) prevLogs.push(log);
    });

    const ratio = (logs) => {
      const pos = logs.filter((l) => l.type === 'positive').length;
      const neg = logs.filter((l) => l.type !== 'positive').length;
      const total = pos + neg;
      if (!total) return { ratio: null, pos, neg };
      return { ratio: (pos / total) * 100, pos, neg };
    };

    const cur = ratio(currentLogs);
    const prev = ratio(prevLogs);
    const delta = cur.ratio !== null && prev.ratio !== null ? cur.ratio - prev.ratio : null;
    return { currentRatio: cur.ratio, previousRatio: prev.ratio, delta, pos: cur.pos, neg: cur.neg };
  }, [behavior, range]);

  const healthDelta = React.useMemo(() => {
    if (!health.length) return { bmiNow: null, bmiPrev: null, delta: null, weightDelta: null, heightDelta: null };
    const sorted = [...health].sort((a, b) => (a.updatedAt || 0) - (b.updatedAt || 0));
    const latest = sorted[sorted.length - 1];
    const prev = sorted.length > 1 ? sorted[sorted.length - 2] : null;
    const bmiNow = bmi(latest.weight, latest.height);
    const bmiPrev = prev ? bmi(prev.weight, prev.height) : null;
    return {
      bmiNow,
      bmiPrev,
      delta: bmiNow !== null && bmiPrev !== null ? bmiNow - bmiPrev : null,
      weightDelta: prev && latest.weight != null && prev.weight != null ? latest.weight - prev.weight : null,
      heightDelta: prev && latest.height != null && prev.height != null ? latest.height - prev.height : null,
    };
  }, [health]);

  const attendanceChartData = React.useMemo(() => {
    const stats = attendance.stats || { มาเรียน: 0, ขาด: 0, ลา: 0, สาย: 0 };
    return Object.keys(stats).map((key) => ({ name: key, value: stats[key], color: attendanceColors[key] }));
  }, [attendance]);

  const behaviorSeries = React.useMemo(() => ([
    { name: 'เชิงบวก', value: behavior.positive, color: '#22c55e' },
    { name: 'ควรส่งเสริม', value: behavior.needsAttention, color: '#f97316' },
  ]), [behavior]);

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
      การมาเรียน (ช่วง ${range} วัน): ${attendanceText}
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

  const scoreTrend = trendCopy[trendFromDelta(scoreDelta.delta)];
  const behaviorTrend = trendCopy[trendFromDelta(behaviorDelta.delta)];
  const healthTrend = trendCopy[trendFromDelta(healthDelta.delta)];

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
          <div className="flex gap-2 flex-wrap items-center">
            <select
              value={range}
              onChange={(e) => setRange(e.target.value)}
              className="bg-slate-900 border border-slate-600 text-slate-200 text-sm rounded-xl px-3 py-2"
            >
              {rangeOptions.map((opt) => (
                <option key={opt.key} value={opt.key}>{opt.label}</option>
              ))}
            </select>
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-300 flex items-center gap-2"><Icon name="Target" />คะแนนรวม</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${scoreTrend.bg} ${scoreTrend.color}`}>{scoreTrend.text}</span>
                  </div>
                  <p className="text-2xl font-bold text-white mt-2">{scoreDelta.currentAvg !== null ? `${scoreDelta.currentAvg.toFixed(1)}%` : '—'}</p>
                  <p className="text-xs text-slate-400">เทียบช่วงก่อนหน้า: {formatDeltaText(scoreDelta.delta)}</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-300 flex items-center gap-2"><Icon name="SmilePlus" />พฤติกรรมเชิงบวก</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${behaviorTrend.bg} ${behaviorTrend.color}`}>{behaviorTrend.text}</span>
                  </div>
                  <p className="text-2xl font-bold text-white mt-2">{behaviorDelta.currentRatio !== null ? `${behaviorDelta.currentRatio.toFixed(1)}%` : '—'}</p>
                  <p className="text-xs text-slate-400">เทียบช่วงก่อนหน้า: {formatDeltaText(behaviorDelta.delta)}</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-300 flex items-center gap-2"><Icon name="HeartPulse" />สุขภาพ (BMI)</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${healthTrend.bg} ${healthTrend.color}`}>{healthTrend.text}</span>
                  </div>
                  <p className="text-2xl font-bold text-white mt-2">{healthDelta.bmiNow !== null ? healthDelta.bmiNow.toFixed(1) : '—'}</p>
                  <p className="text-xs text-slate-400">Δ น้ำหนัก {formatDeltaText(healthDelta.weightDelta, 'kg')}</p>
                </div>
              </div>

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
                        <span className="w-2 h-2 rounded-full" style={{ background: colorThemes[Object.keys(colorThemes)[idx % Object.keys(colorThemes).length]].hex }} />
                        <span className="truncate">{sub.subjectName}</span>
                        <span className="ml-auto text-slate-400">ส่ง {sub.submitted}/{sub.total}</span>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <Icon name="Activity" className="text-amber-300" />
                    <h3 className="font-bold text-white">พฤติกรรม (ช่วง {range} วัน + ย้อนหลังเทียบ)</h3>
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
                  <div className="text-xs text-slate-400">
                    เชิงบวก {behaviorDelta.pos} รายการ / ควรส่งเสริม {behaviorDelta.neg} ในช่วง {range} วัน
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
                  {healthDelta.bmiNow !== null && (
                    <div className="mt-2 text-xs text-slate-300">
                      BMI ล่าสุด {healthDelta.bmiNow.toFixed(1)} | Δ BMI {formatDeltaText(healthDelta.delta)} | Δ น้ำหนัก {formatDeltaText(healthDelta.weightDelta, 'kg')} | Δ ส่วนสูง {formatDeltaText(healthDelta.heightDelta, 'cm')}
                    </div>
                  )}
                </section>

                <section className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon name="CheckSquare" className="text-lime-300" />
                    <h3 className="font-bold text-white">การมาเรียน (ดูประกอบ)</h3>
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
                          วันที่ขาด/ลา (ล่าสุด): {attendance.absentDays.slice(0, 5).join(', ')}
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
