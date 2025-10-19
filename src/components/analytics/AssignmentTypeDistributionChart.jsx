import React from 'react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip, ResponsiveContainer } from 'recharts';
import Icon from '../../icons/Icon';

const AssignmentTypeDistributionChart = ({ data, isLoading }) => {
    if (isLoading) {
        return (
             <div className="p-6 rounded-2xl backdrop-blur-lg bg-gray-800/30 border border-gray-700/50 h-[400px] flex items-center justify-center">
                <Icon name="Loader2" className="animate-spin text-purple-400" size={40} />
             </div>
        )
    }

    return (
        <div className="p-6 rounded-2xl backdrop-blur-lg bg-gray-800/30 border border-gray-700/50 h-[400px]">
            <h3 className="text-lg font-bold text-white mb-4">สัดส่วนประเภทงาน</h3>
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
                    <PolarGrid stroke="rgba(255, 255, 255, 0.2)" />
                    <PolarAngleAxis dataKey="type" tick={{ fill: '#9ca3af', fontSize: 14 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 'dataMax + 5']} tick={false} axisLine={false} />
                    <Radar name="Assignments" dataKey="count" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'rgba(31, 41, 55, 0.8)',
                            borderColor: 'rgba(255, 255, 255, 0.2)',
                            borderRadius: '0.5rem',
                        }}
                        labelStyle={{ color: '#ffffff' }}
                    />
                </RadarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default AssignmentTypeDistributionChart;
