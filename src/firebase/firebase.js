// src/firebase/firebase.js
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  connectFirestoreEmulator,
  serverTimestamp,
  setDoc,
  doc
} from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword, updateProfile, onAuthStateChanged } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';
import { logActivity, initLogger } from '../services/activityLogger'; // Import new service

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
let app;
let db;
let auth;
let storage;
let functions;

try {
  app = initializeApp(firebaseConfig);

  // Initialize Firestore with Offline Persistence
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
  });

  initLogger(db, import.meta.env.VITE_FIRESTORE_APP_ID || firebaseConfig.appId);

  auth = getAuth(app);
  storage = getStorage(app);
  functions = getFunctions(app);

  if (import.meta.env.VITE_USE_EMULATOR === 'true') {
    connectFirestoreEmulator(db, 'localhost', 8080);
    console.log('Connected to Firestore Emulator');
  }
} catch (error) {
  console.error('Firebase initialization error:', error);
  // Fallback if long polling fails
  if (app && !db) {
    db = getFirestore(app);
  }
}

// --- Auth Helpers ---

const handleLogin = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    await logActivity('LOGIN', `เข้าสู่ระบบสำเร็จ: ${user.email}`, 'success');
    return user;
  } catch (error) {
    console.error('Login error:', error);
    await logActivity('LOGIN_FAILED', `เข้าสู่ระบบล้มเหลว: ${email} - ${error.message}`, 'error');
    throw error;
  }
};

const handleLogout = async () => {
  try {
    const user = auth.currentUser;
    await signOut(auth);
    if (user) {
      await logActivity('LOGOUT', `ออกจากระบบสำเร็จ: ${user.email}`, 'info');
    }
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
};

const handleSignUp = async (email, password, displayName = 'Admin') => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    await updateProfile(user, { displayName });

    // Create initial user doc if needed
    const userDocRef = doc(db, 'users', user.uid);
    await setDoc(userDocRef, {
      email: user.email,
      role: 'admin', // Default role for new signups in this context
      createdAt: serverTimestamp(),
    }, { merge: true });

    await logActivity('SIGNUP', `สร้างบัญชีใหม่สำเร็จ: ${email}`, 'success');
    return user;
  } catch (error) {
    console.error('Signup error:', error);
    await logActivity('SIGNUP_FAILED', `สร้างบัญชีล้มเหลว: ${email} - ${error.message}`, 'error');
    throw error;
  }
};

export {
  app,
  db,
  auth,
  storage,
  functions,
  handleLogin,
  handleLogout,
  handleSignUp,
  logActivity,
  firebaseConfig,
  onAuthStateChanged
};

// Export appId separately if needed elsewhere
export const appId = import.meta.env.VITE_FIRESTORE_APP_ID || firebaseConfig.appId;