import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import StudentList from '../StudentList';

// Mock Icon
vi.mock('../../../../icons/Icon', () => ({
    default: ({ name }) => <span data-testid={`icon-${name}`}>{name}</span>
}));

const mockStudents = [
    { id: 's1', studentNumber: '101', firstName: 'John', lastName: 'Doe' },
    { id: 's2', studentNumber: '102', firstName: 'Jane', lastName: 'Smith' },
];

describe('StudentList', () => {
    const mockOnEdit = vi.fn();
    const mockOnDelete = vi.fn();

    it('renders list of students', () => {
        render(
            <StudentList
                students={mockStudents}
                isLoading={false}
                onEdit={mockOnEdit}
                onDelete={mockOnDelete}
            />
        );

        expect(screen.getByText('John')).toBeInTheDocument();
        expect(screen.getByText('Jane')).toBeInTheDocument();
    });

    it('shows loading state', () => {
        render(
            <StudentList
                students={[]}
                isLoading={true}
                onEdit={mockOnEdit}
                onDelete={mockOnDelete}
            />
        );

        expect(screen.getByTestId('icon-Loader2')).toBeInTheDocument();
    });

    it('shows empty state', () => {
        render(
            <StudentList
                students={[]}
                isLoading={false}
                onEdit={mockOnEdit}
                onDelete={mockOnDelete}
            />
        );

        expect(screen.getByText('ไม่พบรายชื่อนักเรียน')).toBeInTheDocument();
    });

    it('calls edit handler', () => {
        render(
            <StudentList
                students={mockStudents}
                isLoading={false}
                onEdit={mockOnEdit}
                onDelete={mockOnDelete}
            />
        );

        const editButtons = screen.getAllByTitle('แก้ไข');
        fireEvent.click(editButtons[0]);
        expect(mockOnEdit).toHaveBeenCalledWith(mockStudents[0]);
    });

    it('calls delete handler', () => {
        render(
            <StudentList
                students={mockStudents}
                isLoading={false}
                onEdit={mockOnEdit}
                onDelete={mockOnDelete}
            />
        );

        const deleteButtons = screen.getAllByTitle('ลบ');
        fireEvent.click(deleteButtons[0]);
        expect(mockOnDelete).toHaveBeenCalledWith(mockStudents[0]);
    });
});
