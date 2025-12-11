import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AttendanceJoinView from '../AttendanceJoinView';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

// Mock Firebase
vi.mock('../../firebase/firebase', () => ({
    db: {},
    appId: 'test-app',
}));

const mockGetDoc = vi.fn();
const mockSetDoc = vi.fn();
const mockOnSnapshot = vi.fn();

vi.mock('firebase/firestore', () => ({
    collection: vi.fn((...args) => ({ type: 'collection', args })),
    doc: vi.fn((...args) => ({ type: 'doc', args })),
    getDoc: (...args) => mockGetDoc(...args),
    setDoc: (...args) => mockSetDoc(...args),
    onSnapshot: (...args) => mockOnSnapshot(...args),
    query: vi.fn((...args) => ({ type: 'query', args })),
    orderBy: vi.fn(),
    serverTimestamp: vi.fn(() => 'timestamp'),
}));

// Mock Icon component
vi.mock('../../icons/Icon', () => ({
    default: ({ name, className }) => <div data-testid={`icon-${name}`} className={className}>Icon-{name}</div>
}));

const renderWithRouter = (grade = 'p1', date = '2025-12-11', token = 'abc123') => {
    return render(
        <MemoryRouter initialEntries={[`/attendance/join/${grade}/${date}/${token}`]}>
            <Routes>
                <Route path="/attendance/join/:grade/:date/:token" element={<AttendanceJoinView />} />
            </Routes>
        </MemoryRouter>
    );
};

describe('AttendanceJoinView - Duplicate Check Prevention', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        // Default: valid session
        mockGetDoc.mockImplementation((ref) => {
            if (ref.args && ref.args[1]?.includes('attendance_sessions')) {
                return Promise.resolve({
                    exists: () => true,
                    data: () => ({ token: 'abc123' }),
                });
            }
            // Check for attendance doc - no existing data by default
            if (ref.args && ref.args[1]?.includes('attendance')) {
                return Promise.resolve({
                    exists: () => false,
                    data: () => ({}),
                });
            }
            return Promise.resolve({ exists: () => false });
        });

        // Mock student list
        mockOnSnapshot.mockImplementation((ref, callback) => {
            callback({
                docs: [
                    { id: 'stu1', data: () => ({ firstName: 'สมชาย', lastName: 'ใจดี', studentNumber: 1 }) },
                    { id: 'stu2', data: () => ({ firstName: 'สมหญิง', lastName: 'ใจงาม', studentNumber: 2 }) },
                ],
            });
            return vi.fn(); // unsubscribe
        });

        mockSetDoc.mockResolvedValue(undefined);
    });

    it('allows check-in for student who has not checked in yet', async () => {
        renderWithRouter();

        await waitFor(() => {
            expect(screen.getByText(/เลขที่ 1/)).toBeInTheDocument();
        });

        // Select student
        const radioButton = screen.getAllByRole('radio')[0];
        fireEvent.click(radioButton);

        // Submit
        const submitButton = screen.getByRole('button', { name: /เช็คชื่อ/ });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(mockSetDoc).toHaveBeenCalled();
            expect(screen.getByText(/เช็คชื่อสำเร็จ/)).toBeInTheDocument();
        });
    });

    it('shows warning message when student has already checked in', async () => {
        // Override mockGetDoc to simulate existing check-in
        mockGetDoc.mockImplementation((ref) => {
            if (ref.args && ref.args[1]?.includes('attendance_sessions')) {
                return Promise.resolve({
                    exists: () => true,
                    data: () => ({ token: 'abc123' }),
                });
            }
            // Existing attendance data - student stu1 already checked in
            if (ref.args && ref.args[1]?.includes('attendance')) {
                return Promise.resolve({
                    exists: () => true,
                    data: () => ({ stu1: 'มาเรียน' }),
                });
            }
            return Promise.resolve({ exists: () => false });
        });

        renderWithRouter();

        await waitFor(() => {
            expect(screen.getByText(/เลขที่ 1/)).toBeInTheDocument();
        });

        // Select student who already checked in
        const radioButton = screen.getAllByRole('radio')[0];
        fireEvent.click(radioButton);

        // Submit
        const submitButton = screen.getByRole('button', { name: /เช็คชื่อ/ });
        fireEvent.click(submitButton);

        await waitFor(() => {
            // Should NOT call setDoc for duplicate
            expect(mockSetDoc).not.toHaveBeenCalled();
            // Should show duplicate warning message
            expect(screen.getByText(/เช็คชื่อไปแล้ว|เคยเช็คชื่อแล้ว/)).toBeInTheDocument();
        });
    });

    it('allows check-in for different student even if another student already checked in', async () => {
        // Student stu1 already checked in, but stu2 has not
        mockGetDoc.mockImplementation((ref) => {
            if (ref.args && ref.args[1]?.includes('attendance_sessions')) {
                return Promise.resolve({
                    exists: () => true,
                    data: () => ({ token: 'abc123' }),
                });
            }
            if (ref.args && ref.args[1]?.includes('attendance')) {
                return Promise.resolve({
                    exists: () => true,
                    data: () => ({ stu1: 'มาเรียน' }), // Only stu1 checked in
                });
            }
            return Promise.resolve({ exists: () => false });
        });

        renderWithRouter();

        await waitFor(() => {
            expect(screen.getByText(/เลขที่ 2/)).toBeInTheDocument();
        });

        // Select student stu2 (who hasn't checked in)
        const radioButton = screen.getAllByRole('radio')[1];
        fireEvent.click(radioButton);

        // Submit
        const submitButton = screen.getByRole('button', { name: /เช็คชื่อ/ });
        fireEvent.click(submitButton);

        await waitFor(() => {
            // Should call setDoc because stu2 hasn't checked in
            expect(mockSetDoc).toHaveBeenCalled();
            expect(screen.getByText(/เช็คชื่อสำเร็จ/)).toBeInTheDocument();
        });
    });
});
