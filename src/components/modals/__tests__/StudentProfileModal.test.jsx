vi.mock('firebase/firestore', () => {
  const setDocMock = vi.fn(() => Promise.resolve());
  const deleteDocMock = vi.fn(() => Promise.resolve());
  const docMock = vi.fn((dbArg, path, maybeId) => ({ path: maybeId ? `${path}/${maybeId}` : path }));

  return {
    collection: vi.fn((dbArg, path) => ({ path })),
    doc: docMock,
    onSnapshot: vi.fn(() => vi.fn()),
    query: vi.fn((colRef) => colRef),
    orderBy: vi.fn((field) => field),
    deleteDoc: deleteDocMock,
    setDoc: setDocMock,
    serverTimestamp: vi.fn(() => 'server-timestamp'),
  };
});

vi.mock('../../../firebase/firebase', () => ({
  db: {},
  appId: 'test-app',
}));

vi.mock('../../../api/gemini', () => ({
  callGeminiAPI: vi.fn(async () => 'ai-summary'),
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
  default: ({ item, onConfirm, onClose }) => (
    <div data-testid="confirm-modal">
      <p>ยืนยันลบ {item?.name}</p>
      <button onClick={onConfirm}>confirm-delete</button>
      <button onClick={onClose}>close</button>
    </div>
  ),
}));

import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StudentProfileModal from '../StudentProfileModal';
import { setDoc, deleteDoc } from 'firebase/firestore';

const baseStudent = {
  id: 'stu1',
  studentNumber: '1',
  firstName: 'เด็กชายทดสอบ',
  lastName: 'เรียนดี',
  birthDate: '2013-06-18',
  gender: 'male',
  studentId: '001',
};

const subjects = [{ id: 'math', name: 'คณิตศาสตร์' }];

const initialScores = {
  math: {
    name: 'คณิตศาสตร์',
    assignments: [
      { name: 'การบ้าน 1', score: 8, maxScore: 10 },
      { name: 'โครงงาน', score: undefined, maxScore: 10 },
    ],
  },
};

const initialBehaviorLogs = [
  {
    id: 'log-positive',
    tag: 'ช่วยเพื่อน',
    type: 'positive',
    icon: 'Heart',
    note: 'ให้กำลังใจเพื่อน',
    timestamp: new Date('2024-11-02T10:00:00Z'),
  },
  {
    id: 'log-negative',
    tag: 'ไม่ส่งการบ้าน',
    type: 'negative',
    icon: 'AlertTriangle',
    note: 'ขาดส่งหลายครั้ง',
    timestamp: new Date('2024-11-01T10:00:00Z'),
  },
];

const renderModal = (overrideProps = {}) =>
  render(
    <StudentProfileModal
      student={baseStudent}
      grade="p6"
      subjects={subjects}
      onClose={vi.fn()}
      openModal={vi.fn()}
      testOverrides={{
        initialScores,
        initialBehaviorLogs,
        initialHealthData: { weight: '65', height: '165', measuredAt: new Date('2024-11-01T00:00:00Z') },
        skipLiveSync: true,
      }}
      {...overrideProps}
    />
  );

describe('StudentProfileModal (UI smoke tests)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders student identity and quick stats', () => {
    renderModal();

    expect(screen.getByText('เด็กชายทดสอบ เรียนดี')).toBeInTheDocument();
    expect(screen.getByText('ชั้น ป.6')).toBeInTheDocument();
    expect(screen.getByText('65 กก.')).toBeInTheDocument();
    expect(screen.getByText('165 ซม.')).toBeInTheDocument();
  });

  it('shows summary stats and reveals subject details after toggling the overview card', async () => {
    const user = userEvent.setup();
    renderModal();

    expect(screen.getByText(/ส่งแล้ว 1/)).toBeInTheDocument();
    expect(screen.getByText(/ค้างส่ง 1/)).toBeInTheDocument();
    expect(screen.queryByText(/การบ้าน 1/)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /ภาพรวมการเรียน/i }));
    await user.click(screen.getByRole('button', { name: /คณิตศาสตร์/i }));

    expect(screen.getByText(/การบ้าน 1/)).toBeInTheDocument();
    expect(screen.getByText(/โครงงาน/)).toBeInTheDocument();
    expect(screen.getByText(/งานที่ส่งแล้ว/)).toBeInTheDocument();
  });

  it('saves edited health data via Firestore', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByText('แก้ไข'));
    const inputs = screen.getAllByRole('spinbutton');
    await user.clear(inputs[0]);
    await user.type(inputs[0], '52');
    await user.clear(inputs[1]);
    await user.type(inputs[1], '150');

    await user.click(screen.getByText('บันทึก'));

    const [, dataArg] = setDoc.mock.calls[0];
    expect(dataArg.weight).toBe(52);
    expect(dataArg.height).toBe(150);
  });

  it('confirms and deletes a behavior log', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole('button', { name: /ภาพรวมพฤติกรรม/i }));
    await user.click(screen.getAllByLabelText('ลบบันทึก')[0]);
    await user.click(screen.getByText('confirm-delete'));

    expect(deleteDoc).toHaveBeenCalled();
    const docRef = deleteDoc.mock.calls[0][0];
    expect(docRef.path).toContain('behavior_logs/log-positive');
  });

  it('shows behavior summary card and reveals detailed logs on click', async () => {
    const user = userEvent.setup();
    renderModal();

    expect(screen.getByText(/สถานะ: ควรจับตา/i)).toBeInTheDocument();
    expect(screen.getByText(/เชิงบวก 1 \| ควรปรับปรุง 1/i)).toBeInTheDocument();
    expect(screen.queryByText(/ช่วยเพื่อน/)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /ภาพรวมพฤติกรรม/i }));

    expect(screen.getByText(/ช่วยเพื่อน/)).toBeInTheDocument();
    expect(screen.getByText(/\+ เพิ่มบันทึก/)).toBeInTheDocument();
  });
});
