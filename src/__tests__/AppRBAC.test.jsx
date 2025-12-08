import React, { Suspense } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import App from '../App';
import { AppContext } from '../context/AppContext';
import { SiteConfigContext } from '../context/SiteConfigContext';
import { vi } from 'vitest';

// Mock Modules
vi.mock('../views/SettingsView', () => ({
  default: () => <div data-testid="settings-view">Settings View</div>
}));
vi.mock('../views/DashboardView', () => ({
  default: () => <div data-testid="dashboard-view">Dashboard View</div>
}));
vi.mock('../views/LoginView', () => ({
  default: () => <div data-testid="login-view">Login View</div>
}));
// Mock other views to avoid loading issues
vi.mock('../views/SubjectsView', () => ({ default: () => <div>Subjects</div> }));
vi.mock('../views/StudentsView', () => ({ default: () => <div>Students</div> }));
vi.mock('../views/ToolsView', () => ({ default: () => <div>Tools</div> }));
vi.mock('../views/ClassroomToolsView', () => ({ default: () => <div>Classroom Tools</div> }));
vi.mock('../views/CalendarView', () => ({ default: () => <div>Calendar</div> }));
vi.mock('../components/layout/Header', () => ({ default: () => <div>Header</div> }));
vi.mock('../components/layout/Sidebar', () => ({ default: () => <div>Sidebar</div> }));

// Mock Config
const mockSiteConfig = {
    featureFlags: {},
    primaryColor: 'from-blue-500',
    logoText: 'L',
    siteTitle: 'School',
    schoolName: 'School Name',
    developerName: 'Dev',
};

const renderApp = (initialEntries, role) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
       <AppContext.Provider value={{ 
           user: { email: 'test@test.com' }, 
           userRole: role, 
           authLoading: false,
           subjects: [],
           modalStack: [],
           openModal: vi.fn(),
           closeModal: vi.fn(),
           handleLogout: vi.fn()
       }}>
        <SiteConfigContext.Provider value={{ siteConfig: mockSiteConfig }}>
           <App />
        </SiteConfigContext.Provider>
      </AppContext.Provider>
    </MemoryRouter>
  );
};

// I cannot easily wrap the *internal* AppContent with MemoryRouter because App exports App which has Providers.
// But App.jsx exports App as default.
// The App component *renders* AppContextProvider.
// So if I render <App />, it uses its own provider.
// I need to export AppContent or mock AppContextProvider.
// Mocking AppContextProvider in '../context/AppContext' is already done in previous tests but here I want to control the value.

vi.mock('../context/AppContext', async () => {
    const actual = await vi.importActual('../context/AppContext');
    return {
        ...actual,
        AppContextProvider: ({ children, value }) => <div>{children}</div>, // Bypass internal provider
        useApp: () => React.useContext(actual.AppContext), // Use the context I provide in renderApp
    };
});

describe('App Route Protection', () => {
  it('allows access to /settings for Admin', async () => {
    renderApp(['/settings'], 'admin');
    await waitFor(() => {
       expect(screen.getByTestId('settings-view')).toBeInTheDocument();
    });
  });

  it('redirects to Dashboard (or does not show Settings) for Teacher accessing /settings', async () => {
     renderApp(['/settings'], 'teacher');
     await waitFor(() => {
        expect(screen.queryByTestId('settings-view')).not.toBeInTheDocument();
        // Since the current implementation just renders standard Routes, if I don't protect it, it WILL show Settings.
        // If I protect it by redirecting, it should show Dashboard.
        // But for "fail first", I expect it TO SHOW settings (fail), but here I assert it DOES NOT show.
        // So this test SHOULD fail if implementation is missing.
     });
  });
});
