import React from 'react';
import { callGeminiAPI } from '../../api/gemini';
import Icon from '../../icons/Icon';

const parseJsonSafe = (text) => {
  if (!text) return null;
  try {
    return JSON.parse(text);
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

const AIQuizSetGeneratorModal = ({ onClose, onApply }) => {
  const [form, setForm] = React.useState({
    subject: '',
    topic: '',
    focus: '',
    numQuestions: 5,
    difficulty: 'medium',
    optionCount: 4,
  });
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [error, setError] = React.useState('');
  const [result, setResult] = React.useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === 'numQuestions' || name === 'optionCount' ? Number(value) : value,
    }));
  };

  const buildPrompt = () => {
    return `
คุณเป็นผู้เชี่ยวชาญสร้างข้อสอบแบบปรนัย (multiple choice) สำหรับเด็กไทย
จงสร้างชุดคำถามที่สั้น กระชับ ตรงหัวข้อ และมีเฉลย

เงื่อนไข:
- วิชา/บริบท: ${form.subject || 'ทั่วไป'}
- หัวข้อหลัก: ${form.topic || 'ไม่ระบุ'}
- ประเด็นเน้น: ${form.focus || 'ไม่ระบุ'}
- จำนวนข้อ: ${form.numQuestions}
- จำนวนตัวเลือกต่อข้อ: ${form.optionCount} ตัวเลือก
- ระดับ: ${form.difficulty} (easy/medium/hard)
- ภาษา: ภาษาไทยทั้งหมด
- รูปแบบผลลัพธ์ JSON:
{
  "title": "ชื่อชุดข้อสอบย่อ",
  "topic": "หัวข้อ/คำอธิบายสั้น",
  "questions": [
    {
      "text": "โจทย์",
      "options": ["ตัวเลือก 1", "ตัวเลือก 2", "..."],
      "answerIndex": 0
    }
  ]
}
- answerIndex คือ index ของตัวเลือกที่ถูกต้อง (เริ่มที่ 0)
- เนื้อหาต้องตรงหัวข้อและไม่หลุดประเด็น
`;
  };

  const handleGenerate = async () => {
    if (!form.topic.trim()) {
      setError('กรุณาระบุหัวข้อหลัก (topic)');
      return;
    }
    setIsGenerating(true);
    setError('');
    setResult(null);
    try {
      const prompt = buildPrompt();
      const response = await callGeminiAPI(prompt);
      const parsed = parseJsonSafe(response);
      if (!parsed || !parsed.questions || !Array.isArray(parsed.questions)) {
        setError('รูปแบบผลลัพธ์ไม่ถูกต้อง โปรดลองอีกครั้ง');
        return;
      }
      setResult(parsed);
    } catch (err) {
      console.error('AI quiz generation failed', err);
      const isOverloaded = String(err?.message || '').includes('overloaded') || String(err).includes('UNAVAILABLE');
      if (isOverloaded) {
        setError('โมเดลยุ่งมาก (503) กรุณาลองใหม่อีกครั้งในอีกสักครู่');
      } else {
        setError('ไม่สามารถสร้างข้อสอบได้ โปรดลองใหม่');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApply = () => {
    if (!result) return;
    onApply({
      title: result.title || form.topic || 'AI Quiz Set',
      topic: result.topic || form.topic,
      instructions: `สร้างด้วย AI | วิชา ${form.subject} | ระดับ ${form.difficulty}`,
      questions: result.questions.map((q) => ({
        text: q.text,
        options: q.options,
        answerIndex: Number(q.answerIndex) || 0,
      })),
    });
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-3xl rounded-3xl border border-white/15 bg-[#0c142a]/95 text-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <header className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-2">
            <Icon name="Sparkles" size={20} className="text-amber-300" />
            <h3 className="text-xl font-bold">AI สร้างชุดคำถาม</h3>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white">
            <Icon name="X" size={24} />
          </button>
        </header>

        <div className="grid gap-4 p-5 lg:grid-cols-[1fr_1.1fr]">
          <section className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <label className="text-white/70">วิชา</label>
                <input
                  name="subject"
                  value={form.subject}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 p-2 text-white focus:border-amber-300 focus:outline-none"
                  placeholder="คณิต, วิทย์, ภาษาไทย..."
                />
              </div>
              <div>
                <label className="text-white/70">จำนวนข้อ</label>
                <input
                  type="number"
                  min="3"
                  max="20"
                  name="numQuestions"
                  value={form.numQuestions}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 p-2 text-white focus:border-amber-300 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-white/70">ตัวเลือก/ข้อ</label>
                <input
                  type="number"
                  min="2"
                  max="5"
                  name="optionCount"
                  value={form.optionCount}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 p-2 text-white focus:border-amber-300 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-white/70">ระดับความยาก</label>
                <select
                  name="difficulty"
                  value={form.difficulty}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 p-2 text-white focus:border-amber-300 focus:outline-none"
                >
                  <option value="easy">ง่าย</option>
                  <option value="medium">ปานกลาง</option>
                  <option value="hard">ยาก</option>
                </select>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div>
                <label className="text-white/70">หัวข้อหลัก (จำเป็น)</label>
                <input
                  name="topic"
                  value={form.topic}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-lg border border-amber-300/40 bg-black/30 p-2 text-white focus:border-amber-300 focus:outline-none"
                  placeholder="ระบบสุริยะ, เศษส่วน, ส่วนประกอบของพืช..."
                />
              </div>
              <div>
                <label className="text-white/70">เนื้อหาที่เน้น/คำสำคัญ</label>
                <textarea
                  name="focus"
                  value={form.focus}
                  onChange={handleChange}
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 p-2 text-sm text-white focus:border-amber-300 focus:outline-none"
                  placeholder="เช่น เน้นการคำนวณเศษส่วนแท้, ตัวอย่างในชีวิตประจำวัน, ใช้ตัวเลขง่าย"
                />
              </div>
            </div>
            {error && <p className="text-sm text-rose-300">{error}</p>}
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 via-pink-500 to-indigo-500 py-3 text-sm font-semibold uppercase tracking-[0.25em] text-black shadow-[0_18px_45px_-28px_rgba(0,0,0,0.7)] transition hover:opacity-90 disabled:opacity-60"
            >
              {isGenerating ? <Icon name="Loader2" className="animate-spin" size={16} /> : <Icon name="Sparkles" size={16} />}
              {isGenerating ? 'กำลังสร้าง...' : 'ให้ AI สร้างชุดคำถาม'}
            </button>
          </section>

          <section className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-sm font-semibold text-white">ตัวอย่างผลลัพธ์</p>
            {!result ? (
              <div className="flex h-full min-h-[320px] items-center justify-center text-sm text-white/60">
                รอผลลัพธ์จาก AI
              </div>
            ) : (
              <div className="mt-3 space-y-2 max-h-[420px] overflow-auto pr-1">
                <p className="text-xs text-white/70">ชุด: {result.title || '—'}</p>
                <p className="text-xs text-white/60">หัวข้อ: {result.topic || form.topic}</p>
                <ul className="space-y-3">
                  {result.questions?.map((q, idx) => (
                    <li key={idx} className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-white/80">
                      <p className="font-semibold text-white">{idx + 1}. {q.text}</p>
                      <ul className="mt-2 space-y-1">
                        {q.options?.map((opt, optIdx) => (
                          <li key={optIdx} className={`flex items-center gap-2 ${Number(q.answerIndex) === optIdx ? 'text-emerald-300' : ''}`}>
                            <span className="h-6 w-6 rounded-lg bg-white/10 text-center text-[11px] leading-6 text-white">
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <span>{opt}</span>
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="mt-3 flex justify-end gap-2">
              <button onClick={onClose} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white/70 hover:bg-white/10">
                ปิด
              </button>
              <button
                onClick={handleApply}
                disabled={!result}
                className="rounded-lg bg-emerald-500/90 px-4 py-2 text-xs font-semibold text-black hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                ใช้ชุดคำถามนี้
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default AIQuizSetGeneratorModal;
