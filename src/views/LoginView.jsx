import React, { useState } from 'react';
import Icon from '../icons/Icon';
import { handleLogin, handleSignUp } from '../firebase/firebase';

const featureHighlights = [
  'จัดเก็บข้อมูลนักเรียน รายวิชา และคะแนนอย่างเป็นระบบ',
  'สร้างสื่อ ใบงาน ข้อสอบ และแผนการสอนด้วย AI ในไม่กี่คลิก',
  'แดชบอร์ดภาพรวมโรงเรียนแบบเรียลไทม์เพื่อช่วยตัดสินใจ',
];

const LoginView = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validateInputs = () => {
    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      setError('กรุณากรอกอีเมล');
      return null;
    }
    // เบื้องต้นตรวจรูปแบบอีเมลแบบง่าย
    if (!/\S+@\S+\.\S+/.test(normalizedEmail)) {
      setError('รูปแบบอีเมลไม่ถูกต้อง');
      return null;
    }
    if (!password || password.length < 6) {
      setError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
      return null;
    }
    return normalizedEmail;
  };

  const onLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    const normalizedEmail = validateInputs();
    if (!normalizedEmail) {
      setIsLoading(false);
      return;
    }
    try {
      await handleLogin(normalizedEmail, password);
    } catch (err) {
      setError(err.message);
    }
    setIsLoading(false);
  };

  const onSignUp = async () => {
    setIsLoading(true);
    setError('');
    const normalizedEmail = validateInputs();
    if (!normalizedEmail) {
      setIsLoading(false);
      return;
    }
    try {
      await handleSignUp(normalizedEmail, password);
    } catch (err) {
      setError(err.message);
    }
    setIsLoading(false);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#080b1a]">
      <div className="absolute inset-0">
        <div className="absolute -top-40 -left-28 h-80 w-80 rounded-full bg-gradient-to-br from-sky-400/55 via-indigo-500/45 to-purple-500/30 blur-3xl" />
        <div className="absolute top-1/4 right-[-120px] h-96 w-96 rounded-full bg-gradient-to-br from-purple-500/45 via-pink-500/25 to-transparent blur-3xl" />
        <div className="absolute bottom-[-120px] left-6 h-72 w-72 rounded-full bg-gradient-to-br from-teal-400/40 via-cyan-500/25 to-transparent blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),rgba(8,11,26,0.92))]" />
      </div>

      <div className="relative z-10 grid w-full max-w-5xl items-center gap-12 px-6 py-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <section className="space-y-10 text-white">
          <div className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.35em] text-white/70">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/15 text-white/80">
              <Icon name="Sparkles" size={16} />
            </span>
            Banwanghin Krukit AI by Wasin Suksuwan
          </div>
          <div className="space-y-6">
            <h1 className="text-[2.4rem] font-semibold tracking-tight text-white sm:text-[2.5rem]">
              <span className="block whitespace-nowrap leading-tight">สู่ระบบบริหารจัดการเรียนรู้</span>
              <span className="mt-2 block text-[2.3rem] leading-tight text-white/90 sm:text-[2.5rem]">
                ที่ยกระดับด้วยปัญญาประดิษฐ์
              </span>
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-white/70">
              บริหารจัดการข้อมูลโรงเรียน รายวิชา นักเรียน และแผนการสอนได้อย่างมีประสิทธิภาพ
              ด้วยผู้ช่วย AI ที่ออกแบบมาสำหรับครูไทยโดยเฉพาะ
            </p>
          </div>
          <ul className="space-y-4 text-sm leading-relaxed text-white/80">
            {featureHighlights.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="mt-1 flex h-5 w-5 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white/80">
                  <Icon name="Check" size={14} />
                </span>
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="relative">
          <div className="absolute inset-0 -translate-y-6 translate-x-6 rounded-[36px] bg-gradient-to-br from-indigo-500/35 via-purple-500/20 to-cyan-400/25 blur-2xl" />
          <div className="relative rounded-[32px] border border-white/15 bg-[#101632]/85 px-8 py-10 shadow-[0_35px_70px_-40px_rgba(8,10,25,0.9)] backdrop-blur-xl">
            <header className="mb-8 text-center text-white">
              <p className="text-xs uppercase tracking-[0.35em] text-white/60">
                Sign in to continue
              </p>
              <h2 className="mt-3 text-2xl font-semibold">ยินดีต้อนรับสู่ KruKit</h2>
            </header>

            <form onSubmit={onLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/85">อีเมล</label>
                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white focus-within:border-sky-400 focus-within:ring-2 focus-within:ring-sky-500/40">
                  <Icon name="User" size={18} className="text-white/50" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none"
                    placeholder="name@school.ac.th"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-white/85">รหัสผ่าน</label>
                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white focus-within:border-sky-400 focus-within:ring-2 focus-within:ring-sky-500/40">
                  <Icon name="Lock" size={18} className="text-white/50" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none"
                    placeholder="อย่างน้อย 8 ตัวอักษร"
                    required
                  />
                </div>
              </div>

              {error && (
                <p className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-center text-xs font-medium text-rose-200">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-500 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-white shadow-[0_25px_45px_-30px_rgba(79,70,229,0.8)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <Icon name="Loader2" className="animate-spin" size={18} />
                    กำลังเข้าสู่ระบบ...
                  </>
                ) : (
                  <>
                    เข้าสู่ระบบ
                    <Icon name="ArrowRight" size={18} />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onSignUp}
                disabled={isLoading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 py-3 text-sm font-medium text-white/85 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Icon name="UserPlus" size={18} />
                สร้างบัญชีผู้ดูแลโรงเรียน
              </button>
            </form>

            <footer className="mt-8 text-center text-[11px] text-white/50">
              มีปัญหาในการเข้าสู่ระบบ? ติดต่อผู้ดูแลระบบโรงเรียนของคุณ
            </footer>
          </div>
        </section>
      </div>
    </div>
  );
};

export default LoginView;
