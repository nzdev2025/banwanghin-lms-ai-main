import React, { useState, useEffect } from 'react';
import { X, Save, RotateCcw } from 'lucide-react';
import { useSiteConfig } from '../../context/SiteConfigContext';

const SiteEditorModal = ({ onClose }) => {
    const { siteConfig, updateConfig, resetConfig } = useSiteConfig();
    const [formData, setFormData] = useState(siteConfig);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('general');

    useEffect(() => {
        setFormData(siteConfig);
    }, [siteConfig]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (name.startsWith('featureFlags.')) {
            const feature = name.split('.')[1];
            setFormData(prev => ({
                ...prev,
                featureFlags: { ...prev.featureFlags, [feature]: checked }
            }));
        } else if (name.startsWith('announcement.')) {
            const field = name.split('.')[1];
            setFormData(prev => ({
                ...prev,
                announcement: { ...prev.announcement, [field]: type === 'checkbox' ? checked : value }
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        await updateConfig(formData);
        setSaving(false);
        onClose();
    };

    const handleReset = async () => {
        if (window.confirm('คุณแน่ใจหรือไม่ที่จะรีเซ็ตค่าทั้งหมดเป็นค่าเริ่มต้น?')) {
            setSaving(true);
            await resetConfig();
            setSaving(false);
            onClose();
        }
    };

    const tabs = [
        { id: 'general', label: 'ทั่วไป' },
        { id: 'academic', label: 'ปีการศึกษา' },
        { id: 'appearance', label: 'หน้าตา' },
        { id: 'features', label: 'ฟีเจอร์' },
        { id: 'announcement', label: 'ประกาศ' },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#1e293b] shadow-2xl flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
                    <h2 className="text-xl font-semibold text-white">ปรับแต่งเว็บไซต์</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex border-b border-white/10 px-6">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === tab.id
                                    ? 'border-indigo-500 text-indigo-400'
                                    : 'border-transparent text-slate-400 hover:text-slate-200'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    <form id="site-editor-form" onSubmit={handleSubmit} className="space-y-6">
                        {activeTab === 'general' && (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">ชื่อเว็บไซต์ (Site Title)</label>
                                    <input
                                        type="text"
                                        name="siteTitle"
                                        value={formData.siteTitle || ''}
                                        onChange={handleChange}
                                        className="w-full rounded-lg border border-white/10 bg-slate-800 px-4 py-2 text-white focus:border-indigo-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">ชื่อโรงเรียน (School Name)</label>
                                    <input
                                        type="text"
                                        name="schoolName"
                                        value={formData.schoolName || ''}
                                        onChange={handleChange}
                                        className="w-full rounded-lg border border-white/10 bg-slate-800 px-4 py-2 text-white focus:border-indigo-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">ข้อความโลโก้ (Logo Text)</label>
                                    <input
                                        type="text"
                                        name="logoText"
                                        value={formData.logoText || ''}
                                        onChange={handleChange}
                                        className="w-full rounded-lg border border-white/10 bg-slate-800 px-4 py-2 text-white focus:border-indigo-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">ชื่อผู้พัฒนา (Developer Name)</label>
                                    <input
                                        type="text"
                                        name="developerName"
                                        value={formData.developerName || ''}
                                        onChange={handleChange}
                                        className="w-full rounded-lg border border-white/10 bg-slate-800 px-4 py-2 text-white focus:border-indigo-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">ข้อความ Footer</label>
                                    <textarea
                                        name="footerText"
                                        value={formData.footerText || ''}
                                        onChange={handleChange}
                                        rows="3"
                                        className="w-full rounded-lg border border-white/10 bg-slate-800 px-4 py-2 text-white focus:border-indigo-500 focus:outline-none resize-none"
                                    />
                                </div>
                            </div>
                        )}

                        {activeTab === 'academic' && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-1">ปีการศึกษา (เช่น 2567)</label>
                                        <input
                                            type="text"
                                            name="academicYear"
                                            value={formData.academicYear || ''}
                                            onChange={handleChange}
                                            className="w-full rounded-lg border border-white/10 bg-slate-800 px-4 py-2 text-white focus:border-indigo-500 focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-1">ภาคเรียนที่ (เช่น 1, 2)</label>
                                        <input
                                            type="text"
                                            name="semester"
                                            value={formData.semester || ''}
                                            onChange={handleChange}
                                            className="w-full rounded-lg border border-white/10 bg-slate-800 px-4 py-2 text-white focus:border-indigo-500 focus:outline-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'appearance' && (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-3">สีหลัก (Primary Color Theme)</label>
                                    <div className="grid grid-cols-1 gap-3">
                                        {[
                                            { name: 'Emerald - Teal - Sky (Default)', value: 'from-emerald-400 via-teal-500 to-sky-500' },
                                            { name: 'Indigo - Purple - Pink', value: 'from-indigo-400 via-purple-500 to-pink-500' },
                                            { name: 'Orange - Amber - Yellow', value: 'from-orange-400 via-amber-500 to-yellow-500' },
                                            { name: 'Blue - Cyan - Sky', value: 'from-blue-400 via-cyan-500 to-sky-500' },
                                            { name: 'Rose - Red - Orange', value: 'from-rose-400 via-red-500 to-orange-500' },
                                        ].map((theme) => (
                                            <label key={theme.value} className="flex items-center gap-3 p-3 rounded-lg border border-white/5 bg-white/5 cursor-pointer hover:bg-white/10">
                                                <input
                                                    type="radio"
                                                    name="primaryColor"
                                                    value={theme.value}
                                                    checked={formData.primaryColor === theme.value}
                                                    onChange={handleChange}
                                                    className="text-indigo-500 focus:ring-indigo-500"
                                                />
                                                <div className={`h-8 w-8 rounded-full bg-gradient-to-br ${theme.value}`} />
                                                <span className="text-sm text-slate-200">{theme.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'features' && (
                            <div className="space-y-4">
                                <p className="text-sm text-slate-400 mb-4">เลือกเปิด/ปิดการใช้งานเมนูต่างๆ</p>
                                <div className="space-y-3">
                                    {[
                                        { key: 'savings', label: 'ระบบออมทรัพย์' },
                                        { key: 'health', label: 'ห้องพยาบาล' },
                                        { key: 'calendar', label: 'ปฏิทินงาน/สอบ' },
                                        { key: 'tools', label: 'AI ช่วยสร้าง' },
                                    ].map((feature) => (
                                        <label key={feature.key} className="flex items-center justify-between p-3 rounded-lg border border-white/5 bg-white/5 cursor-pointer hover:bg-white/10">
                                            <span className="text-slate-200">{feature.label}</span>
                                            <div className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    name={`featureFlags.${feature.key}`}
                                                    checked={formData.featureFlags?.[feature.key] ?? true}
                                                    onChange={handleChange}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'announcement' && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 mb-4">
                                    <input
                                        type="checkbox"
                                        name="announcement.enabled"
                                        checked={formData.announcement?.enabled || false}
                                        onChange={handleChange}
                                        id="announce-enable"
                                        className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <label htmlFor="announce-enable" className="text-sm font-medium text-white">เปิดใช้งานประกาศ</label>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">ข้อความประกาศ</label>
                                    <textarea
                                        name="announcement.message"
                                        value={formData.announcement?.message || ''}
                                        onChange={handleChange}
                                        rows="3"
                                        className="w-full rounded-lg border border-white/10 bg-slate-800 px-4 py-2 text-white focus:border-indigo-500 focus:outline-none resize-none"
                                        placeholder="พิมพ์ข้อความประกาศที่นี่..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">ประเภท</label>
                                    <select
                                        name="announcement.type"
                                        value={formData.announcement?.type || 'info'}
                                        onChange={handleChange}
                                        className="w-full rounded-lg border border-white/10 bg-slate-800 px-4 py-2 text-white focus:border-indigo-500 focus:outline-none"
                                    >
                                        <option value="info">ทั่วไป (สีฟ้า)</option>
                                        <option value="warning">แจ้งเตือน (สีเหลือง)</option>
                                        <option value="error">สำคัญ/ฉุกเฉิน (สีแดง)</option>
                                        <option value="success">ข่าวดี (สีเขียว)</option>
                                    </select>
                                </div>
                            </div>
                        )}
                    </form>
                </div>

                <div className="flex items-center justify-between border-t border-white/10 px-6 py-4 bg-[#1e293b] rounded-b-2xl">
                    <button
                        type="button"
                        onClick={handleReset}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                    >
                        <RotateCcw size={18} />
                        <span>รีเซ็ตค่าเริ่มต้น</span>
                    </button>

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
                        >
                            ยกเลิก
                        </button>
                        <button
                            type="submit"
                            form="site-editor-form"
                            disabled={saving}
                            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                        >
                            <Save size={18} />
                            <span>{saving ? 'บันทึก...' : 'บันทึก'}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SiteEditorModal;
