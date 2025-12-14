import React from 'react';
import Icon from '../../../../icons/Icon';
import PropTypes from 'prop-types';

const OverviewTab = ({
    student,
    healthData,
    age,
    isEditingHealth,
    setIsEditingHealth,
    isSavingHealth,
    handleSaveHealthData,
    setHealthData,
    aiSummary,
    parentComment,
    isGenerating,
    isGeneratingParentComment,
    handleGenerateSummary,
    handleGenerateParentComment,
    isCopied,
    handleCopy
}) => {
    return (
        <div className="space-y-6">
            <section className="bg-slate-900/60 rounded-2xl border border-slate-800/70 p-5 shadow-inner shadow-black/20">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">ข้อมูลส่วนตัว & สุขภาพ</p>
                        <h3 className="text-lg font-semibold text-white mt-1 flex items-center gap-2">
                            <Icon name="User" size={18} className="text-teal-300" />
                            โปรไฟล์นักเรียน
                        </h3>
                    </div>
                    {!isEditingHealth && (
                        <button
                            onClick={() => setIsEditingHealth(true)}
                            className="text-xs text-sky-300 hover:text-sky-200 flex items-center gap-1"
                        >
                            <Icon name="Pencil" size={12} /> แก้ไข
                        </button>
                    )}
                </div>

                <div className="mt-4 space-y-3 text-sm text-slate-200">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-xl bg-slate-800/60 border border-slate-700/60 p-3">
                            <p className="text-[11px] uppercase tracking-wide text-slate-500">วันเกิด</p>
                            <p className="font-semibold mt-1">
                                {student.birthDate ? new Date(student.birthDate).toLocaleDateString('th-TH', { dateStyle: 'long' }) : '-'}
                            </p>
                        </div>
                        <div className="rounded-xl bg-slate-800/60 border border-slate-700/60 p-3">
                            <p className="text-[11px] uppercase tracking-wide text-slate-500">รหัสนักเรียน</p>
                            <p className="font-semibold mt-1">{student.studentId || '-'}</p>
                        </div>
                    </div>

                    <div className="rounded-xl bg-slate-800/60 border border-slate-700/60 p-3">
                        <div className="grid grid-cols-2 gap-4 items-start">
                            <div>
                                <p className="text-[11px] uppercase tracking-wide text-slate-500">น้ำหนัก (กก.)</p>
                                {isEditingHealth ? (
                                    <input
                                        type="number"
                                        value={healthData.weight}
                                        onChange={(e) => setHealthData({ ...healthData, weight: e.target.value })}
                                        className="mt-2 w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-white text-sm focus:border-teal-400 outline-none"
                                    />
                                ) : (
                                    <p className="text-2xl font-bold text-teal-300 mt-1">{healthData.weight || '-'}</p>
                                )}
                            </div>
                            <div>
                                <p className="text-[11px] uppercase tracking-wide text-slate-500">ส่วนสูง (ซม.)</p>
                                {isEditingHealth ? (
                                    <input
                                        type="number"
                                        value={healthData.height}
                                        onChange={(e) => setHealthData({ ...healthData, height: e.target.value })}
                                        className="mt-2 w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-white text-sm focus:border-teal-400 outline-none"
                                    />
                                ) : (
                                    <p className="text-2xl font-bold text-teal-300 mt-1">{healthData.height || '-'}</p>
                                )}
                            </div>
                        </div>
                        {healthData.measuredAt && <p className="mt-2 text-[11px] text-slate-500">บันทึกเมื่อ {new Date(healthData.measuredAt.toDate ? healthData.measuredAt.toDate() : healthData.measuredAt).toLocaleString('th-TH')}</p>}
                    </div>

                    {isEditingHealth && (
                        <div className="flex gap-2">
                            <button
                                onClick={handleSaveHealthData}
                                disabled={isSavingHealth}
                                className="flex-1 bg-teal-600 hover:bg-teal-500 text-white text-xs py-2 rounded-lg transition-colors disabled:opacity-60"
                            >
                                {isSavingHealth ? 'บันทึก...' : 'บันทึก'}
                            </button>
                            <button
                                onClick={() => setIsEditingHealth(false)}
                                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white text-xs py-2 rounded-lg transition-colors"
                            >
                                ยกเลิก
                            </button>
                        </div>
                    )}
                </div>
            </section>

            <section className="bg-gradient-to-br from-indigo-900/50 via-slate-900/60 to-purple-900/50 rounded-2xl border border-indigo-500/20 p-5 shadow-inner shadow-black/30">
                <div className="flex items-center justify-between gap-3">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Icon name="Sparkles" size={18} className="text-purple-300" />
                        AI Coach
                    </h3>
                    <span className="text-[11px] text-slate-400">สรุปและส่งต่อผู้ปกครอง</span>
                </div>

                <button
                    onClick={handleGenerateSummary}
                    disabled={isGenerating}
                    className="w-full mt-4 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 px-4 rounded-xl transition-all shadow-lg shadow-indigo-900/50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isGenerating ? <Icon name="Loader2" className="animate-spin" size={18} /> : <Icon name="BrainCircuit" size={18} />}
                    {isGenerating ? 'กำลังวิเคราะห์...' : 'วิเคราะห์ผลการเรียน'}
                </button>

                <div className="mt-4 space-y-3">
                    {aiSummary ? (
                        <div className="bg-slate-950/40 border border-indigo-500/20 rounded-xl p-4 space-y-3">
                            <p className="text-slate-100 text-sm leading-relaxed whitespace-pre-line">{aiSummary}</p>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={handleGenerateParentComment}
                                    disabled={isGeneratingParentComment}
                                    className="flex-1 min-w-[180px] py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm rounded-lg border border-slate-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                                >
                                    {isGeneratingParentComment ? <Icon name="Loader2" className="animate-spin" size={14} /> : <Icon name="MessageSquare" size={14} />}
                                    ข้อความถึงผู้ปกครอง
                                </button>
                                {parentComment && (
                                    <button
                                        onClick={() => handleCopy(parentComment)}
                                        className="px-3 py-2 bg-emerald-500/15 border border-emerald-500/30 rounded-lg text-emerald-100 text-sm flex items-center gap-2 hover:bg-emerald-500/25"
                                    >
                                        {isCopied ? <Icon name="Check" size={14} /> : <Icon name="Copy" size={14} />}
                                        คัดลอกคอมเมนต์
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-slate-950/40 border border-dashed border-indigo-500/30 rounded-xl p-4 text-sm text-slate-400">
                            กดปุ่ม "วิเคราะห์ผลการเรียน" เพื่อให้ AI สรุปแนวโน้มการเรียนและข้อเสนอแนะสำหรับห้องเรียนนี้
                        </div>
                    )}

                    {parentComment && (
                        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
                            <p className="text-emerald-50 text-sm leading-relaxed whitespace-pre-line">"{parentComment}"</p>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};

OverviewTab.propTypes = {
    student: PropTypes.object.isRequired,
    healthData: PropTypes.object.isRequired,
    age: PropTypes.object,
    isEditingHealth: PropTypes.bool.isRequired,
    setIsEditingHealth: PropTypes.func.isRequired,
    isSavingHealth: PropTypes.bool.isRequired,
    handleSaveHealthData: PropTypes.func.isRequired,
    setHealthData: PropTypes.func.isRequired,
    aiSummary: PropTypes.string,
    parentComment: PropTypes.string,
    isGenerating: PropTypes.bool.isRequired,
    isGeneratingParentComment: PropTypes.bool.isRequired,
    handleGenerateSummary: PropTypes.func.isRequired,
    handleGenerateParentComment: PropTypes.func.isRequired,
    isCopied: PropTypes.bool,
    handleCopy: PropTypes.func.isRequired
};

export default OverviewTab;
