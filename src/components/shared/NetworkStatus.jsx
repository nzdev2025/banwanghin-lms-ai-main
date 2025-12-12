// src/components/shared/NetworkStatus.jsx
import React, { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import Icon from '../../icons/Icon';

const NetworkStatus = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [wasOffline, setWasOffline] = useState(false);
    const toast = useToast();

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            if (wasOffline) {
                toast.success('กลับมาออนไลน์แล้ว! ข้อมูลจะซิงค์อัตโนมัติ');
            }
            setWasOffline(false);
        };

        const handleOffline = () => {
            setIsOnline(false);
            setWasOffline(true);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [wasOffline, toast]);

    if (isOnline) return null;

    return (
        <div className="fixed top-0 left-0 right-0 z-[9998] bg-rose-600 text-white py-2 px-4 flex items-center justify-center gap-2 shadow-lg">
            <Icon name="WifiOff" size={18} />
            <span className="font-medium text-sm">ไม่มีการเชื่อมต่ออินเทอร์เน็ต - ข้อมูลจะบันทึกเมื่อกลับมาออนไลน์</span>
        </div>
    );
};

export default NetworkStatus;
