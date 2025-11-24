// src/components/worksheet/TrueFalseRenderer.jsx
import React from 'react';

const stripLeadingNumber = (text = '') => text.replace(/^\s*\d+[\.\)]\s*/, '').trim();

const TrueFalseRenderer = ({ data, sectionNumber }) => {
  const questions = Array.isArray(data.questions) ? data.questions : [];

  return (
    <div>
      <h3 className="text-lg font-bold mb-2">ตอนที่ {sectionNumber}: {data.instruction}</h3>
      <ol className="list-none space-y-3">
        {questions.map((q, index) => (
          <li key={`tf-${sectionNumber}-${index}`} className="flex gap-3 items-start">
            <span className="w-8 text-right font-semibold leading-relaxed">{index + 1}.</span>
            <div className="flex-1 flex items-start gap-2">
              <span className="flex-1 leading-relaxed">{stripLeadingNumber(q.text)}</span>
              <span className="font-mono text-gray-600 whitespace-nowrap">(..... ถูก / ..... ผิด)</span>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
};

export default TrueFalseRenderer;
