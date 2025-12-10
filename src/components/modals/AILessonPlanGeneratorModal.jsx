import React from 'react';
import Icon from '../../icons/Icon';
import { callGeminiAPI } from '../../api/gemini';

const gradeLevels = [
  'ประถมศึกษาปีที่ 1',
  'ประถมศึกษาปีที่ 2',
  'ประถมศึกษาปีที่ 3',
  'ประถมศึกษาปีที่ 4',
  'ประถมศึกษาปีที่ 5',
  'ประถมศึกษาปีที่ 6',
  'มัธยมศึกษาตอนต้น',
  'มัธยมศึกษาตอนปลาย',
];

const defaultLessonPlan = {
  topic: 'โครงสร้างพืชพื้นฐาน',
  gradeLevel: 'ประถมศึกษาปีที่ 5',
  duration: '60 นาที',
  overview:
    'แนะนำส่วนประกอบของพืชและหน้าที่สำคัญ เพื่อปูพื้นฐานก่อนเข้าสู่วิชาชีววิทยาเชิงลึก',
  objectives: [
    'อธิบายหน้าที่ของราก ลำต้น ใบ และดอกได้อย่างถูกต้อง',
    'จำแนกลักษณะสำคัญของพืชที่พบในท้องถิ่นได้',
  ],
  hook: 'แสดงภาพพืชแปลกๆ และถามว่า ถ้าไม่มีใบ/รากแล้วจะเกิดอะไรขึ้น?',
  lessonFlow: [
    {
      phase: 'Warm Up',
      duration: '10 นาที',
      description:
        'จับกลุ่มระดมสมองเกี่ยวกับสิ่งที่พืชต้องใช้ในการดำรงชีวิต และแชร์คำตอบ',
      tips: 'ใช้บัตรคำหรือรูปภาพเพื่อกระตุ้นการมีส่วนร่วมจากทุกคน',
    },
    {
      phase: 'Mini Lecture',
      duration: '15 นาที',
      description:
        'อธิบายหน้าที่ของส่วนต่างๆ ของพืช พร้อมตัวอย่างจริงประกอบ และให้จับคู่คำศัพท์',
      tips: 'ใช้สไลด์สั้น กระชับ และสอดแทรกคำถามเชิงคิดวิเคราะห์',
    },
    {
      phase: 'Hands-on Activity',
      duration: '20 นาที',
      description:
        'ให้นักเรียนออกไปสำรวจต้นไม้ในบริเวณโรงเรียน จดบันทึกรูป ร่างลักษณะ แล้วกลับมาสรุป',
      tips: 'เตรียมใบงานสำหรับบันทึก และคัดเลือกพื้นที่ที่ปลอดภัย',
    },
    {
      phase: 'Wrap Up & Reflection',
      duration: '15 นาที',
      description:
        'แต่ละกลุ่มนำเสนอหนึ่งสิ่งที่เรียนรู้ พร้อมตอบคำถามสะท้อนคิดจากครู',
      tips: 'ใช้กระดาน Padlet หรือกระดานจริงในการรวบรวมข้อค้นพบ',
    },
  ],
  essentialQuestions: [
    'ถ้าใบไม่สามารถสร้างอาหารได้ พืชจะมีวิธีชดเชยหรือไม่?',
    'ส่วนใดของพืชที่สำคัญที่สุดต่อการอยู่รอด เพราะอะไร?',
  ],
  assessments: {
    formative: ['ใบงานบันทึกการสำรวจ', 'การถาม-ตอบระหว่างกิจกรรม'],
    summative: ['แบบทดสอบสั้น 5 ข้อเกี่ยวกับหน้าที่ของส่วนต่างๆ ของพืช'],
  },
  extensions: [
    'มอบหมายให้นักเรียนปลูกพืชผักสวนครัวและบันทึกการเติบโต 1 สัปดาห์',
    'เชื่อมโยงกับวิทยาศาสตร์ โดยทดลองว่าปัจจัยใดส่งผลต่อการเจริญเติบโต',
  ],
  reflection:
    'ให้นักเรียนเขียนบันทึกสั้นๆ ว่าวันนี้พืชสอนอะไรเกี่ยวกับการใช้ชีวิตของมนุษย์',
};

