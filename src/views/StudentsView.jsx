import React from 'react';
import PropTypes from 'prop-types';
import Icon from '../icons/Icon';
import FeatureCard from '../components/shared/FeatureCard';

const StudentsView = ({ openModal }) => {
  const studentFeatures = [
    {
      icon: <Icon name="CheckCircle" size={24} className="text-green-400" />,
      title: 'เช็คชื่อนักเรียน',
      description: 'บันทึกการเข้าเรียนของนักเรียน',
      action: () => openModal('manageAttendance'),
    },
    {
      icon: <Icon name="PiggyBank" size={24} className="text-pink-400" />,
      title: 'ระบบออมทรัพย์',
      description: 'จัดการการออมเงินของนักเรียน',
      action: () => openModal('manageSavings'),
    },
    {
      icon: <Icon name="HeartPulse" size={24} className="text-red-400" />,
      title: 'ข้อมูลสุขภาพ',
      description: 'บันทึกข้อมูลสุขภาพและน้ำหนักส่วนสูง',
      action: () => openModal('healthRecord'),
    },
    {
      icon: <Icon name="ClipboardList" size={24} className="text-yellow-400" />,
      title: 'ประเมินพัฒนาการ',
      description: 'บันทึกและประเมินพัฒนาการนักเรียน',
      action: () => openModal('developmentalAssessment'),
    },
  ];

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-white mb-8">เครื่องมือเกี่ยวกับนักเรียน</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {studentFeatures.map((item, index) => (
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

StudentsView.propTypes = {
  openModal: PropTypes.func.isRequired,
};

export default StudentsView;