import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, setAuthToken } from '../services/api';
import Swal from 'sweetalert2';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const isShowingAlert = useRef(false);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setAuthToken(null);
    setUser(null);
    setToken(null);
    navigate('/login');
  }, [navigate]);

  useEffect(() => {
    if (token) {
      setAuthToken(token);
      // You could add a 'verify' endpoint to check token validity on load
      // For now, we'll just parse the user from localStorage
      try {
        const storedUser = JSON.parse(localStorage.getItem('user'));
        setUser(storedUser);
      } catch (e) {
        console.error("Could not parse user from localStorage", e);
        logout(); // Clear bad data
      }
    }
    setLoading(false);
  }, [token, logout]);

  // Set up axios interceptor to handle unauthorized errors
  useEffect(() => {
    // Response interceptor to handle unauthorized errors
    const responseInterceptor = api.interceptors.response.use(
      (response) => response, // On success, just return the response
      async (error) => {
        // Check for 401 status code or "Unauthorized. Invalid token." message
        if (
          error.response &&
          (error.response.status === 401 ||
           (error.response.data &&
            (error.response.data.message === 'Unauthorized. Invalid token.' ||
             error.response.data.message?.includes('Invalid token') ||
             error.response.data.message?.includes('Unauthorized'))))
        ) {
          // Prevent multiple alerts from showing simultaneously
          if (!isShowingAlert.current) {
            isShowingAlert.current = true;
            // Token is invalid, show alert and redirect to login
            console.warn('Invalid token detected, redirecting to login...');
            await Swal.fire({
              icon: 'warning',
              title: 'Session Expired',
              text: 'Please login again',
              confirmButtonColor: '#286070',
              allowOutsideClick: false,
              allowEscapeKey: false
            });
            logout();
            // Reset flag after a delay to allow for future alerts
            setTimeout(() => {
              isShowingAlert.current = false;
            }, 1000);
          } else {
            // If alert is already showing, just logout without showing another alert
            logout();
          }
        }
        return Promise.reject(error);
      }
    );

    // Cleanup interceptor on unmount
    return () => {
      api.interceptors.response.eject(responseInterceptor);
    };
  }, [logout]);

  const login = (userData, userToken) => {
    localStorage.setItem('token', userToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setAuthToken(userToken);
    setUser(userData);
    setToken(userToken);
    navigate('/dashboard');
  };

  const value = {
    user,
    token,
    login,
    logout,
    isAuthenticated: !!token,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};