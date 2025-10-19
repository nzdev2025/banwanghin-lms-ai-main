import React from 'react';
import Icon from '../../icons/Icon';

const FeatureCardShell = ({
    onClick,
    iconName,
    title,
    subtitle,
    footerIcon,
    footerText,
    badgeText,
    theme = {},
}) => {
    const accentHex = theme.hex || '#38bdf8';
    const accentText = theme.text || 'text-sky-500';

    const handleKeyDown = (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            if (onClick) onClick();
        }
    };

    return (
        <div
            role="button"
            tabIndex={0}
            onClick={onClick}
            onKeyDown={handleKeyDown}
            aria-label={title}
            className="group relative flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            style={{ backgroundImage: `radial-gradient(circle at 20% 20%, ${accentHex}11, transparent 65%)` }}
        >
            {badgeText ? (
                <span className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: accentHex }} />
                    {badgeText}
                </span>
            ) : null}

            <div className="mt-1 flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-white leading-snug">{title}</h3>
                    {subtitle ? (
                        <p className="mt-2 text-sm text-slate-300/90">{subtitle}</p>
                    ) : null}
                </div>
                <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50">
                    <Icon name={iconName} className={`${accentText}`} size={20} />
                </span>
            </div>

            {footerText ? (
                <div className="mt-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.34em]" style={{ color: accentHex }}>
                    {footerIcon ? <Icon name={footerIcon} size={14} /> : null}
                    <span>{footerText}</span>
                </div>
            ) : null}
        </div>
    );
};

export default FeatureCardShell;
