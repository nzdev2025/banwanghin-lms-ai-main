import React from 'react';
import SubjectSelectionView from '../components/modals/SubjectSelectionView';
import Icon from '../icons/Icon';

const SubjectsView = ({ subjects, openModal }) => {
  const handleSubjectClick = (subject) => {
    openModal('selectGrade', subject);
  };

  // It's better to handle loading state from a higher-level component if possible,
  // but for now, we can check the subjects prop.
  if (!subjects) {
    return (
      <div className="flex items-center justify-center p-8">
        <Icon name="Loader2" className="animate-spin text-teal-400" size={48} />
      </div>
    );
  }

  if (subjects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <Icon name="BookOff" size={48} className="text-gray-500 mb-4" />
        <h2 className="text-xl font-bold text-white">ไม่พบรายวิชา</h2>
        <p className="text-gray-400">ยังไม่มีการสร้างรายวิชาในระบบ</p>
      </div>
    );
  }

  return (
    <SubjectSelectionView subjects={subjects} onSubjectClick={handleSubjectClick} />
  );
};

export default SubjectsView;
