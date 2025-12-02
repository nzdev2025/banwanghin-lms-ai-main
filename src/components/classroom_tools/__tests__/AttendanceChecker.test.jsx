import React from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AttendanceChecker from '../AttendanceChecker';

vi.mock('../../../firebase/firebase', () => ({
  db: {},
  appId: 'test-app',
  logActivity: vi.fn(),
}));

const mockOnSnapshot = vi.fn();
const mockGetDoc = vi.fn();

vi.mock('firebase/firestore', () => ({
  collection: vi.fn((...args) => ({ type: 'collection', args })),
  query: vi.fn((...args) => ({ type: 'query', args })),
  orderBy: vi.fn((...args) => ({ type: 'orderBy', args })),
  doc: vi.fn((...args) => ({ type: 'doc', args })),
  onSnapshot: (...args) => mockOnSnapshot(...args),
  getDoc: (...args) => mockGetDoc(...args),
  setDoc: vi.fn(),
  serverTimestamp: vi.fn(() => 'timestamp'),
}));

describe('AttendanceChecker grade dropdown', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOnSnapshot.mockImplementation((ref, cb) => {
      cb({ docs: [] });
      return vi.fn();
    });
    mockGetDoc.mockResolvedValue({ exists: () => false });
  });

  it('renders with dark theme to keep text legible on dropdown', async () => {
    render(<AttendanceChecker />);
    const select = await screen.findByTestId('grade-select');
    expect(select.className).toMatch(/bg-slate-900/);
    const option = select.querySelector('option');
    expect(option?.className || '').toMatch(/bg-slate-900/);
  });
});
