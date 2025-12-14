// src/components/pp5/SheetSelector.jsx
// Component for selecting a sheet from the workbook - Premium design

import React from 'react';
import PropTypes from 'prop-types';
import Icon from '../../icons/Icon';

/**
 * SheetSelector - Displays list of sheets for selection with expanded layout
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
        if (mappedSheets.studentInfo === sheetName) return { icon: 'Users', color: 'text-blue-400', label: 'ข้อมูลนักเรียน', bgColor: 'bg-blue-500/20' };
        if (mappedSheets.scores === sheetName) return { icon: 'Award', color: 'text-amber-400', label: 'คะแนน', bgColor: 'bg-amber-500/20' };
        if (mappedSheets.attendance === sheetName) return { icon: 'Calendar', color: 'text-emerald-400', label: 'เวลาเรียน', bgColor: 'bg-emerald-500/20' };
        if (mappedSheets.health === sheetName) return { icon: 'Heart', color: 'text-rose-400', label: 'สุขภาพ', bgColor: 'bg-rose-500/20' };
        if (mappedSheets.basicInfo === sheetName) return { icon: 'Info', color: 'text-purple-400', label: 'ข้อมูลพื้นฐาน', bgColor: 'bg-purple-500/20' };
        return null;
    };

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/20">
                    <Icon name="Layers" size={20} className="text-purple-400" />
                </div>
                {title}
            </h3>

            {/* Expanded sheet grid - no max height, wrap naturally */}
            <div className="flex flex-wrap gap-2">
                {sheets.map((sheetName, index) => {
                    const isSelected = selectedSheet === sheetName;
                    const mappingInfo = getMappingIcon(sheetName);

                    return (
                        <button
                            key={index}
                            onClick={() => onSelectSheet(sheetName)}
                            title={sheetName}
                            className={`
                                relative px-4 py-2.5 rounded-xl text-left transition-all duration-200 whitespace-nowrap
                                border-2 ${isSelected
                                    ? 'bg-gradient-to-r from-blue-600/40 to-indigo-600/40 border-blue-400 shadow-lg shadow-blue-500/20'
                                    : mappingInfo
                                        ? `${mappingInfo.bgColor} border-white/10 hover:border-white/30`
                                        : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'}
                            `}
                        >
                            {/* Mapping indicator badge */}
                            {mappingInfo && (
                                <div className={`absolute -top-2 -right-2 p-1.5 rounded-full ${mappingInfo.bgColor} border-2 border-gray-800`}>
                                    <Icon name={mappingInfo.icon} size={12} className={mappingInfo.color} />
                                </div>
                            )}

                            <div className="flex items-center gap-2">
                                <Icon
                                    name="FileSpreadsheet"
                                    size={16}
                                    className={isSelected ? 'text-blue-300' : 'text-gray-400'}
                                />
                                <span className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-gray-200'}`}>
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
