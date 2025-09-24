import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, Button, Spinner, Alert, Form, InputGroup } from 'react-bootstrap';
import { Sparkles, BrainCircuit, Send } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import api from '../utils/api';
import './FinancialAdvicePage.css';

const FinancialAdvicePage = () => {
    const [initialAdvice, setInitialAdvice] = useState('');
    const [chatHistory, setChatHistory] = useState([]);
    const [userInput, setUserInput] = useState('');
    const [loadingInitial, setLoadingInitial] = useState(false);
    const [isChatLoading, setIsChatLoading] = useState(false);
    const [error, setError] = useState('');
    const chatEndRef = useRef(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory]);

    const handleGenerateAdvice = async () => {
        setLoadingInitial(true);
        setError('');
        setInitialAdvice('');
        setChatHistory([]);
        try {
            const res = await api.get('/advice');
            const adviceText = res.data.advice;
            setInitialAdvice(adviceText);
            const firstAIMessage = {
                role: 'model',
                parts: [{ text: adviceText }]
            };
            setChatHistory([firstAIMessage]);
        } catch (err) {
            setError('Could not fetch financial advice. Please try again later.');
            console.error(err);
        } finally {
            setLoadingInitial(false);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!userInput.trim() || isChatLoading) return;

        const userMessage = userInput.trim();
        const newUserMessage = {
            role: 'user',
            parts: [{ text: userMessage }]
        };

        const updatedHistory = [...chatHistory, newUserMessage];
        setChatHistory(updatedHistory);
        setUserInput('');
        setIsChatLoading(true);

        try {
            // FIXED: Send the *entire updated history* to the backend in one go.
            // This is a more robust way to handle the conversation.
            const res = await api.post('/advice/chat', {
                history: updatedHistory
            });

            const aiReply = res.data.reply;
            const newAiMessage = {
                role: 'model',
                parts: [{ text: aiReply }]
            };
            
            setChatHistory([...updatedHistory, newAiMessage]);
        } catch (err) {
            setError('The AI is unable to respond right now. Please try again later.');
            console.error(err);
        } finally {
            setIsChatLoading(false);
        }
    };

    // ... (The JSX part of your component remains exactly the same)
    return (
            <Container 
          fluid 
          className="px-4" 
          style={{
            background: 'linear-gradient(135deg, #0099ff0c 0%, #0099ff1c 25%, #0099ff1c 50%, #0099ff2c 75%, #0099ff2c 100%)',
            minHeight: '100vh',
            paddingTop: '20px',
            paddingBottom: '20px'
          }}
        >
            <Row className="my-4">
                <Col>
                    <div>
                        <h2 className="mb-0 text-dark fw-bold">AI Financial Advisor</h2>
                        <p className="text-muted mb-0">Get personalized insights and chat with your AI advisor.</p>
                    </div>
                </Col>
            </Row>

            <Row>
                <Col>
                    <Card className="border-0 shadow-sm">
                        {!initialAdvice && !loadingInitial && (
                            <Card.Body className="p-4 p-md-5 text-center">
                                <Card.Title as="h3" className="mb-3 d-flex align-items-center justify-content-center gap-2">
                                    <BrainCircuit size={28} />
                                    Your Personal Financial Analysis
                                </Card.Title>
                                <Card.Text className="text-muted mb-4">
                                    Click the button to have our AI analyze your activity from the last 30 days.
                                </Card.Text>
                                <Button variant="primary" size="lg" onClick={handleGenerateAdvice} className="d-inline-flex align-items-center gap-2">
                                    <Sparkles size={20} />
                                    Generate My Financial Advice
                                </Button>
                            </Card.Body>
                        )}
                        
                        {loadingInitial && (
                            <Card.Body className="p-4 p-md-5 text-center">
                                <Spinner animation="border" variant="primary" />
                                <p className="mt-3 text-muted">Analyzing your finances...</p>
                            </Card.Body>
                        )}

                        {error && (
                            <Card.Footer className="bg-transparent border-0 p-4">
                                <Alert variant="danger">{error}</Alert>
                            </Card.Footer>
                        )}
                        
                        {chatHistory.length > 0 && (
                            <Card.Body className="p-0">
                                <div className="chat-window">
                                    {chatHistory.map((msg, index) => (
                                        <div key={index} className={`message-container ${msg.role}`}>
                                            <div className="message-bubble">
                                                <ReactMarkdown>{msg.parts[0].text}</ReactMarkdown>
                                            </div>
                                        </div>
                                    ))}
                                    {isChatLoading && (
                                        <div className="message-container model">
                                            <div className="message-bubble">
                                                <Spinner animation="grow" size="sm" />
                                            </div>
                                        </div>
                                    )}
                                    <div ref={chatEndRef} />
                                </div>
                                <div className="chat-input-container">
                                    <Form onSubmit={handleSendMessage}>
                                        <InputGroup size="lg">
                                            <Form.Control
                                                placeholder="Ask a follow-up question..."
                                                value={userInput}
                                                onChange={(e) => setUserInput(e.target.value)}
                                                disabled={isChatLoading}
                                                autoFocus
                                            />
                                            <Button variant="primary" type="submit" disabled={isChatLoading || !userInput.trim()}>
                                                {isChatLoading ? <Spinner size="sm" /> : <Send size={20} />}
                                            </Button>
                                        </InputGroup>
                                    </Form>
                                </div>
                            </Card.Body>
                        )}
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default FinancialAdvicePage;