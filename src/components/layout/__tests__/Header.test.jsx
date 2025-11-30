import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import Header from '../Header';

const mockUser = {
  displayName: 'nzappcreator',
  email: 'nzappcreator@gmail.com',
};

describe('Header', () => {
  it('renders luxe greeting and user info', () => {
    render(<Header user={mockUser} handleLogout={() => {}} />);

    expect(screen.getByText(/Welcome back/i)).toBeInTheDocument();
    expect(screen.getByText(/สวัสดี, nzappcreator/i)).toBeInTheDocument();
    expect(screen.getByText('nzappcreator@gmail.com')).toBeInTheDocument();
    expect(screen.getByLabelText('notifications')).toBeInTheDocument();
    expect(screen.getByLabelText('logout')).toBeInTheDocument();
  });

  it('calls handleLogout when logout button is clicked', async () => {
    const handleLogout = vi.fn();
    const user = userEvent.setup();
    render(<Header user={mockUser} handleLogout={handleLogout} />);

    await user.click(screen.getByLabelText('logout'));
    expect(handleLogout).toHaveBeenCalled();
  });
});
