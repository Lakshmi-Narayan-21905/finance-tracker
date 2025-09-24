import React, { useState } from 'react';
import { Form, Button, Card, Alert, Container } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ✅ Client-side validation
    if (password.length < 6) {
      return setError('Password must be at least 6 characters long');
    }

    if (password !== passwordConfirm) {
      return setError('Passwords do not match');
    }
    
    try {
      setError('');
      setLoading(true);
      const result = await register(username, email, password);
      
      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError('Failed to create an account');
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
    inputInvalid: {
      borderColor: "#e53e3e",
      boxShadow: "0 0 0 3px rgba(229, 62, 62, 0.1)"
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
    },
    feedback: {
      color: "#e53e3e",
      fontSize: "0.875rem",
      marginTop: "0.25rem"
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
              <h2 className="text-center" style={styles.title}>Create Account</h2>
              {error && (
                <Alert variant="danger" style={styles.alert}>
                  {error}
                </Alert>
              )}
              <Form onSubmit={handleSubmit}>
                <Form.Group id="username" style={styles.formGroup}>
                  <Form.Label style={styles.label}>Username</Form.Label>
                  <Form.Control 
                    type="text" 
                    required 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
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
                    placeholder="Choose a username"
                  />
                </Form.Group>
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
                    isInvalid={password.length > 0 && password.length < 6}
                    style={{
                      ...styles.input,
                      ...(password.length > 0 && password.length < 6 ? styles.inputInvalid : {})
                    }}
                    onFocus={(e) => {
                      if (password.length > 0 && password.length < 6) {
                        e.target.style.borderColor = styles.inputInvalid.borderColor;
                        e.target.style.boxShadow = styles.inputInvalid.boxShadow;
                      } else {
                        e.target.style.borderColor = styles.inputFocus.borderColor;
                        e.target.style.boxShadow = styles.inputFocus.boxShadow;
                      }
                      e.target.style.backgroundColor = styles.inputFocus.backgroundColor;
                    }}
                    onBlur={(e) => {
                      if (password.length > 0 && password.length < 6) {
                        e.target.style.borderColor = styles.inputInvalid.borderColor;
                        e.target.style.boxShadow = 'none';
                      } else {
                        e.target.style.borderColor = styles.input.border.split(' ')[2];
                        e.target.style.boxShadow = 'none';
                      }
                      e.target.style.backgroundColor = styles.input.backgroundColor;
                    }}
                    placeholder="Create a password"
                  />
                  <Form.Control.Feedback type="invalid" style={styles.feedback}>
                    Password must be at least 6 characters long
                  </Form.Control.Feedback>
                </Form.Group>
                <Form.Group id="password-confirm" style={styles.formGroup}>
                  <Form.Label style={styles.label}>Confirm Password</Form.Label>
                  <Form.Control 
                    type="password" 
                    required 
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    isInvalid={passwordConfirm.length > 0 && password !== passwordConfirm}
                    style={{
                      ...styles.input,
                      ...(passwordConfirm.length > 0 && password !== passwordConfirm ? styles.inputInvalid : {})
                    }}
                    onFocus={(e) => {
                      if (passwordConfirm.length > 0 && password !== passwordConfirm) {
                        e.target.style.borderColor = styles.inputInvalid.borderColor;
                        e.target.style.boxShadow = styles.inputInvalid.boxShadow;
                      } else {
                        e.target.style.borderColor = styles.inputFocus.borderColor;
                        e.target.style.boxShadow = styles.inputFocus.boxShadow;
                      }
                      e.target.style.backgroundColor = styles.inputFocus.backgroundColor;
                    }}
                    onBlur={(e) => {
                      if (passwordConfirm.length > 0 && password !== passwordConfirm) {
                        e.target.style.borderColor = styles.inputInvalid.borderColor;
                        e.target.style.boxShadow = 'none';
                      } else {
                        e.target.style.borderColor = styles.input.border.split(' ')[2];
                        e.target.style.boxShadow = 'none';
                      }
                      e.target.style.backgroundColor = styles.input.backgroundColor;
                    }}
                    placeholder="Confirm your password"
                  />
                  <Form.Control.Feedback type="invalid" style={styles.feedback}>
                    Passwords do not match
                  </Form.Control.Feedback>
                </Form.Group>
                <Button 
                  disabled={loading} 
                  className="w-100" 
                  type="submit"
                  style={styles.button}
                  onMouseEnter={(e) => {
                    if (!loading) {
                      e.target.style.transform = styles.buttonHover.transform;
                      e.target.style.boxShadow = styles.buttonHover.boxShadow;
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'none';
                    e.target.style.boxShadow = 'none';
                  }}
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
                </Button>
              </Form>
              <div className="w-100 text-center mt-4">
                <Link 
                  to="/login" 
                  style={styles.link}
                  onMouseEnter={(e) => {
                    e.target.style.color = styles.linkHover.color;
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.color = styles.link.color;
                  }}
                >
                  Already have an account? Sign in here
                </Link>
              </div>
            </Card.Body>
          </Card>
        </div>
      </Container>
    </div>
  );
};

export default Register;