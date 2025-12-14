// src/components/pp5/ColumnMapper.jsx
// Component for mapping data fields to Excel columns - Premium expanded design

import React from 'react';
import PropTypes from 'prop-types';
import Icon from '../../icons/Icon';

// Field definitions for each data type
const FIELD_DEFINITIONS = {
    studentInfo: [
        { key: 'studentNumber', label: 'เลขที่', required: true, icon: 'Hash' },
        { key: 'studentId', label: 'เลขประจำตัว', required: false, icon: 'CreditCard' },
        { key: 'fullName', label: 'ชื่อ-สกุล', required: true, icon: 'User' },
        { key: 'nationalId', label: 'เลขประจำตัวประชาชน', required: false, icon: 'IdCard' },
        { key: 'nickname', label: 'ชื่อเล่น', required: false, icon: 'Smile' },
        { key: 'birthDate', label: 'วัน/เดือน/ปี เกิด', required: false, icon: 'Calendar' },
    ],
    scores: [
        { key: 'studentNumber', label: 'เลขที่', required: true, icon: 'Hash' },
        { key: 'fullName', label: 'ชื่อ-สกุล', required: true, icon: 'User' },
        { key: 'term1Indicator', label: 'ตัวชี้วัด ภาค 1', required: false, icon: 'Target' },
        { key: 'term1Midterm', label: 'ระหว่างเรียน ภาค 1', required: false, icon: 'BookOpen' },
        { key: 'term1Final', label: 'ปลายภาค ภาค 1', required: false, icon: 'FileCheck' },
        { key: 'term1Total', label: 'รวม ภาค 1', required: false, icon: 'Calculator' },
        { key: 'term2Indicator', label: 'ตัวชี้วัด ภาค 2', required: false, icon: 'Target' },
        { key: 'term2Midterm', label: 'ระหว่างเรียน ภาค 2', required: false, icon: 'BookOpen' },
        { key: 'term2Final', label: 'ปลายปี ภาค 2', required: false, icon: 'FileCheck' },
        { key: 'term2Total', label: 'รวม ภาค 2', required: false, icon: 'Calculator' },
        { key: 'yearTotal', label: 'รวม 2 ภาค', required: false, icon: 'BarChart' },
        { key: 'gradeLevel', label: 'ระดับผลการเรียน', required: false, icon: 'Award' },
    ],
    attendance: [
        { key: 'studentNumber', label: 'เลขที่', required: true, icon: 'Hash' },
        { key: 'studentId', label: 'เลขประจำตัว', required: false, icon: 'CreditCard' },
        { key: 'fullName', label: 'ชื่อ-สกุล', required: true, icon: 'User' },
        { key: 'total', label: 'เต็ม', required: false, icon: 'CheckCircle' },
    ],
    health: [
        { key: 'studentNumber', label: 'เลขที่', required: true, icon: 'Hash' },
        { key: 'fullName', label: 'ชื่อ-สกุล', required: true, icon: 'User' },
        { key: 'weight1', label: 'น้ำหนัก (พ.ค.)', required: false, icon: 'Scale' },
        { key: 'height1', label: 'ส่วนสูง (พ.ค.)', required: false, icon: 'Ruler' },
        { key: 'weight2', label: 'น้ำหนัก (ส.ค.)', required: false, icon: 'Scale' },
        { key: 'height2', label: 'ส่วนสูง (ส.ค.)', required: false, icon: 'Ruler' },
        { key: 'weight3', label: 'น้ำหนัก (พ.ย.)', required: false, icon: 'Scale' },
        { key: 'height3', label: 'ส่วนสูง (พ.ย.)', required: false, icon: 'Ruler' },
        { key: 'weight4', label: 'น้ำหนัก (ก.พ.)', required: false, icon: 'Scale' },
        { key: 'height4', label: 'ส่วนสูง (ก.พ.)', required: false, icon: 'Ruler' },
    ],
};

/**
 * ColumnMapper - UI for mapping data fields to Excel columns
 * Expanded layout to reduce scrolling
 */
