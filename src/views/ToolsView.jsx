import React from 'react';
import PropTypes from 'prop-types';
import Icon from '../icons/Icon';
import FeatureCard from '../components/shared/FeatureCard';

const ToolsView = ({ openModal }) => {
  const tools = [
    {
      icon: <Icon name="Bot" size={24} className="text-purple-400" />,
      title: 'AI Worksheet Generator',
      description: 'สร้างใบงานและข้อสอบอัตโนมัติด้วย AI',
      action: () => openModal('aiWorksheet'),
    },
    {
      icon: <Icon name="NotebookPen" size={24} className="text-sky-400" />,
      title: 'AI สร้างแผนการสอน',
      description: 'ระบุหัวข้อ-ระดับชั้น แล้วรับโครงร่างแผนการสอนพร้อมกิจกรรม',
      action: () => openModal('aiLessonPlan'),
    },
    {
      icon: <Icon name="FileText" size={24} className="text-orange-400" />,
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
          <FeatureCard
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

ToolsView.propTypes = {
  openModal: PropTypes.func.isRequired,
};

export default ToolsView;