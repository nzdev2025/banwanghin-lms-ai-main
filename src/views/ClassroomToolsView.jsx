import React from 'react';
import { Bolt, Presentation } from 'lucide-react';

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

const ClassroomToolsView = ({ openModal }) => {
  const tools = [
    {
      icon: <Bolt size={24} className="text-purple-400" />,
      title: 'Lightning Quiz (Beta)',
      description: 'สร้าง/โฮสต์เกมตอบเร็วในแอป ไม่ต้องสลับไป Kahoot',
      action: () => openModal('lightningQuiz'),
    },
    {
      icon: <Presentation size={24} className="text-blue-400" />,
      title: 'Classroom Toolkit',
      description: 'เครื่องมือสำหรับจัดการในชั้นเรียน เช่น จับเวลา สุ่มนักเรียน',
      action: () => openModal('classroomToolkit'),
    },
  ];

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-white mb-8">เครื่องมือช่วยสอน</h1>
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

export default ClassroomToolsView;
