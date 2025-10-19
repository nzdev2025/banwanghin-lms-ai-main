// src/components/analytics/SubjectPerformanceChart.jsx (The Corrected & Final Glowing Version)
import React from 'react';
// --- FIX: Removed Defs, linearGradient, stop from import ---
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import { colorThemes } from '../../constants/theme';
import Icon from '../../icons/Icon';

const SubjectPerformanceChart = ({ data, isLoading }) => {
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-gray-900/80 backdrop-blur-sm border border-white/20 p-3 rounded-lg shadow-lg">
                    <p className="font-bold text-white">{`${label}`}</p>
                    <p style={{ color: payload[0].payload.colorTheme.hex }}>
                        {`คะแนนเฉลี่ย: ${payload[0].value.toFixed(2)}%`}
                    </p>
                </div>
            );
        }
        return null;
    };

    if (isLoading) {
        return (
             <div className="flex h-[340px] items-center justify-center rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-lg">
                <Icon name="Loader2" className="animate-spin text-teal-400" size={40} />
             </div>
        )
    }
    
    const defs = Object.keys(colorThemes).map(key => (
        <React.Fragment key={key}>
            {/* --- FIX: Used lowercase <linearGradient> and <stop> as standard SVG tags --- */}
            <linearGradient id={`color-${key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colorThemes[key].hex} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={colorThemes[key].hex} stopOpacity={0.2}/>
            </linearGradient>
            <filter id={`glow-${key}`} x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
                <feFlood floodColor={colorThemes[key].hex} result="flood" />
                <feComposite in="flood" in2="blur" operator="in" result="glow" />
                <feMerge>
                    <feMergeNode in="glow" />
                    <feMergeNode in="SourceGraphic" />
                </feMerge>
            </filter>
        </React.Fragment>
    ));


    return (
        <div className="h-[340px] rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-lg">
            <h3 className="text-lg font-bold text-white mb-4">ประสิทธิภาพรายวิชา (คะแนนเฉลี่ย)</h3>
            <ResponsiveContainer width="100%" height="90%">
                <BarChart data={data} margin={{ top: 5, right: 20, left: -20, bottom: 60 }}>
                    {/* --- FIX: Used lowercase <defs> as a standard SVG tag --- */}
                    <defs>{defs}</defs>

                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                    <XAxis
                        dataKey="name"
                        angle={-45}
                        textAnchor="end"
                        height={100}
                        tick={{ fill: '#9ca3af', fontSize: 12 }}
                        interval={0}
                    />
                    <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} unit="%" domain={[0, 100]} />
                    <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(148, 163, 184, 0.1)'}} />
                    <Bar dataKey="average" radius={[4, 4, 0, 0]}>
                         {data.map((entry) => (
                            <Cell 
                                key={`cell-${entry.id}`} 
                                fill={`url(#color-${entry.colorTheme.key})`}
                                filter={`url(#glow-${entry.colorTheme.key})`}
                            />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default SubjectPerformanceChart;
