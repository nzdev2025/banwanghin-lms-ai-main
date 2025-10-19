// src/components/worksheet/WorksheetRenderer.jsx (V4 - Fully Equipped)
import React from 'react';
import FillInTheBlanksRenderer from './FillInTheBlanksRenderer';
import MultipleChoiceRenderer from './MultipleChoiceRenderer';
import TrueFalseRenderer from './TrueFalseRenderer';
import ShortAnswerRenderer from './ShortAnswerRenderer'; // <-- Import แม่พิมพ์ใหม่

const WorksheetRenderer = ({ worksheetData }) => {
    if (!worksheetData || !worksheetData.sections) {
        return null;
    }

    return (
        <div className="space-y-8">
            {worksheetData.sections.map((section, index) => {
                const sectionNumber = index + 1;
                switch (section.type) {
                    case 'fill_in_the_blanks':
                        return <FillInTheBlanksRenderer key={index} data={section} sectionNumber={sectionNumber} />;
                    case 'multiple_choice':
                        return <MultipleChoiceRenderer key={index} data={section} sectionNumber={sectionNumber} />;
                    case 'true_false':
                        return <TrueFalseRenderer key={index} data={section} sectionNumber={sectionNumber} />;

                    // --- เพิ่ม Case ให้รู้จักคำถาม "อัตนัย" ---
                    case 'short_answer':
                        return <ShortAnswerRenderer key={index} data={section} sectionNumber={sectionNumber} />;

                    default:
                        return <p key={index} className="text-red-500">Error: ไม่รู้จักประเภทของส่วนนี้: {section.type}</p>;
                }
            })}
        </div>
    );
};

export default WorksheetRenderer;