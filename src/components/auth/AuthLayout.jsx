import React from 'react';
import PropTypes from 'prop-types';
import Icon from '../../icons/Icon';

const AuthLayout = ({ children, title, footerText, highlights = [] }) => {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#080b1a]">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute -top-40 -left-28 h-80 w-80 rounded-full bg-gradient-to-br from-sky-400/55 via-indigo-500/45 to-purple-500/30 blur-3xl" />
        <div className="absolute top-1/4 right-[-120px] h-96 w-96 rounded-full bg-gradient-to-br from-purple-500/45 via-pink-500/25 to-transparent blur-3xl" />
        <div className="absolute bottom-[-120px] left-6 h-72 w-72 rounded-full bg-gradient-to-br from-teal-400/40 via-cyan-500/25 to-transparent blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),rgba(8,11,26,0.92))]" />
      </div>

      <div className="relative z-10 grid w-full max-w-5xl items-center gap-12 px-6 py-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        {/* Left Column: Branding & Highlights */}
        <section className="space-y-10 text-white">
          <div className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.35em] text-white/70">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/15 text-white/80">
              <Icon name="Sparkles" size={16} />
            </span>
            {footerText}
          </div>
          <div className="space-y-6">
            <h1 className="text-[2.4rem] font-semibold tracking-tight text-white sm:text-[2.5rem]">
              <span className="block whitespace-nowrap leading-tight">สู่ระบบบริหารจัดการเรียนรู้</span>
              <span className="mt-2 block text-[2.3rem] leading-tight text-white/90 sm:text-[2.5rem]">
                ที่ยกระดับด้วยปัญญาประดิษฐ์
              </span>
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-white/70">
              {title} บริหารจัดการข้อมูลโรงเรียน รายวิชา นักเรียน และแผนการสอนได้อย่างมีประสิทธิภาพ
              ด้วยผู้ช่วย AI ที่ออกแบบมาสำหรับครูไทยโดยเฉพาะ
            </p>
          </div>
          
          {highlights.length > 0 && (
            <ul className="space-y-4 text-sm leading-relaxed text-white/80">
              {highlights.map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="mt-1 flex h-5 w-5 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white/80">
                    <Icon name="Check" size={14} />
                  </span>
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Right Column: Auth Form */}
        <section className="relative">
          <div className="absolute inset-0 -translate-y-6 translate-x-6 rounded-[36px] bg-gradient-to-br from-indigo-500/35 via-purple-500/20 to-cyan-400/25 blur-2xl" />
          <div className="relative rounded-[32px] border border-white/15 bg-[#101632]/85 px-8 py-10 shadow-[0_35px_70px_-40px_rgba(8,10,25,0.9)] backdrop-blur-xl">
            {children}
          </div>
        </section>
      </div>
    </div>
  );
};

AuthLayout.propTypes = {
  children: PropTypes.node.isRequired,
  title: PropTypes.string,
  footerText: PropTypes.string,
  highlights: PropTypes.arrayOf(PropTypes.string),
};

export default AuthLayout;
