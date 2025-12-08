import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Sidebar from '../Sidebar';
import { AppContext } from '../../../context/AppContext';
import { SiteConfigContext } from '../../../context/SiteConfigContext';
import { vi } from 'vitest';

// Mock Config
const mockSiteConfig = {
  featureFlags: {
    calendar: true,
    tools: true,
  },
  primaryColor: 'from-blue-500',
  logoText: 'L',
  siteTitle: 'School',
  schoolName: 'School Name',
  developerName: 'Dev',
};

const renderSidebar = (role) => {
  return render(
    <BrowserRouter>
      <AppContext.Provider value={{ userRole: role }}>
        <SiteConfigContext.Provider value={{ siteConfig: mockSiteConfig }}>
          <Sidebar />
        </SiteConfigContext.Provider>
      </AppContext.Provider>
    </BrowserRouter>
  );
};

describe('Sidebar RBAC', () => {
  it('shows all items including "Settings" for Admin', () => {
    renderSidebar('admin');
    expect(screen.getByText('แดชบอร์ด')).toBeInTheDocument();
    expect(screen.getByText('รายวิชา')).toBeInTheDocument();
    expect(screen.getByText('ตั้งค่า')).toBeInTheDocument();
  });

  it('hides "Settings" for Teacher', () => {
    renderSidebar('teacher');
    expect(screen.getByText('แดชบอร์ด')).toBeInTheDocument();
    expect(screen.getByText('รายวิชา')).toBeInTheDocument();
    expect(screen.queryByText('ตั้งค่า')).not.toBeInTheDocument();
  });

  it('shows only "Dashboard" for Student', () => {
    renderSidebar('student');
    expect(screen.getByText('แดชบอร์ด')).toBeInTheDocument();
    expect(screen.queryByText('รายวิชา')).not.toBeInTheDocument();
    expect(screen.queryByText('ตั้งค่า')).not.toBeInTheDocument();
  });

  it('shows only "Dashboard" for Parent', () => {
    renderSidebar('parent');
    expect(screen.getByText('แดชบอร์ด')).toBeInTheDocument();
    expect(screen.queryByText('รายวิชา')).not.toBeInTheDocument();
    expect(screen.queryByText('ตั้งค่า')).not.toBeInTheDocument();
  });
});
