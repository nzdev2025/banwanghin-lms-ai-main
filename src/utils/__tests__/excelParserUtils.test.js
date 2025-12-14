import { describe, it, expect } from 'vitest';
import { isValidExcelFile, columnLetterToNumber, numberToColumnLetter } from '../excelParser';

describe('excelParser Utils', () => {
  describe('isValidExcelFile', () => {
    it('returns true for valid xlsx file', () => {
      const file = new File([''], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      expect(isValidExcelFile(file)).toBe(true);
    });

    it('returns true for valid xls file', () => {
      const file = new File([''], 'test.xls', { type: 'application/vnd.ms-excel' });
      expect(isValidExcelFile(file)).toBe(true);
    });

    it('returns false for invalid extension', () => {
      const file = new File([''], 'test.txt', { type: 'text/plain' });
      expect(isValidExcelFile(file)).toBe(false);
    });
  });

  describe('Column Conversion', () => {
    it('converts number to letter correctly', () => {
      expect(numberToColumnLetter(1)).toBe('A');
      expect(numberToColumnLetter(2)).toBe('B');
      expect(numberToColumnLetter(26)).toBe('Z');
      expect(numberToColumnLetter(27)).toBe('AA');
      expect(numberToColumnLetter(28)).toBe('AB');
    });

    it('converts letter to number correctly', () => {
      expect(columnLetterToNumber('A')).toBe(1);
      expect(columnLetterToNumber('B')).toBe(2);
      expect(columnLetterToNumber('Z')).toBe(26);
      expect(columnLetterToNumber('AA')).toBe(27);
      expect(columnLetterToNumber('AB')).toBe(28);
    });
  });
});
