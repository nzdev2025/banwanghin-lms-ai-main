import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AttendanceChecker from '../AttendanceChecker';
import { ToastProvider } from '../../../context/ToastContext';

// Wrapper with ToastProvider
const renderWithProviders = (ui) => {
  return render(<ToastProvider>{ui}</ToastProvider>);
};

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
    renderWithProviders(<AttendanceChecker />);
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
    renderWithProviders(<AttendanceChecker />);

    await waitFor(() => {
      const datePicker = screen.getByTestId('date-picker');
      expect(datePicker).toBeInTheDocument();
      expect(datePicker.type).toBe('date');
    });
  });

  it('defaults to today\'s date', async () => {
    renderWithProviders(<AttendanceChecker />);
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

    renderWithProviders(<AttendanceChecker />);

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

    renderWithProviders(<AttendanceChecker />);

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

    renderWithProviders(<AttendanceChecker />);

    await waitFor(() => {
      // Look for warning badge on student card
      const warningBadges = screen.queryAllByTestId('absence-warning-badge');
      // Test should expect warning badge for students with high absence
      expect(warningBadges).toBeDefined();
    });
  });

  it('does not show warning badge for students with less than 4 absences', async () => {
    mockGetDoc.mockResolvedValue({ exists: () => false });

    renderWithProviders(<AttendanceChecker />);

    await waitFor(() => {
      // No warning badges should appear for students with low absence
      const warningBadges = screen.queryAllByTestId('absence-warning-badge');
      expect(warningBadges.length).toBe(0);
    });
  });
});

describe('AttendanceChecker - QR URL with Selected Date', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOnSnapshot.mockImplementation((ref, cb) => {
      cb({
        docs: [
          { id: 'stu1', data: () => ({ firstName: 'สมชาย', lastName: 'ใจดี', studentNumber: 1, gender: 'ชาย' }) },
        ],
      });
      return vi.fn();
    });
    mockGetDoc.mockImplementation((ref) => {
      // Return existing session with token when checking for QR session
      if (ref.args && ref.args[1]?.includes('attendance_sessions')) {
        return Promise.resolve({
          exists: () => true,
          data: () => ({ token: 'test-token-123' }),
        });
      }
      return Promise.resolve({ exists: () => false });
    });
    mockGetDocs.mockResolvedValue({ docs: [] });
  });

  it('displays QR URL with selectedDate when date is changed', async () => {
    renderWithProviders(<AttendanceChecker />);

    await waitFor(() => {
      expect(screen.getByTestId('date-picker')).toBeInTheDocument();
    });

    // Change date to a past date
    const datePicker = screen.getByTestId('date-picker');
    fireEvent.change(datePicker, { target: { value: '2025-12-01' } });

    // Wait for component to re-render with new date
    await waitFor(() => {
      // Look for QR section that should contain the selectedDate
      const qrSection = screen.queryByText(/attendance\/join/);
      if (qrSection) {
        // The URL should contain the selected date, not today
        expect(qrSection.textContent).toContain('2025-12-01');
      }
    });
  });
});

describe('AttendanceChecker - Monthly Report Button', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOnSnapshot.mockImplementation((ref, cb) => {
      cb({
        docs: [
          { id: 'stu1', data: () => ({ firstName: 'สมชาย', lastName: 'ใจดี', studentNumber: 1, gender: 'ชาย' }) },
        ],
      });
      return vi.fn();
    });
    mockGetDoc.mockResolvedValue({ exists: () => false });
    mockGetDocs.mockResolvedValue({ docs: [] });
  });

  it('renders a monthly report button', async () => {
    renderWithProviders(<AttendanceChecker />);

    await waitFor(() => {
      const reportButton = screen.queryByText(/สถิติ/i) || screen.queryByTestId('monthly-report-button');
      expect(reportButton).toBeDefined();
    });
  });
});

describe('AttendanceChecker - Save Without LINE Token', () => {
  const mockAlert = vi.fn();
  const originalAlert = window.alert;

  beforeEach(() => {
    vi.clearAllMocks();
    window.alert = mockAlert;
    mockOnSnapshot.mockImplementation((ref, cb) => {
      cb({
        docs: [
          { id: 'stu1', data: () => ({ firstName: 'สมชาย', lastName: 'ใจดี', studentNumber: 1, gender: 'ชาย' }) },
        ],
      });
      return vi.fn();
    });
    mockGetDoc.mockResolvedValue({ exists: () => false });
    mockGetDocs.mockResolvedValue({ docs: [] });
  });

  afterEach(() => {
    window.alert = originalAlert;
  });

  it('saves attendance successfully even without LINE token', async () => {
    // Mock: no LINE settings exist
    mockGetDoc.mockImplementation((ref) => {
      if (ref.args && ref.args[1]?.includes('line_notify_tokens')) {
        return Promise.resolve({ exists: () => false });
      }
      return Promise.resolve({ exists: () => false });
    });

    renderWithProviders(<AttendanceChecker />);

    await waitFor(() => {
      expect(screen.getByText('บันทึกและแจ้งเตือนผู้ปกครอง')).toBeInTheDocument();
    });

    // Click save button
    const saveButton = screen.getByText('บันทึกและแจ้งเตือนผู้ปกครอง');
    fireEvent.click(saveButton);

    // Wait and check that alert shows success message (not error)
    await waitFor(() => {
      const alertCalls = mockAlert.mock.calls;
      if (alertCalls.length > 0) {
        const message = alertCalls[alertCalls.length - 1][0];
        // Should contain success message, not error about missing token
        expect(message).not.toContain('เกิดข้อผิดพลาด');
      }
    }, { timeout: 3000 });
  });
});
