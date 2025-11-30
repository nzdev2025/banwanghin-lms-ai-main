import React from 'react';
import { UserCog, BellRing, BookUp, Eraser } from 'lucide-react';

const SettingsCard = ({ icon, title, description, onClick }) => (
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


const SettingsView = ({ openModal }) => {
  const settingsItems = [
    {
      icon: <UserCog size={24} className="text-sky-400" />,
      title: 'ทะเบียนนักเรียน',
      description: 'จัดการข้อมูลนักเรียนทั้งหมดในระบบ',
      action: () => openModal('manageRoster'),
    },
    {
      icon: <BellRing size={24} className="text-lime-400" />,
      title: 'ตั้งค่าแจ้งเตือน',
      description: 'ตั้งค่าการส่งข้อความแจ้งเตือนผ่าน LINE Notify',
      action: () => openModal('lineNotifySettings'),
    },
    {
      icon: <BookUp size={24} className="text-amber-400" />,
      title: 'ตั้งค่าวิชา',
      description: 'จัดการรายวิชาทั้งหมดที่เปิดสอน',
      action: () => openModal('manageSubjects'),
    },
    {
      icon: <Eraser size={24} className="text-rose-400" />,
      title: 'ล้างงานและคะแนน',
      description: 'ล้างหัวข้องานและคะแนนทั้งชั้น/วิชาเมื่อขึ้นเทอมใหม่',
      action: () => openModal('resetAssignments'),
    },
    {
      icon: <UserCog size={24} className="text-purple-400" />,
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
          <SettingsCard
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

export default SettingsView;
