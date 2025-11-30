// src/components/worksheet/ShortAnswerRenderer.jsx
import React from 'react';

const stripLeadingNumber = (text = '') => text.replace(/^\s*\d+[.)]\s*/, '').trim();

const ShortAnswerRenderer = ({ data, sectionNumber }) => {
  const questions = Array.isArray(data.questions) ? data.questions : [];

  return (
    <div>
      <h3 className="text-lg font-bold mb-2">ตอนที่ {sectionNumber}: {data.instruction}</h3>
      <ol className="list-none space-y-6">
        {questions.map((q, index) => (
          <li key={`short-${sectionNumber}-${index}`} className="flex gap-3 items-start">
            <span className="w-8 text-right font-semibold leading-relaxed">{index + 1}.</span>
            <div className="flex-1 space-y-2">
              <p className="font-semibold leading-relaxed">{stripLeadingNumber(q.text)}</p>
              <div className="w-full border-b-2 border-dotted border-black h-8"></div>
              <div className="w-full border-b-2 border-dotted border-black h-8"></div>
              <div className="w-full border-b-2 border-dotted border-black h-8"></div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
};

export default ShortAnswerRenderer;
