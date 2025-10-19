import React from 'react';
import { CheckCircle, PiggyBank, HeartPulse, ClipboardList } from 'lucide-react';

const StudentFeatureCard = ({ icon, title, description, onClick }) => (
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

const StudentsView = ({ openModal }) => {
  const studentFeatures = [
    {
      icon: <CheckCircle size={24} className="text-green-400" />,
      title: 'เช็คชื่อนักเรียน',
      description: 'บันทึกการเข้าเรียนของนักเรียน',
      action: () => openModal('manageAttendance'),
    },
    {
      icon: <PiggyBank size={24} className="text-pink-400" />,
      title: 'ระบบออมทรัพย์',
      description: 'จัดการการออมเงินของนักเรียน',
      action: () => openModal('manageSavings'),
    },
    {
      icon: <HeartPulse size={24} className="text-red-400" />,
      title: 'ข้อมูลสุขภาพ',
      description: 'บันทึกข้อมูลสุขภาพและน้ำหนักส่วนสูง',
      action: () => openModal('healthRecord'),
    },
    {
      icon: <ClipboardList size={24} className="text-yellow-400" />,
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
          <StudentFeatureCard
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

export default StudentsView;
