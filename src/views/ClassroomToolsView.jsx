import React from 'react';
import PropTypes from 'prop-types';
import Icon from '../icons/Icon';
import FeatureCard from '../components/shared/FeatureCard';

const ClassroomToolsView = ({ openModal }) => {
  const tools = [
    {
      icon: <Icon name="Zap" size={24} className="text-purple-400" />,
      title: 'Lightning Quiz (Beta)',
      description: 'สร้าง/โฮสต์เกมตอบเร็วในแอป ไม่ต้องสลับไป Kahoot',
      action: () => openModal('lightningQuiz'),
    },
    {
      icon: <Icon name="Presentation" size={24} className="text-blue-400" />,
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

ClassroomToolsView.propTypes = {
  openModal: PropTypes.func.isRequired,
};

export default ClassroomToolsView;