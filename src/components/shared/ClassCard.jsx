import React from 'react';
import { colorThemes } from '../../constants/theme';
import Icon from '../../icons/Icon';

const hexToRgba = (hex, alpha = 1) => {
  if (!hex) return `rgba(45, 212, 191, ${alpha})`;
  const sanitized = hex.replace('#', '');
  const bigint = parseInt(sanitized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const ClassCard = ({ subject, onClick }) => {
  const theme = colorThemes[subject.colorTheme] || colorThemes.teal;
  const iconName = subject.iconName || 'BookOpen';
  const accent = theme.hex;
  const accentGlow = hexToRgba(accent, 0.22);
  const accentSurface = hexToRgba(accent, 0.12);

  return (
    <button
      type="button"
      onClick={onClick}
      data-testid="subject-card"
      className="group relative flex min-h-[190px] flex-col gap-6 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/70 p-6 text-left shadow-xl shadow-black/30 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/20 hover:shadow-2xl hover:shadow-black/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
      style={{
        background: `linear-gradient(145deg, ${hexToRgba(accent, 0.08)}, rgba(15,23,42,0.9))`,
      }}
    >
      <div
        className="pointer-events-none absolute -left-16 -top-20 h-40 w-40 rounded-full blur-3xl"
        style={{ background: accentGlow }}
      />
      <div
        className="pointer-events-none absolute right-6 -bottom-10 h-32 w-32 rounded-full blur-3xl opacity-80"
        style={{ background: hexToRgba(accent, 0.18) }}
      />
      <div className="relative flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <span
            className="text-[11px] uppercase tracking-[0.35em] text-white/60"
            style={{ color: hexToRgba(accent, 0.75) }}
          >
            {subject.code || 'SUBJECT'}
          </span>
          <h3 className="max-w-[240px] text-xl font-semibold leading-tight text-white drop-shadow">
            {subject.name}
          </h3>
          <p className="text-xs text-gray-300">
            {subject.gradeRange || 'ทุกระดับชั้น'} ·{' '}
            {subject.category || 'หมวดวิชาทั่วไป'}
          </p>
        </div>
        <span
          data-testid="subject-icon"
          className="flex h-12 w-12 items-center justify-center rounded-xl border text-white transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-lg group-hover:shadow-black/30"
          style={{
            backgroundColor: accentSurface,
            borderColor: hexToRgba(accent, 0.45),
            color: accent,
          }}
        >
          <Icon name={iconName} size={22} />
        </span>
      </div>

      <div className="flex items-center justify-between gap-3 text-sm text-white/80">
        <div className="flex items-center gap-3">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-full border text-white"
            style={{
              backgroundColor: hexToRgba(accent, 0.2),
              borderColor: hexToRgba(accent, 0.4),
              color: accent,
            }}
          >
            <Icon name="User" size={16} />
          </span>
          <div className="flex flex-col leading-tight">
            <span className="text-[11px] uppercase tracking-[0.15em] text-gray-400">ครูผู้สอน</span>
            <span className="text-sm font-semibold text-white">
              {subject.teacherName || 'ยังไม่ได้กำหนด'}
            </span>
          </div>
        </div>
        <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-gray-300 transition-colors group-hover:text-white">
          ดูรายละเอียด <Icon name="ArrowRight" size={16} />
        </span>
      </div>
    </button>
  );
};

export default ClassCard;
