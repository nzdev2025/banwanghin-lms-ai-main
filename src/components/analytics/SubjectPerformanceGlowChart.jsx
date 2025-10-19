// src/components/analytics/SubjectPerformanceGlowChart.jsx
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Defs } from 'recharts';
import Icon from '../../icons/Icon';

const SubjectPerformanceGlowChart = ({ data, isLoading }) => {

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const subjectData = payload[0].payload;
            return (
                <div className="bg-gray-900/80 backdrop-blur-sm border border-white/20 p-3 rounded-lg shadow-lg">
                    <p className="font-bold text-white">{label}</p>
                    <p style={{ color: subjectData.fill }}>
                        คะแนนเฉลี่ย: {payload[0].value.toFixed(2)}%
                    </p>
                </div>
            );
        }
        return null;
    };

    if (isLoading) {
        return (
             <div className="p-6 rounded-2xl backdrop-blur-lg bg-gray-800/30 border border-gray-700/50 h-[400px] flex items-center justify-center">
                <Icon name="Loader2" className="animate-spin text-teal-400" size={40} />
             </div>
        )
    }

    // Prepare a unique gradient and filter for each subject
    const defs = data.map(subject => (
        <React.Fragment key={subject.id}>
            <linearGradient id={`color-${subject.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={subject.fill} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={subject.fill} stopOpacity={0}/>
            </linearGradient>
            <filter id={`glow-${subject.id}`} x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="4" result="coloredBlur" in="SourceGraphic" />
                <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                </feMerge>
            </filter>
        </React.Fragment>
    ));

    return (
        <div className="p-6 rounded-2xl backdrop-blur-lg bg-gray-800/30 border border-gray-700/50 h-[400px]">
            <h3 className="text-lg font-bold text-white mb-4">ประสิทธิภาพรายวิชา (ภาพรวม)</h3>
            <ResponsiveContainer width="100%" height="90%">
                <AreaChart
                    data={data}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                    <defs>{defs}</defs>
                    <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 12 }} angle={-45} textAnchor="end" height={80} interval={0} />
                    <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} unit="%" domain={[0, 100]} />
                    <Tooltip content={<CustomTooltip />} />
                    {/* Render a line for each subject */}
                    {data.map(subject => (
                        <Area 
                            key={subject.id}
                            type="monotone" 
                            dataKey="average" 
                            data={data.filter(d => d.id === subject.id)} // This seems odd but it's how recharts can isolate lines
                            stroke={subject.fill} 
                            strokeWidth={3}
                            fillOpacity={1} 
                            fill={`url(#color-${subject.id})`}
                            filter={`url(#glow-${subject.id})`}
                        />
                    ))}
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

export default SubjectPerformanceGlowChart;