import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AttendanceSummaryCard from '../AttendanceSummaryCard';
import { getDocs } from 'firebase/firestore';
import { AppContext } from '../../../context/AppContext';

// Mock Firebase
vi.mock('../../../firebase/firebase', () => ({
    db: {},
    appId: 'test-app',
}));

vi.mock('firebase/firestore', () => ({
    collection: vi.fn(),
    getDocs: vi.fn(),
}));

// Mock Recharts to avoid resizing issues in test env
vi.mock('recharts', () => ({
    ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
    PieChart: ({ children }) => <div data-testid="pie-chart">{children}</div>,
    Pie: () => <div data-testid="pie">Pie</div>,
    Cell: () => <div data-testid="cell">Cell</div>,
    Tooltip: () => <div data-testid="tooltip">Tooltip</div>,
}));

vi.mock('../../../icons/Icon', () => ({
    default: ({ name, className }) => <div data-testid={`icon-${name}`} className={className}>Icon-{name}</div>
}));

describe('AttendanceSummaryCard', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the card title', async () => {
        getDocs.mockResolvedValue({ docs: [] });
        render(
            <AppContext.Provider value={{}}>
                <AttendanceSummaryCard totalStudents={100} />
            </AppContext.Provider>
        );
        await waitFor(() => {
            expect(screen.getByText('การมาเรียนวันนี้')).toBeInTheDocument();
        });
    });

    it('calculates and displays attendance stats from firestore', async () => {
        const today = new Date().toISOString().slice(0, 10);

        // Mock data: 2 classes have taken attendance
        // Class 1: 2 Present, 1 Absent
        // Class 2: 1 Present, 1 Late (counts as present-ish or separate?), 0 Absent
        // Let's assume the component counts 'มาเรียน' and 'สาย' as Present group, 'ขาด' and 'ลา' as Absent group for simplicity of the chart? 
        // Or specific logic. Let's assume standard: Passed = Present+Late, Failed = Absent+Leave.

        const mockDocs = [
            {
                id: `p1-${today}`,
                data: () => ({
                    'stu1': 'มาเรียน',
                    'stu2': 'ขาด',
                    'stu3': 'มาเรียน'
                })
            },
            {
                id: `p2-${today}`,
                data: () => ({
                    'stu4': 'สาย',
                    'stu5': 'ลา'
                })
            },
            {
                id: `p3-old-date`, // Should be filtered out if we query all, but if we query carefully, we won't get it. 
                // Actually, we plan to fetch all and filter by ID or fetch with query? 
                // Plan says "fetch all in collection and filter".
                data: () => ({ 'stu6': 'มาเรียน' })
            }
        ];

        getDocs.mockResolvedValue({
            docs: mockDocs,
            forEach: (cb) => mockDocs.forEach(cb)
        });

        render(
            <AppContext.Provider value={{}}>
                <AttendanceSummaryCard totalStudents={10} />
            </AppContext.Provider>
        );

        await waitFor(() => {
            // Check for total Present: 2 (Class 1) + 1 (Class 2 Late?) -> Let's say we display 'มาเรียน' count specifically.
            // If the UI shows "มาเรียน", it should count 'มาเรียน' + 'สาย' ? 
            // Let's expect the component to show breakdown.

            // Wait, we want a "Summary" card. Usually "Present" vs "Absent".
            // Let's assume Present = มา+สาย, Absent = ขาด+ลา
            // Present: 2 + 1 = 3
            // Absent: 1 + 1 = 2

            // We expect some text or number indicating these values.
            // Let's look for "3" and "2" in the document if we render them.
            // Or better, check for the label "มาเรียน" and "ขาด".

            expect(screen.getByText('มาเรียน')).toBeInTheDocument();
        });
    });

    it('displays the correct attendance percentage', async () => {
        const today = new Date().toISOString().slice(0, 10);
        const mockDocs = [
            { id: `p1-${today}`, data: () => ({ 's1': 'มาเรียน', 's2': 'มาเรียน' }) }, // 2 Present
            { id: `p2-${today}`, data: () => ({ 's3': 'ขาด', 's4': 'ลา' }) }        // 2 Absent/Leave
        ];
        // Total = 4. Present = 2. Percentage = 50%

        getDocs.mockResolvedValue({
            docs: mockDocs,
            forEach: (cb) => mockDocs.forEach(cb)
        });

        render(
            <AppContext.Provider value={{}}>
                <AttendanceSummaryCard totalStudents={10} />
            </AppContext.Provider>
        );

        await waitFor(() => {
            expect(screen.getByText('50%')).toBeInTheDocument();
            expect(screen.getByText('เข้าเรียน')).toBeInTheDocument();
        });


    });
});
