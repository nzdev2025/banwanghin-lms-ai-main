import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Sidebar from '../Sidebar';
import { SiteConfigContext } from '../../../context/SiteConfigContext';
import { AppContext } from '../../../context/AppContext';

const mockConfig = {
  primaryColor: 'from-emerald-400 via-teal-500 to-sky-500',
  logoText: 'AI',
  siteTitle: 'KruKit AI',
  schoolName: 'โรงเรียนบ้านวังหิน',
  developerName: 'Wasin Suksuwan',
  featureFlags: {},
};

const renderWithConfig = (ui, initialRoute = '/') =>
  render(
    <AppContext.Provider value={{ userRole: 'admin' }}>
      <SiteConfigContext.Provider value={{ siteConfig: mockConfig }}>
        <MemoryRouter initialEntries={[initialRoute]}>{ui}</MemoryRouter>
      </SiteConfigContext.Provider>
    </AppContext.Provider>
  );

describe('Sidebar', () => {
  it('renders premium nav items and support links', () => {
    renderWithConfig(<Sidebar />);

    const navLinks = screen.getAllByTestId('sidebar-link');
    expect(navLinks.length).toBeGreaterThan(0);
    expect(screen.getAllByText(/แดชบอร์ด|รายวิชา/).length).toBeGreaterThan(0);

    const supportLinks = screen.getAllByTestId('sidebar-support');
    expect(supportLinks.length).toBeGreaterThan(0);
  });

  it('highlights active route styling on root path', () => {
    renderWithConfig(<Sidebar />);

    const active = screen.getAllByTestId('sidebar-link')[0];
    expect(active.className).toContain('shadow-lg');
  });
});
