import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, test, expect, beforeEach } from 'vitest';
import StudentSavingsDetailModal from '../StudentSavingsDetailModal';
import { runTransaction, onSnapshot } from 'firebase/firestore';

// Mock Firebase
vi.mock('../../../firebase/firebase', () => ({
  db: {},
  appId: 'test-app',
  logActivity: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  query: vi.fn(),
  orderBy: vi.fn(),
  onSnapshot: vi.fn(),
  serverTimestamp: vi.fn(),
  runTransaction: vi.fn(),
}));

describe('StudentSavingsDetailModal', () => {
  const mockStudent = { id: 's1', firstName: 'Test', lastName: 'Student' };
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock snapshot to return empty initially
    onSnapshot.mockImplementation((query, callback) => {
      callback({ docs: [], exists: () => false }); // for transactions and summary
      return () => {};
    });
  });

  test('has correct z-index (>200) to appear above SavingsManagementModal', () => {
    render(<StudentSavingsDetailModal student={mockStudent} grade="p1" onClose={mockOnClose} />);
    // Find the backdrop/container
    const modal = screen.getByText('Test Student').closest('.fixed');
    // We expect it to be higher than 200. Let's say we target 250.
    // The current code is z-[60] which is wrong.
    // The test should fail if checking for z-[250].
    expect(modal.className).toContain('z-[250]');
  });

  test('calls onClose after successful transaction', async () => {
    render(<StudentSavingsDetailModal student={mockStudent} grade="p1" onClose={mockOnClose} />);

    // Enter Amount
    const amountInput = screen.getByPlaceholderText('0.00');
    fireEvent.change(amountInput, { target: { value: '100' } });

    // Mock runTransaction success
    runTransaction.mockResolvedValue();

    // Submit
    const submitBtn = screen.getByText('ยืนยัน');
    fireEvent.click(submitBtn);

    // Wait for onClose
    await waitFor(() => {
        expect(runTransaction).toHaveBeenCalled();
        expect(mockOnClose).toHaveBeenCalled(); 
    });
  });
});
