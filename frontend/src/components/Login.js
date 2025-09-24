import React, { useState } from 'react';
import { Form, Button, Card, Alert, Container } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setError('');
      setLoading(true);
      const result = await login(email, password);
      
      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError('Failed to log in');
    }
    
    setLoading(false);
  };

  const styles = {
    pageWrapper: {
      minHeight: "100vh",
      width: "100vw",
      background: "linear-gradient(135deg, #0099ff0c 0%, #0099ff1c 25%, #0099ff1c 50%, #0099ff2c 75%, #0099ff2c 100%)",
      margin: 0,
      padding: 0,
      boxSizing: "border-box"
    },
    container: {
      minHeight: "100vh",
      padding: "20px",
      margin: 0,
      maxWidth: "100%"
    },
    card: {
      backgroundColor: "#ffffff",
      borderRadius: "15px",
      boxShadow: "0 20px 40px rgba(102, 126, 234, 0.3)",
      border: "none",
      overflow: "hidden"
    },
    cardBody: {
      padding: "3rem 2.5rem"
    },
    title: {
      color: "#2c3e50",
      fontWeight: "700",
      fontSize: "2rem",
      marginBottom: "2rem"
    },
    formGroup: {
      marginBottom: "1.5rem"
    },
    label: {
      color: "#4a5568",
      fontWeight: "600",
      marginBottom: "0.5rem"
    },
    input: {
      borderRadius: "10px",
      border: "2px solid #e2e8f0",
      padding: "12px 15px",
      fontSize: "1rem",
      transition: "all 0.3s ease",
      backgroundColor: "#f8fafc"
    },
    inputFocus: {
      borderColor: "#667eea",
      boxShadow: "0 0 0 3px rgba(102, 126, 234, 0.1)",
      backgroundColor: "#ffffff"
    },
    button: {
      backgroundColor: "#667eea",
      borderColor: "#667eea",
      borderRadius: "10px",
      padding: "12px 20px",
      fontSize: "1.1rem",
      fontWeight: "600",
      transition: "all 0.3s ease",
      background: "linear-gradient(135deg, #0099ff71 0%, #0099ff7f 25%, #0099ff94 50%, #0099ff91 75%, #0099ffc7 100%)",
      border: "none"
    },
    buttonHover: {
      transform: "translateY(-2px)",
      boxShadow: "0 8px 25px rgba(102, 126, 234, 0.4)"
    },
    link: {
      color: "#667eea",
      textDecoration: "none",
      fontWeight: "500",
      transition: "color 0.3s ease"
    },
    linkHover: {
      color: "#764ba2"
    },
    alert: {
      borderRadius: "10px",
      border: "none",
      backgroundColor: "#fed7d7",
      color: "#c53030",
      fontWeight: "500"
    }
  };

  return (
    <div style={styles.pageWrapper}>
      <Container 
        className="d-flex align-items-center justify-content-center" 
        style={styles.container}
      >
        <div className="w-100" style={{ maxWidth: "400px" }}>
        <Card style={styles.card}>
          <Card.Body style={styles.cardBody}>
            <h2 className="text-center" style={styles.title}>Welcome Back</h2>
            {error && (
              <Alert variant="danger" style={styles.alert}>
                {error}
              </Alert>
            )}
            <Form onSubmit={handleSubmit}>
              <Form.Group id="email" style={styles.formGroup}>
                <Form.Label style={styles.label}>Email Address</Form.Label>
                <Form.Control
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={styles.input}
                  onFocus={(e) => {
                    e.target.style.borderColor = styles.inputFocus.borderColor;
                    e.target.style.boxShadow = styles.inputFocus.boxShadow;
                    e.target.style.backgroundColor = styles.inputFocus.backgroundColor;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = styles.input.border.split(' ')[2];
                    e.target.style.boxShadow = 'none';
                    e.target.style.backgroundColor = styles.input.backgroundColor;
                  }}
                  placeholder="Enter your email"
                />
              </Form.Group>
              <Form.Group id="password" style={styles.formGroup}>
                <Form.Label style={styles.label}>Password</Form.Label>
                <Form.Control
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={styles.input}
                  onFocus={(e) => {
                    e.target.style.borderColor = styles.inputFocus.borderColor;
                    e.target.style.boxShadow = styles.inputFocus.boxShadow;
                    e.target.style.backgroundColor = styles.inputFocus.backgroundColor;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = styles.input.border.split(' ')[2];
                    e.target.style.boxShadow = 'none';
                    e.target.style.backgroundColor = styles.input.backgroundColor;
                  }}
                  placeholder="Enter your password"
                />
              </Form.Group>
              <Button 
                disabled={loading} 
                className="w-100" 
                type="submit"
                style={styles.button}
                onMouseEnter={(e) => {
                  e.target.style.transform = styles.buttonHover.transform;
                  e.target.style.boxShadow = styles.buttonHover.boxShadow;
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'none';
                  e.target.style.boxShadow = 'none';
                }}
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </Button>
            </Form>
            <div className="w-100 text-center mt-4">
              <Link 
                to="/register" 
                style={styles.link}
                onMouseEnter={(e) => {
                  e.target.style.color = styles.linkHover.color;
                }}
                onMouseLeave={(e) => {
                  e.target.style.color = styles.link.color;
                }}
              >
                Don't have an account? Sign up here
              </Link>
            </div>
          </Card.Body>
        </Card>
        </div>
      </Container>
    </div>
  );
};

export default Login;