const ColumnMapper = ({
    dataType = 'studentInfo',
    columns = {},
    startRow = 1,
    onColumnChange,
    onStartRowChange,
    selectedColumn = null,
    onFieldSelect,
}) => {
    const fields = FIELD_DEFINITIONS[dataType] || [];
    const [activeField, setActiveField] = React.useState(null);

    // Handle column input change
    const handleColumnInputChange = (fieldKey, value) => {
        const upperValue = value.toUpperCase().replace(/[^A-Z]/g, '');
        if (onColumnChange) {
            onColumnChange(fieldKey, upperValue);
        }
    };

    // Handle field click for column selection
    const handleFieldClick = (fieldKey) => {
        setActiveField(fieldKey);
        if (onFieldSelect) {
            onFieldSelect(fieldKey);
        }
    };

    // Check if a column is assigned to a field
    const getAssignedColumn = (fieldKey) => {
        return columns[fieldKey] || '';
    };

    // Get completion status
    const requiredFields = fields.filter(f => f.required);
    const mappedRequiredCount = requiredFields.filter(f => columns[f.key]).length;
    const isComplete = mappedRequiredCount === requiredFields.length;

    return (
        <div className="space-y-5">
            {/* Start row configuration - more prominent */}
            <div className="flex items-center gap-4 p-5 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-2xl border border-blue-500/20">
                <div className="p-3 rounded-xl bg-blue-500/20">
                    <Icon name="ArrowDown" size={24} className="text-blue-400" />
                </div>
                <div className="flex-1">
                    <label className="block text-base font-semibold text-white">
                        แถวเริ่มต้นข้อมูล
                    </label>
                    <p className="text-sm text-gray-400">
                        ระบุแถวแรกที่มีข้อมูลนักเรียน (ไม่ใช่หัวตาราง)
                    </p>
                </div>
                <input
                    type="number"
                    min="1"
                    max="100"
                    value={startRow}
                    onChange={(e) => onStartRowChange && onStartRowChange(parseInt(e.target.value) || 1)}
                    className="w-24 px-4 py-3 bg-gray-800 border-2 border-blue-500/30 rounded-xl text-white text-center text-lg font-bold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                />
            </div>

            {/* Completion status */}
            <div className={`flex items-center gap-3 px-5 py-4 rounded-xl ${isComplete
                ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/10 border border-green-500/30'
                : 'bg-gradient-to-r from-amber-500/20 to-orange-500/10 border border-amber-500/30'}`}>
                <div className={`p-2 rounded-lg ${isComplete ? 'bg-green-500/20' : 'bg-amber-500/20'}`}>
                    <Icon
                        name={isComplete ? 'CheckCircle' : 'AlertCircle'}
                        size={22}
                        className={isComplete ? 'text-green-400' : 'text-amber-400'}
                    />
                </div>
                <span className={`text-base font-medium ${isComplete ? 'text-green-200' : 'text-amber-200'}`}>
                    {isComplete
                        ? 'ครบทุกช่องที่จำเป็น ✓'
                        : `กรุณา map ช่องที่จำเป็น (${mappedRequiredCount}/${requiredFields.length})`}
                </span>
            </div>

            {/* Field mapping grid - 2 columns, compact but visible */}
            <div className="grid grid-cols-2 gap-3">
                {fields.map((field) => {
                    const assignedColumn = getAssignedColumn(field.key);
                    const isActive = activeField === field.key;
                    const isMapped = !!assignedColumn;

                    return (
                        <div
                            key={field.key}
                            onClick={() => handleFieldClick(field.key)}
                            className={`
                                relative p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer
                                ${isActive
                                    ? 'bg-gradient-to-r from-blue-600/30 to-indigo-600/30 border-blue-400 shadow-lg shadow-blue-500/20'
                                    : isMapped
                                        ? 'bg-gradient-to-r from-green-600/20 to-emerald-600/10 border-green-500/40 hover:border-green-400'
                                        : field.required
                                            ? 'bg-gradient-to-r from-amber-600/10 to-orange-600/5 border-amber-500/30 hover:border-amber-400'
                                            : 'bg-white/5 border-white/10 hover:border-white/30'}
                            `}
                        >
                            <div className="flex items-center gap-3">
                                {/* Field icon */}
                                <div className={`p-2.5 rounded-xl ${isMapped ? 'bg-green-500/20' : isActive ? 'bg-blue-500/20' : 'bg-white/10'}`}>
                                    <Icon
                                        name={field.icon}
                                        size={20}
                                        className={isMapped ? 'text-green-400' : isActive ? 'text-blue-400' : 'text-gray-400'}
                                    />
                                </div>

                                {/* Field info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-semibold text-white">
                                            {field.label}
                                        </span>
                                        {field.required && (
                                            <span className="text-amber-400 font-bold">*</span>
                                        )}
                                    </div>
                                </div>

                                {/* Column input */}
                                <input
                                    type="text"
                                    value={assignedColumn}
                                    onChange={(e) => handleColumnInputChange(field.key, e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                    placeholder="คอลัมน์"
                                    maxLength={3}
                                    className={`
                                        w-20 px-3 py-2 text-center text-base font-mono font-bold rounded-xl border-2
                                        focus:outline-none focus:ring-2 focus:ring-blue-500/50
                                        ${isMapped
                                            ? 'bg-green-600/30 border-green-500/50 text-green-200'
                                            : 'bg-gray-800/80 border-white/20 text-white placeholder-gray-500'}
                                    `}
                                />
                            </div>

                            {/* Selection indicator */}
                            {selectedColumn && isActive && (
                                <div className="absolute -bottom-8 left-0 right-0 text-center z-10">
                                    <span className="text-xs bg-blue-600 text-white px-3 py-1 rounded-full shadow-lg">
                                        คลิกคอลัมน์ในตารางเพื่อเลือก
                                    </span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Legend - compact */}
            <div className="flex items-center gap-6 text-sm text-gray-400 pt-3 border-t border-white/10">
                <span className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-lg bg-green-500/30 border-2 border-green-500/50"></span>
                    Map แล้ว
                </span>
                <span className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-lg bg-amber-500/30 border-2 border-amber-500/50"></span>
                    จำเป็น*
                </span>
                <span className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-lg bg-white/10 border-2 border-white/20"></span>
                    ไม่จำเป็น
                </span>
            </div>
        </div>
    );
};

ColumnMapper.propTypes = {
    dataType: PropTypes.oneOf(['studentInfo', 'scores', 'attendance', 'health']),
    columns: PropTypes.object,
    startRow: PropTypes.number,
    onColumnChange: PropTypes.func,
    onStartRowChange: PropTypes.func,
    selectedColumn: PropTypes.string,
    onFieldSelect: PropTypes.func,
};

export default ColumnMapper;
