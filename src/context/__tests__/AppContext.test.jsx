import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { AppContextProvider, useApp } from '../AppContext';
import { onAuthStateChanged } from '../../firebase/firebase';
import { vi, describe, it, expect } from 'vitest';

// Mock Firebase
vi.mock('../../firebase/firebase', () => ({
  auth: {},
  db: {},
  onAuthStateChanged: vi.fn(),
  handleLogout: vi.fn(),
}));

vi.mock('../../config', () => ({
  config: { appId: 'test-app' }
}));

// Mock Firestore
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  onSnapshot: vi.fn(() => vi.fn()),
  query: vi.fn(),
  orderBy: vi.fn(),
}));

// Test Component to consume context
const TestComponent = () => {
  const { user, userRole } = useApp();
  return (
    <div>
      <div data-testid="user-email">{user ? user.email : 'no-user'}</div>
      <div data-testid="user-role">{userRole || 'no-role'}</div>
    </div>
  );
};

describe('AppContext RBAC', () => {
  it('assigns "admin" role to admin@school.ac.th', async () => {
    onAuthStateChanged.mockImplementation((authInstance, callback) => {
      callback({ email: 'admin@school.ac.th', uid: '123' });
      return vi.fn(); // unsubscribe
    });

    await act(async () => {
      render(
        <AppContextProvider>
          <TestComponent />
        </AppContextProvider>
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId('user-email')).toHaveTextContent('admin@school.ac.th');
      expect(screen.getByTestId('user-role')).toHaveTextContent('admin');
    });
  });

  it('assigns "teacher" role to other emails', async () => {
    onAuthStateChanged.mockImplementation((authInstance, callback) => {
      callback({ email: 'teacher@school.ac.th', uid: '456' });
      return vi.fn(); // unsubscribe
    });

    await act(async () => {
      render(
        <AppContextProvider>
          <TestComponent />
        </AppContextProvider>
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId('user-email')).toHaveTextContent('teacher@school.ac.th');
      expect(screen.getByTestId('user-role')).toHaveTextContent('teacher');
    });
  });
});
