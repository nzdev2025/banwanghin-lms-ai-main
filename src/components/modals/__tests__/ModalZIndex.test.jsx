import React from 'react';
import { render } from '@testing-library/react';
import { vi, describe, test, expect } from 'vitest';
import StudentModal from '../StudentModal';
import ConfirmationModal from '../ConfirmationModal';
import AIWorksheetGeneratorModal from '../AIWorksheetGeneratorModal';
import AILessonPlanGeneratorModal from '../AILessonPlanGeneratorModal';
import AIQuizSetGeneratorModal from '../AIQuizSetGeneratorModal';
import AIAssignmentGeneratorModal from '../AIAssignmentGeneratorModal';
import StudentProfileModal from '../StudentProfileModal';
import StudentProgressModal from '../StudentProgressModal';
import SavingsReportModal from '../SavingsReportModal';
import { ToastProvider } from '../../../context/ToastContext';

const renderWithProviders = (ui) => render(<ToastProvider>{ui}</ToastProvider>);

// Mock required props
const mockOnClose = vi.fn();
const mockOnSave = vi.fn();
const mockOnConfirm = vi.fn();

// Mock Gemini API
vi.mock('../../api/gemini', () => ({
  callGeminiAPI: vi.fn(),
}));

// Mock SavingsReportModal Print
vi.mock('../savingsReportPrint', () => ({
  buildPrintableSavingsReport: vi.fn(),
}));

// Mock WorksheetRenderer
vi.mock('../worksheet/WorksheetRenderer', () => ({
  default: () => <div>Worksheet Renderer</div>
}));

// Mock Recharts
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
  AreaChart: () => <div>AreaChart</div>,
  Area: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  BarChart: () => <div>BarChart</div>,
  Bar: () => null,
  PieChart: () => <div>PieChart</div>,
  Pie: () => null,
  Cell: () => null,
  CartesianGrid: () => null,
}));

// Mock student progress API
vi.mock('../../api/studentProgress', () => ({
  fetchAcademicTrend: vi.fn(() => Promise.resolve([])),
  fetchBehaviorStats: vi.fn(() => Promise.resolve({})),
  fetchHealthSeries: vi.fn(() => Promise.resolve([])),
  fetchAttendanceStats: vi.fn(() => Promise.resolve({})),
}));

// Mock Firebase
vi.mock('../../firebase/firebase', () => ({
  db: {},
  appId: 'test-app',
}));

// Mock SiteConfigContext
vi.mock('../../../context/SiteConfigContext', () => ({
  useSiteConfig: vi.fn(() => ({
    siteConfig: {
      schoolName: 'Test School'
    }
  }))
}));

describe('Modal Z-Index Tests', () => {
  test('StudentModal should have z-[200]', () => {
    const { container } = renderWithProviders(
      <StudentModal onClose={mockOnClose} onSave={mockOnSave} />
    );
    const modalContainer = container.querySelector('.fixed');
    expect(modalContainer.className).toContain('z-[200]');
  });

  test('ConfirmationModal should have z-[200]', () => {
    const { container } = render(
      <ConfirmationModal
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        item={{ name: 'Test Item' }}
      />
    );
    const modalContainer = container.querySelector('.fixed');
    expect(modalContainer.className).toContain('z-[200]');
  });

  test('AIWorksheetGeneratorModal should have z-[200]', () => {
    const { container } = renderWithProviders(<AIWorksheetGeneratorModal onClose={mockOnClose} />);
    const modalContainer = container.querySelector('.fixed');
    expect(modalContainer.className).toContain('z-[200]');
  });

  test('AILessonPlanGeneratorModal should have z-[200]', () => {
    const { container } = renderWithProviders(<AILessonPlanGeneratorModal onClose={mockOnClose} />);
    const modalContainer = container.querySelector('.fixed');
    expect(modalContainer.className).toContain('z-[200]');
  });

  test('AIQuizSetGeneratorModal should have z-[200]', () => {
    const { container } = render(<AIQuizSetGeneratorModal onClose={mockOnClose} />);
    const modalContainer = container.querySelector('.fixed');
    expect(modalContainer.className).toContain('z-[200]');
  });

  test('AIAssignmentGeneratorModal should have z-[200]', () => {
    const { container } = render(<AIAssignmentGeneratorModal onClose={mockOnClose} />);
    const modalContainer = container.querySelector('.fixed');
    expect(modalContainer.className).toContain('z-[200]');
  });

  test('StudentProfileModal should have z-[200]', () => {
    const mockStudent = {
      id: '1',
      firstName: 'Test',
      lastName: 'Student',
      studentNumber: 1,
      birthDate: '2015-01-01',
      gender: 'male'
    };
    const { container } = renderWithProviders(
      <StudentProfileModal
        student={mockStudent}
        grade="p1"
        subjects={[]}
        onClose={mockOnClose}
        testOverrides={{ skipLiveSync: true }}
      />
    );
    const modalContainer = container.querySelector('.fixed');
    expect(modalContainer.className).toContain('z-[200]');
  });

  test('StudentProgressModal should have z-[250]', () => {
    const mockStudent = { id: '1', firstName: 'Test', lastName: 'Student' };
    const { container } = render(
      <StudentProgressModal
        student={mockStudent}
        grade="p1"
        subjects={[]}
        onClose={mockOnClose}
      />
    );
    const modalContainer = container.querySelector('.fixed');
    expect(modalContainer.className).toContain('z-[250]');
  });

  test('SavingsReportModal should have z-[250]', () => {
    const { container } = renderWithProviders(<SavingsReportModal onClose={mockOnClose} />);
    const modalContainer = container.querySelector('.fixed');
    expect(modalContainer.className).toContain('z-[250]');
  });
});