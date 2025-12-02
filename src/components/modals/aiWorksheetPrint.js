const renderSection = (section) => {
  if (!section) return '';
  if (section.type === 'fill_in_the_blanks') {
    return `
      <div class="section">
        <p class="instruction">${section.instruction || ''}</p>
        <ol>
          ${(section.content || [])
            .map((item) => `<li class="question">${item}</li>`)
            .join('')}
        </ol>
      </div>
    `;
  }

  const optionsBlock = (q) =>
    q.options
      ? `<ul class="options">
          ${q.options.map((opt) => `<li>${opt}</li>`).join('')}
        </ul>`
      : '';

  return `
    <div class="section">
      <p class="instruction">${section.instruction || ''}</p>
      <ol>
        ${(section.questions || [])
          .map(
            (q) => `
              <li class="question">
                <p>${q.text || ''}</p>
                ${optionsBlock(q)}
              </li>
            `,
          )
          .join('')}
      </ol>
    </div>
  `;
};

export const buildPrintableWorksheetHTML = ({ worksheetData, formData }) => {
  const title = worksheetData?.title || (formData?.docType === 'exam' ? 'แบบทดสอบ' : 'ใบงาน');
  const subject = worksheetData?.subject || '..........................';
  const sectionHTML = renderSection(worksheetData?.sections?.[0]);

  return `
    <html>
      <head>
        <meta charset="utf-8" />
        <title></title>
        <style>
          @page { margin: 10mm; }
          body { margin: 0; padding: 16px; font-family: "Sarabun", Arial, sans-serif; color: #0f172a; }
          .page { max-width: 800px; margin: 0 auto; }
          .header { text-align: center; margin-bottom: 12px; }
          .header h1 { margin: 0; font-size: 20px; }
          .header h2 { margin: 4px 0 0; font-size: 16px; font-weight: 600; }
          .info { display: flex; justify-content: space-between; align-items: center; border: 1px solid #e5e7eb; padding: 8px 12px; margin: 8px 0 12px; font-size: 14px; }
          .section { margin-top: 12px; }
          .instruction { margin: 0 0 8px; font-weight: 600; }
          .question { margin-bottom: 10px; }
          .options { list-style-type: none; padding-left: 12px; margin: 6px 0 0; }
          .options li::before { content: "• "; }
        </style>
      </head>
      <body>
        <div class="page">
          <div class="header">
            <h1>${title}</h1>
            <h2>วิชา: ${subject}</h2>
          </div>
          <div class="info">
            <span>ชื่อ: .................................................................</span>
            <span>ชั้น: ............ เลขที่: ............</span>
          </div>
          ${sectionHTML || '<p style="text-align:center;color:#94a3b8;">ไม่พบข้อมูลสำหรับพิมพ์</p>'}
        </div>
      </body>
    </html>
  `;
};

export const printWorksheetHtml = (html, windowRef = window) => {
  const printWindow = windowRef.open('', '_blank', 'width=900,height=1200');
  if (!printWindow) return;
  const { document: doc, history } = printWindow;
  doc.open();
  doc.write(html);
  doc.title = '\u200b';
  if (history && typeof history.replaceState === 'function') {
    try {
      history.replaceState({}, '', ' ');
    } catch (err) {
      console.warn('replaceState failed in print window', err);
    }
  }
  doc.close();
  if (typeof printWindow.focus === 'function') printWindow.focus();
  if (typeof printWindow.print === 'function') printWindow.print();
};
