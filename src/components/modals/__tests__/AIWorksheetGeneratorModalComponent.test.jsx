import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import AIWorksheetGeneratorModal from '../AIWorksheetGeneratorModal';
import { ToastProvider } from '../../../context/ToastContext';

// Mock dependencies
vi.mock('../../api/gemini', () => ({
    callGeminiAPI: vi.fn(),
}));
vi.mock('../worksheet/WorksheetRenderer', () => ({
    default: () => <div data-testid="worksheet-renderer" />,
}));
vi.mock('./aiWorksheetPrint', () => ({
    buildPrintableWorksheetHTML: vi.fn(),
    printWorksheetHtml: vi.fn(),
}));
vi.mock('../../icons/Icon', () => ({
    default: ({ name }) => <span data-testid={`icon-${name}`} />,
}));

// Mock SiteConfigContext
vi.mock('../../../context/SiteConfigContext', () => ({
    useSiteConfig: vi.fn(() => ({
        siteConfig: {
            schoolName: 'Test School Worksheet'
        }
    }))
}));

describe('AIWorksheetGeneratorModal', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders correctly with dynamic school name', () => {
        render(<ToastProvider><AIWorksheetGeneratorModal onClose={vi.fn()} /></ToastProvider>);

        // Check for the header text "โรงเรียนบ้านวังหิน" which should now be "Test School Worksheet"
        // Initially this will fail because it's hardcoded
        expect(screen.getByText('Test School Worksheet')).toBeInTheDocument();
    });
});
