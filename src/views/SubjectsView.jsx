import React from 'react';
import SubjectSelectionList from '../components/subjects/SubjectSelectionList';
import Icon from '../icons/Icon';
import PropTypes from 'prop-types';

const SubjectsView = ({ subjects, openModal }) => {
  const handleSubjectClick = (subject) => {
    openModal('selectGrade', subject);
  };

  if (!subjects) {
    return (
      <div className="flex items-center justify-center p-8 h-full">
        <Icon name="Loader2" className="animate-spin text-teal-400" size={48} />
      </div>
    );
  }

  if (subjects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center h-full">
        <Icon name="BookOff" size={48} className="text-gray-500 mb-4" />
        <h2 className="text-xl font-bold text-white">ไม่พบรายวิชา</h2>
        <p className="text-gray-400">ยังไม่มีการสร้างรายวิชาในระบบ</p>
      </div>
    );
  }

  return (
    <SubjectSelectionList subjects={subjects} onSubjectClick={handleSubjectClick} />
  );
};

SubjectsView.propTypes = {
    subjects: PropTypes.array,
    openModal: PropTypes.func.isRequired
};

export default SubjectsView;