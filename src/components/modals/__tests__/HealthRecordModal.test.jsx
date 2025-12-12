import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import HealthRecordModal from '../HealthRecordModal';
import { ToastProvider } from '../../../context/ToastContext';

vi.mock('../../../firebase/firebase', () => ({
  db: null,
  appId: 'test',
  logActivity: vi.fn(),
}));

vi.mock('../../../icons/Icon', () => ({
  default: ({ name }) => <span data-testid={`icon-${name}`} />,
}));

// Mock SiteConfigContext
vi.mock('../../../context/SiteConfigContext', () => ({
  useSiteConfig: vi.fn(() => ({
    siteConfig: {
      schoolName: 'Test School Health',
    }
  }))
}));

describe('HealthRecordModal', () => {
  it('renders correctly with dynamic school name', () => {
    render(<ToastProvider><HealthRecordModal onClose={() => { }} /></ToastProvider>);
    expect(screen.getByText(/บันทึกข้อมูลสุขภาพ/i)).toBeInTheDocument();
    // This assertion ensures we are using the config, it should fail if hardcoded (which is "โรงเรียนบ้านวังหิน")
    expect(screen.getByText(/Test School Health/i)).toBeInTheDocument();
  });

  it('shows highlighted term button clearly against background', async () => {
    render(<ToastProvider><HealthRecordModal onClose={() => { }} /></ToastProvider>);
    const term1 = await screen.findByTestId('health-term1');
    const term2 = screen.getByTestId('health-term2');

    expect(term1.className).toMatch(/bg-rose-500/);
    expect(term2.className).toMatch(/bg-white\/10/);
    expect(term2.className).toMatch(/border-rose-200/);
  });
});
