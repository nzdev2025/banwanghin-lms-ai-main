import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import QuickActionsWidget from '../QuickActionsWidget';
import { AppContext } from '../../../context/AppContext';

// Mock Icon component since it's used in the widget
vi.mock('../../../icons/Icon', () => ({
    default: ({ name, className }) => <div data-testid={`icon-${name}`} className={className}>Icon-{name}</div>
}));

describe('QuickActionsWidget', () => {
    const mockOpenModal = vi.fn();

    const renderWidget = () => {
        return render(
            <AppContext.Provider value={{ openModal: mockOpenModal }}>
                <QuickActionsWidget />
            </AppContext.Provider>
        );
    };

    afterEach(() => {
        cleanup();
        vi.clearAllMocks();
    });



    it('renders all action buttons', () => {
        renderWidget();
        expect(screen.getByText('เช็คชื่อ')).toBeInTheDocument();
        expect(screen.getByText('เครื่องมือคุมชั้นเรียน')).toBeInTheDocument();
        expect(screen.getByText('ออมทรัพย์')).toBeInTheDocument();
        expect(screen.getByText('สร้างใบงาน AI')).toBeInTheDocument();
    });

    it('calls openModal with "manageAttendance" when "เช็คชื่อ" is clicked', () => {
        renderWidget();
        const button = screen.getByText('เช็คชื่อ');
        fireEvent.click(button);
        expect(mockOpenModal).toHaveBeenCalledWith('manageAttendance');
    });

    it('calls openModal with "classroomToolkit" when "เครื่องมือคุมชั้นเรียน" is clicked', () => {
        renderWidget();
        const button = screen.getByText('เครื่องมือคุมชั้นเรียน');
        fireEvent.click(button);
        expect(mockOpenModal).toHaveBeenCalledWith('classroomToolkit');
    });

    it('calls openModal with "manageSavings" when "ออมทรัพย์" is clicked', () => {
        renderWidget();
        const button = screen.getByText('ออมทรัพย์');
        fireEvent.click(button);
        expect(mockOpenModal).toHaveBeenCalledWith('manageSavings');
    });

    it('calls openModal with "aiWorksheet" when "สร้างใบงาน AI" is clicked', () => {
        renderWidget();
        const button = screen.getByText('สร้างใบงาน AI');
        fireEvent.click(button);
        expect(mockOpenModal).toHaveBeenCalledWith('aiWorksheet');
    });
});
