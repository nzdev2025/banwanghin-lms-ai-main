import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginView from '../LoginView';
import { useSiteConfig } from '../../context/SiteConfigContext';
import { handleLogin, handleSignUp } from '../../firebase/firebase';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mocks
vi.mock('../../firebase/firebase', () => ({
  handleLogin: vi.fn(),
  handleSignUp: vi.fn(),
}));

vi.mock('../../icons/Icon', () => ({
  default: ({ name }) => <span data-testid={`icon-${name}`}>{name}</span>
}));

const defaultSiteConfig = {
  siteConfig: {
    siteTitle: 'Test School',
    footerText: 'Test Footer',
  }
};

vi.mock('../../context/SiteConfigContext', () => ({
  useSiteConfig: vi.fn(() => defaultSiteConfig)
}));

describe('LoginView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useSiteConfig.mockReturnValue(defaultSiteConfig);
  });

  it('renders correctly', () => {
    render(<LoginView />);
    expect(screen.getByRole('heading', { name: /Test School/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('name@school.ac.th')).toBeInTheDocument();
  });

  it('handles login failure (empty fields)', async () => {
    render(<LoginView />);
    const submitBtn = screen.getByText('เข้าสู่ระบบ');
    const form = submitBtn.closest('form');
    fireEvent.submit(form);

    expect(handleLogin).not.toHaveBeenCalled();
    expect(await screen.findByText('กรุณากรอกอีเมล')).toBeInTheDocument();
  });

  it('calls handleLogin on valid submission', async () => {
    render(<LoginView />);
    
    fireEvent.change(screen.getByPlaceholderText('name@school.ac.th'), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByPlaceholderText('อย่างน้อย 8 ตัวอักษร'), { target: { value: 'password123' } });
    
    fireEvent.click(screen.getByText('เข้าสู่ระบบ'));

    await waitFor(() => {
      expect(handleLogin).toHaveBeenCalledWith('test@test.com', 'password123');
    });
  });

  it('calls handleSignUp', async () => {
    render(<LoginView />);
    
    fireEvent.change(screen.getByPlaceholderText('name@school.ac.th'), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByPlaceholderText('อย่างน้อย 8 ตัวอักษร'), { target: { value: 'password123' } });
    
    fireEvent.click(screen.getByText('สร้างบัญชีผู้ดูแลโรงเรียน'));

    await waitFor(() => {
      expect(handleSignUp).toHaveBeenCalledWith('test@test.com', 'password123');
    });
  });
});
