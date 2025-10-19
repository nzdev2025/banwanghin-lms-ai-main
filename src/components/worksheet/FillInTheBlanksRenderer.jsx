// src/components/worksheet/FillInTheBlanksRenderer.jsx (Final Version)
import React from 'react';

const FillInTheBlanksRenderer = ({ data, sectionNumber }) => {
    const createMarkup = (text) => {
        if (typeof text !== 'string') return '';
        // ลบตัวเลข "1." ที่ AI อาจจะสร้างมาซ้ำซ้อน
        const cleanText = text.replace(/^\d+\.\s*/, '');
        return cleanText.replace(/___/g, 
            '<span class="inline-block border-b-2 border-dotted border-black w-40 mx-1 align-bottom"></span>'
        );
    };

    return (
        <div>
            <h3 className="text-lg font-bold mb-4">ตอนที่ {sectionNumber}: {data.instruction || 'เติมคำในช่องว่างให้สมบูรณ์'}</h3>
            {/* **FIX: เปลี่ยนจาก div/p เป็น ol/li เพื่อให้มีตัวเลขนำหน้า** */}
            <ol className="list-decimal list-inside text-base leading-relaxed space-y-3">
                {Array.isArray(data.content) ? (
                    data.content.map((line, index) => (
                        <li key={index} dangerouslySetInnerHTML={{ __html: createMarkup(line) }} />
                    ))
                ) : (
                    <li dangerouslySetInnerHTML={{ __html: createMarkup(data.content) }} />
                )}
            </ol>
        </div>
    );
};

export default FillInTheBlanksRenderer;