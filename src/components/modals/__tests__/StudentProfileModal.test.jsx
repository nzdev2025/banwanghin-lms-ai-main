import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { act } from 'react';
import { vi, describe, it, afterEach, beforeEach, expect } from 'vitest';
import StudentProfileModal from '../StudentProfileModal';

vi.mock('../../../api/gemini', () => ({
  callGeminiAPI: vi.fn(),
}));

vi.mock('../../../icons/Icon', () => ({
  __esModule: true,
  default: ({ name }) => <span data-testid={`icon-${name}`} />,
}));

vi.mock('../BehaviorLoggerModal', () => ({
  __esModule: true,
  default: () => <div data-testid="behavior-logger-modal" />,
}));

vi.mock('../ConfirmationModal', () => ({
  __esModule: true,
  default: ({ onConfirm, onClose }) => (
    <div data-testid="confirmation-modal">
      <button type="button" onClick={onConfirm}>
        confirm
      </button>
      <button type="button" onClick={onClose}>
        cancel
      </button>
    </div>
  ),
}));

const baseStudent = {
  id: 'student-1',
  studentNumber: '01',
  firstName: 'Niran',
  lastName: 'Somsak',
  gender: 'male',
  studentId: 'S001',
  birthDate: '2015-02-10',
};

const getAgeDisplay = (birthDateString) => {
  if (!birthDateString) return '-';
  const birthDate = new Date(birthDateString);
  const today = new Date();
  let years = today.getFullYear() - birthDate.getFullYear();
  let months = today.getMonth() - birthDate.getMonth();
  if (months < 0 || (months === 0 && today.getDate() < birthDate.getDate())) {
    years--;
    months += 12;
  }
  return `${years} ปี ${months} เดือน`;
};

const renderModal = (props = {}) => {
  const { testOverrides, ...rest } = props;
  const mergedOverrides = { skipLiveSync: true, ...testOverrides };

  return render(
    <StudentProfileModal
      student={baseStudent}
      grade="p6"
      subjects={[]}
      onClose={vi.fn()}
      testOverrides={mergedOverrides}
      {...rest}
    />,
  );
};

describe('StudentProfileModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  it('shows age and assignment overview stats with grouped details', async () => {
    renderModal({
      testOverrides: {
        initialScores: {
          math: {
            name: 'คณิตศาสตร์',
            assignments: [
              { name: 'แบบฝึกหัด 1', score: 8, maxScore: 10 },
              { name: 'แบบฝึกหัด 2', maxScore: 10 },
            ],
          },
          science: {
            name: 'วิทยาศาสตร์',
            assignments: [{ name: 'การทดลอง', score: 10, maxScore: 10 }],
          },
        },
      },
    });

    const expectedAge = getAgeDisplay(baseStudent.birthDate);

    expect(screen.getByText(/อัตราการส่งงานล่าสุด/)).toBeInTheDocument();
    expect(screen.getByText(`อายุ ${expectedAge}`)).toBeInTheDocument();
    expect(screen.getByText('ชั้น ป.6')).toBeInTheDocument();

    const overviewButton = screen.getByText('อัตราการส่งงานล่าสุด').closest('button');
    fireEvent.click(overviewButton);

    expect(await screen.findByText('ส่งแล้ว 2')).toBeInTheDocument();
    expect(screen.getAllByText('ค้างส่ง 1')[0]).toBeInTheDocument();
    expect(screen.getByText('ทั้งหมด 3')).toBeInTheDocument();
    expect(screen.getByText('วิชา 2')).toBeInTheDocument();
    expect(screen.getByText(/67%/)).toBeInTheDocument();

    expect(screen.getByText('คณิตศาสตร์')).toBeInTheDocument();
    expect(screen.getByText('วิทยาศาสตร์')).toBeInTheDocument();
    const mathSubject = screen.getByText('คณิตศาสตร์').closest('button');
    fireEvent.click(mathSubject);
    expect(await screen.findByText('แบบฝึกหัด 2')).toBeInTheDocument();
    expect(screen.getByText('ยังไม่ส่ง')).toBeInTheDocument();
  });

  it('filters behavior logs by start date and updates status accordingly', async () => {
    const { container } = renderModal({
      testOverrides: {
        initialBehaviorLogs: [
          {
            id: 'log-1',
            tag: 'ช่วยเพื่อน',
            type: 'positive',
            icon: 'Smile',
            timestamp: new Date('2025-01-10T10:00:00Z'),
          },
          {
            id: 'log-2',
            tag: 'ส่งงานช้า',
            type: 'negative',
            icon: 'Clock',
            timestamp: new Date('2025-02-15T10:00:00Z'),
          },
        ],
      },
    });

    const behaviorCard = await screen.findByText(/ภาพรวมพฤติกรรม/);
    fireEvent.click(behaviorCard.closest('button'));

    expect(screen.getByText('สถานะ: ควรจับตา')).toBeInTheDocument();
    expect(screen.getAllByText(/ส่งงานช้า|ช่วยเพื่อน/)).toHaveLength(2);

    const startDateInput = container.querySelector('input[type="date"]');
    fireEvent.change(startDateInput, { target: { value: '2025-02-01' } });

    await waitFor(() => {
      expect(screen.getByText('สถานะ: ควรปรับปรุง')).toBeInTheDocument();
    });
    expect(screen.getByText('ส่งงานช้า')).toBeInTheDocument();
    expect(screen.queryByText('ช่วยเพื่อน')).not.toBeInTheDocument();
  });

  it('generates AI summary, parent comment, and copies the comment', async () => {
    const { callGeminiAPI } = await import('../../../api/gemini');
    callGeminiAPI.mockResolvedValueOnce('สรุปผลการเรียน');
    callGeminiAPI.mockResolvedValueOnce('ข้อความถึงผู้ปกครอง');
    navigator.clipboard.writeText.mockResolvedValue();

    renderModal({
      testOverrides: {
        initialScores: {
          math: {
            name: 'คณิตศาสตร์',
            assignments: [{ name: 'แบบฝึกหัด 1', score: 9, maxScore: 10 }],
          },
        },
        initialBehaviorLogs: [
          { id: 'log-1', tag: 'มีสมาธิ', type: 'positive', icon: 'Sparkles', timestamp: new Date('2025-02-10T09:00:00Z') },
        ],
      },
    });

    const analyzeButton = await screen.findByRole('button', { name: /วิเคราะห์ผลการเรียน/i });
    fireEvent.click(analyzeButton);

    await waitFor(() => expect(callGeminiAPI).toHaveBeenCalledTimes(1));
    expect(callGeminiAPI).toHaveBeenCalledWith(expect.stringContaining("Niran Somsak"));
    expect(await screen.findByText('สรุปผลการเรียน')).toBeInTheDocument();

    const parentCommentButton = screen.getByRole('button', { name: /ข้อความถึงผู้ปกครอง/ });
    fireEvent.click(parentCommentButton);

    await waitFor(() => expect(callGeminiAPI).toHaveBeenCalledTimes(2));
    expect(await screen.findByText(/"ข้อความถึงผู้ปกครอง"/)).toBeInTheDocument();

    const copyButton = screen.getByRole('button', { name: /คัดลอกคอมเมนต์/ });
    await act(async () => {
      fireEvent.click(copyButton);
      await Promise.resolve();
    });
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('ข้อความถึงผู้ปกครอง');
  });
});
