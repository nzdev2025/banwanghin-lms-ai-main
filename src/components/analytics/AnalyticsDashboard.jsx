import React from 'react';
import { analyticsCardStyles } from '../../constants/theme';
import Icon from '../../icons/Icon';

const AnalyticsDashboard = ({ students, assignments, scores }) => {
    const analyticsData = React.useMemo(() => {
        if (students.length === 0 || assignments.length === 0) return [];

        return assignments.map(assign => {
            const assignmentScores = students
                .map(student => scores[student.id]?.[assign.id])
                .filter(score => typeof score === 'number');

            if (assignmentScores.length === 0) {
                return { id: assign.id, name: assign.name, category: assign.category, avg: '-', max: '-', min: '-' };
            }

            const sum = assignmentScores.reduce((acc, score) => acc + score, 0);
            const avg = (sum / assignmentScores.length).toFixed(2);
            const max = Math.max(...assignmentScores);
            const min = Math.min(...assignmentScores);

            return { id: assign.id, name: assign.name, category: assign.category, avg, max, min };
        });
    }, [students, assignments, scores]);

    if (!analyticsData.length) return null;

    return (
        <div className="mb-8 p-4 bg-gray-900/50 rounded-xl border border-white/10">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Icon name="BarChart2" size={20}/>ภาพรวมคะแนน</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {analyticsData.map((data, index) => {
                    const cardStyle = analyticsCardStyles[index % analyticsCardStyles.length];
                    return (
                        <div key={data.id} className={`bg-gradient-to-br ${cardStyle.gradient} rounded-lg border ${cardStyle.border} overflow-hidden shadow-lg`}>
                            <div className="p-4">
                                <p className="font-bold text-white truncate mb-3 text-base">{data.name}</p>
                                <div className="grid grid-cols-3 gap-2 text-center">
                                    <div>
                                        <p className="text-xs text-gray-300 flex items-center justify-center gap-1"><Icon name="Minus" size={12}/>เฉลี่ย</p>
                                        <p className="text-2xl font-bold text-white">{data.avg}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-300 flex items-center justify-center gap-1"><Icon name="TrendingUp" size={12}/>สูงสุด</p>
                                        <p className="text-2xl font-bold text-white">{data.max}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-300 flex items-center justify-center gap-1"><Icon name="TrendingDown" size={12}/>ต่ำสุด</p>
                                        <p className="text-2xl font-bold text-white">{data.min}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default AnalyticsDashboard;
