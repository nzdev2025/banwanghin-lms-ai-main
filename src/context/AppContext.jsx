import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db, auth, onAuthStateChanged, handleLogout } from '../firebase/firebase';
import { config } from '../config';

const AppContext = createContext();

export const AppContextProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [subjects, setSubjects] = useState([]);
    const [modalStack, setModalStack] = useState([]);

    // Subscribe to auth state changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setAuthLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // Listen to subjects metadata
    useEffect(() => {
        if (!user) return;
        const subjectsMetaPath = `artifacts/${config.appId}/public/data/subjects_meta`;
        const q = query(collection(db, subjectsMetaPath), orderBy('createdAt'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setSubjects(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsubscribe();
    }, [user]);

    // Modal helpers
    const openModal = (type, data = null) => {
        setModalStack((prev) => [...prev, { type, data }]);
    };

    const closeModal = () => {
        setModalStack((prev) => prev.slice(0, prev.length - 1));
    };

    const value = {
        user,
        authLoading,
        subjects,
        modalStack,
        openModal,
        closeModal,
        handleLogout,
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within an AppContextProvider');
    }
    return context;
};
