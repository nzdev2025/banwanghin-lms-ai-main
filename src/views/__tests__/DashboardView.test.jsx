import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DashboardView from '../DashboardView';
import { useApp } from '../../context/AppContext';
import { useSiteConfig } from '../../context/SiteConfigContext';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mocks
vi.mock('../../components/analytics/OverallAnalytics', () => ({
  default: () => <div data-testid="overall-analytics">Overall Analytics</div>
}));
vi.mock('../../icons/Icon', () => ({
  default: ({ name }) => <span data-testid={`icon-${name}`}>{name}</span>
}));

// Mock Hooks
const mockOpenModal = vi.fn();
const mockFetchAllStudents = vi.fn();
const mockSubjects = [{ id: 1, name: 'Math' }];
const mockStudents = [
  { id: 1, firstName: 'John', lastName: 'Doe', studentNumber: '1', grade: 'A' },
  { id: 2, firstName: 'Jane', lastName: 'Smith', studentNumber: '2', grade: 'B' }
];

const defaultContextValue = {
  subjects: mockSubjects,
  openModal: mockOpenModal,
  allStudents: mockStudents,
  isLoadingStudents: false,
  fetchAllStudents: mockFetchAllStudents,
};

const defaultSiteConfig = {
  siteConfig: {
    announcement: {
      enabled: false,
      message: '',
      type: 'info'
    }
  }
};

vi.mock('../../context/AppContext', () => ({
  useApp: vi.fn(() => defaultContextValue)
}));

vi.mock('../../context/SiteConfigContext', () => ({
  useSiteConfig: vi.fn(() => defaultSiteConfig)
}));

describe('DashboardView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useApp.mockReturnValue(defaultContextValue);
    useSiteConfig.mockReturnValue(defaultSiteConfig);
  });

  it('renders correctly', () => {
    render(<DashboardView />);
    expect(screen.getByTestId('overall-analytics')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/ค้นหานักเรียน/i)).toBeInTheDocument();
  });

  it('fetches students on mount', () => {
    render(<DashboardView />);
    expect(mockFetchAllStudents).toHaveBeenCalled();
  });

  it('shows announcement when enabled', () => {
    useSiteConfig.mockReturnValue({
      siteConfig: {
        announcement: {
          enabled: true,
          message: 'Test Announcement',
          type: 'warning'
        }
      }
    });

    render(<DashboardView />);
    expect(screen.getByText('Test Announcement')).toBeInTheDocument();
  });

  it('filters students when typing in search bar', async () => {
    render(<DashboardView />);
    const input = screen.getByPlaceholderText(/ค้นหานักเรียน/i);
    
    // Type 'John'
    fireEvent.change(input, { target: { value: 'John' } });

    // Should see John in results (we might need to wait for debounce if implemented, 
    // but current implementation is immediate in effect)
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
    });
  });

  it('opens modal when clicking a student result', async () => {
    render(<DashboardView />);
    const input = screen.getByPlaceholderText(/ค้นหานักเรียน/i);
    fireEvent.change(input, { target: { value: 'John' } });

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('John Doe'));
    expect(mockOpenModal).toHaveBeenCalledWith('studentProfile', {
      student: mockStudents[0],
      grade: mockStudents[0].grade
    });
  });
});
