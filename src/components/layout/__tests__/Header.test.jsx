import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import Header from '../Header';
import { AppContext } from '../../../context/AppContext';

// Mock Icon to avoid issues
vi.mock('../../icons/Icon', () => ({
  default: ({ name }) => <span data-testid={`icon-${name}`} />,
}));

const mockUser = {
  displayName: 'nzappcreator',
  email: 'nzappcreator@gmail.com',
};

const renderWithContext = (ui, contextValue = {}) => {
  return render(
    <AppContext.Provider value={contextValue}>
      {ui}
    </AppContext.Provider>
  );
};

describe('Header', () => {
  it('renders luxe greeting and user info', () => {
    const contextValue = {
      user: mockUser,
      handleLogout: vi.fn(),
      toggleSidebar: vi.fn(),
    };
    
    renderWithContext(<Header />, contextValue);

    expect(screen.getByText(/Welcome back/i)).toBeInTheDocument();
    expect(screen.getByText(/สวัสดี, nzappcreator/i)).toBeInTheDocument();
    expect(screen.getByText('nzappcreator@gmail.com')).toBeInTheDocument();
    // Use role for button with aria-label if possible, or label text
    // The previous test used getByLabelText which works if aria-label is present.
    // notification button has aria-label="notifications"
    // logout button has aria-label="logout"
  });

  it('calls handleLogout when logout button is clicked', async () => {
    const handleLogout = vi.fn();
    const contextValue = {
      user: mockUser,
      handleLogout,
      toggleSidebar: vi.fn(),
    };
    const user = userEvent.setup();
    renderWithContext(<Header />, contextValue);

    // Find the logout button. The icon is now mocked so we look for the button containing the mock icon or by aria-label
    // The previous code had aria-label="logout" on the button.
    const logoutBtn = screen.getByRole('button', { name: /logout/i }) || screen.getByLabelText('logout');
    await user.click(logoutBtn);
    expect(handleLogout).toHaveBeenCalled();
  });
});