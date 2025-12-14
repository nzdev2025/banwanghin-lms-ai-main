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

  if (section.type === 'true_false') {
    return `
      <div class="section">
        <p class="instruction">${section.instruction || ''}</p>
        <ol class="true-false-list">
          ${(section.questions || [])
            .map(
              (q) => `
                <li class="question">
                  <span class="tf-slot">(________)</span>
                  <span class="tf-text">${q.text || ''}</span>
                </li>
              `
            )
            .join('')}
        </ol>
      </div>
    `;
  }

  if (section.type === 'short_answer') {
    return `
      <div class="section">
        <p class="instruction">${section.instruction || ''}</p>
        <ol>
          ${(section.questions || [])
            .map(
              (q) => `
                <li class="question short-answer">
                  <p>${q.text || ''}</p>
                  <div class="lines">
                    <div class="line"></div>
                    <div class="line"></div>
                  </div>
                </li>
              `
            )
            .join('')}
        </ol>
      </div>
    `;
  }

  // Multiple Choice (default fallback)
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

export const buildPrintableWorksheetHTML = ({ worksheetData, formData, schoolName }) => {
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
          .header h1 { margin: 0; font-size: 20px; font-weight: bold; }
          .header h2 { margin: 4px 0 0; font-size: 16px; font-weight: 600; }
          .header h3 { margin: 4px 0 0; font-size: 14px; font-weight: normal; }
          .info { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 8px 12px; margin: 8px 0 16px; font-size: 14px; }
          .section { margin-top: 12px; }
          .instruction { margin: 0 0 12px; font-weight: 600; }
          .question { margin-bottom: 14px; page-break-inside: avoid; }
          .options { list-style-type: none; padding-left: 12px; margin: 6px 0 0; }
          .options li::before { content: "• "; margin-right: 6px; }
          
          /* True/False styles */
          .true-false-list { list-style: none; padding: 0; }
          .true-false-list li { margin-bottom: 10px; display: flex; align-items: baseline; }
          .tf-slot { margin-right: 12px; font-family: monospace; white-space: nowrap; }

          /* Short Answer styles */
          .short-answer .lines { margin-top: 24px; }
          .short-answer .line { border-bottom: 1px dotted #000; height: 24px; width: 100%; margin-bottom: 8px; }
        </style>
      </head>
      <body>
        <div class="page">
          <div class="header">
            <h1>${schoolName || 'โรงเรียน................................'}</h1>
            <h2>${title}</h2>
            <h3>วิชา: ${subject}</h3>
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
