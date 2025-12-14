import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import SubjectSelectionList from '../SubjectSelectionList';

// Mock Icon because it might use Lucide and cause issues or just to be safe
vi.mock('../../../icons/Icon', () => ({
    default: ({ name }) => <span data-testid="subject-icon">{name}</span>
}));

// Mock ClassCard to isolate test to the List component, 
// OR we can rely on real ClassCard if we want integration test.
// The original test relied on ClassCard having 'subject-card' test id.
// If ClassCard is simple, we can leave it. But to be safe, I'll mock it 
// OR check ClassCard content.
// "expect(screen.getByTestId('subject-card')).toBeInTheDocument();"
// Let's assume ClassCard has it.

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

describe('SubjectSelectionList', () => {
  it('renders subject cards', () => {
    render(<SubjectSelectionList subjects={subjects} onSubjectClick={() => {}} />);
    expect(screen.getByText(/เลือกรายวิชา/)).toBeInTheDocument();
    // Use text matcher if ClassCard doesn't have testid or if we want to be more real
    expect(screen.getByText('วิทยาการคำนวณ')).toBeInTheDocument();
    expect(screen.getByText('ครูสอน')).toBeInTheDocument();
  });

  it('calls onSubjectClick when a card is clicked', async () => {
    const onSubjectClick = vi.fn();
    const user = userEvent.setup();
    render(<SubjectSelectionList subjects={subjects} onSubjectClick={onSubjectClick} />);

    // Click the text
    await user.click(screen.getByText('วิทยาการคำนวณ'));
    expect(onSubjectClick).toHaveBeenCalledWith(subjects[0]);
  });
});
