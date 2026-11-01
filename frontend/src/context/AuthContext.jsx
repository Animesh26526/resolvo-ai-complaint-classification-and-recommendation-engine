import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import api from '../services/api';
import { jwtDecode } from 'jwt-decode';

// Provides global authentication state and login/logout methods.
const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing token
    const token = localStorage.getItem('resolvo_token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        // We might want to fetch full profile from /api/auth/me
        setUser({
          id: decoded.id,
          role: decoded.role,
          name: decoded.name || decoded.role // Fallback if name is not in token
        });
        
        // Also fetch fresh user data
        api.get('/auth/me')
          .then(res => {
            setUser(res.data.user || res.data.data?.user);
          })
          .catch(err => {
            console.error('Failed to fetch user profile', err);
            // If token is invalid, clear it
            if (err.response?.status === 401) {
              logout();
            }
          });
      } catch (err) {
        console.error('Invalid token', err);
        localStorage.removeItem('resolvo_token');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    
    // Support both enveloped { data: { token, user } } and flat { token, user } structures
    const token = res.data.token || res.data.data?.token;
    const userData = res.data.user || res.data.data?.user;
    
    localStorage.setItem('resolvo_token', token);
    setUser(userData);
    return userData;
  };

  const register = async (userData) => {
    const res = await api.post('/auth/register', userData);
    const token = res.data.token || res.data.data?.token;
    const user = res.data.user || res.data.data?.user;
    if (token) localStorage.setItem('resolvo_token', token);
    if (user) setUser(user);
    return user;
  };

  const logout = () => {
    localStorage.removeItem('resolvo_token');
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
