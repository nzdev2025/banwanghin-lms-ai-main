// src/components/analytics/KeyMetricCard.jsx (Three-Line Structured Edition)
import React from 'react';
import Icon from '../../icons/Icon';

const alignmentConfig = {
  left: 'items-start text-left',
  center: 'items-center text-center',
  right: 'items-end text-right',
};

const KeyMetricCard = ({
  icon,
  title,
  value,
  detail,
  isLoading,
  gradient = 'bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950',
  iconAccent = 'bg-white/12 text-white',
  valueAlign = 'center',
}) => {
  const alignmentClass = alignmentConfig[valueAlign] || alignmentConfig.center;
  const skeletonAlignment =
    valueAlign === 'right' ? 'ml-auto' : valueAlign === 'center' ? 'mx-auto' : 'mr-auto';

  return (
    <div
      className={`group relative flex min-h-[110px] min-w-[200px] flex-col justify-between overflow-hidden rounded-2xl border border-white/12 px-5 py-4 text-white shadow-[0_22px_42px_-30px_rgba(8,10,26,0.78)] transition-transform duration-300 hover:-translate-y-1.5 ${gradient}`}
    >
      <div className="pointer-events-none absolute inset-0 bg-slate-950/25 transition-opacity duration-300 group-hover:bg-slate-950/15" />
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -right-12 top-0 h-32 w-32 rounded-full bg-white/14 blur-3xl" />
        <div className="absolute left-0 bottom-0 h-20 w-20 rounded-full bg-white/10 blur-3xl" />
      </div>

      <header className="relative flex items-center gap-3">
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/15 ${iconAccent}`}
        >
          <Icon name={icon} size={18} />
        </span>
        <p className="text-base font-semibold tracking-tight text-white/92">{title}</p>
      </header>

      <main className={`relative flex flex-1 items-center justify-center text-white ${alignmentClass}`}>
        {isLoading ? (
          <div
            className={`h-10 w-32 rounded-lg bg-white/20 backdrop-blur-sm animate-pulse ${skeletonAlignment}`}
          />
        ) : (
          <p className="text-[30px] font-bold tracking-tight drop-shadow">{value}</p>
        )}
      </main>

      {detail && (
        <footer className={`relative text-xs font-medium text-white/70 ${alignmentClass}`}>
          {detail}
        </footer>
      )}
    </div>
  );
};

export default KeyMetricCard;

