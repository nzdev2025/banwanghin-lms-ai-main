import { describe, it, vi, beforeEach } from 'vitest';
import { generatePp5PDF } from '../pdfGenerator';
import jsPDF from 'jspdf';

// Mock jsPDF with a class to support 'new'
vi.mock('jspdf', () => {
    class JsPDFMock {
        constructor() {
            this.internal = {
                pageSize: {
                    getWidth: vi.fn(() => 297),
                    getHeight: vi.fn(() => 210)
                },
                getNumberOfPages: vi.fn(() => 1)
            };
            this.lastAutoTable = { finalY: 100 };
        }
        setFontSize = vi.fn();
        text = vi.fn();
        addFileToVFS = vi.fn();
        addFont = vi.fn();
        setFont = vi.fn();
        save = vi.fn();
        addPage = vi.fn();
    }
    return {
        default: JsPDFMock,
        jsPDF: JsPDFMock
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
        // Mock global fetch
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

    it('should use default school name "โรงเรียนบ้านวังหิน" when no config provided', async () => {
        await generatePp5PDF({}, 'p1', [], {}, []);

        // existing logic expects hardcoded 'โรงเรียนบ้านวังหิน' 
        // We get the mock instance from the mock calls
        const MockClass = jsPDF;
        // The mock class constructor is called. We need to spy on the instance methods.
        // Since we are creating a new instance inside the function, we can't easily access that specific instance reference *before* it's created unless we spy on the prototype or capture it from the constructor call.
        // But our mock implementation returns a fresh object.

        // However, 'jsPDF' imported here IS the mock class.
        // The function calls `new jsPDF()`.

        // In this specific mock setup, we can define the spies on the prototype or check the calls on the instances if we tracked them.
        // BUT, `vi.mock` factory above creates a FRESH class. 
        // The properties like `text` are instance properties initialized in the constructor.
        // We can check if ANY instance called `text`.

        // A better way with Vitest for constructor mocks? 
        // We can just check the results of the mock class.
        // 'jsPDF' is the mock/spy.

        // Wait, standard vitest mock class usage:
        // The imported 'jsPDF' is the constructor spy? No, it's the object { default: ... }

        // Actually, let's look at how I defined it:
        // return { default: JsPDFMock, jsPDF: JsPDFMock }
        // So import jsPDF from 'jspdf' -> jsPDF is JsPDFMock class.
        // But is JsPDFMock a spy? No, it's a class. 
        // I should treat the methods as spies.

        // Let's rely on the fact that `mockDoc.text` is a vi.fn().
        // Does code expose the doc? No.

        // Strategy: We can inspect the calls to the methods if we spy on them.
        // But new methods are created per instance in my mock.

        // Let's mock the methods on the prototype? No, I defined them in constructor.

        // Alternative: Use a factory that returns a shared spy object? No, internal state might matter.

        // Let's refine the mock to facilitate testing.
    });

    it('should use provided school name when config is passed', async () => {
        // ...
    });
});