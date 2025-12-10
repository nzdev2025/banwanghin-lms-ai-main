import React from 'react';
import { render, screen } from '@testing-library/react';
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

// Mock Recharts to prevent rendering issues in test environment
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

describe('Modal Z-Index Tests', () => {
  test('StudentModal should have z-index higher than 100 (z-[200])', () => {
    render(
      <StudentModal 
        onClose={mockOnClose} 
        onSave={mockOnSave} 
      />
    );
    
    const modalContainer = screen.getByText('เพิ่มนักเรียนใหม่').closest('div').parentElement;
    expect(modalContainer.className).toContain('z-[200]');
    expect(modalContainer.className).not.toContain('z-50');
  });

  test('ConfirmationModal should have z-index higher than 100 (z-[200])', () => {
    render(
      <ConfirmationModal 
        onClose={mockOnClose} 
        onConfirm={mockOnConfirm}
        item={{ name: 'Test Item' }} 
      />
    );
    
    const modalContainer = screen.getAllByText('ยืนยันการลบ')[0].closest('.fixed');
    expect(modalContainer.className).toContain('z-[200]');
    expect(modalContainer.className).not.toContain('z-50');
  });

  test('AIWorksheetGeneratorModal should have z-index higher than 100 (z-[200])', () => {
    render(<AIWorksheetGeneratorModal onClose={mockOnClose} />);
    
    const modalContainer = screen.getByText('AI Document Factory').closest('.fixed');
    expect(modalContainer.className).toContain('z-[200]');
    expect(modalContainer.className).not.toContain('z-[60]');
  });

  test('AILessonPlanGeneratorModal should have z-index higher than 100 (z-[200])', () => {
    render(<AILessonPlanGeneratorModal onClose={mockOnClose} />);
    
    const modalContainer = screen.getByText('AI Lesson Plan Generator').closest('.fixed');
    expect(modalContainer.className).toContain('z-[200]');
    expect(modalContainer.className).not.toContain('z-[60]');
  });

  test('AIQuizSetGeneratorModal should have z-index higher than 100 (z-[200])', () => {
    render(<AIQuizSetGeneratorModal onClose={mockOnClose} />);
    
    const modalContainer = screen.getByText('AI สร้างชุดคำถาม').closest('.fixed');
    expect(modalContainer.className).toContain('z-[200]');
  });

  test('AIAssignmentGeneratorModal should have z-index higher than 100 (z-[200])', () => {
    render(<AIAssignmentGeneratorModal onClose={mockOnClose} />);
    
    const modalContainer = screen.getByText('ผู้ช่วยสร้างแบบทดสอบ').closest('.fixed');
    expect(modalContainer.className).toContain('z-[200]');
    expect(modalContainer.className).not.toContain('z-[60]');
  });

  test('StudentProfileModal should have z-index higher than 100 (z-[200])', () => {
    const mockStudent = { 
      id: '1', 
      firstName: 'Test', 
      lastName: 'Student', 
      studentNumber: 1, 
      birthDate: '2015-01-01',
      gender: 'male' 
    };
    render(
      <StudentProfileModal 
        student={mockStudent}
        grade="p1"
        subjects={[]}
        onClose={mockOnClose}
        testOverrides={{ skipLiveSync: true }}
      />
    );
    
    const modalContainer = screen.getAllByText('โปรไฟล์นักเรียน')[0].closest('.fixed');
    expect(modalContainer.className).toContain('z-[200]');
  });

  test('StudentProgressModal should have z-index higher than StudentProfileModal (z-[250] or more)', () => {
    const mockStudent = { id: '1', firstName: 'Test', lastName: 'Student' };
    render(
      <StudentProgressModal 
        student={mockStudent}
        grade="p1"
        subjects={[]}
        onClose={mockOnClose}
      />
    );
    
    const modalContainer = screen.getByText('ความคืบหน้าเชิงรายบุคคล').closest('.fixed');
    // It should be at least z-[200], but ideally higher since it sits on top.
    // Let's expect z-[250] or similar high value.
    expect(modalContainer.className).toContain('z-[250]');
  });

  test('SavingsReportModal should have z-index higher than SavingsManagementModal (z-[250] or more)', () => {
    render(<SavingsReportModal onClose={mockOnClose} />);
    
    // Find the fixed backdrop container directly
    // Look for text unique to the modal
    const modalContainer = screen.getByText('รายงานการออมทรัพย์').closest('.fixed');
    expect(modalContainer.className).toContain('z-[250]');
  });
});