const sanitizeJson = (raw) => raw.replace(/```json|```/g, '').trim();

const parseLessonPlan = (text) => {
  if (!text) return null;
  try {
    return JSON.parse(sanitizeJson(text));
  } catch {
    try {
      const start = text.indexOf('{');
      const end = text.lastIndexOf('}');
      if (start !== -1 && end !== -1) {
        return JSON.parse(text.slice(start, end + 1));
      }
    } catch {
      return null;
    }
  }
  return null;
};

const LessonSection = ({ icon, title, children }) => (
  <section className="rounded-2xl border border-white/10 bg-white/5 p-4 md:p-5">
    <header className="mb-3 flex items-center gap-3 text-white/90">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-white/80">
        <Icon name={icon} size={20} />
      </span>
      <h3 className="text-lg font-semibold">{title}</h3>
    </header>
    <div className="space-y-3 text-sm text-white/85">{children}</div>
  </section>
);

const renderList = (items) => (
  <ul className="space-y-2">
    {items.map((item, idx) => (
      <li key={idx} className="flex gap-2 text-white/80">
        <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-white/60" />
        <span className="leading-relaxed">{item}</span>
      </li>
    ))}
  </ul>
);

const stringifyPlan = (plan) => {
  const lines = [
    `หัวข้อ: ${plan.topic}`,
    `ระดับชั้น: ${plan.gradeLevel}`,
    `เวลาโดยประมาณ: ${plan.duration}`,
    '',
    `ภาพรวมแผน: ${plan.overview}`,
    '',
    'จุดประสงค์การเรียนรู้:',
    ...plan.objectives.map((o, idx) => `${idx + 1}. ${o}`),
    '',
    `กิจกรรมเปิดบทเรียน: ${plan.hook}`,
    '',
    'โครงสร้างแผนการสอน:',
    ...plan.lessonFlow.map(
      (flow, idx) =>
        `${idx + 1}. ${flow.phase} (${flow.duration}) - ${flow.description}${
          flow.tips ? ` | Tips: ${flow.tips}` : ''
        }`,
    ),
    '',
    'คำถามชวนคิด:',
    ...plan.essentialQuestions.map((q, idx) => `${idx + 1}. ${q}`),
    '',
    'การประเมิน (Formative):',
    ...plan.assessments.formative.map((a, idx) => `${idx + 1}. ${a}`),
    '',
    'การประเมิน (Summative):',
    ...plan.assessments.summative.map((a, idx) => `${idx + 1}. ${a}`),
    '',
    'ขยายความรู้เพิ่มเติม:',
    ...plan.extensions.map((ext, idx) => `${idx + 1}. ${ext}`),
    '',
    `บันทึกสะท้อนคิด: ${plan.reflection}`,
  ];

  return lines.join('\n');
};

