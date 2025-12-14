import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock firebase modules to prevent actual initialization errors during testing
vi.mock('firebase/app', () => ({
    initializeApp: vi.fn(),
}));
vi.mock('firebase/firestore', () => ({
    getFirestore: vi.fn(),
    initializeFirestore: vi.fn(),
    collection: vi.fn(),
    addDoc: vi.fn(),
    serverTimestamp: vi.fn(),
    persistentLocalCache: vi.fn(),
    persistentMultipleTabManager: vi.fn(),
    connectFirestoreEmulator: vi.fn(),
    setDoc: vi.fn(),
    doc: vi.fn(),
}));
vi.mock('firebase/auth', () => ({
    getAuth: vi.fn(),
    createUserWithEmailAndPassword: vi.fn(),
    signInWithEmailAndPassword: vi.fn(),
    signOut: vi.fn(),
    updateProfile: vi.fn(),
}));

describe('Firebase Config', () => {
    beforeEach(() => {
        vi.resetModules();
        // Reset env vars
        vi.unstubAllEnvs();
        // Default required mocks for validation to pass
        vi.stubEnv('VITE_FIREBASE_API_KEY', 'test-key');
        vi.stubEnv('VITE_FIREBASE_AUTH_DOMAIN', 'test-domain');
        vi.stubEnv('VITE_FIREBASE_PROJECT_ID', 'test-project');
        vi.stubEnv('VITE_FIREBASE_STORAGE_BUCKET', 'test-bucket');
        vi.stubEnv('VITE_FIREBASE_MESSAGING_SENDER_ID', 'test-sender');
        vi.stubEnv('VITE_FIREBASE_APP_ID', '1:123456:web:abcdef');
        vi.stubEnv('VITE_FIRESTORE_APP_ID', ''); // Ensure this is unset by default
    });

    it('uses default appId when VITE_FIRESTORE_APP_ID is not set', async () => {
        // Import the module dynamically
        const { appId } = await import('../firebase');
        // Expects default from VITE_FIREBASE_APP_ID
        expect(appId).toBe('1:123456:web:abcdef');
    });

    it('uses VITE_FIRESTORE_APP_ID when set', async () => {
        // Set the override env var
        vi.stubEnv('VITE_FIRESTORE_APP_ID', 'custom-school-id');

        // Re-import to get fresh state
        const { appId } = await import('../firebase');
        expect(appId).toBe('custom-school-id');
    });
});
