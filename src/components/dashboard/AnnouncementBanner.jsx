import React from 'react';
import PropTypes from 'prop-types';
import Icon from '../../icons/Icon';

const AnnouncementBanner = ({ config }) => {
  if (!config?.enabled || !config?.message) return null;

  const getStyle = () => {
    switch (config.type) {
      case 'error':
        return 'border-rose-500/30 bg-rose-500/10 text-rose-200';
      case 'warning':
        return 'border-amber-500/30 bg-amber-500/10 text-amber-200';
      case 'success':
        return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200';
      default:
        return 'border-sky-500/30 bg-sky-500/10 text-sky-200';
    }
  };

  const getIcon = () => {
    switch (config.type) {
      case 'error':
        return 'AlertCircle';
      case 'warning':
        return 'AlertTriangle';
      case 'success':
        return 'CheckCircle';
      default:
        return 'Info';
    }
  };

  return (
    <div className={`relative z-20 flex items-start gap-3 rounded-xl border p-4 ${getStyle()}`}>
      <Icon name={getIcon()} size={20} className="mt-0.5 shrink-0" />
      <p className="text-sm font-medium leading-relaxed">{config.message}</p>
    </div>
  );
};

AnnouncementBanner.propTypes = {
  config: PropTypes.shape({
    enabled: PropTypes.bool,
    message: PropTypes.string,
    type: PropTypes.oneOf(['error', 'warning', 'success', 'info']),
  }),
};

export default AnnouncementBanner;
