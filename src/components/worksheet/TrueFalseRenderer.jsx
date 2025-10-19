// src/components/worksheet/TrueFalseRenderer.jsx
import React from 'react';

const TrueFalseRenderer = ({ data, sectionNumber }) => {
    return (
        <div>
            <h3 className="text-lg font-bold mb-2">ตอนที่ {sectionNumber}: {data.instruction}</h3>
            <ol className="list-decimal list-inside space-y-3">
                {data.questions.map((q) => (
                    <li key={q.id} className="flex items-start">
                        <span className="mr-2">{q.text}</span>
                        <span className="ml-auto font-mono text-gray-500">(..... ถูก / ..... ผิด)</span>
                    </li>
                ))}
            </ol>
        </div>
    );
};

export default TrueFalseRenderer;