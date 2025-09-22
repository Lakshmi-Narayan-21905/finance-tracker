import React from 'react';//Navigation.js
import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navigation = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <Navbar bg="dark" variant="dark" expand="lg">
      <Container>
        <Navbar.Brand onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          Finance Tracker
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          {currentUser ? (
            <>
              <Nav className="me-auto">
                <Nav.Link onClick={() => navigate('/dashboard')}>Dashboard</Nav.Link>
                <Nav.Link onClick={() => navigate('/transactions')}>Transactions</Nav.Link>
                <Nav.Link onClick={() => navigate('/aiadvice')}>AI Advice</Nav.Link>
                <Nav.Link onClick={() => navigate('/reports')}>Reports</Nav.Link>
              </Nav>
              <Nav>
                <Navbar.Text className="me-3">
                  Welcome, {currentUser.username}
                </Navbar.Text>
                <Button variant="outline-light" onClick={logout}>
                  Logout
                </Button>
              </Nav>
            </>
          ) : (
            <Nav className="ms-auto">
              <Nav.Link onClick={() => navigate('/login')}>Login</Nav.Link>
              <Nav.Link onClick={() => navigate('/register')}>Register</Nav.Link>
            </Nav>
          )}
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Navigation;