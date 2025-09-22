import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Configure axios base URL - point to your backend
  axios.defaults.baseURL = 'http://localhost:5000';

  // Wrap getUser in useCallback to prevent infinite re-renders
  const getUser = useCallback(async () => {
    try {
      const res = await axios.get('/api/auth/me');
      setCurrentUser(res.data.user);
    } catch (error) {
      console.error('Error getting user', error);
      logout();
    } finally {
      setLoading(false);
    }
  }, []);

  // Set auth token header if token exists
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      getUser();
    } else {
      setLoading(false);
    }
  }, [token, getUser]); // Now includes getUser as a dependency

  const login = async (email, password) => {
    try {
      const res = await axios.post('/api/auth/login', { email, password });
      const { token: newToken, user } = res.data;
      
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setCurrentUser(user);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed' 
      };
    }
  };

  const register = async (username, email, password) => {
    try {
      const res = await axios.post('/api/auth/register', { username, email, password });
      const { token: newToken, user } = res.data;
      
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setCurrentUser(user);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Registration failed' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setCurrentUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  const value = {
    currentUser,
    login,
    register,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};