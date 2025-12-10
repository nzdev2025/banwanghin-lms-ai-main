import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Header from '../Header';
import Sidebar from '../Sidebar';
import { AppContext } from '../../../context/AppContext';
import { SiteConfigContext } from '../../../context/SiteConfigContext';

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  House: () => <span data-testid="icon-house" />,
  Book: () => <span data-testid="icon-book" />,
  Users: () => <span data-testid="icon-users" />,
  Calendar: () => <span data-testid="icon-calendar" />,
  FilePlus: () => <span data-testid="icon-fileplus" />,
  Briefcase: () => <span data-testid="icon-briefcase" />,
  Settings: () => <span data-testid="icon-settings" />,
  LifeBuoy: () => <span data-testid="icon-lifebuoy" />,
  MessageCircle: () => <span data-testid="icon-messagecircle" />,
  Menu: () => <span data-testid="icon-menu" />,
  X: () => <span data-testid="icon-x" />,
}));

const mockConfig = {
  primaryColor: 'from-blue-500 to-cyan-500',
  logoText: 'AI',
  siteTitle: 'Test School',
  schoolName: 'Test School Name',
  developerName: 'Test Dev',
};

describe('Mobile Sidebar & Header Interaction', () => {
  it('Header shows menu button on mobile', () => {
    const toggleSidebar = vi.fn();
    render(
      <AppContext.Provider value={{ user: { email: 'test@test.com' }, toggleSidebar, handleLogout: () => {} }}>
        <Header />
      </AppContext.Provider>
    );

    // We expect a button that calls toggleSidebar
    // Since we can't easily test "display: none" with jsdom without computing styles,
    // we'll check for the existence of the button and its click handler.
    // In implementation, we must ensure it has 'lg:hidden'.
    const menuBtn = screen.getByLabelText('toggle sidebar');
    fireEvent.click(menuBtn);
    expect(toggleSidebar).toHaveBeenCalled();
  });

  it('Sidebar is visible when open on mobile', () => {
    const closeSidebar = vi.fn();
    render(
      <AppContext.Provider value={{ userRole: 'teacher', isSidebarOpen: true, closeSidebar }}>
        <SiteConfigContext.Provider value={{ siteConfig: mockConfig }}>
          <MemoryRouter>
            <Sidebar />
          </MemoryRouter>
        </SiteConfigContext.Provider>
      </AppContext.Provider>
    );

    // Sidebar should have a class indicating it's open (e.g., translate-x-0)
    const sidebar = screen.getByRole('complementary'); // <aside> defaults to complementary
    expect(sidebar.className).not.toContain('-translate-x-full');
    
    // Check for overlay
    const overlay = screen.getByTestId('sidebar-overlay');
    expect(overlay).toBeInTheDocument();
    
    fireEvent.click(overlay);
    expect(closeSidebar).toHaveBeenCalled();
  });

  it('Sidebar is hidden when closed on mobile', () => {
    render(
      <AppContext.Provider value={{ userRole: 'teacher', isSidebarOpen: false }}>
         <SiteConfigContext.Provider value={{ siteConfig: mockConfig }}>
          <MemoryRouter>
            <Sidebar />
          </MemoryRouter>
        </SiteConfigContext.Provider>
      </AppContext.Provider>
    );

    const sidebar = screen.getByRole('complementary');
    // It should have classes to hide it off-screen on mobile
    expect(sidebar.className).toContain('-translate-x-full');
  });
});
