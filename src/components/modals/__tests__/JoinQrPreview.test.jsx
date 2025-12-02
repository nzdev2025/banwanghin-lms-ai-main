import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import JoinQrPreview from '../JoinQrPreview';

describe('JoinQrPreview', () => {
  const sampleUrl = 'https://example.com/qr.png';

  it('expands QR when clicked and allows closing', async () => {
    render(<JoinQrPreview qrUrl={sampleUrl} description="ทดสอบ" />);

    const thumb = screen.getByAltText(/QR สำหรับเข้าร่วม Lightning Quiz/i);
    await userEvent.click(thumb);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByAltText(/QR ขนาดใหญ่/i)).toHaveAttribute('src', sampleUrl);

    await userEvent.click(screen.getByRole('button', { name: /ปิดภาพใหญ่/i }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
