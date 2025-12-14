import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import SubjectList from '../SubjectList';

// Mock Icon
vi.mock('../../../../icons/Icon', () => ({
    default: ({ name }) => <span data-testid={`icon-${name}`}>{name}</span>
}));

const mockSubjects = [
    { id: 'sub1', name: 'Math', teacherName: 'T1', colorTheme: 'teal' },
    { id: 'sub2', name: 'Science', teacherName: 'T2', colorTheme: 'orange' },
];

describe('SubjectList', () => {
    const mockSetEditingSubject = vi.fn();
    const mockHandleDelete = vi.fn();

    it('renders list of subjects', () => {
        render(
            <SubjectList
                subjects={mockSubjects}
                filteredSubjects={mockSubjects}
                setEditingSubject={mockSetEditingSubject}
                handleDelete={mockHandleDelete}
            />
        );

        expect(screen.getByText('Math')).toBeInTheDocument();
        expect(screen.getByText('Science')).toBeInTheDocument();
    });

    it('renders empty state', () => {
        render(
            <SubjectList
                subjects={mockSubjects}
                filteredSubjects={[]}
                setEditingSubject={mockSetEditingSubject}
                handleDelete={mockHandleDelete}
            />
        );

        expect(screen.getByText('ไม่พบรายวิชาที่ค้นหา')).toBeInTheDocument();
    });

    it('calls edit handler', () => {
        render(
            <SubjectList
                subjects={mockSubjects}
                filteredSubjects={mockSubjects}
                setEditingSubject={mockSetEditingSubject}
                handleDelete={mockHandleDelete}
            />
        );

        // Find edit button for first item
        const editButtons = screen.getAllByTitle('แก้ไข');
        fireEvent.click(editButtons[0]);
        expect(mockSetEditingSubject).toHaveBeenCalledWith(mockSubjects[0]);
    });

    it('calls delete handler', () => {
        render(
            <SubjectList
                subjects={mockSubjects}
                filteredSubjects={mockSubjects}
                setEditingSubject={mockSetEditingSubject}
                handleDelete={mockHandleDelete}
            />
        );

        const deleteButtons = screen.getAllByTitle('ลบ');
        fireEvent.click(deleteButtons[0]);
        expect(mockHandleDelete).toHaveBeenCalledWith(mockSubjects[0].id);
    });
});
