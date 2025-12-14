// src/utils/excelParser.js
// Utility functions for parsing and writing Excel files using exceljs

import ExcelJS from 'exceljs';

// Valid Excel MIME types
const VALID_EXCEL_TYPES = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
];

// Valid Excel extensions
const VALID_EXCEL_EXTENSIONS = ['.xlsx', '.xls', '.xlsm'];

/**
 * Check if a file is a valid Excel file
 * @param {File} file - The file to check
 * @returns {boolean} - True if valid Excel file
 */
export const isValidExcelFile = (file) => {
    if (!file || !file.name) return false;

    const extension = '.' + file.name.split('.').pop().toLowerCase();
    const hasValidExtension = VALID_EXCEL_EXTENSIONS.includes(extension);
    const hasValidType = VALID_EXCEL_TYPES.includes(file.type) || file.type === '';

    return hasValidExtension && hasValidType;
};

/**
 * Parse an Excel file and return a workbook object
 * @param {File} file - The Excel file to parse
 * @returns {Promise<ExcelJS.Workbook>} - The parsed workbook
 * @throws {Error} - If file is invalid or corrupted
 */
export const parseExcelFile = async (file) => {
    // Validate file type
    if (!isValidExcelFile(file)) {
        throw new Error('ไฟล์ไม่ถูกต้อง กรุณาอัพโหลดไฟล์ Excel (.xlsx หรือ .xls)');
    }

    try {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(arrayBuffer);
        return workbook;
    } catch (error) {
        console.error('Error parsing Excel file:', error);
        throw new Error('ไม่สามารถอ่านไฟล์ Excel ได้ ไฟล์อาจเสียหาย');
    }
};

/**
 * Get all sheet names from a workbook
 * @param {ExcelJS.Workbook} workbook - The workbook
 * @returns {string[]} - Array of sheet names
 */
export const getSheetNames = (workbook) => {
    if (!workbook || !workbook.worksheets) return [];
    return workbook.worksheets.map(sheet => sheet.name);
};

/**
 * Get cell data from a specific sheet
 * @param {ExcelJS.Workbook} workbook - The workbook
 * @param {string} sheetName - Name of the sheet
 * @param {Object} options - Options for data extraction
 * @param {number} options.maxRows - Maximum rows to read (default: 50)
 * @param {number} options.maxCols - Maximum columns to read (default: 20)
 * @param {number} options.startRow - Starting row (default: 1)
 * @param {number} options.startCol - Starting column (default: 1)
 * @returns {Object|null} - Sheet data or null if sheet not found
 */
export const getSheetData = (workbook, sheetName, options = {}) => {
    const {
        maxRows = 50,
        maxCols = 20,
        startRow = 1,
        startCol = 1,
    } = options;

    const sheet = workbook.getWorksheet(sheetName);
    if (!sheet) return null;

    const rows = [];
    const actualRowCount = Math.min(sheet.rowCount || maxRows, startRow + maxRows - 1);
    const actualColCount = Math.min(sheet.columnCount || maxCols, startCol + maxCols - 1);

    for (let r = startRow; r <= actualRowCount; r++) {
        const row = sheet.getRow(r);
        const rowData = [];

        for (let c = startCol; c <= actualColCount; c++) {
            const cell = row.getCell(c);
            rowData.push({
                value: cell.value,
                text: cell.text || String(cell.value || ''),
                column: c,
                columnLetter: numberToColumnLetter(c),
            });
        }

        rows.push({
            rowNumber: r,
            cells: rowData,
        });
    }

    return {
        sheetName: sheet.name,
        rowCount: sheet.rowCount,
        columnCount: sheet.columnCount,
        rows,
    };
};

/**
 * Get preview data from all sheets (for mapping UI)
 * @param {ExcelJS.Workbook} workbook - The workbook
 * @param {Object} options - Preview options
 * @returns {Object[]} - Array of sheet previews
 */
