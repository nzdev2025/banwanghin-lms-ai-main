import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { collection, onSnapshot, query, orderBy, getDocs } from 'firebase/firestore';
import { db, auth, onAuthStateChanged, handleLogout } from '../firebase/firebase';
import { config } from '../config';
import { grades } from '../constants/data';
/* eslint-disable react-refresh/only-export-components */

export const AppContext = createContext();

export const AppContextProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [subjects, setSubjects] = useState([]);
    const [modalStack, setModalStack] = useState([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Student Cache
    const [allStudents, setAllStudents] = useState([]);
    const [isLoadingStudents, setIsLoadingStudents] = useState(false);

    // Subscribe to auth state changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                // Mock Role Logic
                const role = (currentUser.email === 'nzappcreator@gmail.com' || currentUser.email === 'admin@school.ac.th') ? 'admin' : 'teacher';
                setUserRole(role);
            } else {
                setUserRole(null);
            }
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

    // Student Fetching with Cache
    const fetchAllStudents = useCallback(async (force = false) => {
        if (!force && allStudents.length > 0) return;

        setIsLoadingStudents(true);
        try {
            const promises = grades.map(async (grade) => {
                const path = `artifacts/${config.appId}/public/data/rosters/${grade}/students`;
                const querySnapshot = await getDocs(collection(db, path));
                return querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    grade // Attach grade to student object for reference
                }));
            });

            const results = await Promise.all(promises);
            setAllStudents(results.flat());
        } catch (error) {
            console.error("Error fetching students:", error);
        } finally {
            setIsLoadingStudents(false);
        }
    }, [allStudents.length]);

    // Modal helpers
    const openModal = useCallback((type, data = null) => {
        setModalStack((prev) => [...prev, { type, data }]);
    }, []);

    const closeModal = useCallback(() => {
        setModalStack((prev) => prev.slice(0, prev.length - 1));
    }, []);

    const closeAllModals = useCallback(() => {
        setModalStack([]);
    }, []);

    const toggleSidebar = useCallback(() => setIsSidebarOpen((prev) => !prev), []);
    const closeSidebar = useCallback(() => setIsSidebarOpen(false), []);

    const value = useMemo(() => ({
        user,
        userRole,
        authLoading,
        subjects,
        modalStack,
        isSidebarOpen,
        allStudents,
        isLoadingStudents,
        fetchAllStudents,
        openModal,
        closeModal,
        closeAllModals,
        toggleSidebar,
        closeSidebar,
        handleLogout,
    }), [user, userRole, authLoading, subjects, modalStack, isSidebarOpen, allStudents, isLoadingStudents, fetchAllStudents, openModal, closeModal, closeAllModals, toggleSidebar, closeSidebar]);

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within an AppContextProvider');
    }
    return context;
};
