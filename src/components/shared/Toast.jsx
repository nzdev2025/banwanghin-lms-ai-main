// src/components/shared/Toast.jsx
import React from 'react';
import { useToast } from '../../context/ToastContext';
import Icon from '../../icons/Icon';

const toastStyles = {
    success: {
        bg: 'bg-emerald-500/90',
        border: 'border-emerald-400',
        icon: 'CheckCircle',
        iconColor: 'text-white'
    },
    error: {
        bg: 'bg-rose-500/90',
        border: 'border-rose-400',
        icon: 'XCircle',
        iconColor: 'text-white'
    },
    warning: {
        bg: 'bg-amber-500/90',
        border: 'border-amber-400',
        icon: 'AlertTriangle',
        iconColor: 'text-white'
    },
    info: {
        bg: 'bg-sky-500/90',
        border: 'border-sky-400',
        icon: 'Info',
        iconColor: 'text-white'
    }
};

const Toast = () => {
    const { toasts, removeToast } = useToast();

    if (toasts.length === 0) return null;

    return (
        <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm">
            {toasts.map(toast => {
                const style = toastStyles[toast.type] || toastStyles.info;
                return (
                    <div
                        key={toast.id}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-sm shadow-xl animate-slide-in ${style.bg} ${style.border}`}
                    >
                        <Icon name={style.icon} className={style.iconColor} size={20} />
                        <span className="flex-1 text-white font-medium text-sm">{toast.message}</span>
                        <button
                            onClick={() => removeToast(toast.id)}
                            className="text-white/70 hover:text-white transition-colors"
                        >
                            <Icon name="X" size={16} />
                        </button>
                    </div>
                );
            })}
        </div>
    );
};

export default Toast;
