// Firebase initialization and helper utilities
//
// This module initializes the Firebase app and exports the Firestore
// database, authentication object and convenience methods for common
// operations.  It performs a sanity check on required environment
// variables to help developers catch misconfiguration early and
// gracefully handles initialization errors.

import { initializeApp } from 'firebase/app';
import { getFirestore, initializeFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';

// Build the Firebase config from environment variables.  We
// intentionally avoid hardcoding property names to minimise typos and
// log a warning when variables are missing.  Firebase itself will
// throw if the configuration is incomplete, but a warning helps
// identify the root cause quickly.
const firebaseConfig = {};
const requiredKeys = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
];
requiredKeys.forEach((key) => {
  const val = import.meta.env[key];
  if (!val) {
    console.warn(`Firebase environment variable ${key} is not set`);
  }
  // Derive the config property name (e.g. API_KEY -> api_key).  We
  // lowercase to match Firebase JS SDK expectations.  See
  // https://firebase.google.com/docs/web/setup#config-object
  // Convert e.g. API_KEY -> apiKey by lowercasing the first word
  // and capitalising subsequent words.  This matches the property
  // names expected by the Firebase SDK.  Example: PROJECT_ID
  // becomes projectId.
  const parts = key.replace('VITE_FIREBASE_', '').toLowerCase().split('_');
  const camelCaseKey = parts
    .map((part, index) => (index === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)))
    .join('');
  firebaseConfig[camelCaseKey] = val;
});

// Validate that all required values are present and the appId looks sane.
const validateFirebaseConfig = (config) => {
  const keyMap = {
    apiKey: 'VITE_FIREBASE_API_KEY',
    authDomain: 'VITE_FIREBASE_AUTH_DOMAIN',
    projectId: 'VITE_FIREBASE_PROJECT_ID',
    storageBucket: 'VITE_FIREBASE_STORAGE_BUCKET',
    messagingSenderId: 'VITE_FIREBASE_MESSAGING_SENDER_ID',
    appId: 'VITE_FIREBASE_APP_ID',
  };

  const missing = Object.entries(keyMap)
    .filter(([prop]) => !config[prop])
    .map(([, envKey]) => envKey);

  const errors = [];
  if (missing.length) {
    errors.push(`missing env vars: ${missing.join(', ')}`);
  }

  const appIdPattern = /^1:\d{6,}:web:[a-f0-9]+$/i;
  if (config.appId && !appIdPattern.test(config.appId)) {
    errors.push('VITE_FIREBASE_APP_ID format ไม่ถูกต้อง (คัดลอกจาก Firebase Console ให้ครบทุกตัวอักษร)');
  }

  if (errors.length) {
    console.error(`[Firebase config invalid] ${errors.join(' | ')}`);
    return false;
  }

  return true;
};

const firebaseConfigIsValid = validateFirebaseConfig(firebaseConfig);
if (!firebaseConfigIsValid) {
  throw new Error(
    'Firebase config ไม่ถูกต้อง กรุณาตรวจสอบค่า .env (คัดลอกจาก Firebase Console ให้ครบถ้วน)',
  );
}

let app;
let db;
let auth;
if (firebaseConfigIsValid) {
  try {
    app = initializeApp(firebaseConfig);
    // Prefer auto-detection of the best transport first; fall back to forced long polling if needed.
    const firestoreSettings = {
      experimentalAutoDetectLongPolling: true,
      useFetchStreams: false,
    };
    try {
      db = initializeFirestore(app, firestoreSettings);
    } catch (firestoreInitError) {
      console.warn('Primary Firestore init failed, retrying with forced long polling', firestoreInitError);
      db = initializeFirestore(app, {
        experimentalForceLongPolling: true,
        useFetchStreams: false,
      });
    }
    auth = getAuth(app);
  } catch (e) {
    console.error('Firebase initialization error:', e);
    if (app && !db) {
      // fallback ถ้า init ด้วย long polling มีปัญหา
      db = getFirestore(app);
    }
  }
}

// Export a default appId in case one is injected at runtime.  When
// compiled for production this constant can be replaced with a global
// variable by your bundler to target a different Firestore path.
export const appId = typeof __app_id !== 'undefined' ? __app_id : 'banwanghin-lms-dev';

/**
 * Record an activity log entry in Firestore.  Each entry stores a
 * message, type, optional details and a server-generated timestamp.
 * Errors are caught so that logging never interrupts the main flow of
 * the application.
 *
 * @param {string} type A category for the log entry (e.g. 'info' or 'error').
 * @param {string} message A human-readable description of the event.
 * @param {object} [details={}] Additional structured data about the event.
 */
export const logActivity = async (type, message, details = {}) => {
  if (!db) return;
  try {
    const logPath = `artifacts/${appId}/public/data/activity_log`;
    await addDoc(collection(db, logPath), {
      type,
      message,
      details,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error logging activity:', error);
  }
};

// Authentication helpers.  These thin wrappers forward to Firebase
// methods and could be extended to handle custom error reporting or
// analytics in a single place.
export const handleSignUp = (email, password) => {
  return createUserWithEmailAndPassword(auth, email, password);
};
export const handleLogin = (email, password) => {
  return signInWithEmailAndPassword(auth, email, password);
};
export const handleLogout = () => {
  return signOut(auth);
};

// Export Firestore and auth along with onAuthStateChanged for consumers
export { db, auth, onAuthStateChanged };
