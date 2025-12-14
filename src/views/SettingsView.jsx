import React from 'react';
import PropTypes from 'prop-types';
import Icon from '../icons/Icon';
import FeatureCard from '../components/shared/FeatureCard';

const SettingsView = ({ openModal }) => {
  const settingsItems = [
    {
      icon: <Icon name="UserCog" size={24} className="text-sky-400" />,
      title: 'ทะเบียนนักเรียน',
      description: 'จัดการข้อมูลนักเรียนทั้งหมดในระบบ',
      action: () => openModal('manageRoster'),
    },
    {
      icon: <Icon name="BellRing" size={24} className="text-lime-400" />,
      title: 'ตั้งค่าแจ้งเตือน',
      description: 'ตั้งค่าการส่งข้อความแจ้งเตือนผ่าน LINE Notify',
      action: () => openModal('lineNotifySettings'),
    },
    {
      icon: <Icon name="BookUp" size={24} className="text-amber-400" />,
      title: 'ตั้งค่าวิชา',
      description: 'จัดการรายวิชาทั้งหมดที่เปิดสอน',
      action: () => openModal('manageSubjects'),
    },
    {
      icon: <Icon name="Eraser" size={24} className="text-rose-400" />,
      title: 'ล้างงานและคะแนน',
      description: 'ล้างหัวข้องานและคะแนนทั้งชั้น/วิชาเมื่อขึ้นเทอมใหม่',
      action: () => openModal('resetAssignments'),
    },
    {
      icon: <Icon name="Settings2" size={24} className="text-purple-400" />, // Changed UserCog to Settings2 for distinction
      title: 'ปรับแต่งเว็บไซต์',
      description: 'แก้ไขชื่อเว็บ, โลโก้, และข้อความ Footer',
      action: () => openModal('siteEditor'),
    },
  ];

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-white mb-8">ตั้งค่า</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {settingsItems.map((item, index) => (
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

SettingsView.propTypes = {
  openModal: PropTypes.func.isRequired,
};

export default SettingsView;