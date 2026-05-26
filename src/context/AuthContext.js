import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, getCurrentUser, logoutUser } from '../services/api';
import Swal from 'sweetalert2';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const isShowingAlert = useRef(false);

  const logout = useCallback(async () => {
    try { await logoutUser(); } catch { /* ignore network errors on logout */ }
    setUser(null);
    navigate('/login');
  }, [navigate]);

  // On mount, call /auth/me to check whether a valid session cookie exists.
  // This replaces the old localStorage token read and works across page refreshes.
  useEffect(() => {
    getCurrentUser()
      .then(res => setUser(res.data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  // Intercept 401 responses from any API call and redirect to login
  useEffect(() => {
    const responseInterceptor = api.interceptors.response.use(
      response => response,
      async error => {
        if (
          error.response &&
          (error.response.status === 401 ||
           (error.response.data?.message?.includes('Invalid token') ||
            error.response.data?.message?.includes('Unauthorized')))
        ) {
          if (!isShowingAlert.current) {
            isShowingAlert.current = true;
            await Swal.fire({
              icon: 'warning',
              title: 'Session Expired',
              text: 'Please login again',
              confirmButtonColor: '#286070',
              allowOutsideClick: false,
              allowEscapeKey: false
            });
            logout();
            setTimeout(() => { isShowingAlert.current = false; }, 1000);
          } else {
            logout();
          }
        }
        return Promise.reject(error);
      }
    );

    return () => { api.interceptors.response.eject(responseInterceptor); };
  }, [logout]);

  // Called by Login component after a successful POST /auth/login.
  // The server has already set the httpOnly cookie; we just store the user payload.
  const login = (userData) => {
    setUser(userData);
    navigate('/dashboard');
  };

  const value = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
