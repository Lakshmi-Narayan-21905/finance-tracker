import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navigation.css';

const Navigation = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/transactions', label: 'Transactions' },
    { path: '/reports', label: 'Reports' },
    { path: '/aiadvice', label: 'AI Advice' }
  ];

  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <nav className="minimal-nav">
      <div className="nav-container">
        {/* Logo */}
        <div className="logo" onClick={() => navigate('/dashboard')}>
          FinanceTrack
        </div>

        {/* Navigation */}
        {currentUser && (
          <div className="tabs">
            {tabs.map(tab => (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                className={`tab ${isActive(tab.path) ? 'active' : ''}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* User Actions */}
        <div className="user-actions">
          {currentUser ? (
            <>
              <span className="user">Hi, {currentUser.username}</span>
              <button onClick={() => logout()} className="logout">
                Logout
              </button>
            </>
          ) : (
            <>
              <button onClick={() => navigate('/login')} className="auth">
                Login
              </button>
              <button onClick={() => navigate('/register')} className="auth primary">
                Sign Up
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;