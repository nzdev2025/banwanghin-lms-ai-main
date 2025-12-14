import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Icon from '../../icons/Icon';

const LoginForm = ({ onLogin, onSignUp, isLoading, siteTitle, error }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationError, setValidationError] = useState('');

  // Clear validation error when inputs change
  useEffect(() => {
    setValidationError('');
  }, [email, password]);

  const validateAndSubmit = (e, action) => {
    e.preventDefault();
    setValidationError('');
    
    const normalizedEmail = email.trim();
    
    if (!normalizedEmail) {
      setValidationError('กรุณากรอกอีเมล');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(normalizedEmail)) {
      setValidationError('รูปแบบอีเมลไม่ถูกต้อง');
      return;
    }
    if (!password || password.length < 6) {
      setValidationError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
      return;
    }

    action(normalizedEmail, password);
  };

  const displayError = validationError || error;

  return (
    <>
      <header className="mb-8 text-center text-white">
        <p className="text-xs uppercase tracking-[0.35em] text-white/60">
          Sign in to continue
        </p>
        <h2 className="mt-3 text-2xl font-semibold">ยินดีต้อนรับสู่ {siteTitle}</h2>
      </header>

      <form onSubmit={(e) => validateAndSubmit(e, onLogin)} className="space-y-6">
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

        {displayError && (
          <p className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-center text-xs font-medium text-rose-200">
            {displayError}
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
          onClick={(e) => validateAndSubmit(e, onSignUp)}
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
    </>
  );
};

LoginForm.propTypes = {
  onLogin: PropTypes.func.isRequired,
  onSignUp: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
  siteTitle: PropTypes.string,
  error: PropTypes.string,
};

export default LoginForm;