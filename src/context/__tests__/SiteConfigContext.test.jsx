import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// We mock firebase first
vi.mock('firebase/firestore', () => ({
    getFirestore: vi.fn(),
    doc: vi.fn(),
    onSnapshot: vi.fn((ref, callback) => {
        // Return unsubscribe function
        return () => { };
    }),
    setDoc: vi.fn(),
}));

vi.mock('../../firebase/firebase', () => ({
    db: {}
}));

describe('SiteConfigContext', () => {
    beforeEach(() => {
        vi.resetModules();
    });

    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it('uses VITE_SCHOOL_NAME from environment', async () => {
        // Setup the mock env before importing the module
        vi.stubEnv('VITE_SCHOOL_NAME', 'Test SchoolName');

        // Dynamic import to ensure the module is re-evaluated with the new env
        const { SiteConfigProvider, useSiteConfig } = await import('../SiteConfigContext');

        const TestComponent = () => {
            const { siteConfig } = useSiteConfig();
            return <div>School: {siteConfig.schoolName}</div>;
        };

        render(
            <SiteConfigProvider>
                <TestComponent />
            </SiteConfigProvider>
        );

        // This should fail currently because the code has 'โรงเรียนบ้านวังหิน' hardcoded
        expect(screen.getByText(/Test SchoolName/)).toBeInTheDocument();
    });
});
