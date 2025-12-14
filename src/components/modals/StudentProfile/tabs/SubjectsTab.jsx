import React from 'react';
import PropTypes from 'prop-types';
import Icon from '../../../../icons/Icon';

const subjectCardStyles = [
    { bg: 'from-cyan-500/15 to-blue-500/10', border: 'border-cyan-500/40' },
    { bg: 'from-emerald-500/15 to-teal-500/10', border: 'border-emerald-500/40' },
    { bg: 'from-amber-500/15 to-orange-500/10', border: 'border-amber-500/40' },
    { bg: 'from-purple-500/15 to-indigo-500/10', border: 'border-purple-500/40' },
    { bg: 'from-pink-500/15 to-rose-500/10', border: 'border-rose-500/40' },
];

const SubjectsTab = ({
    isSubjectsOpen,
    setIsSubjectsOpen,
    assignmentStats,
    completionRate,
    groupedAssignments,
    expandedSubjectId,
    toggleSubject
}) => {
    return (
        <section className="bg-slate-900/60 rounded-2xl border border-slate-800/70 p-5 shadow-inner shadow-black/20">
            <button
                type="button"
                onClick={() => setIsSubjectsOpen((open) => !open)}
                className="group w-full text-left"
                aria-expanded={isSubjectsOpen}
            >
                <div className="relative overflow-hidden rounded-xl border border-slate-700/60 bg-gradient-to-r from-slate-900/80 via-sky-900/40 to-indigo-900/40 p-4 flex flex-col gap-4 shadow-lg shadow-black/20 hover:-translate-y-0.5 transition-transform">
                    <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-sky-500/20 blur-3xl" />
                    <div className="absolute right-4 bottom-3 h-16 w-16 rounded-2xl bg-gradient-to-br from-cyan-300/40 via-emerald-300/30 to-indigo-400/40 blur-xl" />
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div
                                data-testid="overview-hero-icon"
                                className="h-12 w-12 rounded-2xl bg-gradient-to-br from-sky-500 via-cyan-400 to-emerald-400 flex items-center justify-center text-white font-extrabold shadow-lg shadow-black/30 ring-4 ring-white/10"
                            >
                                <Icon name="Gauge" size={22} />
                            </div>
                            <div>
                                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">ภาพรวมการเรียน</p>
                                <h3 className="text-xl font-semibold text-white">อัตราการส่งงานล่าสุด</h3>
                                <p className="text-xs text-slate-400">คลิกการ์ดนี้เพื่อดูรายละเอียดแยกตามวิชา</p>
                            </div>
                        </div>
                        <div
                            data-testid="overview-hero-art"
                            className="relative h-16 w-24 overflow-hidden rounded-3xl border border-white/10 bg-slate-950/60 shadow-inner shadow-black/30"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-sky-500/30 via-indigo-500/15 to-emerald-400/25 blur-[1px]" />
                            <div className="absolute left-2 top-2 h-4 w-12 rounded-full bg-white/20" />
                            <div className="absolute right-2 bottom-2 h-12 w-16 rounded-[18px] bg-gradient-to-br from-emerald-300/40 via-sky-300/30 to-indigo-400/40 shadow-lg shadow-emerald-500/20" />
                            <div className="absolute inset-1 rounded-2xl border border-white/20" />
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs">
                        <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-100">
                            ส่งแล้ว {assignmentStats.submitted}
                        </span>
                        <span className="px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-100">
                            ค้างส่ง {assignmentStats.missing}
                        </span>
                        <span className="px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-100">
                            ทั้งหมด {assignmentStats.totalAssignments}
                        </span>
                        <span className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-200">
                            วิชา {assignmentStats.subjectCount}
                        </span>
                    </div>

                    <div className="mt-1">
                        <div className="flex items-center justify-between text-sm text-slate-200 mb-2">
                            <span className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" /> อัตราการส่งงาน
                            </span>
                            <span className="font-bold text-white">{completionRate}%</span>
                        </div>
                        <div className="h-3 w-full rounded-full bg-slate-800 overflow-hidden border border-slate-700/70">
                            <div
                                className="h-full bg-gradient-to-r from-emerald-300 via-sky-400 to-indigo-400 rounded-full transition-all"
                                style={{ width: `${Math.min(completionRate, 100)}%` }}
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between text-sm text-sky-200/90">
                        <span className="flex items-center gap-2">
                            <Icon name="Sparkles" size={14} /> คลิกเพื่อ{isSubjectsOpen ? 'ย่อรายละเอียด' : 'ดูรายละเอียดวิชา'}
                        </span>
                        <Icon name={isSubjectsOpen ? 'ChevronUp' : 'ChevronDown'} size={18} className="text-slate-100" />
                    </div>
                </div>
            </button>

            {isSubjectsOpen &&
                (groupedAssignments.length === 0 ? (
                    <div className="text-center py-10 text-slate-500 text-sm">ยังไม่มีข้อมูลงานในวิชานี้</div>
                ) : (
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[520px] overflow-y-auto pr-1 custom-scrollbar">
                        {groupedAssignments.map(({ subjectName, submitted, missing }, idx) => {
                            const totalAssignments = submitted.length + missing.length;
                            const style = subjectCardStyles[idx % subjectCardStyles.length];
                            const cardId = `${subjectName}-${idx}`;
                            return (
                                <div
                                    key={cardId}
                                    className={`rounded-xl border ${style.border} bg-gradient-to-br ${style.bg} p-4 space-y-3 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/20`}
                                >
                                    <button
                                        type="button"
                                        onClick={() => toggleSubject(cardId)}
                                        className="w-full text-left flex items-start justify-between gap-3"
                                        aria-expanded={expandedSubjectId === cardId}
                                    >
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-white font-semibold text-lg">
                                                <Icon name="NotebookText" size={18} className="text-sky-200" />
                                                {subjectName}
                                            </div>
                                            <div className="flex items-center gap-2 text-[11px] flex-wrap">
                                                <span className="px-2 py-1 rounded-full bg-white/10 text-slate-100 border border-white/15">ทั้งหมด {totalAssignments}</span>
                                                <span className="px-2 py-1 rounded-full bg-rose-500/20 text-rose-50 border border-rose-500/30">ค้างส่ง {missing.length}</span>
                                                <span className="px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-50 border border-emerald-500/30">ส่งแล้ว {submitted.length}</span>
                                            </div>
                                        </div>
                                        <Icon name={expandedSubjectId === cardId ? 'ChevronUp' : 'ChevronDown'} size={18} className="text-slate-100" />
                                    </button>

                                    {expandedSubjectId === cardId && (
                                        <div className="space-y-3">
                                            {missing.length > 0 && (
                                                <div className="space-y-2">
                                                    <p className="text-rose-50 text-sm flex items-center gap-1">
                                                        <Icon name="AlertCircle" size={14} /> งานที่ค้างส่ง
                                                    </p>
                                                    {missing.map((assign, i) => (
                                                        <div key={i} className="bg-rose-500/15 border border-rose-500/30 rounded-lg p-3 flex items-center justify-between text-sm text-rose-50">
                                                            <div>
                                                                <p className="font-semibold">{assign.name}</p>
                                                                <p className="text-xs text-rose-100/80">-{assign.maxScore} คะแนน</p>
                                                            </div>
                                                            <span className="text-[11px] uppercase tracking-wide">ยังไม่ส่ง</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            <div className="space-y-2">
                                                <p className="text-emerald-50 text-sm flex items-center gap-1">
                                                    <Icon name="CheckCircle2" size={14} /> งานที่ส่งแล้ว
                                                </p>
                                                {submitted.length > 0 ? (
                                                    submitted.map((assign, i) => (
                                                        <div key={i} className="bg-slate-900/60 border border-slate-800 rounded-lg p-3 space-y-2">
                                                            <div className="flex items-center justify-between text-sm text-slate-100">
                                                                <p className="font-semibold">{assign.name}</p>
                                                                <span className="font-bold text-emerald-300">
                                                                    {assign.score}/{assign.maxScore}
                                                                </span>
                                                            </div>
                                                            <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full bg-gradient-to-r from-teal-300 to-emerald-500 rounded-full"
                                                                    style={{ width: `${Math.min(100, (assign.score / assign.maxScore) * 100)}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p className="text-xs text-slate-200/70 bg-slate-900/60 border border-slate-800 rounded-lg p-3">
                                                        ยังไม่มีงานที่ส่งในวิชานี้
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ))}
        </section>
    );
};

SubjectsTab.propTypes = {
    isSubjectsOpen: PropTypes.bool.isRequired,
    setIsSubjectsOpen: PropTypes.func.isRequired,
    assignmentStats: PropTypes.object.isRequired,
    completionRate: PropTypes.number.isRequired,
    groupedAssignments: PropTypes.array.isRequired,
    expandedSubjectId: PropTypes.string,
    toggleSubject: PropTypes.func.isRequired
};

export default SubjectsTab;
