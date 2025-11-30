// src/components/worksheet/MultipleChoiceRenderer.jsx
import React from 'react';

const stripLeadingNumber = (text = '') => text.replace(/^\s*\d+[.)]\s*/, '').trim();

const parseOption = (option = '', optIndex) => {
  const cleaned = option.trim();
  const [rawLabel, ...rawText] = cleaned.split(' ');
  const labelFromPrefix = cleaned.match(/^([^\s.]+[.)])/);
  const fallbackLabel = `${String.fromCharCode(65 + optIndex)}.`;
  const hasExplicitLabel = /[.)]$/.test(rawLabel || '');
  const label = labelFromPrefix?.[1] || (hasExplicitLabel ? rawLabel : fallbackLabel);
  const textFromSplit = rawText.join(' ').trim();
  const strippedText = cleaned.replace(/^[^\s.]+[.)]?\s*/, '').trim();
  const text = textFromSplit || strippedText || cleaned || label;

  return { label, text };
};

const MultipleChoiceRenderer = ({ data, sectionNumber }) => {
  const questions = Array.isArray(data.questions) ? data.questions : [];

  return (
    <div>
      <h3 className="text-lg font-bold mb-2">ตอนที่ {sectionNumber}: {data.instruction}</h3>
      <ol className="list-none space-y-4">
        {questions.map((q, index) => (
          <li key={`mc-${sectionNumber}-${index}`} className="flex gap-3 items-start">
            <span className="w-8 text-right font-semibold leading-relaxed">{index + 1}.</span>
            <div className="flex-1">
              <p className="font-semibold mb-2 leading-relaxed">{stripLeadingNumber(q.text)}</p>
              <div className="pl-1 space-y-1">
                {Array.isArray(q.options) && q.options.map((option, optIndex) => {
                  const { label, text } = parseOption(option || '', optIndex);

                  return (
                    <div key={`opt-${index}-${optIndex}`} className="flex items-start gap-2">
                      <span className="min-w-[1.5rem]">{label}</span>
                      <span className="flex-1 leading-relaxed">{text}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
};

export default MultipleChoiceRenderer;
