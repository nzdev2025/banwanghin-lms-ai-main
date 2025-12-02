import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import HealthRecordModal from '../HealthRecordModal';

vi.mock('../../../firebase/firebase', () => ({
  db: null,
  appId: 'test',
  logActivity: vi.fn(),
}));

vi.mock('../../../icons/Icon', () => ({
  default: ({ name }) => <span data-testid={`icon-${name}`} />,
}));

describe('HealthRecordModal term toggle visibility', () => {
  it('shows highlighted term button clearly against background', async () => {
    render(<HealthRecordModal onClose={() => {}} />);
    const term1 = await screen.findByTestId('health-term1');
    const term2 = screen.getByTestId('health-term2');

    expect(term1.className).toMatch(/bg-rose-500/);
    expect(term2.className).toMatch(/bg-white\/10/);
    expect(term2.className).toMatch(/border-rose-200/);
  });
});
