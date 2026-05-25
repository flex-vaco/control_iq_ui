import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import PrivateRoute from '../components/PrivateRoute';

// Control isAuthenticated via mock
let mockIsAuthenticated = false;
jest.mock('../context/AuthContext', () => ({
  useAuth: () => ({ isAuthenticated: mockIsAuthenticated })
}));

function renderWithRoute(authenticated, initialPath = '/dashboard') {
  mockIsAuthenticated = authenticated;
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route element={<PrivateRoute />}>
          <Route path="/dashboard" element={<div>Dashboard content</div>} />
        </Route>
        <Route path="/login" element={<div>Login page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('PrivateRoute', () => {
  test('redirects to /login when user is not authenticated', () => {
    renderWithRoute(false);
    expect(screen.getByText('Login page')).toBeInTheDocument();
    expect(screen.queryByText('Dashboard content')).not.toBeInTheDocument();
  });

  test('renders protected child route when user is authenticated', () => {
    renderWithRoute(true);
    expect(screen.getByText('Dashboard content')).toBeInTheDocument();
    expect(screen.queryByText('Login page')).not.toBeInTheDocument();
  });
});