const AILessonPlanGeneratorModal = ({ onClose }) => {
  const [topic, setTopic] = React.useState('');
  const [gradeLevel, setGradeLevel] = React.useState(gradeLevels[0]);
  const [duration, setDuration] = React.useState('60 นาที');
  const [focus, setFocus] = React.useState('');
  const [plan, setPlan] = React.useState(null);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [error, setError] = React.useState('');
  const [copied, setCopied] = React.useState(false);
  const [statusMessage, setStatusMessage] = React.useState('');

  const activePlan = plan || defaultLessonPlan;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(stringifyPlan(activePlan));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const handleGenerate = async () => {
    if (!topic.trim()) {
      alert('กรุณากรอกหัวข้อการสอนก่อนนะครับ');
      return;
    }
    setIsGenerating(true);
    setError('');
    setPlan(null);
    setStatusMessage('กำลังเตรียมข้อมูลสำหรับ AI...');

    const prompt = `
คุณเป็น Instructional Designer มืออาชีพสำหรับครูไทย
จงสร้างแผนการสอนในรูปแบบ JSON ตามโครงสร้างต่อไปนี้ โดยใช้ข้อมูลหัวข้อและระดับชั้นที่กำหนด
ทุกส่วนต้องเป็นภาษาไทยและเหมาะสมกับระดับชั้นนั้น ๆ

INPUT:
- topic: ${topic.trim()}
- gradeLevel: ${gradeLevel}
- duration: ${duration}
- additionalFocus: ${focus || 'ไม่ระบุ'}

OUTPUT JSON FORMAT:
{
  "topic": "...",
  "gradeLevel": "...",
  "duration": "...",
  "overview": "...",
  "objectives": ["...", "..."],
  "hook": "...",
  "lessonFlow": [
    {
      "phase": "Warm Up",
      "duration": "10 นาที",
      "description": "...",
      "tips": "..."
    }
  ],
  "essentialQuestions": ["...", "..."],
  "assessments": {
    "formative": ["...", "..."],
    "summative": ["...", "..."]
  },
  "extensions": ["...", "..."],
  "reflection": "..."
}

เงื่อนไขเพิ่มเติม:
1. lessonFlow ต้องมีอย่างน้อย 3 ช่วงเวลา (Warm Up, Main Activity, Wrap Up) และปรับให้เหมาะกับ duration
2. essentialQuestions ต้องชวนคิดเชิงลึก
3. กิจกรรมต้องสอดคล้องกับหัวข้อและเน้น Active Learning
4. extension ต้องช่วยต่อยอด หรือบูรณาการกับวิชาอื่น
5. ห้ามใส่เครื่องหมาย backticks หรือข้อความอธิบายเพิ่มเติมนอกเหนือจาก JSON`;

    try {
      setStatusMessage('AI กำลังร่างแผนการสอนให้คุณ...');
      const response = await callGeminiAPI(prompt);
      setStatusMessage('กำลังจัดรูปแบบแผนการสอน...');
      const generatedPlan = parseLessonPlan(response);

      if (!generatedPlan) {
        throw new Error('ไม่สามารถอ่านผลลัพธ์จาก AI ได้');
      }

      setPlan(generatedPlan);
      setStatusMessage('สร้างแผนการสอนสำเร็จ พร้อมใช้งาน');
      setTimeout(() => setStatusMessage(''), 3000);
    } catch (err) {
      console.error(err);
      setError(
        err.message ||
          'เกิดข้อผิดพลาดในการสร้างแผนการสอน กรุณาลองใหม่อีกครั้งภายหลัง',
      );
      setStatusMessage('เกิดข้อผิดพลาดในการสร้างแผนการสอน');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 px-4 py-8 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-5xl max-h-[90vh] flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#11162b]/95 shadow-[0_40px_80px_-35px_rgba(8,10,25,0.95)]"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-slate-400">
              AI Lesson Plan Generator
            </p>
            <h2 className="mt-1 text-xl font-semibold text-white">
              AI สร้างแผนการสอนอัจฉริยะ
            </h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-200 transition hover:bg-white/15"
            aria-label="ปิดหน้าต่าง"
          >
            <Icon name="X" size={18} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto border-b border-white/10">
          <div className="grid gap-6 px-6 py-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          <aside className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="space-y-3">
              <label className="text-sm font-medium text-white/85">หัวข้อการสอน</label>
              <input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="เช่น การสังเคราะห์ด้วยแสง ป.6"
                className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
              />
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-white/85">ระดับชั้น</label>
              <select
                value={gradeLevel}
                onChange={(e) => setGradeLevel(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
              >
                {gradeLevels.map((grade) => (
                  <option key={grade} value={grade} className="bg-[#11162b]">
                    {grade}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-white/85">
                เวลาโดยรวมของบทเรียน
              </label>
              <input
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="เช่น 60 นาที"
                className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
              />
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-white/85">
                จุดเน้นเพิ่มเติม (ถ้ามี)
              </label>
              <textarea
                value={focus}
                onChange={(e) => setFocus(e.target.value)}
                rows={3}
                placeholder="เช่น ต้องการเน้นกิจกรรมปฏิบัติ หรือเชื่อมโยงกับวิชาคณิตศาสตร์"
                className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-500 py-3 text-sm font-semibold text-white shadow-[0_15px_30px_-18px_rgba(79,70,229,0.8)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isGenerating ? (
                <>
                  <Icon name="Loader2" size={18} className="animate-spin" />
                  กำลังสร้างแผน...
                </>
              ) : (
                <>
                  <Icon name="Sparkles" size={18} />
                  สร้างแผนการสอนด้วย AI
                </>
              )}
            </button>
            {(isGenerating || statusMessage) && (
              <div
                className={`flex items-start gap-3 rounded-xl border ${
                  isGenerating
                    ? 'border-sky-400/40 bg-sky-500/10 text-sky-100'
                    : error
                    ? 'border-rose-400/40 bg-rose-500/10 text-rose-100'
                    : 'border-emerald-400/40 bg-emerald-500/10 text-emerald-100'
                } px-4 py-3 text-sm transition`}
              >
                <Icon
                  name={
                    isGenerating
                      ? 'Loader2'
                      : error
                      ? 'AlertTriangle'
                      : 'CheckCircle2'
                  }
                  size={18}
                  className={isGenerating ? 'animate-spin' : ''}
                />
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-[0.3em] opacity-70">
                    สถานะ
                  </p>
                  <p className="leading-snug">{statusMessage}</p>
                </div>
              </div>
            )}
            {error && (
              <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </p>
            )}
          </aside>

          <section className="space-y-5">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-white shadow-inner">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold">
                    {activePlan.topic} · {activePlan.gradeLevel}
                  </h3>
                  <p className="mt-1 text-sm text-white/70">
                    เวลาโดยประมาณ {activePlan.duration}
                  </p>
                </div>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-white/15"
                >
                  <Icon name="FilePlus" size={16} />
                  {copied ? 'คัดลอกแล้ว' : 'คัดลอกแผน'}
                </button>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-white/75">{activePlan.overview}</p>
            </div>

            <LessonSection icon="Target" title="จุดประสงค์การเรียนรู้">
              {renderList(activePlan.objectives)}
            </LessonSection>

            <LessonSection icon="Sparkles" title="กิจกรรมเปิดบทเรียน">
              <p className="leading-relaxed text-white/80">{activePlan.hook}</p>
            </LessonSection>

            <LessonSection icon="Timer" title="ผังการสอนรายช่วงเวลา">
              <div className="space-y-3">
                {activePlan.lessonFlow.map((flow, idx) => (
                  <div
                    key={`${flow.phase}-${idx}`}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white/80"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3 text-sm font-semibold text-white">
                      <span>{flow.phase}</span>
                      <span className="text-xs uppercase tracking-[0.3em] text-white/60">
                        {flow.duration}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-white/80">
                      {flow.description}
                    </p>
                    {flow.tips && (
                      <p className="mt-2 text-xs italic text-white/60">Tips: {flow.tips}</p>
                    )}
                  </div>
                ))}
              </div>
            </LessonSection>

            <LessonSection icon="Lightbulb" title="คำถามชวนคิด">
              {renderList(activePlan.essentialQuestions)}
            </LessonSection>

            <LessonSection icon="ClipboardCheck" title="การประเมินผล">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-white/70">
                    Formative
                  </h4>
                  {renderList(activePlan.assessments.formative)}
                </div>
                <div>
                  <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-white/70">
                    Summative
                  </h4>
                  {renderList(activePlan.assessments.summative)}
                </div>
              </div>
            </LessonSection>

            <LessonSection icon="TrendingUp" title="ไอเดียต่อยอด / การบ้าน">
              {renderList(activePlan.extensions)}
            </LessonSection>

            <LessonSection icon="BookOpen" title="สะท้อนคิดปิดท้าย">
              <p className="text-sm leading-relaxed text-white/80">{activePlan.reflection}</p>
            </LessonSection>
          </section>
          </div>
        </div>

        <footer className="flex items-center justify-end gap-3 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-xl border border-white/10 px-5 py-2 text-sm font-medium text-white/80 transition hover:bg-white/10"
          >
            ปิดหน้าต่าง
          </button>
        </footer>
      </div>
    </div>
  );
};

export default AILessonPlanGeneratorModal;
