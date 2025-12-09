import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Font URL (Local)
const TH_FONT_URL = '/fonts/Sarabun-Regular.ttf';

// Helper to load font
const loadThaiFont = async (doc) => {
    try {
        const response = await fetch(TH_FONT_URL);
        if (!response.ok) throw new Error('Failed to fetch font');
        const buffer = await response.arrayBuffer();

        const base64Font = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => {
                const result = reader.result;
                resolve(result.split(',')[1]);
            };
            reader.readAsDataURL(new Blob([buffer]));
        });

        doc.addFileToVFS('Sarabun-Regular.ttf', base64Font);
        doc.addFont('Sarabun-Regular.ttf', 'Sarabun', 'normal');
        doc.setFont('Sarabun', 'normal');
        return true;
    } catch (error) {
        console.warn('Could not load Thai font, falling back to standard font.', error);
        return false;
    }
};

// Helper to calculate grade (basic 0-4 scale)
const calculateGrade = (score, maxScore) => {
    if (!maxScore) return '-';
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return '4';
    if (percentage >= 75) return '3.5';
    if (percentage >= 70) return '3';
    if (percentage >= 65) return '2.5';
    if (percentage >= 60) return '2';
    if (percentage >= 55) return '1.5';
    if (percentage >= 50) return '1';
    return '0';
};

export const generatePp5PDF = async (subject, grade, students, scores, assignments) => {
    // Use landscape orientation for better table fit
    const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
    });

    // Load Thai font
    const fontLoaded = await loadThaiFont(doc);
    const fontName = fontLoaded ? 'Sarabun' : 'helvetica';

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 10;

    // Calculate max possible score
    const maxTotalScore = assignments.reduce((sum, a) => sum + (a.maxScore || 0), 0);

    // === HEADER SECTION ===
    doc.setFontSize(16);
    doc.text('แบบบันทึกผลการเรียนประจำรายวิชา (ปพ.5)', pageWidth / 2, 15, { align: 'center' });

    doc.setFontSize(12);
    doc.text('โรงเรียนบ้านวังหิน', pageWidth / 2, 22, { align: 'center' });

    const gradeLabel = grade.replace('p', '');
    doc.setFontSize(11);
    doc.text(`รายวิชา ${subject.name || '-'} (${subject.code || '-'}) ชั้นประถมศึกษาปีที่ ${gradeLabel}`, pageWidth / 2, 29, { align: 'center' });
    doc.text(`ครูผู้สอน: ${subject.teacherName || subject.teacher || '-'}`, pageWidth / 2, 35, { align: 'center' });

    // === TABLE SECTION ===
    // Dynamic column widths
    const fixedColumnsWidth = 12 + 10 + 50 + 18 + 15 + 20;
    const availableWidth = pageWidth - (margin * 2) - fixedColumnsWidth;
    const assignmentColWidth = Math.min(
        Math.max(availableWidth / Math.max(assignments.length, 1), 12),
        25
    );

    // Table Headers
    const headers = [
        'ลำดับ',
        'เลขที่',
        'ชื่อ - สกุล',
        ...assignments.map(a => `${a.name}\n(${a.maxScore})`),
        `รวม\n(${maxTotalScore})`,
        'เกรด',
        'หมายเหตุ'
    ];

    // Table Body
    const body = students.map((student, index) => {
        let totalScore = 0;
        const assignmentScores = assignments.map(assign => {
            const score = scores[student.id]?.[assign.id];
            if (typeof score === 'number') {
                totalScore += score;
                return score.toString();
            }
            return '-';
        });

        const gradeVal = calculateGrade(totalScore, maxTotalScore);

        return [
            (index + 1).toString(),
            student.studentNumber?.toString() || '-',
            `${student.firstName || ''} ${student.lastName || ''}`.trim() || '-',
            ...assignmentScores,
            totalScore.toString(),
            gradeVal,
            ''
        ];
    });

    // Column Styles
    const columnStyles = {
        0: { halign: 'center', cellWidth: 12 },
        1: { halign: 'center', cellWidth: 10 },
        2: { halign: 'left', cellWidth: 50 },
    };

    assignments.forEach((_, idx) => {
        columnStyles[idx + 3] = { halign: 'center', cellWidth: assignmentColWidth };
    });

    const totalColIndex = 3 + assignments.length;
    columnStyles[totalColIndex] = { halign: 'center', cellWidth: 18 };
    columnStyles[totalColIndex + 1] = { halign: 'center', cellWidth: 15 };
    columnStyles[totalColIndex + 2] = { halign: 'center', cellWidth: 20 };

    // Generate Table
    autoTable(doc, {
        startY: 40,
        head: [headers],
        body: body,
        styles: {
            font: fontName,
            fontSize: 9,
            cellPadding: 2,
            lineColor: [0, 0, 0],
            lineWidth: 0.2,
            textColor: [0, 0, 0],
            valign: 'middle'
        },
        headStyles: {
            fillColor: [230, 230, 230],
            textColor: [0, 0, 0],
            halign: 'center',
            valign: 'middle',
            fontStyle: 'normal',
            lineWidth: 0.3
        },
        bodyStyles: {
            fillColor: [255, 255, 255]
        },
        alternateRowStyles: {
            fillColor: [248, 248, 248]
        },
        columnStyles: columnStyles,
        theme: 'grid',
        margin: { left: margin, right: margin },
        tableWidth: 'auto',
        didDrawPage: (data) => {
            const pageCount = doc.internal.getNumberOfPages();
            if (pageCount > 1) {
                doc.setFontSize(8);
                doc.text(
                    `หน้า ${data.pageNumber} / ${pageCount}`,
                    pageWidth - margin,
                    pageHeight - 5,
                    { align: 'right' }
                );
            }
        }
    });

    // === FOOTER SECTION ===
    const finalY = doc.lastAutoTable.finalY + 15;

    if (finalY > pageHeight - 40) {
        doc.addPage();
        doc.setFontSize(10);
        doc.text('ลงชื่อ...............................................ครูผู้สอน', 60, 30);
        doc.text('(.................................................)', 60, 38);
        doc.text('ลงชื่อ...............................................หัวหน้ากลุ่มสาระฯ', pageWidth - 60, 30, { align: 'center' });
        doc.text('(.................................................)', pageWidth - 60, 38, { align: 'center' });
    } else {
        doc.setFontSize(10);
        doc.text('ลงชื่อ...............................................ครูผู้สอน', 60, finalY);
        doc.text('(.................................................)', 60, finalY + 8);
        doc.text('ลงชื่อ...............................................หัวหน้ากลุ่มสาระฯ', pageWidth - 60, finalY, { align: 'center' });
        doc.text('(.................................................)', pageWidth - 60, finalY + 8, { align: 'center' });
    }

    // Save the PDF
    const fileName = `ปพ5_${subject.name || 'วิชา'}_ป${gradeLabel}.pdf`;
    doc.save(fileName);
};
