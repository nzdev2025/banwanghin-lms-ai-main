import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import DevelopmentalAssessmentModal from '../DevelopmentalAssessmentModal';
import { ToastProvider } from '../../../context/ToastContext';

vi.mock('../../../firebase/firebase', () => ({
  db: null,
  appId: 'test',
  logActivity: vi.fn(),
}));

vi.mock('../../../icons/Icon', () => ({
  default: ({ name }) => <span data-testid={`icon-${name}`} />,
}));

describe('DevelopmentalAssessmentModal term toggle visibility', () => {
  it('renders term buttons with clear active/inactive contrast', async () => {
    render(<ToastProvider><DevelopmentalAssessmentModal onClose={() => { }} /></ToastProvider>);
    const term1 = await screen.findByTestId('assessment-term1');
    const term2 = screen.getByTestId('assessment-term2');

    expect(term1.className).toMatch(/bg-blue-500/);
    expect(term2.className).toMatch(/bg-white\/10/);
    expect(term2.className).toMatch(/border-blue-200/);
  });
});
