// Script to analyze pp5.xlsx structure
const XLSX = require('xlsx');
const wb = XLSX.readFile('pp5.xlsx');

console.log('=== All Sheet Names ===');
wb.SheetNames.forEach((name, i) => console.log(`${i + 1}. ${name}`));

// Analyze key input sheets
const sheetsToAnalyze = [
    'ข้อมูลพื้นฐาน',
    'กรอกข้อมูล นร1',
    'คะแนนรายวิชา',
    'น้ำหนักส่วนสูง',
    'เวลาเรียน1'
];

sheetsToAnalyze.forEach(sheetName => {
    const ws = wb.Sheets[sheetName];
    if (!ws) {
        console.log(`\n=== Sheet: ${sheetName} === NOT FOUND`);
        return;
    }
    console.log(`\n=== Sheet: ${sheetName} ===`);
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    console.log(`Range: A1 to ${XLSX.utils.encode_col(range.e.c)}${range.e.r + 1}`);

    // Show first 20 rows, first 12 columns
    for (let r = 0; r <= Math.min(19, range.e.r); r++) {
        let row = [];
        for (let c = 0; c <= Math.min(11, range.e.c); c++) {
            const addr = XLSX.utils.encode_cell({ r, c });
            const cell = ws[addr];
            const val = cell ? String(cell.v).substring(0, 15) : '';
            row.push(val.padEnd(15));
        }
        console.log(`R${String(r + 1).padStart(2)}: ${row.join(' | ')}`);
    }
});
