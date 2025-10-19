// src/components/analytics/SubjectPerformanceRadialChart.jsx
import React from 'react';
import { RadialBarChart, RadialBar, Legend, ResponsiveContainer, PolarAngleAxis } from 'recharts';
import Icon from '../../icons/Icon';

const SubjectPerformanceRadialChart = ({ data, isLoading }) => {
    
    const CustomLegend = (props) => {
        const { payload } = props;
        return (
            <ul className="grid grid-cols-2 gap-x-4 gap-y-1 mt-4 text-xs">
                {payload.map((entry, index) => (
                    <li key={`item-${index}`} className="flex items-center gap-2 truncate">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                        <span className="text-gray-300">{entry.value}:</span>
                        <span className="font-bold text-white">{entry.payload.average.toFixed(2)}%</span>
                    </li>
                ))}
            </ul>
        );
    };

    if (isLoading) {
        return (
             <div className="p-6 rounded-2xl backdrop-blur-lg bg-gray-800/30 border border-gray-700/50 h-[400px] flex items-center justify-center">
                <Icon name="Loader2" className="animate-spin text-teal-400" size={40} />
             </div>
        )
    }

    return (
        <div className="p-6 rounded-2xl backdrop-blur-lg bg-gray-800/30 border border-gray-700/50 h-[400px] flex flex-col">
            <h3 className="text-lg font-bold text-white">ประสิทธิภาพรายวิชา</h3>
            <div className="flex-grow">
                <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart 
                        cx="50%" 
                        cy="50%" 
                        innerRadius="20%" 
                        outerRadius="100%" 
                        barSize={10} 
                        data={data}
                        startAngle={90}
                        endAngle={-270}
                    >
                        <PolarAngleAxis
                            type="number"
                            domain={[0, 100]}
                            angleAxisId={0}
                            tick={false}
                        />
                        <RadialBar 
                            minAngle={15} 
                            background 
                            clockWise 
                            dataKey="average" 
                        />
                        <Legend iconSize={10} layout="horizontal" verticalAlign="bottom" align="center" content={<CustomLegend />} />
                    </RadialBarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default SubjectPerformanceRadialChart;