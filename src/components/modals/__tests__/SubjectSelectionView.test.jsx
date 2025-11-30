import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import SubjectSelectionView from '../SubjectSelectionView';

const subjects = [
  {
    id: 'math',
    code: 'SUBJECT',
    name: 'วิทยาการคำนวณ',
    gradeRange: 'ป.1-ป.6',
    category: 'หมวดวิชาทั่วไป',
    teacherName: 'ครูสอน',
    colorTheme: 'amber',
    iconName: 'BookOpen',
  },
];

describe('SubjectSelectionView', () => {
  it('renders subject cards with luxe styling cues', () => {
    render(<SubjectSelectionView subjects={subjects} onSubjectClick={() => {}} />);
    expect(screen.getByText(/เลือกรายวิชา/)).toBeInTheDocument();
    expect(screen.getByTestId('subject-card')).toBeInTheDocument();
    expect(screen.getByTestId('subject-icon')).toBeInTheDocument();
    expect(screen.getByText(/วิทยาการคำนวณ/)).toBeInTheDocument();
    expect(screen.getByText(/ครูสอน/)).toBeInTheDocument();
  });

  it('calls onSubjectClick when a card is clicked', async () => {
    const onSubjectClick = vi.fn();
    const user = userEvent.setup();
    render(<SubjectSelectionView subjects={subjects} onSubjectClick={onSubjectClick} />);

    await user.click(screen.getByTestId('subject-card'));
    expect(onSubjectClick).toHaveBeenCalledWith(subjects[0]);
  });
});
