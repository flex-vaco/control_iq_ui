import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Login from '../views/Login/Login';
import * as api from '../services/api';

// Mock the AuthContext so Login can call login() without a real context tree
const mockLogin = jest.fn();
jest.mock('../context/AuthContext', () => ({
  useAuth: () => ({ login: mockLogin })
}));

// Mock the API service
jest.mock('../services/api', () => ({
  loginUser: jest.fn()
}));

function renderLogin() {
  return render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );
}

describe('Login component', () => {
  afterEach(() => jest.clearAllMocks());

  test('renders email input, password input, and login button', () => {
    renderLogin();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  test('shows "Logging in..." and disables button while request is in flight', async () => {
    // Hang the request so we can check the loading state
    let resolve;
    api.loginUser.mockReturnValue(new Promise(r => { resolve = r; }));

    renderLogin();
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'admin@acme.com' } });
    fireEvent.change(screen.getByLabelText(/password/i),       { target: { value: 'Admin@123' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /logging in/i })).toBeDisabled();
    });

    // Clean up the hanging promise
    resolve({ data: { success: false } });
  });

  test('calls login() with user and token on successful response', async () => {
    api.loginUser.mockResolvedValue({
      data: {
        success: true,
        token: 'Bearer test-token',
        user: { userId: 1, email: 'admin@acme.com', tenantId: 2, roleId: 2 }
      }
    });

    renderLogin();
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'admin@acme.com' } });
    fireEvent.change(screen.getByLabelText(/password/i),       { target: { value: 'Admin@123' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith(
        { userId: 1, email: 'admin@acme.com', tenantId: 2, roleId: 2 },
        'Bearer test-token'
      );
    });
  });

  test('displays server error message when login fails', async () => {
    api.loginUser.mockRejectedValue({
      response: { data: { message: 'Invalid credentials.' } }
    });

    renderLogin();
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'bad@acme.com' } });
    fireEvent.change(screen.getByLabelText(/password/i),       { target: { value: 'Wrong!' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials.')).toBeInTheDocument();
    });
  });

  test('displays fallback error message when response has no message', async () => {
    api.loginUser.mockRejectedValue(new Error('Network Error'));

    renderLogin();
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'bad@acme.com' } });
    fireEvent.change(screen.getByLabelText(/password/i),       { target: { value: 'Wrong!' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(screen.getByText('Login failed. Please try again.')).toBeInTheDocument();
    });
  });
});
