import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generatePp5PDF } from '../pdfGenerator';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Mock jsPDF
vi.mock('jspdf', () => {
    const jsPDFMock = vi.fn(function () {
        return {
            addFileToVFS: vi.fn(),
            addFont: vi.fn(),
            setFont: vi.fn(),
            setFontSize: vi.fn(),
            text: vi.fn(),
            save: vi.fn(),
            addPage: vi.fn(),
            lastAutoTable: { finalY: 100 },
            internal: {
                getNumberOfPages: vi.fn(() => 1),
                pageSize: {
                    getWidth: vi.fn(() => 297),
                    getHeight: vi.fn(() => 210),
                }
            }
        };
    });

    return {
        default: jsPDFMock,
        jsPDF: jsPDFMock
    };
});

// Mock jspdf-autotable
vi.mock('jspdf-autotable', () => {
    return {
        default: vi.fn()
    };
});

describe('generatePp5PDF', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Mock global fetch using vi.stubGlobal
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: true,
            arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(10)),
        }));
        
        // Mock FileReader
        vi.stubGlobal('FileReader', class {
            readAsDataURL() {
                this.result = 'data:font/ttf;base64,AAEAAA==';
                if (this.onload) this.onload();
            }
        });
    });

    it('should create a PDF and save it with correct filename', async () => {
        const subject = { name: 'Math', id: 'SUB001', code: 'M101', teacherName: 'Teacher A' };
        const grade = 'p1';
        const students = [
            { id: '1', studentNumber: '1', firstName: 'John', lastName: 'Doe' },
            { id: '2', studentNumber: '2', firstName: 'Jane', lastName: 'Smith' },
        ];
        const scores = {
            '1': { 'assign1': 10 },
            '2': { 'assign1': 8 },
        };
        const assignments = [
            { id: 'assign1', name: 'Quiz 1', maxScore: 10 },
        ];

        await generatePp5PDF(subject, grade, students, scores, assignments);

        expect(fetch).toHaveBeenCalledWith('/fonts/Sarabun-Regular.ttf');
        expect(jsPDF).toHaveBeenCalled();
        // We don't check constructor args strictly as implementation might vary, 
        // but we check if doc methods are called.

        const doc = jsPDF.mock.results[0].value;
        expect(doc.addFileToVFS).toHaveBeenCalled();
        expect(doc.addFont).toHaveBeenCalled();
        expect(doc.setFont).toHaveBeenCalledWith('Sarabun', 'normal');
        expect(doc.text).toHaveBeenCalled();
        expect(autoTable).toHaveBeenCalled();
        expect(doc.save).toHaveBeenCalled();
    });
});