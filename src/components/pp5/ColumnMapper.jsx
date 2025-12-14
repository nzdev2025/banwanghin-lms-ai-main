// src/components/pp5/ColumnMapper.jsx
// Component for mapping data fields to Excel columns

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
        <div className="space-y-4">
            {/* Start row configuration */}
            <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
                <Icon name="ArrowDown" size={20} className="text-blue-400" />
                <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-200">
                        แถวเริ่มต้นข้อมูล
                    </label>
                    <p className="text-xs text-gray-400">
                        ระบุแถวแรกที่มีข้อมูลนักเรียน (ไม่ใช่หัวตาราง)
                    </p>
                </div>
                <input
                    type="number"
                    min="1"
                    max="100"
                    value={startRow}
                    onChange={(e) => onStartRowChange && onStartRowChange(parseInt(e.target.value) || 1)}
                    className="w-20 px-3 py-2 bg-gray-800 border border-white/20 rounded-lg text-white text-center focus:outline-none focus:border-blue-500"
                />
            </div>

            {/* Completion status */}
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${isComplete ? 'bg-green-500/20 border border-green-500/30' : 'bg-yellow-500/20 border border-yellow-500/30'}`}>
                <Icon
                    name={isComplete ? 'CheckCircle' : 'AlertCircle'}
                    size={18}
                    className={isComplete ? 'text-green-400' : 'text-yellow-400'}
                />
                <span className={`text-sm ${isComplete ? 'text-green-200' : 'text-yellow-200'}`}>
                    {isComplete
                        ? 'ครบทุกช่องที่จำเป็น ✓'
                        : `กรุณา map ช่องที่จำเป็น (${mappedRequiredCount}/${requiredFields.length})`}
                </span>
            </div>

            {/* Field mapping grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {fields.map((field) => {
                    const assignedColumn = getAssignedColumn(field.key);
                    const isActive = activeField === field.key;
                    const isMapped = !!assignedColumn;

                    return (
                        <div
                            key={field.key}
                            onClick={() => handleFieldClick(field.key)}
                            className={`
                                relative p-3 rounded-xl border transition-all duration-200 cursor-pointer
                                ${isActive
                                    ? 'bg-blue-600/30 border-blue-500 ring-2 ring-blue-500/50'
                                    : isMapped
                                        ? 'bg-green-600/20 border-green-500/30 hover:border-green-500/50'
                                        : field.required
                                            ? 'bg-yellow-600/10 border-yellow-500/30 hover:border-yellow-500/50'
                                            : 'bg-white/5 border-white/10 hover:border-white/20'}
                            `}
                        >
                            <div className="flex items-center gap-3">
                                {/* Field icon */}
                                <div className={`p-2 rounded-lg ${isMapped ? 'bg-green-500/20' : 'bg-white/5'}`}>
                                    <Icon
                                        name={field.icon}
                                        size={18}
                                        className={isMapped ? 'text-green-400' : 'text-gray-400'}
                                    />
                                </div>

                                {/* Field info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-white">
                                            {field.label}
                                        </span>
                                        {field.required && (
                                            <span className="text-xs text-yellow-400">*</span>
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
                                        w-16 px-2 py-1.5 text-center text-sm font-mono rounded-lg border
                                        focus:outline-none focus:ring-2 focus:ring-blue-500
                                        ${isMapped
                                            ? 'bg-green-600/30 border-green-500/50 text-green-200'
                                            : 'bg-gray-800 border-white/20 text-white placeholder-gray-500'}
                                    `}
                                />
                            </div>

                            {/* Selection indicator */}
                            {selectedColumn && isActive && (
                                <div className="absolute -bottom-8 left-0 right-0 text-center">
                                    <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">
                                        คลิกคอลัมน์ในตารางเพื่อเลือก
                                    </span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-6 text-xs text-gray-400 pt-2 border-t border-white/10">
                <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-green-500/30 border border-green-500/50"></span>
                    Map แล้ว
                </span>
                <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-yellow-500/30 border border-yellow-500/50"></span>
                    จำเป็น*
                </span>
                <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-white/10 border border-white/20"></span>
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
