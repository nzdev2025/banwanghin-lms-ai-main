// src/components/pp5/MappingWizard.jsx
// Step-by-step wizard for configuring PP5 template mapping
// Premium fullscreen design

import React from 'react';
import PropTypes from 'prop-types';
import Icon from '../../icons/Icon';
import SheetSelector from './SheetSelector';
import SheetPreview from './SheetPreview';
import ColumnMapper from './ColumnMapper';
import { getSheetData, getSheetNames } from '../../utils/excelParser';
import { DEFAULT_MAPPING_CONFIG } from '../../services/pp5MappingService';

// Wizard steps configuration
const WIZARD_STEPS = [
    {
        id: 'studentInfo',
        title: 'ข้อมูลนักเรียน',
        description: 'เลือก Sheet และ Column สำหรับรายชื่อนักเรียน',
        icon: 'Users',
        color: 'from-blue-500 to-indigo-600',
        bgColor: 'bg-blue-500/20',
        textColor: 'text-blue-400',
        required: true,
    },
    {
        id: 'scores',
        title: 'คะแนนรายวิชา',
        description: 'เลือก Sheet และ Column สำหรับคะแนน',
        icon: 'Award',
        color: 'from-amber-500 to-orange-600',
        bgColor: 'bg-amber-500/20',
        textColor: 'text-amber-400',
        required: false,
    },
    {
        id: 'attendance',
        title: 'เวลาเรียน',
        description: 'เลือก Sheet และ Column สำหรับการเข้าเรียน',
        icon: 'Calendar',
        color: 'from-emerald-500 to-teal-600',
        bgColor: 'bg-emerald-500/20',
        textColor: 'text-emerald-400',
        required: false,
    },
    {
        id: 'health',
        title: 'น้ำหนัก/ส่วนสูง',
        description: 'เลือก Sheet และ Column สำหรับข้อมูลสุขภาพ',
        icon: 'Heart',
        color: 'from-rose-500 to-pink-600',
        bgColor: 'bg-rose-500/20',
        textColor: 'text-rose-400',
        required: false,
    },
    {
        id: 'confirm',
        title: 'ยืนยัน',
        description: 'ตรวจสอบการตั้งค่าและบันทึก',
        icon: 'CheckCircle',
        color: 'from-green-500 to-emerald-600',
        bgColor: 'bg-green-500/20',
        textColor: 'text-green-400',
        required: true,
    },
];

/**
 * MappingWizard - Multi-step wizard for template mapping configuration
 * Premium fullscreen design
 */
