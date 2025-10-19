// src/components/worksheet/MultipleChoiceRenderer.jsx
import React from 'react';

const MultipleChoiceRenderer = ({ data, sectionNumber }) => {
    return (
        <div>
            <h3 className="text-lg font-bold mb-2">ตอนที่ {sectionNumber}: {data.instruction}</h3>
            <ol className="list-decimal list-inside space-y-4">
                {data.questions.map((q) => (
                    <li key={q.id}>
                        <p className="font-semibold mb-2">{q.text}</p>
                        <div className="pl-6 space-y-1">
                            {q.options.map((option, index) => (
                                <div key={index} className="flex items-center">
                                    <span>{option}</span>
                                </div>
                            ))}
                        </div>
                    </li>
                ))}
            </ol>
        </div>
    );
};

export default MultipleChoiceRenderer;