import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { config } from '../config';

const SiteConfigContext = createContext();

const defaultConfig = {
    siteTitle: 'KruKit AI',
    schoolName: 'โรงเรียนบ้านวังหิน',
    logoText: 'AI',
    developerName: 'Wasin Suksuwan',
    footerText: 'Banwanghin KruKit AI by Wasin Suksuwan. สงวนลิขสิทธิ์',
    version: '5.0',
    primaryColor: 'from-emerald-400 via-teal-500 to-sky-500',
    academicYear: '2567',
    semester: '2',
    announcement: {
        enabled: false,
        message: '',
        type: 'info' // info, warning, error
    },
    featureFlags: {
        savings: true,
        health: true,
        calendar: true,
        tools: true
    }
};

export const SiteConfigProvider = ({ children }) => {
    const [siteConfig, setSiteConfig] = useState(defaultConfig);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const configRef = doc(db, `artifacts/${config.appId}/config/main`);

        const unsubscribe = onSnapshot(configRef, (docSnap) => {
            if (docSnap.exists()) {
                setSiteConfig({ ...defaultConfig, ...docSnap.data() });
            } else {
                setSiteConfig(defaultConfig);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const updateConfig = async (newConfig) => {
        try {
            const configRef = doc(db, `artifacts/${config.appId}/config/main`);
            await setDoc(configRef, newConfig, { merge: true });
            return { success: true };
        } catch (error) {
            console.error("Error updating site config:", error);
            return { success: false, error };
        }
    };

    const resetConfig = async () => {
        try {
            const configRef = doc(db, `artifacts/${config.appId}/config/main`);
            await setDoc(configRef, defaultConfig);
            return { success: true };
        } catch (error) {
            console.error("Error resetting site config:", error);
            return { success: false, error };
        }
    };

    return (
        <SiteConfigContext.Provider value={{ siteConfig, updateConfig, resetConfig, loading }}>
            {children}
        </SiteConfigContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useSiteConfig = () => {
    const context = useContext(SiteConfigContext);
    if (!context) {
        throw new Error('useSiteConfig must be used within a SiteConfigProvider');
    }
    return context;
};
