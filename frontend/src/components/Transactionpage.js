import React, { useState, useEffect, useMemo } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Button,
  Modal,
  Form,
  InputGroup,
  Badge,
  Alert,
  ButtonGroup,
  Spinner,
  ListGroup,
  CloseButton,
  Toast,
  ToastContainer
} from 'react-bootstrap';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Settings,
  ArrowUpDown,
  Calendar as CalendarIcon,
  Filter,
  Trash
} from 'lucide-react';
import api from '../utils/api'; // Your API utility

const TransactionsPage = () => {
  // Core Data State
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState({
    income: ['Salary', 'Freelance', 'Investments', 'Other'],
    expense: ['Food', 'Transport', 'Utilities', 'Entertainment', 'Healthcare', 'Shopping', 'Other']
  });

  // UI/Modal State
  const [loading, setLoading] = useState(true);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVariant, setToastVariant] = useState('success');

  // Form State
  const [transactionForm, setTransactionForm] = useState({});
  const [newCategory, setNewCategory] = useState({ income: '', expense: '' });
  
  // Filtering & Sorting State
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ type: 'all', category: 'all', dateRange: 'all' });
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });

  // --- Data Fetching ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [transRes, catRes] = await Promise.all([
          api.get('/transactions?limit=1000'),
          api.get('/categories')
        ]);
        setTransactions(transRes.data.transactions || []);
        setCategories(catRes.data || { income: [], expense: [] });
      } catch (error) {
        showToastMessage('Failed to load data', 'danger');
        console.error("Data fetch error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const resetTransactionForm = () => {
    setTransactionForm({
        type: 'expense',
        category: '',
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0]
    });
  };

  // --- Filtering & Sorting Logic ---
  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(t =>
        t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    // Type filter
    if (filters.type !== 'all') {
      filtered = filtered.filter(t => t.type === filters.type);
    }
    // Category filter
    if (filters.category !== 'all') {
      filtered = filtered.filter(t => t.category === filters.category);
    }
    
    // Sort
    filtered.sort((a, b) => {
        const key = sortConfig.key;
        let valA = a[key];
        let valB = b[key];

        if (key === 'amount') {
            valA = parseFloat(valA);
            valB = parseFloat(valB);
        }

        if (valA < valB) {
            return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (valA > valB) {
            return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
    });

    return filtered;
  }, [transactions, searchTerm, filters, sortConfig]);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
        direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // --- CRUD Handlers ---
  const handleAddClick = () => {
    setEditingTransaction(null);
    resetTransactionForm();
    setShowTransactionModal(true);
  };
  
  const handleEditClick = (transaction) => {
    setEditingTransaction(transaction);
    setTransactionForm({ ...transaction, date: new Date(transaction.date).toISOString().split('T')[0] });
    setShowTransactionModal(true);
  };

  const handleDeleteClick = async (id) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
        try {
            await api.delete(`/transactions/${id}`);
            setTransactions(transactions.filter(t => t._id !== id));
            showToastMessage('Transaction deleted successfully!');
        } catch (error) {
            showToastMessage('Failed to delete transaction', 'danger');
        }
    }
  };

  // --- Clear All Transactions Handler ---
  const handleClearAllTransactions = async () => {
    setIsClearing(true);
    try {
      console.log('Testing endpoint first...');
      
      // First test if endpoint is reachable
      const testResponse = await api.delete('/transactions/clear-all-test');
      console.log('Test endpoint response:', testResponse.data);
      
      // If test works, proceed with actual deletion
      console.log('Proceeding with actual deletion...');
      const response = await api.delete('/transactions/clear-all');
      
      console.log('Clear all response:', response.data);
      
      setTransactions([]);
      setShowClearModal(false);
      showToastMessage('All transactions have been cleared successfully!', 'success');
      
    } catch (error) {
      console.error('Full error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers
      });
      
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          'Failed to clear transactions';
      showToastMessage(errorMessage, 'danger');
    } finally {
      setIsClearing(false);
    }
  };

  const handleTransactionSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
        if (editingTransaction) {
            const res = await api.put(`/transactions/${editingTransaction._id}`, transactionForm);
            setTransactions(transactions.map(t => t._id === editingTransaction._id ? res.data : t));
            showToastMessage('Transaction updated successfully!');
        } else {
            const res = await api.post('/transactions', transactionForm);
            setTransactions([res.data, ...transactions]);
            showToastMessage('Transaction added successfully!');
        }
        setShowTransactionModal(false);
    } catch (error) {
        showToastMessage('Failed to save transaction', 'danger');
    } finally {
        setIsSubmitting(false);
    }
  };

  // --- Category Management Handlers ---
  const handleAddCategory = async (type) => {
    const name = newCategory[type].trim();
    if (!name) {
        showToastMessage('Category name cannot be empty', 'warning');
        return;
    }
    if (categories[type].map(c => c.toLowerCase()).includes(name.toLowerCase())) {
        showToastMessage('Category already exists', 'warning');
        return;
    }
    try {
        const res = await api.post('/categories', { type, name });
        setCategories(res.data);
        setNewCategory(prev => ({...prev, [type]: ''}));
        showToastMessage(`Category "${name}" added!`);
    } catch (error) {
        showToastMessage('Failed to add category', 'danger');
    }
  };

  const handleDeleteCategory = async (type, name) => {
     if (window.confirm(`Delete category "${name}"? This cannot be undone.`)) {
        try {
            const res = await api.delete(`/categories/${type}/${name}`);
            setCategories(res.data);
            showToastMessage(`Category "${name}" deleted!`);
        } catch (error) {
            showToastMessage('Failed to delete category', 'danger');
        }
     }
  };

  // --- Helper Functions ---
  const showToastMessage = (message, variant = 'success') => {
    setToastMessage(message);
    setToastVariant(variant);
    setShowToast(true);
  };

  if (loading) {
    return (
        <Container className="d-flex justify-content-center align-items-center" style={{minHeight: '80vh'}}>
            <Spinner animation="border" variant="primary" />
        </Container>
    );
  }

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
      {/* Custom CSS for hover effects */}
      <style>{`
        .hover-card {
          transition: all 0.3s ease;
          border: 1px solid #007bff !important;
        }
        
        .hover-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 123, 255, 0.15) !important;
          border: 1px solid #0056b3 !important;
        }
        
        .metric-card {
          transition: all 0.3s ease;
          border: 1px solid #007bff !important;
        }
        
        .metric-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 30px rgba(0, 123, 255, 0.15) !important;
          border: 1px solid #0056b3 !important;
        }
        
        .table-hover tbody tr:hover {
          background-color: rgba(0, 123, 255, 0.05) !important;
          transform: translateX(2px);
          transition: all 0.2s ease;
        }
      `}</style>

      <ToastContainer position="top-end" className="p-3" style={{ zIndex: 9999 }}>
        <Toast onClose={() => setShowToast(false)} show={showToast} delay={4000} autohide>
          <Toast.Header>
            <strong className="me-auto">{toastVariant === 'success' ? '✅ Success' : '⚠️ Notification'}</strong>
          </Toast.Header>
          <Toast.Body>{toastMessage}</Toast.Body>
        </Toast>
      </ToastContainer>

      {/* Header */}
      <Row className="my-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="mb-0 text-dark fw-bold">Manage Transactions</h2>
              <p className="text-muted mb-0">Add, edit, and filter your financial records.</p>
            </div>
            <ButtonGroup>
              <Button variant="outline-secondary" className="d-flex align-items-center gap-2" onClick={() => setShowCategoryModal(true)}>
                <Settings size={16} /> Manage Categories
              </Button>
              <Button variant="outline-danger" className="d-flex align-items-center gap-2" onClick={() => setShowClearModal(true)} disabled={transactions.length === 0}>
                <Trash size={16} /> Clear All
              </Button>
              <Button variant="primary" className="d-flex align-items-center gap-2" onClick={handleAddClick}>
                <Plus size={18} /> Add Transaction
              </Button>
            </ButtonGroup>
          </div>
        </Col>
      </Row>

      {/* Summary Cards */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="border-0 shadow-sm h-100 metric-card">
            <Card.Body className="text-center">
              <h6 className="text-muted mb-1">Total Income</h6>
              <h4 className="mb-0 text-success fw-bold">
                ₹{transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + parseFloat(t.amount), 0).toFixed(2)}
              </h4>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm h-100 metric-card">
            <Card.Body className="text-center">
              <h6 className="text-muted mb-1">Total Expenses</h6>
              <h4 className="mb-0 text-danger fw-bold">
                ₹{transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + parseFloat(t.amount), 0).toFixed(2)}
              </h4>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm h-100 metric-card">
            <Card.Body className="text-center">
              <h6 className="text-muted mb-1">Total Transactions</h6>
              <h4 className="mb-0 text-dark fw-bold">
                {transactions.length}
              </h4>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm h-100 metric-card">
            <Card.Body className="text-center">
              <h6 className="text-muted mb-1">Filtered Results</h6>
              <h4 className="mb-0 text-primary fw-bold">
                {filteredTransactions.length}
              </h4>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Filters Card */}
      <Card className="border-0 shadow-sm mb-4 hover-card">
        <Card.Body>
          <Row className="g-3 align-items-center">
            <Col lg={4}>
              <InputGroup>
                <InputGroup.Text><Search size={16} /></InputGroup.Text>
                <Form.Control placeholder="Search by description or category..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              </InputGroup>
            </Col>
            <Col md={6} lg={2}>
              <Form.Select value={filters.type} onChange={e => setFilters({...filters, type: e.target.value})}>
                <option value="all">All Types</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </Form.Select>
            </Col>
            <Col md={6} lg={3}>
              <Form.Select value={filters.category} onChange={e => setFilters({...filters, category: e.target.value})}>
                <option value="all">All Categories</option>
                <optgroup label="Income">
                  {categories.income.map(c => <option key={c} value={c}>{c}</option>)}
                </optgroup>
                <optgroup label="Expense">
                  {categories.expense.map(c => <option key={c} value={c}>{c}</option>)}
                </optgroup>
              </Form.Select>
            </Col>
            <Col md={12} lg={3}>
              <InputGroup>
                <InputGroup.Text>Sort By</InputGroup.Text>
                <Form.Select 
                  value={sortConfig.key} 
                  onChange={e => setSortConfig({ ...sortConfig, key: e.target.value })}
                >
                  <option value="date">Date</option>
                  <option value="category">Category</option>
                  <option value="amount">Amount</option>
                </Form.Select>
                <Button 
                  variant="outline-secondary" 
                  onClick={() => setSortConfig({ ...sortConfig, direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' })}
                >
                  {sortConfig.direction === 'asc' ? '↑ Asc' : '↓ Desc'}
                </Button>
              </InputGroup>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Transactions Table Card */}
      <Card className="border-0 shadow-sm hover-card">
        <Card.Body className="p-0">
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-5">
              <CalendarIcon size={48} className="text-muted mb-3" />
              <h6 className="text-muted">
                {transactions.length === 0 ? 'No transactions found. Add your first one!' : 'No transactions match your filters.'}
              </h6>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover className="mb-0 align-middle">
                <thead className="bg-light">
                  <tr>
                    <th className="py-3 ps-3" onClick={() => handleSort('date')} style={{cursor: 'pointer'}}>
                      <ArrowUpDown size={14} className="me-1"/>Date
                    </th>
                    <th className="py-3">Type</th>
                    <th className="py-3" onClick={() => handleSort('category')} style={{cursor: 'pointer'}}>
                      <ArrowUpDown size={14} className="me-1"/>Category
                    </th>
                    <th className="py-3">Description</th>
                    <th className="py-3 text-end" onClick={() => handleSort('amount')} style={{cursor: 'pointer'}}>
                      <ArrowUpDown size={14} className="me-1"/>Amount
                    </th>
                    <th className="py-3 text-center pe-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map(t => (
                    <tr key={t._id}>
                      <td className="ps-3">{new Date(t.date).toLocaleDateString()}</td>
                      <td>
                        <Badge pill bg={t.type === 'income' ? 'success-subtle' : 'danger-subtle'} text={t.type === 'income' ? 'success' : 'danger'}>
                          {t.type}
                        </Badge>
                      </td>
                      <td>{t.category}</td>
                      <td className="text-muted small">{t.description}</td>
                      <td className={`text-end fw-bold ${t.type === 'income' ? 'text-success' : 'text-danger'}`}>
                        {t.type === 'income' ? '+' : '-'}₹{t.amount.toFixed(2)}
                      </td>
                      <td className="text-center pe-3">
                        <ButtonGroup size="sm">
                          <Button variant="outline-secondary" onClick={() => handleEditClick(t)}>
                            <Edit size={14} />
                          </Button>
                          <Button variant="outline-danger" onClick={() => handleDeleteClick(t._id)}>
                            <Trash2 size={14} />
                          </Button>
                        </ButtonGroup>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Add/Edit Transaction Modal */}
      <Modal show={showTransactionModal} onHide={() => setShowTransactionModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{editingTransaction ? 'Edit Transaction' : 'Add Transaction'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleTransactionSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Type</Form.Label>
              <Form.Select name="type" value={transactionForm.type || 'expense'} onChange={e => setTransactionForm({...transactionForm, type: e.target.value, category: ''})}>
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Category</Form.Label>
              <Form.Select name="category" value={transactionForm.category || ''} onChange={e => setTransactionForm({...transactionForm, category: e.target.value})} required>
                <option value="" disabled>Select a category</option>
                {(transactionForm.type === 'income' ? categories.income : categories.expense).map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Form.Select>
            </Form.Group>
            <Row>
              <Col>
                <Form.Group className="mb-3">
                  <Form.Label>Amount</Form.Label>
                  <InputGroup>
                    <InputGroup.Text>₹</InputGroup.Text>
                    <Form.Control type="number" name="amount" value={transactionForm.amount || ''} onChange={e => setTransactionForm({...transactionForm, amount: e.target.value})} required placeholder="0.00" />
                  </InputGroup>
                </Form.Group>
              </Col>
              <Col>
                <Form.Group className="mb-3">
                  <Form.Label>Date</Form.Label>
                  <Form.Control type="date" name="date" value={transactionForm.date || ''} onChange={e => setTransactionForm({...transactionForm, date: e.target.value})} required />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control as="textarea" rows={3} name="description" value={transactionForm.description || ''} onChange={e => setTransactionForm({...transactionForm, description: e.target.value})} />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowTransactionModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Spinner size="sm" /> : 'Save Changes'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Clear All Transactions Modal */}
      <Modal show={showClearModal} onHide={() => setShowClearModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="text-danger">
            <Trash className="me-2" size={24} />
            Clear All Transactions
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="danger" className="mb-0">
            <Alert.Heading>Warning: This action cannot be undone!</Alert.Heading>
            <p className="mb-2">You are about to delete <strong>all {transactions.length} transactions</strong>. This will permanently remove your entire transaction history.</p>
            <p className="mb-0"><strong>This action cannot be reversed.</strong> Are you sure you want to proceed?</p>
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowClearModal(false)} disabled={isClearing}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleClearAllTransactions} disabled={isClearing}>
            {isClearing ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Clearing...
              </>
            ) : (
              'Yes, Clear All'
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Category Management Modal */}
      <Modal show={showCategoryModal} onHide={() => setShowCategoryModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Manage Categories</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row>
            <Col md={6}>
              <h5>Income Categories</h5>
              <ListGroup>
                {categories.income.map(cat => (
                  <ListGroup.Item key={cat} className="d-flex justify-content-between align-items-center">
                    {cat}
                    <CloseButton onClick={() => handleDeleteCategory('income', cat)} />
                  </ListGroup.Item>
                ))}
              </ListGroup>
              <InputGroup className="mt-3">
                <Form.Control placeholder="New income category" value={newCategory.income} onChange={e => setNewCategory({...newCategory, income: e.target.value})} />
                <Button variant="outline-success" onClick={() => handleAddCategory('income')}>Add</Button>
              </InputGroup>
            </Col>
            <Col md={6}>
              <h5>Expense Categories</h5>
              <ListGroup>
                {categories.expense.map(cat => (
                  <ListGroup.Item key={cat} className="d-flex justify-content-between align-items-center">
                    {cat}
                    <CloseButton onClick={() => handleDeleteCategory('expense', cat)} />
                  </ListGroup.Item>
                ))}
              </ListGroup>
              <InputGroup className="mt-3">
                <Form.Control placeholder="New expense category" value={newCategory.expense} onChange={e => setNewCategory({...newCategory, expense: e.target.value})} />
                <Button variant="outline-success" onClick={() => handleAddCategory('expense')}>Add</Button>
              </InputGroup>
            </Col>
          </Row>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default TransactionsPage;