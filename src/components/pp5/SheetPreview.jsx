// src/components/pp5/SheetPreview.jsx
// Visual preview component for Excel sheets with cell selection capability

import React from 'react';
import PropTypes from 'prop-types';
import Icon from '../../icons/Icon';

/**
 * SheetPreview - Displays Excel sheet data in a table format
 * Supports cell selection for mapping configuration
 */
const SheetPreview = ({
    sheetData,
    selectedCells = [],
    onCellClick,
    onColumnSelect,
    highlightedColumns = [],
    maxDisplayRows = 25,
    maxDisplayCols = 15,
    selectionMode = 'column', // 'cell', 'column', 'row'
}) => {
    const [scrollPosition, setScrollPosition] = React.useState({ row: 0, col: 0 });

    if (!sheetData || !sheetData.rows?.length) {
        return (
            <div className="flex items-center justify-center h-64 bg-gray-800/50 rounded-xl border border-white/10">
                <div className="text-center text-gray-400">
                    <Icon name="FileSpreadsheet" size={48} className="mx-auto mb-3 opacity-50" />
                    <p>ไม่มีข้อมูลในชีทนี้</p>
                </div>
            </div>
        );
    }

    const { rows, sheetName } = sheetData;
    const displayRows = rows.slice(scrollPosition.row, scrollPosition.row + maxDisplayRows);

    // Handle column header click
    const handleColumnClick = (colIndex, columnLetter) => {
        if (selectionMode === 'column' && onColumnSelect) {
            onColumnSelect(columnLetter, colIndex);
        }
    };

    // Handle cell click
    const handleCellClick = (rowNum, colIndex, columnLetter, value) => {
        if (onCellClick) {
            onCellClick({
                row: rowNum,
                column: colIndex,
                columnLetter,
                value,
                address: `${columnLetter}${rowNum}`,
            });
        }
    };

    // Check if column is highlighted
    const isColumnHighlighted = (columnLetter) => {
        return highlightedColumns.includes(columnLetter);
    };

    // Check if cell is selected
    const isCellSelected = (rowNum, columnLetter) => {
        return selectedCells.some(c => c.row === rowNum && c.columnLetter === columnLetter);
    };

    return (
        <div className="relative">
            {/* Sheet name header */}
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Icon name="Table" size={20} className="text-blue-400" />
                    {sheetName}
                </h3>
                <span className="text-sm text-gray-400">
                    {rows.length} แถว
                </span>
            </div>

            {/* Scrollable table container */}
            <div className="overflow-auto max-h-[500px] rounded-xl border border-white/10 bg-gray-900/50">
                <table className="min-w-full border-collapse">
                    {/* Column headers (A, B, C, ...) */}
                    <thead className="sticky top-0 z-10">
                        <tr className="bg-gray-800">
                            {/* Row number header */}
                            <th className="sticky left-0 z-20 bg-gray-800 px-2 py-2 text-xs font-medium text-gray-400 border-b border-r border-white/10 w-12">
                                #
                            </th>
                            {/* Column letter headers */}
                            {displayRows[0]?.cells?.map((cell, colIdx) => (
                                <th
                                    key={colIdx}
                                    onClick={() => handleColumnClick(cell.column, cell.columnLetter)}
                                    className={`
                                        px-3 py-2 text-xs font-bold text-center border-b border-r border-white/10 min-w-[80px]
                                        transition-colors cursor-pointer
                                        ${isColumnHighlighted(cell.columnLetter)
                                            ? 'bg-blue-600/50 text-blue-200'
                                            : 'text-gray-300 hover:bg-white/10'}
                                    `}
                                >
                                    {cell.columnLetter}
                                </th>
                            ))}
                        </tr>
                    </thead>

                    {/* Data rows */}
                    <tbody>
                        {displayRows.map((row, rowIdx) => (
                            <tr
                                key={row.rowNumber}
                                className="hover:bg-white/5 transition-colors"
                            >
                                {/* Row number */}
                                <td className="sticky left-0 z-10 bg-gray-800/90 px-2 py-1.5 text-xs font-medium text-gray-400 border-b border-r border-white/10 text-center">
                                    {row.rowNumber}
                                </td>

                                {/* Cell data */}
                                {row.cells.map((cell, colIdx) => {
                                    const isSelected = isCellSelected(row.rowNumber, cell.columnLetter);
                                    const isHighlighted = isColumnHighlighted(cell.columnLetter);

                                    return (
                                        <td
                                            key={colIdx}
                                            onClick={() => handleCellClick(row.rowNumber, cell.column, cell.columnLetter, cell.text)}
                                            className={`
                                                px-2 py-1.5 text-xs border-b border-r border-white/5
                                                max-w-[150px] truncate cursor-pointer transition-colors
                                                ${isSelected
                                                    ? 'bg-green-600/40 text-green-200 ring-2 ring-green-500 ring-inset'
                                                    : isHighlighted
                                                        ? 'bg-blue-600/20 text-blue-100'
                                                        : 'text-gray-300 hover:bg-white/10'}
                                            `}
                                            title={cell.text}
                                        >
                                            {cell.text || ''}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Scroll controls */}
            {rows.length > maxDisplayRows && (
                <div className="flex items-center justify-center gap-4 mt-3">
                    <button
                        onClick={() => setScrollPosition(prev => ({ ...prev, row: Math.max(0, prev.row - 10) }))}
                        disabled={scrollPosition.row === 0}
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        <Icon name="ChevronUp" size={16} className="text-gray-400" />
                    </button>
                    <span className="text-sm text-gray-400">
                        แถว {scrollPosition.row + 1} - {Math.min(scrollPosition.row + maxDisplayRows, rows.length)} / {rows.length}
                    </span>
                    <button
                        onClick={() => setScrollPosition(prev => ({ ...prev, row: Math.min(rows.length - maxDisplayRows, prev.row + 10) }))}
                        disabled={scrollPosition.row + maxDisplayRows >= rows.length}
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        <Icon name="ChevronDown" size={16} className="text-gray-400" />
                    </button>
                </div>
            )}

            {/* Selection hint */}
            <div className="mt-3 text-center text-sm text-gray-500">
                {selectionMode === 'column' && 'คลิกที่หัวคอลัมน์เพื่อเลือก'}
                {selectionMode === 'cell' && 'คลิกที่เซลล์เพื่อเลือก'}
            </div>
        </div>
    );
};

SheetPreview.propTypes = {
    sheetData: PropTypes.shape({
        sheetName: PropTypes.string,
        rows: PropTypes.arrayOf(PropTypes.shape({
            rowNumber: PropTypes.number,
            cells: PropTypes.arrayOf(PropTypes.shape({
                value: PropTypes.any,
                text: PropTypes.string,
                column: PropTypes.number,
                columnLetter: PropTypes.string,
            })),
        })),
    }),
    selectedCells: PropTypes.array,
    onCellClick: PropTypes.func,
    onColumnSelect: PropTypes.func,
    highlightedColumns: PropTypes.arrayOf(PropTypes.string),
    maxDisplayRows: PropTypes.number,
    maxDisplayCols: PropTypes.number,
    selectionMode: PropTypes.oneOf(['cell', 'column', 'row']),
};

export default SheetPreview;
