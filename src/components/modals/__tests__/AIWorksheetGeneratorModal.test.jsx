import { describe, expect, it } from 'vitest';
import { buildPrintableWorksheetHTML, printWorksheetHtml } from '../aiWorksheetPrint';
import { vi } from 'vitest';

describe('buildPrintableWorksheetHTML', () => {
  const baseData = {
    worksheetData: {
      title: 'ใบงานเรื่อง สมการง่ายๆ',
      subject: 'คณิตศาสตร์',
      sections: [
        {
          type: 'multiple_choice',
          instruction: 'เลือกคำตอบที่ถูกต้อง',
          questions: [
            { id: 1, text: '1 + 1 = ?', options: ['1', '2', '3'] },
            { id: 2, text: '2 + 2 = ?', options: ['2', '4', '6'] },
          ],
        },
      ],
    },
    formData: { docType: 'worksheet' },
  };

  it('renders printable HTML without Vite placeholder or browser header strings', () => {
    const html = buildPrintableWorksheetHTML(baseData);
    expect(html).toContain('ใบงานเรื่อง สมการง่ายๆ');
    expect(html).toContain('คณิตศาสตร์');
    expect(html).not.toContain('Vite + React');
    expect(html).toContain('<title></title>');
  });

  it('falls back to placeholder text when no section is provided', () => {
    const html = buildPrintableWorksheetHTML({ worksheetData: {}, formData: { docType: 'worksheet' } });
    expect(html).toContain('ไม่พบข้อมูลสำหรับพิมพ์');
  });

  it('sets blank title and replaces location when printing', () => {
    const write = vi.fn();
    const close = vi.fn();
    const focus = vi.fn();
    const print = vi.fn();
    const replaceState = vi.fn();
    const doc = { open: vi.fn(), write, close, title: 'initial' };
    const mockWindow = { document: doc, history: { replaceState }, focus, print };
    const opener = { open: vi.fn(() => mockWindow) };

    const html = '<html><head><title></title></head><body>test</body></html>';
    printWorksheetHtml(html, opener);

    expect(opener.open).toHaveBeenCalled();
    expect(write).toHaveBeenCalledWith(html);
    expect(doc.title).toBe('\u200b');
    expect(replaceState).toHaveBeenCalledWith({}, '', ' ');
    expect(print).toHaveBeenCalled();
  });
});
