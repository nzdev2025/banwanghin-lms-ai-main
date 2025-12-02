const buildDateLabel = (reportType, selectedDate) => {
  if (reportType === 'daily') return selectedDate;
  if (reportType === 'monthly') return selectedDate.slice(0, 7);
  return selectedDate.slice(0, 4);
};

export const buildPrintableSavingsReport = ({ transactions, summary, selectedDate, reportType }) => {
  const dateLabel = buildDateLabel(reportType, selectedDate);
  const rowsHtml = (transactions || []).length
    ? transactions
        .map((t, idx) => {
          const formattedDate = t.timestamp?.toDate
            ? t.timestamp.toDate().toLocaleString('th-TH', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })
            : '-';
          const sign = t.type === 'deposit' ? '+' : '-';
          const label = t.type === 'deposit' ? 'ฝากเงิน' : 'ถอนเงิน';
          return `
                <tr>
                    <td style="padding:8px;border:1px solid #e5e7eb;text-align:center;">${idx + 1}</td>
                    <td style="padding:8px;border:1px solid #e5e7eb;">${t.studentName || '-'}</td>
                    <td style="padding:8px;border:1px solid #e5e7eb;">${t.grade || '-'}</td>
                    <td style="padding:8px;border:1px solid #e5e7eb;">${label}</td>
                    <td style="padding:8px;border:1px solid #e5e7eb;text-align:right;">${sign}${(t.amount || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</td>
                    <td style="padding:8px;border:1px solid #e5e7eb;">${formattedDate}</td>
                </tr>
            `;
        })
        .join('')
    : `
            <tr>
                <td colspan="6" style="padding:16px;text-align:center;border:1px solid #e5e7eb;color:#6b7280;">
                    ไม่พบข้อมูลในช่วงเวลาที่เลือก
                </td>
            </tr>
        `;

  return `
        <html>
        <head>
            <title>รายงานการออมทรัพย์</title>
            <style>
                body { font-family: "Sarabun", Arial, sans-serif; padding: 24px; color: #0f172a; }
                h1 { margin-bottom: 8px; }
                .summary { display: flex; gap: 12px; margin: 12px 0 20px; }
                .card { padding: 12px 16px; border: 1px solid #e5e7eb; border-radius: 10px; background: #f8fafc; }
                .card-title { font-size: 12px; color: #475569; margin: 0 0 4px; text-transform: uppercase; letter-spacing: 0.08em; }
                .card-value { font-size: 20px; font-weight: 700; margin: 0; }
                table { width: 100%; border-collapse: collapse; }
                th { background: #f1f5f9; text-align: left; }
                th, td { font-size: 13px; }
            </style>
        </head>
        <body>
            <h1>รายงานการออมทรัพย์</h1>
            <p style="color:#475569;margin-top:0;">ช่วงเวลา: ${dateLabel}</p>
            <div class="summary">
                <div class="card">
                    <p class="card-title">ยอดฝากรวม</p>
                    <p class="card-value">${(summary?.deposits || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท</p>
                </div>
                <div class="card">
                    <p class="card-title">ยอดถอนรวม</p>
                    <p class="card-value">${(summary?.withdrawals || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท</p>
                </div>
                <div class="card">
                    <p class="card-title">ผลต่าง</p>
                    <p class="card-value">${((summary?.deposits || 0) - (summary?.withdrawals || 0)).toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท</p>
                </div>
            </div>
            <table>
                <thead>
                    <tr>
                        <th style="padding:8px;border:1px solid #e5e7eb;">#</th>
                        <th style="padding:8px;border:1px solid #e5e7eb;">ชื่อนักเรียน</th>
                        <th style="padding:8px;border:1px solid #e5e7eb;">ชั้น</th>
                        <th style="padding:8px;border:1px solid #e5e7eb;">ประเภท</th>
                        <th style="padding:8px;border:1px solid #e5e7eb;text-align:right;">จำนวนเงิน</th>
                        <th style="padding:8px;border:1px solid #e5e7eb;">เวลา</th>
                    </tr>
                </thead>
                <tbody>${rowsHtml}</tbody>
            </table>
        </body>
        </html>
    `;
};
