import { describe, expect, it } from 'vitest';
import { buildPrintableSavingsReport } from '../savingsReportPrint';

const mockTimestamp = (iso) => ({
  toDate: () => new Date(iso),
});

describe('buildPrintableSavingsReport', () => {
  it('renders summary and transactions into printable HTML', () => {
    const html = buildPrintableSavingsReport({
      transactions: [
        {
          id: 't1',
          type: 'deposit',
          amount: 150,
          studentName: 'ด.ช.เอ',
          grade: 'ป.3',
          timestamp: mockTimestamp('2025-02-11T08:00:00Z'),
        },
        {
          id: 't2',
          type: 'withdraw',
          amount: 50,
          studentName: 'ด.ญ.บี',
          grade: 'ป.4',
          timestamp: mockTimestamp('2025-02-11T09:00:00Z'),
        },
      ],
      summary: { deposits: 150, withdrawals: 50 },
      selectedDate: '2025-02-11',
      reportType: 'daily',
    });

    expect(html).toContain('รายงานการออมทรัพย์');
    expect(html).toContain('ยอดฝากรวม');
    expect(html).toContain('150');
    expect(html).toContain('ด.ช.เอ');
    expect(html).toContain('ฝากเงิน');
    expect(html).toContain('ถอนเงิน');
  });

  it('shows empty state message when no transactions', () => {
    const html = buildPrintableSavingsReport({
      transactions: [],
      summary: { deposits: 0, withdrawals: 0 },
      selectedDate: '2025-02-11',
      reportType: 'daily',
    });

    expect(html).toContain('ไม่พบข้อมูลในช่วงเวลาที่เลือก');
  });
});
