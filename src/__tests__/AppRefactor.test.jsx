import React, { Suspense } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';
import { AppContext } from '../context/AppContext';
import { SiteConfigContext } from '../context/SiteConfigContext';
import { ToastContext } from '../context/ToastContext';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// --- Mocks ---

// Mock Views to avoid lazy loading issues and deep rendering
vi.mock('../views/LoginView', () => ({ default: () => <div data-testid="login-view">Login View</div> }));
vi.mock('../views/DashboardView', () => ({ default: () => <div data-testid="dashboard-view">Dashboard View</div> }));
vi.mock('../views/AttendanceJoinView', () => ({ default: () => <div data-testid="attendance-join-view">Attendance Join View</div> }));
vi.mock('../views/LightningQuizJoinView', () => ({ default: () => <div data-testid="quiz-join-view">Quiz Join View</div> }));

// Mock Layout Components
vi.mock('../components/layout/Header', () => ({ default: () => <div data-testid="header">Header</div> }));
vi.mock('../components/layout/Sidebar', () => ({ default: () => <div data-testid="sidebar">Sidebar</div> }));

// Mock Modals (Just a few to verify ModalManager works)
vi.mock('../components/modals/AttendanceModal', () => ({ default: ({ onClose }) => <div data-testid="modal-attendance"><button onClick={onClose}>Close</button></div> }));
vi.mock('../components/modals/SettingsModal', () => ({ default: () => <div data-testid="modal-settings">Settings Modal</div> }));

// Mock Contexts - We need to manually mock because we are wrapping App with providers in the real code, 
// but for testing specific states we might want to inject values. 
// However, App.jsx *renders* the Providers. 
// To test App.jsx logic, we need to mock the *modules* of the context hooks 
// so that the internal components of App get the values we want.

const mockOpenModal = vi.fn();
const mockCloseModal = vi.fn();
const mockCloseAllModals = vi.fn();

const defaultContextValue = {
  user: { uid: '123', email: 'test@test.com' },
  userRole: 'teacher',
  authLoading: false,
  subjects: [],
  modalStack: [],
  openModal: mockOpenModal,
  closeModal: mockCloseModal,
  closeAllModals: mockCloseAllModals,
  allStudents: [],
  isLoadingStudents: false,
  fetchAllStudents: vi.fn(),
};

const defaultSiteConfig = {
  siteConfig: {
    version: '1.0',
    developerName: 'Tester',
    footerText: 'Footer',
  }
};

// We mock the HOOKS, because App.jsx uses them in AppContent
vi.mock('../context/AppContext', async () => {
  const actual = await vi.importActual('../context/AppContext');
  return {
    ...actual,
    AppContextProvider: ({ children }) => <div>{children}</div>, // Pass through
    useApp: vi.fn(() => defaultContextValue),
  };
});

vi.mock('../context/SiteConfigContext', async () => {
  const actual = await vi.importActual('../context/SiteConfigContext');
  return {
    ...actual,
    SiteConfigProvider: ({ children }) => <div>{children}</div>,
    useSiteConfig: vi.fn(() => defaultSiteConfig),
  };
});

vi.mock('../context/ToastContext', async () => {
  return {
    ToastProvider: ({ children }) => <div>{children}</div>,
    useToast: vi.fn(() => ({ showToast: vi.fn(), toasts: [], removeToast: vi.fn() })),
  };
});

import { useApp } from '../context/AppContext';

describe('App Integration Refactor Test', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useApp.mockReturnValue(defaultContextValue);
  });

  it('renders Dashboard and Layout when authenticated', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );

    // Should see Header, Sidebar, and Dashboard
    await waitFor(() => {
      expect(screen.getByTestId('header')).toBeInTheDocument();
      expect(screen.getByTestId('sidebar')).toBeInTheDocument();
      expect(screen.getByTestId('dashboard-view')).toBeInTheDocument();
    });
  });

  it('renders LoginView when not authenticated', async () => {
    useApp.mockReturnValue({
      ...defaultContextValue,
      user: null, // No user
    });

    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('login-view')).toBeInTheDocument();
      expect(screen.queryByTestId('sidebar')).not.toBeInTheDocument();
    });
  });

  it('renders Loading spinner when authLoading is true', async () => {
    useApp.mockReturnValue({
      ...defaultContextValue,
      authLoading: true,
    });

    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );

    // Look for the Loader icon or wrapper. 
    // In App.jsx: <Icon name="Loader2" ... />
    // We didn't mock Icon, so it renders. We can search for class "animate-spin".
    await waitFor(() => {
      const loader = document.querySelector('.animate-spin');
      expect(loader).toBeInTheDocument();
    });
  });

  it('renders Public Route (Attendance Join) without auth', async () => {
    useApp.mockReturnValue({
      ...defaultContextValue,
      user: null,
    });

    render(
      <MemoryRouter initialEntries={['/attendance/join/g1/2023-01-01/token']}>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('attendance-join-view')).toBeInTheDocument();
      expect(screen.queryByTestId('login-view')).not.toBeInTheDocument();
    });
  });

  it('renders Modal when modalStack has item', async () => {
    useApp.mockReturnValue({
      ...defaultContextValue,
      modalStack: [{ type: 'manageAttendance' }],
    });

    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('modal-attendance')).toBeInTheDocument();
    });
  });
});
