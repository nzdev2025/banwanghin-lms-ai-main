import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { AppContextProvider, useApp } from '../AppContext';

// Mock Firebase
vi.mock('../../firebase/firebase', () => ({
  auth: {},
  db: {},
  onAuthStateChanged: vi.fn(() => vi.fn()),
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

const TestNavComponent = () => {
    const { modalStack, openModal, closeAllModals } = useApp();
    const location = useLocation();
    const navigate = useNavigate();

    // Mimic the logic we want to add to App.jsx
    React.useEffect(() => {
        closeAllModals();
    }, [location.pathname, closeAllModals]); // Dependency on pathname

    return (
        <div>
            <div data-testid="modal-count">{modalStack.length}</div>
            <button data-testid="open-btn" onClick={() => openModal('test')}>Open</button>
            <button data-testid="nav-btn" onClick={() => navigate('/new-path')}>Navigate</button>
        </div>
    );
};

describe('Navigation Modal Closing', () => {
    it('closes all modals when location changes', async () => {
        render(
            <AppContextProvider>
                <MemoryRouter>
                    <TestNavComponent />
                </MemoryRouter>
            </AppContextProvider>
        );

        const openBtn = screen.getByTestId('open-btn');
        const navBtn = screen.getByTestId('nav-btn');
        const countDisplay = screen.getByTestId('modal-count');

        // Open a modal
        act(() => {
            openBtn.click();
        });
        expect(countDisplay).toHaveTextContent('1');

        // Navigate
        act(() => {
            navBtn.click();
        });

        // Expect count to be 0
        expect(countDisplay).toHaveTextContent('0');
    });
});