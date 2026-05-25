import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from '../context/AuthContext';

// Prevent sweetalert2 from trying to render in jsdom
jest.mock('sweetalert2', () => ({
  fire: jest.fn().mockResolvedValue({ isConfirmed: true })
}));

// Prevent axios interceptors from complaining in tests
jest.mock('../services/api', () => ({
  api: {
    defaults: { headers: { common: {} } },
    interceptors: {
      response: { use: jest.fn().mockReturnValue(1), eject: jest.fn() }
    }
  },
  setAuthToken: jest.fn()
}));

function TestConsumer() {
  const { user, isAuthenticated, login, logout } = useAuth();
  return (
    <div>
      <span data-testid="auth-state">{isAuthenticated ? 'authenticated' : 'unauthenticated'}</span>
      <span data-testid="user-email">{user?.email ?? 'none'}</span>
      <button onClick={() => login({ userId: 1, email: 'admin@acme.com' }, 'Bearer tok')}>Login</button>
      <button onClick={() => logout()}>Logout</button>
    </div>
  );
}

function renderConsumer() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('starts unauthenticated when localStorage is empty', () => {
    renderConsumer();
    expect(screen.getByTestId('auth-state').textContent).toBe('unauthenticated');
    expect(screen.getByTestId('user-email').textContent).toBe('none');
  });

  test('login() stores token in localStorage and sets authenticated state', async () => {
    renderConsumer();
    await act(async () => {
      screen.getByRole('button', { name: 'Login' }).click();
    });

    expect(localStorage.getItem('token')).toBe('Bearer tok');
    expect(JSON.parse(localStorage.getItem('user'))).toMatchObject({ email: 'admin@acme.com' });
    expect(screen.getByTestId('auth-state').textContent).toBe('authenticated');
    expect(screen.getByTestId('user-email').textContent).toBe('admin@acme.com');
  });

  test('logout() clears localStorage and resets to unauthenticated', async () => {
    renderConsumer();

    await act(async () => {
      screen.getByRole('button', { name: 'Login' }).click();
    });
    expect(screen.getByTestId('auth-state').textContent).toBe('authenticated');

    await act(async () => {
      screen.getByRole('button', { name: 'Logout' }).click();
    });

    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
    expect(screen.getByTestId('auth-state').textContent).toBe('unauthenticated');
  });

  test('hydrates user from localStorage on mount when token exists', async () => {
    localStorage.setItem('token', 'Bearer existing-tok');
    localStorage.setItem('user', JSON.stringify({ userId: 5, email: 'hydrated@acme.com' }));

    renderConsumer();

    // Wait for the useEffect to run
    await act(async () => {});

    expect(screen.getByTestId('auth-state').textContent).toBe('authenticated');
    expect(screen.getByTestId('user-email').textContent).toBe('hydrated@acme.com');
  });
});
