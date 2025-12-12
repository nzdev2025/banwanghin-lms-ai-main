// src/utils/exportUtils.js

/**
 * Export data to CSV file with Thai character support
 * @param {Array<Object>} data - Array of objects to export
 * @param {string} filename - Filename without extension
 * @param {Array<{key: string, label: string}>} columns - Column definitions
 */
export const exportToCSV = (data, filename, columns) => {
    if (!data || data.length === 0) {
        alert('ไม่มีข้อมูลให้ export');
        return;
    }

    // Create header row
    const headers = columns.map(col => col.label);

    // Create data rows
    const rows = data.map(item =>
        columns.map(col => {
            let value = item[col.key];

            // Handle nested keys like 'student.name'
            if (col.key.includes('.')) {
                const keys = col.key.split('.');
                value = keys.reduce((obj, key) => obj?.[key], item);
            }

            // Escape quotes and wrap in quotes if contains comma
            if (value === null || value === undefined) {
                value = '';
            } else {
                value = String(value);
                if (value.includes(',') || value.includes('"') || value.includes('\n')) {
                    value = `"${value.replace(/"/g, '""')}"`;
                }
            }

            return value;
        })
    );

    // Combine headers and rows
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');

    // Add UTF-8 BOM for Thai character support in Excel
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });

    // Create download link
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

/**
 * Format date for filename
 * @param {Date} date 
 * @returns {string} formatted date string
 */
export const formatDateForFilename = (date = new Date()) => {
    return date.toISOString().slice(0, 10).replace(/-/g, '');
};
