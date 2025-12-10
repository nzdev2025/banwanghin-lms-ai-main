import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, test, expect, beforeEach } from 'vitest';
import OverallAnalytics from '../OverallAnalytics';
import { getAggregateFromServer, sum, collectionGroup, query, where, getDocs } from 'firebase/firestore';
import { useStudentPerformanceData } from '../../../hooks/useStudentPerformanceData';

// Mock Firebase
vi.mock('../../../firebase/firebase', () => ({
  db: {},
  appId: 'test-app',
}));

vi.mock('firebase/firestore', () => ({
  collectionGroup: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getAggregateFromServer: vi.fn(),
  sum: vi.fn(),
  getDocs: vi.fn(),
  collection: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  onSnapshot: vi.fn(() => () => {}),
}));

// Mock Hook
vi.mock('../../../hooks/useStudentPerformanceData', () => ({
  useStudentPerformanceData: vi.fn(),
}));

// Mock Chart Components
vi.mock('../KeyMetricCard', () => ({ 
    default: ({ title, value }) => <div data-testid="metric-card">{title}: {value}</div> 
}));
vi.mock('../SavingsGlowChart', () => ({ default: () => <div>SavingsGlowChart</div> }));
vi.mock('../SubjectPerformanceChart', () => ({ default: () => <div>SubjectPerformanceChart</div> }));
vi.mock('../dashboard/AtRiskStudents', () => ({ default: () => <div>AtRiskStudents</div> }));
vi.mock('../dashboard/TopStudentsLeaderboard', () => ({ default: () => <div>TopStudentsLeaderboard</div> }));
vi.mock('../dashboard/RecentActivityFeed', () => ({ default: () => <div>RecentActivityFeed</div> }));

describe('OverallAnalytics Aggregation', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        
        // Mock Hook Return
        useStudentPerformanceData.mockReturnValue({
            students: new Map(),
            assignments: new Map(),
            loading: false
        });
    });

    test('fetches savings data using aggregation queries', async () => {
        // Mock getAggregateFromServer results
        // We expect 2 calls: one for deposits, one for withdrawals
        getAggregateFromServer
            .mockResolvedValueOnce({ // First call: Deposits
                data: () => ({ total: 10000 })
            })
            .mockResolvedValueOnce({ // Second call: Withdrawals
                data: () => ({ total: 2000 })
            });
        
        render(<OverallAnalytics subjects={[]} onStudentClick={() => {}} />);
        
        // Wait for stats update
        await waitFor(() => {
            // Check for Deposit value in the mocked KeyMetricCard
            expect(screen.getByText('ยอดเงินฝากทั้งหมด: 10,000 ฿')).toBeInTheDocument();
        });
        
        // Verify aggregation calls
        expect(collectionGroup).toHaveBeenCalledWith(expect.anything(), 'transactions');
        expect(query).toHaveBeenCalled();
        expect(where).toHaveBeenCalledWith('type', '==', 'deposit');
        expect(sum).toHaveBeenCalledWith('amount');
        expect(getAggregateFromServer).toHaveBeenCalledTimes(2);
    });

    test('falls back to client-side calculation if aggregation fails', async () => {
        // Mock getAggregateFromServer to fail
        getAggregateFromServer.mockRejectedValue(new Error('Missing index'));

        // Mock getDocs for fallback
        const mockDocs = [
            { ref: { path: '.../savings/...' }, data: () => ({ type: 'deposit', amount: 500 }) },
            { ref: { path: '.../savings/...' }, data: () => ({ type: 'deposit', amount: 500 }) },
            { ref: { path: '.../savings/...' }, data: () => ({ type: 'withdraw', amount: 200 }) },
            { ref: { path: 'other/path' }, data: () => ({ type: 'deposit', amount: 9999 }) }, // Should be ignored by path check? 
            // Wait, my code does `if (doc.ref.path.includes('/savings/'))`
        ];
        
        getDocs.mockResolvedValue({
            forEach: (cb) => mockDocs.forEach(cb)
        });

        render(<OverallAnalytics subjects={[]} onStudentClick={() => {}} />);

        // Wait for stats update
        await waitFor(() => {
            // Deposit: 500 + 500 = 1000
            expect(screen.getByText('ยอดเงินฝากทั้งหมด: 1,000 ฿')).toBeInTheDocument();
        });

        // Verify fallback was called
        expect(getDocs).toHaveBeenCalled();
    });
});
