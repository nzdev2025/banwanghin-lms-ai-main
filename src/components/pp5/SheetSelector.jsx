// src/components/pp5/SheetSelector.jsx
// Component for selecting a sheet from the workbook

import React from 'react';
import PropTypes from 'prop-types';
import Icon from '../../icons/Icon';

/**
 * SheetSelector - Displays list of sheets for selection
 */
const SheetSelector = ({
    sheets = [],
    selectedSheet,
    onSelectSheet,
    mappedSheets = {},
    title = 'เลือก Sheet',
}) => {
    // Get mapping status icon for each sheet
    const getMappingIcon = (sheetName) => {
        if (mappedSheets.studentInfo === sheetName) return { icon: 'Users', color: 'text-blue-400', label: 'ข้อมูลนักเรียน' };
        if (mappedSheets.scores === sheetName) return { icon: 'Award', color: 'text-yellow-400', label: 'คะแนน' };
        if (mappedSheets.attendance === sheetName) return { icon: 'Calendar', color: 'text-green-400', label: 'เวลาเรียน' };
        if (mappedSheets.health === sheetName) return { icon: 'Heart', color: 'text-red-400', label: 'สุขภาพ' };
        if (mappedSheets.basicInfo === sheetName) return { icon: 'Info', color: 'text-purple-400', label: 'ข้อมูลพื้นฐาน' };
        return null;
    };

    return (
        <div className="space-y-3">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Icon name="Layers" size={20} className="text-purple-400" />
                {title}
            </h3>

            <div className="flex flex-wrap gap-2 max-h-[200px] overflow-y-auto p-1">
                {sheets.map((sheetName, index) => {
                    const isSelected = selectedSheet === sheetName;
                    const mappingInfo = getMappingIcon(sheetName);

                    return (
                        <button
                            key={index}
                            onClick={() => onSelectSheet(sheetName)}
                            title={sheetName}
                            className={`
                                relative px-3 py-2 rounded-lg text-left transition-all duration-200 whitespace-nowrap
                                border ${isSelected
                                    ? 'bg-blue-600/30 border-blue-500 ring-2 ring-blue-500/50'
                                    : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'}
                            `}
                        >
                            {/* Mapping indicator badge */}
                            {mappingInfo && (
                                <div className={`absolute -top-1 -right-1 p-1 rounded-full bg-gray-800 border border-white/20`}>
                                    <Icon name={mappingInfo.icon} size={10} className={mappingInfo.color} />
                                </div>
                            )}

                            <div className="flex items-center gap-2">
                                <Icon
                                    name="FileSpreadsheet"
                                    size={14}
                                    className={isSelected ? 'text-blue-400' : 'text-gray-400'}
                                />
                                <span className={`text-xs font-medium ${isSelected ? 'text-blue-200' : 'text-gray-200'}`}>
                                    {sheetName}
                                </span>
                            </div>
                        </button>
                    );
                })}
            </div>

            {sheets.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                    <Icon name="FileX" size={32} className="mx-auto mb-2 opacity-50" />
                    <p>ไม่พบ Sheet ในไฟล์</p>
                </div>
            )}
        </div>
    );
};

SheetSelector.propTypes = {
    sheets: PropTypes.arrayOf(PropTypes.string),
    selectedSheet: PropTypes.string,
    onSelectSheet: PropTypes.func.isRequired,
    mappedSheets: PropTypes.object,
    title: PropTypes.string,
};

export default SheetSelector;
