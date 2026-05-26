import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from '../context/AuthContext';

jest.mock('sweetalert2', () => ({
  fire: jest.fn().mockResolvedValue({ isConfirmed: true })
}));

// Mock api module — getCurrentUser resolves by default (session exists)
const mockGetCurrentUser = jest.fn();
const mockLogoutUser = jest.fn();
jest.mock('../services/api', () => ({
  api: {
    interceptors: {
      response: { use: jest.fn().mockReturnValue(1), eject: jest.fn() }
    }
  },
  getCurrentUser: (...args) => mockGetCurrentUser(...args),
  logoutUser: (...args) => mockLogoutUser(...args)
}));

function TestConsumer() {
  const { user, isAuthenticated, login, logout } = useAuth();
  return (
    <div>
      <span data-testid="auth-state">{isAuthenticated ? 'authenticated' : 'unauthenticated'}</span>
      <span data-testid="user-email">{user?.email ?? 'none'}</span>
      <button onClick={() => login({ userId: 1, email: 'admin@acme.com' })}>Login</button>
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
  afterEach(() => jest.clearAllMocks());

  test('starts unauthenticated when /me returns 401 (no session cookie)', async () => {
    mockGetCurrentUser.mockRejectedValue({ response: { status: 401 } });
    renderConsumer();

    await waitFor(() => {
      expect(screen.getByTestId('auth-state').textContent).toBe('unauthenticated');
    });
    expect(screen.getByTestId('user-email').textContent).toBe('none');
  });

  test('login() sets authenticated state with user payload', async () => {
    mockGetCurrentUser.mockRejectedValue({ response: { status: 401 } });
    renderConsumer();

    await waitFor(() => expect(screen.getByTestId('auth-state').textContent).toBe('unauthenticated'));

    await act(async () => {
      screen.getByRole('button', { name: 'Login' }).click();
    });

    expect(screen.getByTestId('auth-state').textContent).toBe('authenticated');
    expect(screen.getByTestId('user-email').textContent).toBe('admin@acme.com');
  });

  test('logout() calls logoutUser() and resets to unauthenticated', async () => {
    mockGetCurrentUser.mockRejectedValue({ response: { status: 401 } });
    mockLogoutUser.mockResolvedValue({});
    renderConsumer();

    await waitFor(() => expect(screen.getByTestId('auth-state').textContent).toBe('unauthenticated'));

    await act(async () => { screen.getByRole('button', { name: 'Login' }).click(); });
    expect(screen.getByTestId('auth-state').textContent).toBe('authenticated');

    await act(async () => { screen.getByRole('button', { name: 'Logout' }).click(); });

    expect(mockLogoutUser).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('auth-state').textContent).toBe('unauthenticated');
  });

  test('hydrates user from /me on mount when a session cookie exists', async () => {
    mockGetCurrentUser.mockResolvedValue({
      data: { user: { userId: 5, email: 'hydrated@acme.com', tenantId: 2, roleId: 1 } }
    });
    renderConsumer();

    await waitFor(() => {
      expect(screen.getByTestId('auth-state').textContent).toBe('authenticated');
    });
    expect(screen.getByTestId('user-email').textContent).toBe('hydrated@acme.com');
  });
});
