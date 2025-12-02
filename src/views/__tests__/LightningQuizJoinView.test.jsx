import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LightningQuizJoinView from '../LightningQuizJoinView';

// Mock Firebase dependencies used by the join view
vi.mock('../../firebase/firebase', () => ({
  db: {}, // truthy value so the component runs join logic
  appId: 'test-app',
}));

const mockGetDocs = vi.fn();
const mockOnSnapshot = vi.fn();

vi.mock('firebase/firestore', () => ({
  collection: vi.fn((...args) => ({ type: 'collection', args })),
  query: vi.fn((...args) => ({ type: 'query', args })),
  where: vi.fn((...args) => ({ type: 'where', args })),
  limit: vi.fn((...args) => ({ type: 'limit', args })),
  doc: vi.fn((...args) => ({ type: 'doc', args })),
  getDocs: (...args) => mockGetDocs(...args),
  onSnapshot: (...args) => {
    mockOnSnapshot(...args);
    return () => {};
  },
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
}));

vi.mock('../../icons/Icon', () => ({
  default: ({ name }) => <span data-testid={`icon-${name}`} />,
}));

const renderJoinView = () => render(<LightningQuizJoinView />);

describe('LightningQuizJoinView - join flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetDocs.mockReset();
    mockOnSnapshot.mockReset();
    localStorage.clear();
  });

  it('shows a friendly message when the PIN is not found', async () => {
    mockGetDocs.mockResolvedValue({ empty: true, docs: [] });

    renderJoinView();
    await userEvent.type(screen.getByPlaceholderText(/• • • • • •/), '1234');
    await userEvent.click(screen.getByRole('button', { name: /เข้าร่วม/i }));

    expect(
      await screen.findByText('ไม่พบ PIN นี้ในระบบ กรุณาตรวจสอบอีกครั้ง'),
    ).toBeInTheDocument();
  });

  it('retries once when the first join attempt fails with a transient error', async () => {
    const transientError = Object.assign(new Error('network hiccup'), { code: 'unavailable' });
    mockGetDocs
      .mockRejectedValueOnce(transientError)
      .mockResolvedValueOnce({
        empty: false,
        docs: [
          {
            id: 'session-1',
            data: () => ({ sessionCode: '123456', quizTitle: 'Demo Quiz' }),
          },
        ],
      });

    renderJoinView();
    await userEvent.type(screen.getByPlaceholderText(/• • • • • •/), '123456');
    await userEvent.click(screen.getByRole('button', { name: /เข้าร่วม/i }));

    expect(
      await screen.findByText('บันทึกชื่อเล่น'),
    ).toBeInTheDocument();
    await waitFor(() => expect(mockGetDocs).toHaveBeenCalledTimes(2));
  });

  it('surfaces a connection error after exhausting retries', async () => {
    const fatalError = Object.assign(new Error('permission denied'), { code: 'permission-denied' });
    mockGetDocs.mockRejectedValue(fatalError);

    renderJoinView();
    await userEvent.type(screen.getByPlaceholderText(/• • • • • •/), '999999');
    await userEvent.click(screen.getByRole('button', { name: /เข้าร่วม/i }));

    expect(
      await screen.findByText('ไม่สามารถเชื่อมต่อได้ กรุณาลองใหม่'),
    ).toBeInTheDocument();
    await waitFor(() => expect(mockGetDocs).toHaveBeenCalledTimes(2));
  });
});
