import React from 'react';
import PropTypes from 'prop-types';
import Icon from '../../../../icons/Icon';

const BehaviorTab = ({
    isBehaviorOpen,
    setIsBehaviorOpen,
    behaviorStats,
    startDate,
    setStartDate,
    setIsLoggerOpen,
    filteredBehaviorLogs,
    formatDate,
    setConfirmModal
}) => {
    return (
        <section className="bg-slate-900/60 rounded-2xl border border-slate-800/70 p-5 shadow-inner shadow-black/20">
            <button
                type="button"
                onClick={() => setIsBehaviorOpen((open) => !open)}
                className="group w-full text-left"
                aria-expanded={isBehaviorOpen}
            >
                <div className="relative overflow-hidden rounded-xl border border-amber-500/25 bg-gradient-to-r from-slate-950/80 via-amber-900/20 to-rose-900/30 p-4 flex flex-col gap-4 shadow-lg shadow-black/20 hover:-translate-y-0.5 transition-transform">
                    <div className="absolute -right-8 -top-10 h-32 w-32 rounded-full bg-amber-500/20 blur-3xl" />
                    <div className="absolute left-4 bottom-4 h-16 w-16 rounded-full bg-rose-400/20 blur-2xl" />
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-amber-400 via-orange-400 to-rose-400 flex items-center justify-center text-slate-900 font-extrabold shadow-lg shadow-black/30">
                                <Icon name="Activity" size={22} />
                            </div>
                            <div>
                                <p className="text-[11px] uppercase tracking-[0.18em] text-amber-200/80">ภาพรวมพฤติกรรม</p>
                                <h3 className="text-xl font-semibold text-white">สถานะ: {behaviorStats.status}</h3>
                                <p className="text-xs text-slate-300">
                                    {behaviorStats.total > 0
                                        ? `เชิงบวก ${behaviorStats.positives} | ควรปรับปรุง ${behaviorStats.negatives}`
                                        : 'ยังไม่มีบันทึกพฤติกรรม'}
                                </p>
                            </div>
                        </div>
                        <div className="relative h-16 w-24 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/60">
                            <div className="absolute inset-0 bg-gradient-to-br from-amber-400/25 via-rose-300/20 to-emerald-300/20" />
                            <div className="absolute inset-2 border border-white/15 rounded-xl" />
                            <div className="absolute top-2 left-2 h-8 w-8 rounded-xl bg-white/10" />
                            <div className="absolute bottom-2 right-2 h-6 w-10 rounded-xl bg-gradient-to-br from-emerald-300/30 via-sky-300/20 to-indigo-400/30" />
                        </div>
                    </div>

                    <div className="flex items-center justify-between text-sm text-amber-100/90">
                        <span className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-amber-300 animate-pulse" /> คลิกเพื่อ{isBehaviorOpen ? 'ย่อบันทึก' : 'ดูบันทึกรายละเอียด'}
                        </span>
                        <Icon name={isBehaviorOpen ? 'ChevronUp' : 'ChevronDown'} size={18} className="text-slate-100" />
                    </div>
                </div>
            </button>

            {isBehaviorOpen && (
                <div className="mt-4 space-y-3">
                    <div className="flex flex-wrap gap-2">
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                        />
                        {startDate && (
                            <button
                                onClick={() => setStartDate('')}
                                className="text-xs px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800"
                            >
                                ล้างตัวกรอง
                            </button>
                        )}
                        <button
                            onClick={() => setIsLoggerOpen(true)}
                            className="text-xs px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-100 hover:bg-amber-500/25"
                        >
                            + เพิ่มบันทึก
                        </button>
                    </div>

                    <div className="max-h-[320px] overflow-y-auto pr-1 custom-scrollbar space-y-3">
                        {filteredBehaviorLogs.length > 0 ? (
                            filteredBehaviorLogs.map((log) => (
                                <div
                                    key={log.id}
                                    className={`group p-3 rounded-xl border flex items-start gap-3 transition-all ${log.type === 'positive'
                                        ? 'bg-emerald-500/5 border-emerald-500/20 hover:bg-emerald-500/10'
                                        : 'bg-rose-500/5 border-rose-500/20 hover:bg-rose-500/10'
                                        }`}
                                >
                                    <div
                                        className={`mt-1 p-2 rounded-lg ${log.type === 'positive' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-200'
                                            }`}
                                    >
                                        <Icon name={log.icon} size={16} />
                                    </div>
                                    <div className="flex-grow min-w-0">
                                        <div className="flex justify-between items-start gap-2">
                                            <p className={`font-semibold text-sm ${log.type === 'positive' ? 'text-emerald-100' : 'text-rose-100'}`}>
                                                {log.tag}
                                            </p>
                                            <span className="text-[10px] text-slate-400 whitespace-nowrap">{formatDate(log.timestamp)}</span>
                                        </div>
                                        {log.note && <p className="text-xs text-slate-300 mt-1">"{log.note}"</p>}
                                    </div>
                                    <button
                                        onClick={() => setConfirmModal({ isOpen: true, data: { id: log.id, name: log.tag } })}
                                        className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 transition-all p-1"
                                        aria-label="ลบบันทึก"
                                    >
                                        <Icon name="Trash2" size={14} />
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 border border-dashed border-slate-700 rounded-xl bg-slate-950/40">
                                <div className="bg-slate-900/60 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 border border-slate-800">
                                    <Icon name="ClipboardList" size={28} className="text-slate-600" />
                                </div>
                                <p className="text-slate-400 text-sm">ไม่พบบันทึกพฤติกรรม</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </section>
    );
};

BehaviorTab.propTypes = {
    isBehaviorOpen: PropTypes.bool.isRequired,
    setIsBehaviorOpen: PropTypes.func.isRequired,
    behaviorStats: PropTypes.object.isRequired,
    startDate: PropTypes.string,
    setStartDate: PropTypes.func.isRequired,
    setIsLoggerOpen: PropTypes.func.isRequired,
    filteredBehaviorLogs: PropTypes.array.isRequired,
    formatDate: PropTypes.func.isRequired,
    setConfirmModal: PropTypes.func.isRequired
};

export default BehaviorTab;
