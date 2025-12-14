// src/components/modals/Pp5TemplateManager.jsx
// Main modal for managing PP5 template upload, mapping, and export
// Premium fullscreen design

import React from 'react';
import PropTypes from 'prop-types';
import Icon from '../../icons/Icon';
import MappingWizard from '../pp5/MappingWizard';
import { parseExcelFile, isValidExcelFile, downloadBlob } from '../../utils/excelParser';
import {
    savePp5Mapping,
    loadPp5Mapping,
    deletePp5Mapping,
    getMappingStatus
} from '../../services/pp5MappingService';
import { exportPp5 } from '../../services/pp5ExportService';
import { grades } from '../../constants/data';
import { gradeStyles } from '../../constants/theme';
import { useToast } from '../../context/ToastContext';

// View modes
const VIEW_MODES = {
    MAIN: 'main',
    UPLOAD: 'upload',
    MAPPING: 'mapping',
    EXPORT: 'export',
};

/**
 * Pp5TemplateManager - Main modal for PP5 auto-fill feature
 * Premium fullscreen design with glassmorphism
 */
const Pp5TemplateManager = ({ subjects, onClose }) => {
    // Safely get showToast with fallback
    const toastContext = useToast();
    const showToast = toastContext?.showToast || ((message, type) => {
        console.log(`[Toast ${type}]: ${message}`);
        if (type === 'error') alert(message);
    });

    // State
    const [viewMode, setViewMode] = React.useState(VIEW_MODES.MAIN);
    const [loading, setLoading] = React.useState(true);
    const [mapping, setMapping] = React.useState(null);
    const [workbook, setWorkbook] = React.useState(null);
    const [templateFile, setTemplateFile] = React.useState(null);
    const [exportGrade, setExportGrade] = React.useState(null);
    const [exporting, setExporting] = React.useState(false);

    // Load existing mapping on mount
    React.useEffect(() => {
        const loadMapping = async () => {
            setLoading(true);
            try {
                const existingMapping = await loadPp5Mapping();
                setMapping(existingMapping);
            } catch (error) {
                console.error('Error loading mapping:', error);
            } finally {
                setLoading(false);
            }
        };
        loadMapping();
    }, []);

    // Get mapping status for display
    const mappingStatus = React.useMemo(() => getMappingStatus(mapping), [mapping]);

    // Handle file upload
    const handleFileUpload = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!isValidExcelFile(file)) {
            showToast('ไฟล์ไม่ถูกต้อง กรุณาอัพโหลดไฟล์ Excel (.xlsx หรือ .xls)', 'error');
            return;
        }

        setLoading(true);
        try {
            const wb = await parseExcelFile(file);
            setWorkbook(wb);
            setTemplateFile(file);
            setViewMode(VIEW_MODES.MAPPING);
            showToast('อ่านไฟล์ Template สำเร็จ!', 'success');
        } catch (error) {
            console.error('Error parsing file:', error);
            showToast(error.message || 'ไม่สามารถอ่านไฟล์ได้', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Handle mapping complete
    const handleMappingComplete = async (newMapping) => {
        setLoading(true);
        try {
            await savePp5Mapping({
                ...newMapping,
                uploadedAt: new Date().toISOString(),
            });
            setMapping(newMapping);
            setViewMode(VIEW_MODES.MAIN);
            showToast('บันทึก Mapping สำเร็จ!', 'success');
        } catch (error) {
            console.error('Error saving mapping:', error);
            showToast('ไม่สามารถบันทึก Mapping ได้: ' + error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    // Handle export
    const handleExport = async (grade) => {
        if (!mapping || !templateFile) {
            showToast('กรุณาอัพโหลด Template ก่อน', 'error');
            return;
        }

        setExporting(true);
        setExportGrade(grade);

        try {
            const wb = await parseExcelFile(templateFile);
            const blob = await exportPp5(wb, mapping, grade, subjects, {
                includeStudentInfo: true,
                includeScores: true,
                includeAttendance: false,
                includeHealth: true,
            });

            const filename = `ปพ5_ป${grade.replace('p', '')}_${new Date().toISOString().split('T')[0]}.xlsx`;
            downloadBlob(blob, filename);
            showToast(`ส่งออก ปพ.5 ชั้น ป.${grade.replace('p', '')} สำเร็จ!`, 'success');
        } catch (error) {
            console.error('Error exporting:', error);
            showToast('เกิดข้อผิดพลาด: ' + error.message, 'error');
        } finally {
            setExporting(false);
            setExportGrade(null);
        }
    };

    // Handle delete mapping
    const handleDeleteMapping = async () => {
        if (!window.confirm('ต้องการลบ Mapping ที่บันทึกไว้หรือไม่?')) return;

        setLoading(true);
        try {
            await deletePp5Mapping();
            setMapping(null);
            setWorkbook(null);
            setTemplateFile(null);
            showToast('ลบ Mapping สำเร็จ', 'success');
        } catch (error) {
            console.error('Error deleting mapping:', error);
            showToast('ไม่สามารถลบ Mapping ได้', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Render main view - premium design
    const renderMainView = () => (
        <div className="h-full flex flex-col">
            {/* Hero section with gradient */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600/20 via-purple-600/10 to-emerald-600/20 border border-white/10 p-8 mb-8">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent" />
                <div className="relative flex items-start gap-6">
                    <div className={`p-5 rounded-2xl shadow-2xl ${mappingStatus.hasMapping
                        ? 'bg-gradient-to-br from-emerald-500 to-green-600'
                        : 'bg-gradient-to-br from-blue-500 to-indigo-600'}`}>
                        <Icon
                            name={mappingStatus.hasMapping ? 'CheckCircle' : 'FileSpreadsheet'}
                            size={40}
                            className="text-white"
                        />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-2xl font-bold text-white mb-2">
                            {mappingStatus.hasMapping ? '✨ พร้อมใช้งาน!' : 'เริ่มต้นใช้งาน'}
                        </h3>
                        {mappingStatus.hasMapping ? (
                            <div className="space-y-1">
                                <p className="text-gray-200 text-lg">
                                    Template: <span className="text-white font-semibold">{mappingStatus.templateName}</span>
                                </p>
                                <p className="text-gray-300">
                                    ตั้งค่าแล้ว {mappingStatus.sheetsConfigured} จาก {mappingStatus.totalSheets} sheets
                                </p>
                            </div>
                        ) : (
                            <p className="text-gray-200 text-lg">
                                อัพโหลด Template ปพ.5 ของโรงเรียนเพื่อเริ่มใช้งานระบบกรอกอัตโนมัติ
                            </p>
                        )}
                    </div>
                    {mappingStatus.hasMapping && (
                        <button
                            onClick={handleDeleteMapping}
                            className="p-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 hover:text-red-300 rounded-xl transition-all"
                            title="ลบ Mapping"
                        >
                            <Icon name="Trash2" size={24} />
                        </button>
                    )}
                </div>
            </div>

            {/* Action cards grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Upload Template Card */}
                <label className="block group">
                    <input
                        type="file"
                        accept=".xlsx,.xls,.xlsm"
                        onChange={handleFileUpload}
                        className="hidden"
                    />
                    <div className="h-full p-8 bg-gradient-to-br from-blue-500/10 to-indigo-500/5 hover:from-blue-500/20 hover:to-indigo-500/10 border-2 border-dashed border-blue-500/30 hover:border-blue-400/50 rounded-3xl cursor-pointer transition-all duration-300 group-hover:shadow-lg group-hover:shadow-blue-500/10">
                        <div className="flex flex-col items-center text-center">
                            <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-xl mb-5 group-hover:scale-110 transition-transform">
                                <Icon name="Upload" size={32} className="text-white" />
                            </div>
                            <h4 className="text-xl font-bold text-white mb-2">
                                {mappingStatus.hasMapping ? 'อัพโหลด Template ใหม่' : 'อัพโหลด Template'}
                            </h4>
                            <p className="text-gray-400">
                                เลือกไฟล์ .xlsx ปพ.5 ของโรงเรียน
                            </p>
                            <div className="mt-4 px-6 py-2 bg-blue-600/20 text-blue-300 text-sm rounded-full">
                                คลิกเพื่อเลือกไฟล์
                            </div>
                        </div>
                    </div>
                </label>

                {/* Edit Mapping Card */}
                {mappingStatus.hasMapping && templateFile ? (
                    <button
                        onClick={() => setViewMode(VIEW_MODES.MAPPING)}
                        className="h-full p-8 bg-gradient-to-br from-purple-500/10 to-pink-500/5 hover:from-purple-500/20 hover:to-pink-500/10 border-2 border-dashed border-purple-500/30 hover:border-purple-400/50 rounded-3xl transition-all duration-300 text-left group hover:shadow-lg hover:shadow-purple-500/10"
                    >
                        <div className="flex flex-col items-center text-center">
                            <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 shadow-xl mb-5 group-hover:scale-110 transition-transform">
                                <Icon name="Settings" size={32} className="text-white" />
                            </div>
                            <h4 className="text-xl font-bold text-white mb-2">แก้ไข Mapping</h4>
                            <p className="text-gray-400">
                                ปรับการจับคู่ข้อมูลกับ Template
                            </p>
                            <div className="mt-4 px-6 py-2 bg-purple-600/20 text-purple-300 text-sm rounded-full">
                                เปิดตัวตั้งค่า
                            </div>
                        </div>
                    </button>
                ) : (
                    <div className="h-full p-8 bg-white/5 border-2 border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center text-center opacity-50">
                        <div className="p-5 rounded-2xl bg-gray-600/50 mb-5">
                            <Icon name="Settings" size={32} className="text-gray-500" />
                        </div>
                        <h4 className="text-xl font-bold text-gray-500 mb-2">แก้ไข Mapping</h4>
                        <p className="text-gray-600 text-sm">
                            อัพโหลด Template ก่อนเพื่อเริ่มตั้งค่า
                        </p>
                    </div>
                )}
            </div>

            {/* Export section */}
            {mappingStatus.hasMapping && mappingStatus.isComplete && templateFile && (
                <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 rounded-3xl p-8">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-xl">
                            <Icon name="Download" size={28} className="text-white" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-white">ส่งออก ปพ.5</h3>
                            <p className="text-gray-400">เลือกชั้นเรียนที่ต้องการส่งออกข้อมูล</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                        {grades.map((gradeId, index) => {
                            const style = gradeStyles[gradeId];
                            const isExporting = exporting && exportGrade === gradeId;

                            return (
                                <button
                                    key={gradeId}
                                    onClick={() => handleExport(gradeId)}
                                    disabled={exporting}
                                    className={`
                                        p-6 rounded-2xl border-2 transition-all duration-300 group
                                        ${isExporting
                                            ? 'bg-emerald-600/30 border-emerald-500 scale-105'
                                            : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-emerald-500/50 hover:scale-105'}
                                        disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100
                                    `}
                                >
                                    <div className="flex flex-col items-center gap-3">
                                        {isExporting ? (
                                            <Icon name="Loader2" size={36} className="text-emerald-400 animate-spin" />
                                        ) : (
                                            <Icon name={style.icon} size={36} className={`${style.color} group-hover:scale-110 transition-transform`} />
                                        )}
                                        <span className="text-xl font-bold text-white">
                                            ป.{index + 1}
                                        </span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Need to re-upload template notice */}
            {mappingStatus.hasMapping && mappingStatus.isComplete && !templateFile && (
                <div className="mt-auto p-6 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/30 rounded-2xl">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-blue-500/20">
                            <Icon name="Info" size={28} className="text-blue-400" />
                        </div>
                        <div>
                            <p className="text-lg text-blue-200 font-medium">
                                กรุณาอัพโหลด Template อีกครั้งเพื่อส่งออกข้อมูล
                            </p>
                            <p className="text-blue-300/70">
                                การตั้งค่า Mapping ยังอยู่ครบถ้วน เพียงแค่เลือกไฟล์ Template เดิมอีกครั้ง
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Info notice - incomplete mapping */}
            {!mappingStatus.isComplete && mappingStatus.hasMapping && (
                <div className="mt-auto p-6 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-2xl">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-amber-500/20">
                            <Icon name="AlertTriangle" size={28} className="text-amber-400" />
                        </div>
                        <div>
                            <p className="text-lg text-amber-200 font-medium">
                                กรุณาตั้งค่า Mapping ให้ครบอย่างน้อย 2 sheets เพื่อเริ่มส่งออกข้อมูล
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    // Render mapping wizard view
    const renderMappingView = () => (
        <MappingWizard
            workbook={workbook}
            templateName={templateFile?.name || mapping?.templateName || 'unknown'}
            initialMapping={mapping}
            onComplete={handleMappingComplete}
            onCancel={() => setViewMode(VIEW_MODES.MAIN)}
        />
    );

    return (
        <div
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-3"
            onClick={viewMode === VIEW_MODES.MAIN ? onClose : undefined}
        >
            <div
                className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-white/10 rounded-3xl w-full h-full max-w-[98vw] max-h-[98vh] overflow-hidden shadow-[0_0_60px_rgba(59,130,246,0.15)]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Decorative background elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
                    <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
                </div>

                {/* Header */}
                <div className="relative flex items-center justify-between px-8 py-5 border-b border-white/10 bg-black/20">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
                            <Icon name="FileSpreadsheet" size={28} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">
                                กรอก ปพ.5 อัตโนมัติ
                            </h2>
                            <p className="text-gray-400">
                                {viewMode === VIEW_MODES.MAPPING
                                    ? 'ตั้งค่า Mapping Template'
                                    : 'จัดการ Template และส่งออกข้อมูล'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-3 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all border border-transparent hover:border-white/10"
                    >
                        <Icon name="X" size={28} />
                    </button>
                </div>

                {/* Content */}
                <div className="relative p-8 overflow-y-auto h-[calc(100%-88px)]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-full">
                            <div className="relative">
                                <div className="w-20 h-20 rounded-full border-4 border-blue-500/30 border-t-blue-500 animate-spin" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Icon name="FileSpreadsheet" size={32} className="text-blue-400" />
                                </div>
                            </div>
                            <p className="mt-6 text-xl text-gray-400">กำลังโหลด...</p>
                        </div>
                    ) : viewMode === VIEW_MODES.MAPPING && workbook ? (
                        renderMappingView()
                    ) : (
                        renderMainView()
                    )}
                </div>
            </div>
        </div>
    );
};

Pp5TemplateManager.propTypes = {
    subjects: PropTypes.array,
    onClose: PropTypes.func.isRequired,
};

export default Pp5TemplateManager;
