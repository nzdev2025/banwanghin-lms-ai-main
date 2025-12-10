import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { AppContextProvider, useApp } from '../AppContext';
import { vi, describe, it, expect } from 'vitest';

// Mock Firebase
vi.mock('../../firebase/firebase', () => ({
  auth: {},
  db: {},
  onAuthStateChanged: vi.fn(() => vi.fn()), // Return a dummy unsubscribe function
  handleLogout: vi.fn(),
}));

vi.mock('../../config', () => ({
  config: { appId: 'test-app' }
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  onSnapshot: vi.fn(() => vi.fn()),
  query: vi.fn(),
  orderBy: vi.fn(),
}));

const SidebarTestComponent = () => {
  const { isSidebarOpen, toggleSidebar, closeSidebar } = useApp();
  return (
    <div>
      <div data-testid="sidebar-state">{isSidebarOpen ? 'open' : 'closed'}</div>
      <button data-testid="toggle-btn" onClick={toggleSidebar}>Toggle</button>
      <button data-testid="close-btn" onClick={closeSidebar}>Close</button>
    </div>
  );
};

describe('AppContext Sidebar Logic', () => {
  it('toggles sidebar state', () => {
    render(
      <AppContextProvider>
        <SidebarTestComponent />
      </AppContextProvider>
    );

    const stateDisplay = screen.getByTestId('sidebar-state');
    const toggleBtn = screen.getByTestId('toggle-btn');

    // Default should be closed (or undefined, but we want it closed by default for mobile)
    expect(stateDisplay).toHaveTextContent('closed');

    act(() => {
      toggleBtn.click();
    });
    expect(stateDisplay).toHaveTextContent('open');

    act(() => {
      toggleBtn.click();
    });
    expect(stateDisplay).toHaveTextContent('closed');
  });

  it('explicitly closes sidebar', () => {
    render(
      <AppContextProvider>
        <SidebarTestComponent />
      </AppContextProvider>
    );

    const stateDisplay = screen.getByTestId('sidebar-state');
    const toggleBtn = screen.getByTestId('toggle-btn');
    const closeBtn = screen.getByTestId('close-btn');

    // Open first
    act(() => {
      toggleBtn.click();
    });
    expect(stateDisplay).toHaveTextContent('open');

    // Close
    act(() => {
      closeBtn.click();
    });
    expect(stateDisplay).toHaveTextContent('closed');
  });
});