const MappingWizard = ({
    workbook,
    templateName,
    initialMapping = null,
    onComplete,
    onCancel,
}) => {
    const [currentStep, setCurrentStep] = React.useState(0);
    const [mapping, setMapping] = React.useState(() => ({
        ...DEFAULT_MAPPING_CONFIG,
        templateName,
        ...initialMapping,
    }));
    const [selectedSheet, setSelectedSheet] = React.useState(null);
    const [sheetPreviewData, setSheetPreviewData] = React.useState(null);
    const [activeField, setActiveField] = React.useState(null);

    const sheetNames = React.useMemo(() => {
        return workbook ? getSheetNames(workbook) : [];
    }, [workbook]);

    const currentStepConfig = WIZARD_STEPS[currentStep];
    const currentDataType = currentStepConfig.id;

    // Get mapped sheet names for display
    const mappedSheets = React.useMemo(() => ({
        studentInfo: mapping.sheets.studentInfo?.sheetName,
        scores: mapping.sheets.scores?.sheetName,
        attendance: mapping.sheets.attendance?.sheetName,
        health: mapping.sheets.health?.sheetName,
    }), [mapping]);

    // Load sheet preview when sheet is selected
    React.useEffect(() => {
        if (selectedSheet && workbook) {
            const data = getSheetData(workbook, selectedSheet, { maxRows: 30, maxCols: 20 });
            setSheetPreviewData(data);
        } else {
            setSheetPreviewData(null);
        }
    }, [selectedSheet, workbook]);

    // Initialize selected sheet from mapping when step changes
    React.useEffect(() => {
        if (currentDataType !== 'confirm') {
            const savedSheetName = mapping.sheets[currentDataType]?.sheetName;
            setSelectedSheet(savedSheetName || null);
        }
    }, [currentStep, currentDataType, mapping]);

    // Handle sheet selection
    const handleSheetSelect = (sheetName) => {
        setSelectedSheet(sheetName);
        setMapping(prev => ({
            ...prev,
            sheets: {
                ...prev.sheets,
                [currentDataType]: {
                    ...prev.sheets[currentDataType],
                    sheetName,
                },
            },
        }));
    };

    // Handle column selection from preview
    const handleColumnSelect = (columnLetter) => {
        if (activeField && currentDataType !== 'confirm') {
            setMapping(prev => ({
                ...prev,
                sheets: {
                    ...prev.sheets,
                    [currentDataType]: {
                        ...prev.sheets[currentDataType],
                        columns: {
                            ...prev.sheets[currentDataType]?.columns,
                            [activeField]: columnLetter,
                        },
                    },
                },
            }));
        }
    };

    // Handle column change from input
    const handleColumnChange = (fieldKey, value) => {
        if (currentDataType !== 'confirm') {
            setMapping(prev => ({
                ...prev,
                sheets: {
                    ...prev.sheets,
                    [currentDataType]: {
                        ...prev.sheets[currentDataType],
                        columns: {
                            ...prev.sheets[currentDataType]?.columns,
                            [fieldKey]: value,
                        },
                    },
                },
            }));
        }
    };

    // Handle start row change
    const handleStartRowChange = (row) => {
        if (currentDataType !== 'confirm') {
            setMapping(prev => ({
                ...prev,
                sheets: {
                    ...prev.sheets,
                    [currentDataType]: {
                        ...prev.sheets[currentDataType],
                        startRow: row,
                    },
                },
            }));
        }
    };

    // Navigation handlers
    const handleNext = () => {
        if (currentStep < WIZARD_STEPS.length - 1) {
            setCurrentStep(prev => prev + 1);
            setActiveField(null);
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
            setActiveField(null);
        }
    };

    const handleSkip = () => {
        handleNext();
    };

    const handleComplete = () => {
        if (onComplete) {
            onComplete(mapping);
        }
    };

    // Get highlighted columns for current data type
    const highlightedColumns = React.useMemo(() => {
        if (currentDataType === 'confirm') return [];
        const columns = mapping.sheets[currentDataType]?.columns || {};
        return Object.values(columns).filter(Boolean);
    }, [mapping, currentDataType]);

    // Check if current step is valid
    const isStepValid = () => {
        if (currentDataType === 'confirm') return true;
        const sheetConfig = mapping.sheets[currentDataType];
        if (!sheetConfig?.sheetName) return false;

        if (currentDataType === 'studentInfo') {
            const cols = sheetConfig.columns || {};
            return cols.studentNumber && cols.fullName;
        }
        return true;
    };

    // Render step progress - horizontal timeline
    const renderProgress = () => (
        <div className="mb-8">
            <div className="flex items-center justify-between relative">
                {/* Progress line background */}
                <div className="absolute top-6 left-0 right-0 h-1 bg-white/10 rounded-full" />
                {/* Progress line filled */}
                <div
                    className="absolute top-6 left-0 h-1 bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all duration-500"
                    style={{ width: `${(currentStep / (WIZARD_STEPS.length - 1)) * 100}%` }}
                />

                {WIZARD_STEPS.map((step, index) => (
                    <button
                        key={step.id}
                        onClick={() => index < currentStep && setCurrentStep(index)}
                        disabled={index > currentStep}
                        className={`relative flex flex-col items-center z-10 transition-all duration-300 ${index <= currentStep ? 'cursor-pointer' : 'cursor-not-allowed'
                            }`}
                    >
                        <div className={`
                            w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-lg
                            ${index === currentStep
                                ? `bg-gradient-to-br ${step.color} ring-4 ring-white/20 scale-110`
                                : index < currentStep
                                    ? 'bg-gradient-to-br from-green-500 to-emerald-600'
                                    : 'bg-gray-700/80 border border-white/10'}
                        `}>
                            {index < currentStep ? (
                                <Icon name="Check" size={22} className="text-white" />
                            ) : (
                                <Icon name={step.icon} size={22} className={index === currentStep ? 'text-white' : 'text-gray-400'} />
                            )}
                        </div>
                        <span className={`mt-3 text-sm font-medium transition-colors ${index === currentStep ? 'text-white' : index < currentStep ? 'text-green-400' : 'text-gray-500'
                            }`}>
                            {step.title}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );

    // Render confirmation step
    const renderConfirmation = () => {
        const sheets = mapping.sheets;
        const configuredSheets = Object.entries(sheets)
            .filter(([, config]) => config.sheetName)
            .map(([key, config]) => ({ key, ...config }));

        return (
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-10">
                    <div className="inline-flex p-5 rounded-3xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-2xl mb-6">
                        <Icon name="CheckCircle" size={56} className="text-white" />
                    </div>
                    <h3 className="text-3xl font-bold text-white mb-3">ตรวจสอบการตั้งค่า</h3>
                    <p className="text-gray-400 text-lg">ตรวจสอบ mapping ก่อนบันทึก</p>
                </div>

                <div className="grid gap-4">
                    {configuredSheets.map(({ key, sheetName, startRow, columns }) => {
                        const stepConfig = WIZARD_STEPS.find(s => s.id === key);
                        return (
                            <div key={key} className="p-6 bg-gradient-to-br from-white/5 to-white/[0.02] rounded-2xl border border-white/10 hover:border-white/20 transition-all">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className={`p-3 rounded-xl bg-gradient-to-br ${stepConfig?.color || 'from-gray-500 to-gray-600'} shadow-lg`}>
                                        <Icon name={stepConfig?.icon || 'FileSpreadsheet'} size={24} className="text-white" />
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-bold text-white">
                                            {stepConfig?.title || key}
                                        </h4>
                                        <p className="text-gray-400">Sheet: <span className="text-white font-medium">{sheetName}</span></p>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    <div className="px-4 py-2 bg-white/10 rounded-lg text-sm">
                                        <span className="text-gray-400">เริ่มแถวที่:</span>
                                        <span className="ml-2 text-white font-semibold">{startRow}</span>
                                    </div>
                                    {Object.entries(columns || {})
                                        .filter(([, v]) => v)
                                        .map(([k, v]) => (
                                            <div key={k} className="px-4 py-2 bg-white/10 rounded-lg text-sm">
                                                <span className="text-gray-400">{k}:</span>
                                                <span className="ml-2 text-white font-semibold">{v}</span>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {configuredSheets.length === 0 && (
                    <div className="text-center py-16">
                        <Icon name="AlertTriangle" size={48} className="mx-auto mb-4 text-amber-400" />
                        <p className="text-gray-400 text-xl">ยังไม่ได้ตั้งค่า Sheet ใดๆ</p>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="h-full flex flex-col">
            {/* Progress indicator */}
            {renderProgress()}

            {/* Step header */}
            <div className="text-center mb-8">
                <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${currentStepConfig.color} shadow-xl mb-4`}>
                    <Icon name={currentStepConfig.icon} size={32} className="text-white" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">
                    {currentStepConfig.title}
                </h2>
                <p className="text-gray-400 text-lg">{currentStepConfig.description}</p>
            </div>

            {/* Step content */}
            <div className="flex-1 min-h-0 overflow-hidden">
                {currentDataType === 'confirm' ? (
                    <div className="h-full overflow-y-auto px-4">
                        {renderConfirmation()}
                    </div>
                ) : (
                    <div className="h-full grid grid-cols-1 lg:grid-cols-5 gap-6">
                        {/* Left: Sheet selector + Column mapper (2 cols) */}
                        <div className="lg:col-span-2 flex flex-col gap-6 overflow-y-auto pr-2">
                            <div className="bg-gradient-to-br from-white/5 to-transparent rounded-2xl border border-white/10 p-5">
                                <SheetSelector
                                    sheets={sheetNames}
                                    selectedSheet={selectedSheet}
                                    onSelectSheet={handleSheetSelect}
                                    mappedSheets={mappedSheets}
                                    title={`เลือก Sheet`}
                                />
                            </div>

                            {selectedSheet && (
                                <div className="bg-gradient-to-br from-white/5 to-transparent rounded-2xl border border-white/10 p-5 flex-1">
                                    <ColumnMapper
                                        dataType={currentDataType}
                                        columns={mapping.sheets[currentDataType]?.columns || {}}
                                        startRow={mapping.sheets[currentDataType]?.startRow || 1}
                                        onColumnChange={handleColumnChange}
                                        onStartRowChange={handleStartRowChange}
                                        onFieldSelect={setActiveField}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Right: Sheet preview (3 cols) */}
                        <div className="lg:col-span-3 min-h-0">
                            {sheetPreviewData ? (
                                <div className="h-full bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl border border-white/10 overflow-hidden">
                                    <SheetPreview
                                        sheetData={sheetPreviewData}
                                        highlightedColumns={highlightedColumns}
                                        onColumnSelect={handleColumnSelect}
                                        selectionMode="column"
                                    />
                                </div>
                            ) : (
                                <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-800/30 to-gray-900/30 rounded-2xl border-2 border-dashed border-white/10">
                                    <div className="text-center">
                                        <div className="p-6 rounded-2xl bg-white/5 inline-block mb-4">
                                            <Icon name="Table" size={56} className="text-gray-500" />
                                        </div>
                                        <p className="text-gray-400 text-lg">เลือก Sheet เพื่อดูตัวอย่างข้อมูล</p>
                                        <p className="text-gray-500 text-sm mt-1">คลิกที่หัวคอลัมน์เพื่อเลือก</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center justify-between pt-6 mt-6 border-t border-white/10">
                <button
                    onClick={onCancel}
                    className="px-6 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                >
                    ยกเลิก
                </button>

                <div className="flex items-center gap-4">
                    {currentStep > 0 && (
                        <button
                            onClick={handleBack}
                            className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all border border-white/10"
                        >
                            <Icon name="ChevronLeft" size={20} />
                            ย้อนกลับ
                        </button>
                    )}

                    {currentDataType !== 'confirm' && !currentStepConfig.required && (
                        <button
                            onClick={handleSkip}
                            className="px-6 py-3 text-gray-400 hover:text-white transition-colors"
                        >
                            ข้าม
                        </button>
                    )}

                    {currentStep < WIZARD_STEPS.length - 1 ? (
                        <button
                            onClick={handleNext}
                            disabled={currentStepConfig.required && !isStepValid()}
                            className={`
                                flex items-center gap-2 px-8 py-3 rounded-xl transition-all font-semibold
                                ${currentStepConfig.required && !isStepValid()
                                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                    : `bg-gradient-to-r ${currentStepConfig.color} text-white shadow-lg hover:shadow-xl hover:scale-105`}
                            `}
                        >
                            ถัดไป
                            <Icon name="ChevronRight" size={20} />
                        </button>
                    ) : (
                        <button
                            onClick={handleComplete}
                            className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl transition-all font-semibold shadow-lg hover:shadow-xl hover:scale-105"
                        >
                            <Icon name="Save" size={20} />
                            บันทึก Mapping
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

MappingWizard.propTypes = {
    workbook: PropTypes.object.isRequired,
    templateName: PropTypes.string.isRequired,
    initialMapping: PropTypes.object,
    onComplete: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
};

export default MappingWizard;
