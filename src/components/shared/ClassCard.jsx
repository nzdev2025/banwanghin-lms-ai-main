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

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex min-h-[160px] flex-col gap-6 rounded-xl border border-white/10 bg-gray-800/50 p-6 text-left transition-colors duration-200 hover:bg-gray-700/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
    >
      <div className="relative flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <span
            className="text-[11px] uppercase tracking-[0.35em] text-white/60"
            style={{ color: hexToRgba(accent, 0.75) }}
          >
            {subject.code || 'SUBJECT'}
          </span>
          <h3 className="max-w-[220px] text-lg font-semibold leading-tight text-white">
            {subject.name}
          </h3>
          <p className="text-xs text-gray-400">
            {subject.gradeRange || 'ทุกระดับชั้น'} ·{' '}
            {subject.category || 'หมวดวิชาทั่วไป'}
          </p>
        </div>
        <span
          className="flex h-12 w-12 items-center justify-center rounded-xl border text-white transition-colors group-hover:border-white/30"
          style={{
            backgroundColor: hexToRgba(accent, 0.15),
            borderColor: hexToRgba(accent, 0.4),
            color: accent,
          }}
        >
          <Icon name={iconName} size={22} />
        </span>
      </div>

      <div className="flex items-center justify-between gap-3 text-sm text-white/75">
        <div className="flex items-center gap-3">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-full border text-white"
            style={{
              backgroundColor: hexToRgba(accent, 0.18),
              borderColor: hexToRgba(accent, 0.38),
              color: accent,
            }}
          >
            <Icon name="User" size={16} />
          </span>
          <div className="flex flex-col leading-tight">
            <span className="text-xs uppercase tracking-wide text-gray-400">ครูผู้สอน</span>
            <span className="text-sm font-medium text-white">
              {subject.teacherName || 'ยังไม่ได้กำหนด'}
            </span>
          </div>
        </div>
        <span className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.28em] text-gray-400 transition-colors group-hover:text-white">
          ดูรายละเอียด
          <Icon name="ArrowRight" size={16} />
        </span>
      </div>
    </button>
  );
};

export default ClassCard;
