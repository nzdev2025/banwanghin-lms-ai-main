import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import SubjectEditForm from '../SubjectEditForm';
import { ToastProvider } from '../../../context/ToastContext';

const renderWithProviders = (ui) => {
  return render(<ToastProvider>{ui}</ToastProvider>);
};

// Mock dependencies
vi.mock('../../icons/Icon', () => ({
  default: ({ name, ...props }) => <span data-testid={`icon-${name}`} {...props}>{name}</span>
}));

vi.mock('../shared/ClassCard', () => ({
  default: ({ subject }) => (
    <div data-testid="mock-class-card">
      Mock Class Card: {subject.name} - {subject.colorTheme}
    </div>
  )
}));

const mockSubject = {
  id: '1',
  name: 'Existing Subject',
  teacherName: 'Existing Teacher',
  gradeRange: 'ป.1-ป.6',
  iconName: 'BookOpen',
  colorTheme: 'teal',
  midtermWeight: 70,
  finalWeight: 30,
};

describe('SubjectEditForm', () => {
  it('renders form with initial values for editing', () => {
    renderWithProviders(<SubjectEditForm subject={mockSubject} onSave={() => { }} onCancel={() => { }} />);

    expect(screen.getByDisplayValue('Existing Subject')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Existing Teacher')).toBeInTheDocument();
    expect(screen.getByDisplayValue('70')).toBeInTheDocument();
    expect(screen.getByDisplayValue('30')).toBeInTheDocument();
    expect(screen.getByText('แก้ไขรายวิชา')).toBeInTheDocument();
  });

  it('renders empty form for new subject', () => {
    renderWithProviders(<SubjectEditForm subject={{}} onSave={() => { }} onCancel={() => { }} />);

    // Default values
    expect(screen.getByPlaceholderText('เช่น คณิตศาสตร์')).toHaveValue('');
    expect(screen.getByPlaceholderText('เช่น ครูใจดี')).toHaveValue('');
    expect(screen.getByDisplayValue('70')).toBeInTheDocument(); // Default midterm
    expect(screen.getByDisplayValue('30')).toBeInTheDocument(); // Default final
    expect(screen.getByText('สร้างวิชาใหม่')).toBeInTheDocument();
  });

  it('updates form fields when user types', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SubjectEditForm subject={{}} onSave={() => { }} onCancel={() => { }} />);

    const nameInput = screen.getByPlaceholderText('เช่น คณิตศาสตร์');
    const teacherInput = screen.getByPlaceholderText('เช่น ครูใจดี');

    await user.type(nameInput, 'New Math');
    await user.type(teacherInput, 'Teacher A');

    expect(nameInput).toHaveValue('New Math');
    expect(teacherInput).toHaveValue('Teacher A');
  });

  it('updates weights and calculates total correctly', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SubjectEditForm subject={{}} onSave={() => { }} onCancel={() => { }} />);

    const midtermInput = screen.getAllByRole('spinbutton')[0]; // First number input is midterm
    const finalInput = screen.getAllByRole('spinbutton')[1];   // Second is final

    await user.clear(midtermInput);
    await user.type(midtermInput, '50');

    await user.clear(finalInput);
    await user.type(finalInput, '50');

    expect(screen.getByText('100%')).toBeInTheDocument(); // Total weight
  });

  it('shows validation error when weights do not sum to 100', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SubjectEditForm subject={{}} onSave={() => { }} onCancel={() => { }} />);

    const midtermInput = screen.getAllByRole('spinbutton')[0];

    await user.clear(midtermInput);
    await user.type(midtermInput, '60');
    // Final is 30 by default, total 90

    expect(screen.getByText('ผลรวมคะแนนต้องเท่ากับ 100%')).toBeInTheDocument();
  });

  it('prevents submission and alerts if weights are invalid', async () => {
    const onSave = vi.fn();
    const user = userEvent.setup();

    const { container } = renderWithProviders(<SubjectEditForm subject={{}} onSave={onSave} onCancel={() => { }} />);

    const midtermInput = screen.getAllByRole('spinbutton')[0];
    await user.clear(midtermInput);
    await user.type(midtermInput, '60'); // Total 90

    // Verify input value
    expect(midtermInput).toHaveValue(60);

    // Submit the form directly to ensure handler is called
    // (Bypassing potential jsdom issues with form="..." attribute on external buttons)
    // We need to target the form element. The component renders a form with id "subject-form"
    // We can find it by id or by its role if it was more accessible, but looking up by ID is reliable here.
    const form = container.querySelector('#subject-form');
    fireEvent.submit(form);

    expect(onSave).not.toHaveBeenCalled();
  });

  it('submits form data when valid', async () => {
    const onSave = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<SubjectEditForm subject={{}} onSave={onSave} onCancel={() => { }} />);

    // Fill required fields
    await user.type(screen.getByPlaceholderText('เช่น คณิตศาสตร์'), 'Science');
    await user.type(screen.getByPlaceholderText('เช่น ครูใจดี'), 'Dr. B');

    // Weights are 70+30=100 by default

    await user.click(screen.getByText('บันทึกข้อมูล'));

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Science',
      teacherName: 'Dr. B',
      midtermWeight: 70,
      finalWeight: 30
    }));
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const onCancel = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<SubjectEditForm subject={{}} onSave={() => { }} onCancel={onCancel} />);

    await user.click(screen.getByText('ยกเลิก'));
    expect(onCancel).toHaveBeenCalled();
  });
});
