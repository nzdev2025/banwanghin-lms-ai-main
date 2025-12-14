import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

let db = null;
let currentAppId = null;

export const initLogger = (database, applicationId) => {
  db = database;
  currentAppId = applicationId;
};

/**
 * Log activity to Firestore
 * @param {string} type - Type of activity (e.g., 'LOGIN', 'LOGOUT', 'UPDATE_STUDENT')
 * @param {string} detail - Detailed description of the activity (supports HTML)
 * @param {string} [level='info'] - Log level ('info', 'warning', 'error', 'success')
 */
export const logActivity = async (type, detail, level = 'info') => {
  if (!db) {
    console.warn('ActivityLogger: DB not initialized');
    return;
  }
  const targetAppId = currentAppId || import.meta.env.VITE_FIREBASE_APP_ID;
  try {
    const logsRef = collection(db, `artifacts/${targetAppId}/public/logs`);
    await addDoc(logsRef, {
      type,
      detail,
      level,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error logging activity:', error);
  }
};