export const getSheetsPreview = (workbook, options = { maxRows: 30, maxCols: 15 }) => {
    return workbook.worksheets.map(sheet => ({
        name: sheet.name,
        id: sheet.id,
        data: getSheetData(workbook, sheet.name, options),
    }));
};

/**
 * Write data to a sheet based on mapping configuration
 * @param {ExcelJS.Workbook} workbook - The workbook
 * @param {string} sheetName - Name of the sheet
 * @param {Object} mapping - Mapping configuration
 * @param {number} mapping.startRow - Starting row for data
 * @param {Object} mapping.columns - Column mapping { fieldName: columnLetter }
 * @param {Object[]} data - Array of data objects to write
 */
export const writeDataToSheet = (workbook, sheetName, mapping, data) => {
    const sheet = workbook.getWorksheet(sheetName);
    if (!sheet) {
        console.error(`Sheet "${sheetName}" not found`);
        return;
    }

    const { startRow, columns } = mapping;
    if (!columns || !startRow) {
        console.warn('Invalid mapping: missing columns or startRow');
        return;
    }

    data.forEach((item, index) => {
        const rowNum = startRow + index;
        const row = sheet.getRow(rowNum);

        Object.entries(columns).forEach(([fieldName, columnLetter]) => {
            // Skip empty column mappings
            if (!columnLetter || typeof columnLetter !== 'string' || columnLetter.trim() === '') {
                return;
            }

            const colNum = columnLetterToNumber(columnLetter);
            if (colNum < 1) {
                console.warn(`Invalid column letter: "${columnLetter}" for field "${fieldName}"`);
                return;
            }

            const cell = row.getCell(colNum);

            if (item[fieldName] !== undefined) {
                cell.value = item[fieldName];
            }
        });

        row.commit();
    });
};

/**
 * Write a single value to a specific cell
 * @param {ExcelJS.Workbook} workbook - The workbook
 * @param {string} sheetName - Name of the sheet
 * @param {string} cellAddress - Cell address (e.g., 'A1', 'B5')
 * @param {any} value - Value to write
 */
export const writeCellValue = (workbook, sheetName, cellAddress, value) => {
    const sheet = workbook.getWorksheet(sheetName);
    if (!sheet) return;

    const cell = sheet.getCell(cellAddress);
    cell.value = value;
};

/**
 * Export workbook as a downloadable blob
 * @param {ExcelJS.Workbook} workbook - The workbook
 * @returns {Promise<Blob>} - Blob for download
 */
export const exportWorkbook = async (workbook) => {
    const buffer = await workbook.xlsx.writeBuffer();
    return new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
};

/**
 * Download a blob as a file
 * @param {Blob} blob - The blob to download
 * @param {string} filename - Filename for download
 */
export const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

/**
 * Convert column letter to number (A=1, B=2, ..., Z=26, AA=27, etc.)
 * @param {string} letter - Column letter
 * @returns {number} - Column number
 */
export const columnLetterToNumber = (letter) => {
    let result = 0;
    for (let i = 0; i < letter.length; i++) {
        result = result * 26 + (letter.charCodeAt(i) - 64);
    }
    return result;
};

/**
 * Convert column number to letter (1=A, 2=B, ..., 26=Z, 27=AA, etc.)
 * @param {number} num - Column number
 * @returns {string} - Column letter
 */
export const numberToColumnLetter = (num) => {
    let result = '';
    while (num > 0) {
        const remainder = (num - 1) % 26;
        result = String.fromCharCode(65 + remainder) + result;
        num = Math.floor((num - 1) / 26);
    }
    return result;
};

/**
 * Create a new workbook from a template file
 * @param {File} templateFile - The template file
 * @returns {Promise<ExcelJS.Workbook>} - New workbook based on template
 */
export const createWorkbookFromTemplate = async (templateFile) => {
    return parseExcelFile(templateFile);
};
