import React from 'react';
import { Bot, FileText, NotebookPen } from 'lucide-react';

const ToolCard = ({ icon, title, description, onClick }) => (
  <div 
    className="bg-gray-800/50 p-6 rounded-lg border border-white/10 hover:bg-gray-700/50 cursor-pointer transition-colors"
    onClick={onClick}
  >
    <div className="flex items-center gap-4">
      {icon}
      <div>
        <h3 className="font-bold text-white">{title}</h3>
        <p className="text-sm text-gray-400">{description}</p>
      </div>
    </div>
  </div>
);

const ToolsView = ({ openModal }) => {
  const tools = [
    {
      icon: <Bot size={24} className="text-purple-400" />,
      title: 'AI Worksheet Generator',
      description: 'สร้างใบงานและข้อสอบอัตโนมัติด้วย AI',
      action: () => openModal('aiWorksheet'),
    },
    {
      icon: <NotebookPen size={24} className="text-sky-400" />,
      title: 'AI สร้างแผนการสอน',
      description: 'ระบุหัวข้อ-ระดับชั้น แล้วรับโครงร่างแผนการสอนพร้อมกิจกรรม',
      action: () => openModal('aiLessonPlan'),
    },
    {
      icon: <FileText size={24} className="text-orange-400" />,
      title: 'สร้างเอกสาร ปพ.5',
      description: 'สร้างเอกสาร ปพ.5 อัตโนมัติ',
      action: () => openModal('pp5Generator'),
    },
  ];

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-white mb-8">สร้างสื่อ/ใบงาน/ข้อสอบ</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tools.map((item, index) => (
          <ToolCard
            key={index}
            icon={item.icon}
            title={item.title}
            description={item.description}
            onClick={item.action}
          />
        ))}
      </div>
    </div>
  );
};

export default ToolsView;
