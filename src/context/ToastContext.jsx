// src/context/ToastContext.jsx
import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

const ToastContext = createContext(null);

let toastIdCounter = 0;

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const addToast = useCallback((message, type = 'success', duration = 3000) => {
        const id = ++toastIdCounter;
        const newToast = { id, message, type };

        setToasts(prev => [...prev, newToast]);

        if (duration > 0) {
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== id));
            }, duration);
        }

        return id;
    }, []);

    const success = useCallback((message, duration) => addToast(message, 'success', duration), [addToast]);
    const error = useCallback((message, duration) => addToast(message, 'error', duration), [addToast]);
    const warning = useCallback((message, duration) => addToast(message, 'warning', duration), [addToast]);
    const info = useCallback((message, duration) => addToast(message, 'info', duration), [addToast]);

    const value = useMemo(() => ({
        toasts, addToast, removeToast, success, error, warning, info
    }), [toasts, addToast, removeToast, success, error, warning, info]);

    return (
        <ToastContext.Provider value={value}>
            {children}
        </ToastContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
};

export default ToastContext;

