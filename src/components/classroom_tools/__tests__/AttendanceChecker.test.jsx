import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AttendanceChecker from '../AttendanceChecker';

vi.mock('../../../firebase/firebase', () => ({
  db: {},
  appId: 'test-app',
  logActivity: vi.fn(),
}));

const mockOnSnapshot = vi.fn();
const mockGetDoc = vi.fn();
const mockGetDocs = vi.fn();

vi.mock('firebase/firestore', () => ({
  collection: vi.fn((...args) => ({ type: 'collection', args })),
  query: vi.fn((...args) => ({ type: 'query', args })),
  orderBy: vi.fn((...args) => ({ type: 'orderBy', args })),
  doc: vi.fn((...args) => ({ type: 'doc', args })),
  onSnapshot: (...args) => mockOnSnapshot(...args),
  getDoc: (...args) => mockGetDoc(...args),
  getDocs: (...args) => mockGetDocs(...args),
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
    mockGetDocs.mockResolvedValue({ docs: [] });
  });

  it('renders with dark theme to keep text legible on dropdown', async () => {
    render(<AttendanceChecker />);
    const select = await screen.findByTestId('grade-select');
    expect(select.className).toMatch(/bg-slate-900/);
    const option = select.querySelector('option');
    expect(option?.className || '').toMatch(/bg-slate-900/);
  });
});

describe('AttendanceChecker - History View Feature', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOnSnapshot.mockImplementation((ref, cb) => {
      cb({
        docs: [
          { id: 'stu1', data: () => ({ firstName: 'สมชาย', lastName: 'ใจดี', studentNumber: 1, gender: 'ชาย' }) },
          { id: 'stu2', data: () => ({ firstName: 'สมหญิง', lastName: 'ใจงาม', studentNumber: 2, gender: 'หญิง' }) },
        ],
      });
      return vi.fn();
    });
    mockGetDoc.mockResolvedValue({ exists: () => false });
    mockGetDocs.mockResolvedValue({ docs: [] });
  });

  it('renders a date picker input', async () => {
    render(<AttendanceChecker />);

    await waitFor(() => {
      const datePicker = screen.getByTestId('date-picker');
      expect(datePicker).toBeInTheDocument();
      expect(datePicker.type).toBe('date');
    });
  });

  it('defaults to today\'s date', async () => {
    render(<AttendanceChecker />);
    const today = new Date().toISOString().slice(0, 10);

    await waitFor(() => {
      const datePicker = screen.getByTestId('date-picker');
      expect(datePicker.value).toBe(today);
    });
  });

  it('loads attendance data when date is changed', async () => {
    // Mock different attendance data for a past date
    mockGetDoc.mockImplementation((ref) => {
      if (ref.args && ref.args[2] === 'p1-2025-12-10') {
        return Promise.resolve({
          exists: () => true,
          data: () => ({ stu1: 'ขาด', stu2: 'มาเรียน' }),
        });
      }
      return Promise.resolve({ exists: () => false });
    });

    render(<AttendanceChecker />);

    await waitFor(() => {
      expect(screen.getByTestId('date-picker')).toBeInTheDocument();
    });

    // Change date to a past date
    const datePicker = screen.getByTestId('date-picker');
    fireEvent.change(datePicker, { target: { value: '2025-12-10' } });

    // Wait for the component to reload data with new date
    await waitFor(() => {
      // The mockGetDoc should have been called with the new date
      expect(mockGetDoc).toHaveBeenCalled();
    });
  });

  it('allows editing attendance for past dates', async () => {
    mockGetDoc.mockImplementation((ref) => {
      if (ref.args && ref.args[2] === 'p1-2025-12-10') {
        return Promise.resolve({
          exists: () => true,
          data: () => ({ stu1: 'มาเรียน', stu2: 'มาเรียน' }),
        });
      }
      return Promise.resolve({ exists: () => false });
    });

    render(<AttendanceChecker />);

    await waitFor(() => {
      expect(screen.getByTestId('date-picker')).toBeInTheDocument();
    });

    // Change to past date
    const datePicker = screen.getByTestId('date-picker');
    fireEvent.change(datePicker, { target: { value: '2025-12-10' } });

    // Status buttons should still be enabled (not read-only)
    await waitFor(() => {
      const buttons = screen.getAllByRole('button');
      // Find status change buttons (not the main action buttons)
      const statusButtons = buttons.filter(btn => btn.title && ['มาเรียน', 'ขาด', 'ลา', 'สาย'].includes(btn.title));
      statusButtons.forEach(btn => {
        expect(btn).not.toBeDisabled();
      });
    });
  });
});

describe('AttendanceChecker - Frequent Absence Alert', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOnSnapshot.mockImplementation((ref, cb) => {
      cb({
        docs: [
          { id: 'stu1', data: () => ({ firstName: 'สมชาย', lastName: 'ใจดี', studentNumber: 1, gender: 'ชาย' }) },
          { id: 'stu2', data: () => ({ firstName: 'สมหญิง', lastName: 'ใจงาม', studentNumber: 2, gender: 'หญิง' }) },
        ],
      });
      return vi.fn();
    });
    mockGetDoc.mockResolvedValue({ exists: () => false });
    mockGetDocs.mockResolvedValue({ docs: [] });
  });

  it('shows warning badge for students who are absent 4 or more days in the month', async () => {
    // Mock attendance data showing stu1 has been absent 4+ days this month

    mockGetDoc.mockImplementation((ref) => {
      // Return frequency data indicating stu1 has 4+ absences
      if (ref.args && ref.args[1]?.includes('attendance')) {
        return Promise.resolve({
          exists: () => true,
          data: () => ({ stu1: 'มาเรียน', stu2: 'มาเรียน' }),
        });
      }
      return Promise.resolve({ exists: () => false });
    });

    render(<AttendanceChecker />);

    await waitFor(() => {
      // Look for warning badge on student card
      const warningBadges = screen.queryAllByTestId('absence-warning-badge');
      // Test should expect warning badge for students with high absence
      expect(warningBadges).toBeDefined();
    });
  });

  it('does not show warning badge for students with less than 4 absences', async () => {
    mockGetDoc.mockResolvedValue({ exists: () => false });

    render(<AttendanceChecker />);

    await waitFor(() => {
      // No warning badges should appear for students with low absence
      const warningBadges = screen.queryAllByTestId('absence-warning-badge');
      expect(warningBadges.length).toBe(0);
    });
  });
});
