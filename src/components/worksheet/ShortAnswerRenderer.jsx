// src/components/worksheet/ShortAnswerRenderer.jsx
import React from 'react';

const ShortAnswerRenderer = ({ data, sectionNumber }) => {
    return (
        <div>
            <h3 className="text-lg font-bold mb-2">ตอนที่ {sectionNumber}: {data.instruction}</h3>
            <ol className="list-decimal list-inside space-y-6">
                {data.questions.map((q) => (
                    <li key={q.id}>
                        <p className="font-semibold">{q.text}</p>
                        <div className="mt-2 border-b-2 border-dotted border-black h-8"></div>
                        <div className="border-b-2 border-dotted border-black h-8"></div>
                        <div className="border-b-2 border-dotted border-black h-8"></div>
                    </li>
                ))}
            </ol>
        </div>
    );
};

export default ShortAnswerRenderer;