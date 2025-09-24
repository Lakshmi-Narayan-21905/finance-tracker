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
  ProgressBar,
  ButtonGroup,
  Toast,
  ToastContainer,
  Spinner,
  Dropdown
} from 'react-bootstrap';
import { 
  Search, 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar,
  Target,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Bell,
  Edit,
  Trash2,
  MoreVertical
} from 'lucide-react';

import api from '../utils/api';

const Dashboard = () => {
  const [summary, setSummary] = useState({
    income: 0,
    expenses: 0,
    balance: 0
  });
  
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showDeleteBudgetModal, setShowDeleteBudgetModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVariant, setToastVariant] = useState('success');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [budgetToDelete, setBudgetToDelete] = useState(null);

  const [filters, setFilters] = useState({
    type: 'all',
    category: 'all',
    timeFrame: 'all',
    sortBy: 'date',
    sortOrder: 'desc'
  });
  
  const [transactionForm, setTransactionForm] = useState({
    type: 'expense',
    category: '',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });
  
  const [budgetForm, setBudgetForm] = useState({
    category: '',
    amount: '',
    period: 'monthly'
  });

  const categories = ['Salary', 'Food', 'Transport', 'Entertainment', 'Utilities', 'Healthcare', 'Shopping', 'Other'];

  // Fetch user data on component mount
  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const [transactionsRes, summaryRes, budgetsRes] = await Promise.all([
        api.get('/transactions'),
        api.get('/transactions/summary'),
        api.get('/budgets')
      ]);
      
      setTransactions(transactionsRes.data.transactions || []);
      setSummary(summaryRes.data);
      setBudgets(budgetsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      showToastMessage('Error loading data', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await fetchUserData();
    setRefreshing(false);
    showToastMessage('Data refreshed successfully', 'success');
  };

  // Apply filters whenever transactions or filters change
  useEffect(() => {
    applyFilters();
  }, [transactions, filters, searchTerm]);

  const applyFilters = () => {
    let filtered = [...transactions];

    if (searchTerm) {
      filtered = filtered.filter(t => 
        t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filters.type !== 'all') {
      filtered = filtered.filter(t => t.type === filters.type);
    }

    if (filters.category !== 'all') {
      filtered = filtered.filter(t => t.category === filters.category);
    }

    const now = new Date();
    if (filters.timeFrame !== 'all') {
      filtered = filtered.filter(t => {
        const transactionDate = new Date(t.date);
        switch (filters.timeFrame) {
          case 'thisMonth':
            return transactionDate.getMonth() === now.getMonth() && 
                   transactionDate.getFullYear() === now.getFullYear();
          case 'lastMonth':
            const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            return transactionDate.getMonth() === lastMonth.getMonth() && 
                   transactionDate.getFullYear() === lastMonth.getFullYear();
          default:
            return true;
        }
      });
    }

    filtered.sort((a, b) => {
      let aValue, bValue;
      switch (filters.sortBy) {
        case 'amount':
          aValue = parseFloat(a.amount);
          bValue = parseFloat(b.amount);
          break;
        case 'category':
          aValue = a.category;
          bValue = b.category;
          break;
        default:
          aValue = new Date(a.date);
          bValue = new Date(b.date);
      }
      
      return filters.sortOrder === 'asc' ? 
        (aValue > bValue ? 1 : -1) : 
        (aValue < bValue ? 1 : -1);
    });

    setFilteredTransactions(filtered);
  };

  // Generic handler for form inputs
  const handleChange = (formType, field, value) => {
    if (formType === 'transaction') {
      setTransactionForm(prev => ({ ...prev, [field]: value }));
    } else if (formType === 'budget') {
      setBudgetForm(prev => ({ ...prev, [field]: value }));
    }
  };
  
  // Handler for filter changes
  const handleFilterChange = (field, value) => {
      setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleTransactionSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await api.post('/transactions', transactionForm);
      const newTransaction = response.data;
      
      setTransactions(prev => [newTransaction, ...prev]);
      
      // Refresh summary data from API
      const summaryRes = await api.get('/transactions/summary');
      setSummary(summaryRes.data);
      
      showToastMessage('Transaction added successfully!');
      setShowTransactionModal(false);
      setTransactionForm({
        type: 'expense', category: '', amount: '', description: '',
        date: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      console.error('Error adding transaction:', error);
      showToastMessage('Error adding transaction', 'danger');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBudgetSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let response;
      
      if (editingBudget) {
        // Update existing budget
        response = await api.put(`/budgets/${editingBudget._id}`, budgetForm);
        showToastMessage('Budget updated successfully!');
      } else {
        // Create new budget
        response = await api.post('/budgets', budgetForm);
        showToastMessage('Budget created successfully!');
      }
      
      const updatedBudget = response.data;
      
      setBudgets(prev => {
        if (editingBudget) {
          return prev.map(b => b._id === editingBudget._id ? updatedBudget : b);
        } else {
          return [...prev, updatedBudget];
        }
      });
      
      setShowBudgetModal(false);
      setEditingBudget(null);
      setBudgetForm({ category: '', amount: '', period: 'monthly' });
    } catch (error) {
      console.error('Error saving budget:', error);
      showToastMessage(`Error ${editingBudget ? 'updating' : 'creating'} budget`, 'danger');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditBudget = (budget) => {
    setEditingBudget(budget);
    setBudgetForm({
      category: budget.category,
      amount: budget.amount,
      period: budget.period || 'monthly'
    });
    setShowBudgetModal(true);
  };

  const handleDeleteBudget = (budget) => {
    setBudgetToDelete(budget);
    setShowDeleteBudgetModal(true);
  };

  const confirmDeleteBudget = async () => {
    if (!budgetToDelete) return;
    
    try {
      await api.delete(`/budgets/${budgetToDelete._id}`);
      
      setBudgets(prev => prev.filter(b => b._id !== budgetToDelete._id));
      showToastMessage('Budget deleted successfully!');
      setShowDeleteBudgetModal(false);
      setBudgetToDelete(null);
    } catch (error) {
      console.error('Error deleting budget:', error);
      showToastMessage('Error deleting budget', 'danger');
    }
  };

  const showToastMessage = (message, variant = 'success') => {
    setToastMessage(message);
    setToastVariant(variant);
    setShowToast(true);
  };
  
  // Reset form when modal closes
  const handleBudgetModalClose = () => {
    setShowBudgetModal(false);
    setEditingBudget(null);
    setBudgetForm({ category: '', amount: '', period: 'monthly' });
  };

  // --- Helper Functions for Budget calculations ---
  const calculateBudgetProgress = (budget) => {
    const now = new Date();
    const spent = transactions
      .filter(t => 
          t.type === 'expense' && 
          t.category === budget.category &&
          new Date(t.date).getMonth() === now.getMonth() &&
          new Date(t.date).getFullYear() === now.getFullYear()
      )
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const limit = parseFloat(budget.amount);
    const percentage = limit > 0 ? (spent / limit) * 100 : 0;
    const remaining = limit - spent;
    const isOverspent = percentage > 100;
    const isNearLimit = percentage >= 80 && percentage <= 100;

    return { spent, limit, remaining, percentage, isOverspent, isNearLimit };
  };
  
  const getDaysLeftInMonth = () => {
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    return lastDay - now.getDate();
  };
  
  const getBudgetVariant = (percentage) => {
    if (percentage > 100) return 'danger';
    if (percentage >= 80) return 'warning';
    return 'success';
  };
  
  const getBudgetStatus = (progress) => {
    if (progress.isOverspent) {
        return { 
            icon: <AlertTriangle size={14} className="text-danger" />, 
            text: 'Overspent', 
            className: 'text-danger' 
        };
    }
    if (progress.isNearLimit) {
        return { 
            icon: <AlertCircle size={14} className="text-warning" />, 
            text: 'Near Limit', 
            className: 'text-warning'
        };
    }
    return { 
        icon: <CheckCircle size={14} className="text-success" />, 
        text: 'On Track', 
        className: 'text-success'
    };
  };

  // Derived state for budget health summary
  const budgetHealth = useMemo(() => {
    const stats = { onTrack: 0, nearLimit: 0, overspent: 0 };
    budgets.forEach(budget => {
        const progress = calculateBudgetProgress(budget);
        if (progress.isOverspent) {
            stats.overspent++;
        } else if (progress.isNearLimit) {
            stats.nearLimit++;
        } else {
            stats.onTrack++;
        }
    });
    return stats;
  }, [budgets, transactions]);

  if (loading) {
    return (
      <Container fluid className="px-4 d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3 text-muted">Loading your financial data...</p>
        </div>
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
      <style jsx>{`
        .hover-card {
          transition: all 0.3s ease;
          border: 1px solid #007bff !important;
        }
        
        .hover-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 123, 255, 0.15) !important;
          border: 1px solid #0056b3 !important;
        }
        
        .budget-item {
          transition: all 0.3s ease;
          border: 1px solid #e9ecef !important;
        }
        
        .budget-item:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 15px rgba(0, 123, 255, 0.1);
          border: 1px solid #007bff !important;
        }
        
        .budget-item.overspent {
          border: 1px solid #dc3545 !important;
        }
        
        .budget-item.near-limit {
          border: 1px solid #ffc107 !important;
        }
        
        .budget-item.overspent:hover {
          border: 1px solid #c82333 !important;
        }
        
        .budget-item.near-limit:hover {
          border: 1px solid #e0a800 !important;
        }
        
        .table-row {
          transition: background-color 0.2s ease;
        }
        
        .table-row:hover {
          background-color: rgba(0, 123, 255, 0.05) !important;
        }
      `}</style>

      {/* Toast Notifications */}
      <ToastContainer position="top-end" className="position-fixed p-3" style={{ zIndex: 9999 }}>
        <Toast show={showToast} onClose={() => setShowToast(false)} delay={5000} autohide>
          <Toast.Header>
            <strong className="me-auto">
              {toastVariant === 'danger' ? '⚠️ Error' : '✅ Success'}
            </strong>
          </Toast.Header>
          <Toast.Body className={`text-${toastVariant === 'danger' ? 'danger' : 'success'}`}>
            {toastMessage}
          </Toast.Body>
        </Toast>
      </ToastContainer>

      {/* Header with Refresh Button */}
      <Row className="my-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="mb-0 text-dark fw-bold">Financial Dashboard</h2>
              <p className="text-muted mb-0">Your personal financial overview</p>
            </div>
            <ButtonGroup>
<Button 
  variant="outline-primary" 
  onClick={() => setShowBudgetModal(true)}
  className="d-flex align-items-center gap-2 fw-bold border-2"
>
  <Target size={18} /> Set Budget
</Button>


              {/* <Button 
                variant="primary" 
                onClick={() => setShowTransactionModal(true)}
                className="d-flex align-items-center gap-2"
              >
                <Plus size={18} /> Add Transaction
              </Button> */}
            </ButtonGroup>
          </div>
        </Col>
      </Row>

      {/* Budget Health Summary */}
      {budgets.length > 0 && (
        <Row className="mb-4">
          <Col>
            <Alert variant={budgetHealth.overspent > 0 ? 'danger' : budgetHealth.nearLimit > 0 ? 'warning' : 'success'} className="d-flex align-items-center">
              <div className="me-3">
                {budgetHealth.overspent > 0 ? <AlertTriangle size={20} /> : 
                 budgetHealth.nearLimit > 0 ? <AlertCircle size={20} /> : 
                 <CheckCircle size={20} />}
              </div>
              <div className="flex-grow-1">
                <strong>Budget Health: </strong>
                {budgetHealth.overspent > 0 && `${budgetHealth.overspent} budget(s) exceeded.`}
                {budgetHealth.overspent === 0 && budgetHealth.nearLimit > 0 && `${budgetHealth.nearLimit} budget(s) near limit.`}
                {budgetHealth.overspent === 0 && budgetHealth.nearLimit === 0 && 'All budgets on track.'}
                {` ${budgetHealth.onTrack} on track.`}
              </div>
              <div className="ms-auto">
                 <Button 
                    variant="outline-secondary" 
                    size="sm"
                    onClick={refreshData}
                    disabled={refreshing}
                    className="d-flex align-items-center gap-2"
                >
                    <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
                    {refreshing ? 'Refreshing...' : 'Refresh Data'}
                </Button>
              </div>
            </Alert>
          </Col>
        </Row>
      )}

      {/* Summary Cards */}
      <Row className="mb-4">
        <Col md={4}>
            <Card className="border-0 shadow-sm h-100 hover-card">
                <Card.Body className="d-flex align-items-center">
                <div className="bg-success bg-opacity-10 p-3 rounded-3 me-3">
                    <TrendingUp className="text-success" size={24} />
                </div>
                <div>
                    <h6 className="text-muted mb-1">Total Income</h6>
                    <h4 className="mb-0 text-success fw-bold">${summary.income.toFixed(2)}</h4>
                </div>
                </Card.Body>
            </Card>
        </Col>
        <Col md={4}>
            <Card className="border-0 shadow-sm h-100 hover-card">
                <Card.Body className="d-flex align-items-center">
                <div className="bg-danger bg-opacity-10 p-3 rounded-3 me-3">
                    <TrendingDown className="text-danger" size={24} />
                </div>
                <div>
                    <h6 className="text-muted mb-1">Total Expenses</h6>
                    <h4 className="mb-0 text-danger fw-bold">${summary.expenses.toFixed(2)}</h4>
                </div>
                </Card.Body>
            </Card>
        </Col>
        <Col md={4}>
            <Card className="border-0 shadow-sm h-100 hover-card">
                <Card.Body className="d-flex align-items-center">
                <div className="bg-primary bg-opacity-10 p-3 rounded-3 me-3">
                    <DollarSign className="text-primary" size={24} />
                </div>
                <div>
                    <h6 className="text-muted mb-1">Net Balance</h6>
                    <h4 className={`mb-0 fw-bold ${summary.balance >= 0 ? 'text-success' : 'text-danger'}`}>
                        ${summary.balance.toFixed(2)}
                    </h4>
                </div>
                </Card.Body>
            </Card>
        </Col>
      </Row>

      {/* Enhanced Budget Overview */}
      {budgets.length > 0 && (
        <Row className="mb-4">
          <Col>
            <Card className="border-0 shadow-sm hover-card">
              <Card.Header className="bg-white border-0 py-3">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0 d-flex align-items-center gap-2">
                    <Target size={20} /> Budget Overview
                  </h5>
                  <Badge bg="light" text="dark" className="px-3 py-2">
                      <Calendar size={12} className="me-1" />
                      {getDaysLeftInMonth()} days left this month
                  </Badge>
                </div>
              </Card.Header>
              <Card.Body>
                <Row>
                  {budgets.map((budget, index) => {
                    const progress = calculateBudgetProgress(budget);
                    const variant = getBudgetVariant(progress.percentage);
                    const status = getBudgetStatus(progress);
                    
                    return (
                      <Col md={6} lg={4} key={budget._id} className="mb-3">
                        <div className={`p-3 rounded-3 h-100 budget-item ${
                          progress.isOverspent ? 'overspent bg-danger bg-opacity-10' : 
                          progress.isNearLimit ? 'near-limit bg-warning bg-opacity-10' : 
                          ''
                        }`}>
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <h6 className="mb-0">{budget.category}</h6>
                            <div className="d-flex align-items-center gap-2">
                              <div className={`d-flex align-items-center gap-1 small ${status.className}`}>
                                {status.icon} {status.text}
                              </div>
                              <Dropdown>
                                <Dropdown.Toggle variant="light" size="sm" className="border-0 p-1">
                                  <MoreVertical size={14} />
                                </Dropdown.Toggle>
                                <Dropdown.Menu>
                                  <Dropdown.Item onClick={() => handleEditBudget(budget)}>
                                    <Edit size={14} className="me-2" />
                                    Edit Budget
                                  </Dropdown.Item>
                                  <Dropdown.Item 
                                    onClick={() => handleDeleteBudget(budget)}
                                    className="text-danger"
                                  >
                                    <Trash2 size={14} className="me-2" />
                                    Delete Budget
                                  </Dropdown.Item>
                                </Dropdown.Menu>
                              </Dropdown>
                            </div>
                          </div>
                          
                          <ProgressBar className="mb-2" style={{ height: '10px' }}>
                            <ProgressBar 
                                variant={variant} 
                                now={Math.min(progress.percentage, 100)} 
                                key={1}
                            />
                            {progress.isOverspent && (
                                <ProgressBar 
                                    variant="danger"
                                    now={100}
                                    className="progress-bar-striped"
                                    key={2}
                                />
                            )}
                          </ProgressBar>

                          <div className="d-flex justify-content-between small text-muted mb-2">
                             <span>${progress.spent.toFixed(2)} of ${progress.limit.toFixed(2)}</span>
                             <span>{Math.round(progress.percentage)}%</span>
                          </div>
                          
                           <div className="d-flex justify-content-between align-items-center small">
                                <span className={progress.remaining < 0 ? "text-danger fw-bold" : "text-success"}>
                                    {progress.remaining >= 0 ? 
                                        `$${progress.remaining.toFixed(2)} left` : 
                                        `$${Math.abs(progress.remaining).toFixed(2)} over`
                                    }
                                </span>
                           </div>
                        </div>
                      </Col>
                    );
                  })}
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Filters and Search */}
      <Row className="mb-3">
        <Col>
          <Card className="border-0 shadow-sm hover-card">
            <Card.Body className="py-3">
              <Row className="g-2 align-items-center">
                <Col lg={4}>
                  <InputGroup>
                    <InputGroup.Text className="bg-light border-end-0">
                      <Search size={16} />
                    </InputGroup.Text>
                    <Form.Control
                      type="text"
                      placeholder="Search transactions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="border-start-0"
                    />
                  </InputGroup>
                </Col>
                <Col md={6} lg={2}>
                  <Form.Select 
                    value={filters.type} 
                    onChange={(e) => handleFilterChange('type', e.target.value)}
                  >
                    <option value="all">All Types</option>
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                  </Form.Select>
                </Col>
                <Col md={6} lg={2}>
                  <Form.Select 
                    value={filters.category} 
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                  >
                    <option value="all">All Categories</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </Form.Select>
                </Col>
                <Col md={6} lg={2}>
                  <Form.Select 
                    value={filters.timeFrame} 
                    onChange={(e) => handleFilterChange('timeFrame', e.target.value)}
                  >
                    <option value="all">All Time</option>
                    <option value="thisMonth">This Month</option>
                    <option value="lastMonth">Last Month</option>
                  </Form.Select>
                </Col>
                <Col md={6} lg={2}>
                 <InputGroup>
                  <Form.Select 
                    value={filters.sortBy} 
                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  >
                    <option value="date">Sort by Date</option>
                    <option value="amount">Sort by Amount</option>
                    <option value="category">Sort by Category</option>
                  </Form.Select>
                  <Button
                    variant="outline-secondary"
                    onClick={() => handleFilterChange('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
                    title={`Sort ${filters.sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
                  >
                    {filters.sortOrder === 'asc' ? '↑' : '↓'}
                  </Button>
                  </InputGroup>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Transactions Table */}
      <Row>
        <Col>
          <Card className="border-0 shadow-sm hover-card">
            <Card.Header className="bg-white border-0 py-3">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Recent Transactions</h5>
                <Badge bg="light" text="dark" className="px-3 py-2">
                  {filteredTransactions.length} of {transactions.length} transactions
                </Badge>
              </div>
            </Card.Header>
            <Card.Body className="p-0">
              {filteredTransactions.length === 0 ? (
                <div className="text-center py-5">
                  <Calendar size={48} className="text-muted mb-3" />
                  <h6 className="text-muted">No transactions found</h6>
                  <p className="text-muted small">Try adjusting your filters or add a new transaction.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <Table hover className="mb-0 align-middle">
                    <thead className="bg-light">
                      <tr>
                        <th className="border-0 py-3 ps-3">Date</th>
                        <th className="border-0 py-3">Type</th>
                        <th className="border-0 py-3">Category</th>
                        <th className="border-0 py-3">Description</th>
                        <th className="border-0 py-3 text-end pe-3">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTransactions.map(transaction => (
                        <tr key={transaction._id} className="table-row">
                          <td className="py-3 ps-3">
                            {new Date(transaction.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                          </td>
                          <td className="py-3">
                            <Badge 
                              pill
                              bg={transaction.type === 'income' ? 'success-subtle' : 'danger-subtle'}
                              text={transaction.type === 'income' ? 'success' : 'danger'}
                              className="px-2 py-1"
                            >
                               {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                            </Badge>
                          </td>
                          <td className="py-3">
                            <span className="fw-medium">{transaction.category}</span>
                          </td>
                          <td className="py-3 text-muted small">
                            {transaction.description}
                          </td>
                          <td className="py-3 text-end pe-3">
                            <span className={`fw-bold ${transaction.type === 'income' ? 'text-success' : 'text-danger'}`}>
                              {transaction.type === 'income' ? '+' : '-'}${parseFloat(transaction.amount).toFixed(2)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

       {/* Transaction Modal */}
      <Modal show={showTransactionModal} onHide={() => setShowTransactionModal(false)} centered>
        <Modal.Header closeButton className="border-0">
          <Modal.Title>Add New Transaction</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleTransactionSubmit}>
          <Modal.Body className="px-4">
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">Transaction Type</Form.Label>
                <Form.Select 
                  value={transactionForm.type} 
                  onChange={(e) => handleChange('transaction', 'type', e.target.value)}
                >
                  <option value="expense">💸 Expense</option>
                  <option value="income">💰 Income</option>
                </Form.Select>
              </Form.Group>
            
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">Category</Form.Label>
                <Form.Select 
                  value={transactionForm.category} 
                  onChange={(e) => handleChange('transaction', 'category', e.target.value)}
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            
            <Row>
              <Col>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">Amount</Form.Label>
                  <InputGroup>
                    <InputGroup.Text>$</InputGroup.Text>
                    <Form.Control
                      type="number"
                      step="0.01"
                      value={transactionForm.amount}
                      onChange={(e) => handleChange('transaction', 'amount', e.target.value)}
                      placeholder="0.00"
                      required
                    />
                  </InputGroup>
                </Form.Group>
              </Col>
              <Col>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={transactionForm.date}
                    onChange={(e) => handleChange('transaction', 'date', e.target.value)}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Description (Optional)</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={transactionForm.description}
                onChange={(e) => handleChange('transaction', 'description', e.target.value)}
                placeholder="e.g., Coffee with friends"
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="border-0 px-4">
            <Button variant="outline-secondary" onClick={() => setShowTransactionModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? <><Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> Adding...</> : 'Add Transaction'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

       <Modal show={showBudgetModal} onHide={handleBudgetModalClose} centered>
        <Modal.Header closeButton className="border-0">
          <Modal.Title>
            {editingBudget ? 'Edit Budget' : 'Set Budget Limit'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleBudgetSubmit}>
          <Modal.Body className="px-4">
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Category</Form.Label>
              <Form.Select 
                value={budgetForm.category} 
                onChange={(e) => handleChange('budget', 'category', e.target.value)}
                required
                disabled={!!editingBudget} // Disable category editing for existing budgets
              >
                <option value="">Select Category to Budget</option>
                {categories.filter(cat => !['Salary'].includes(cat)).map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </Form.Select>
              {editingBudget && (
                <Form.Text className="text-muted">
                  Category cannot be changed for existing budgets.
                </Form.Text>
              )}
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Monthly Limit</Form.Label>
              <InputGroup>
                <InputGroup.Text>$</InputGroup.Text>
                <Form.Control
                  type="number"
                  step="0.01"
                  value={budgetForm.amount}
                  onChange={(e) => handleChange('budget', 'amount', e.target.value)}
                  placeholder="e.g., 500.00"
                  required
                />
              </InputGroup>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="border-0 px-4">
            <Button variant="outline-secondary" onClick={handleBudgetModalClose}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                  {editingBudget ? ' Updating...' : ' Setting...'}
                </>
              ) : (
                editingBudget ? 'Update Budget' : 'Set Budget'
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Delete Budget Confirmation Modal */}
      <Modal show={showDeleteBudgetModal} onHide={() => setShowDeleteBudgetModal(false)} centered>
        <Modal.Header closeButton className="border-0">
          <Modal.Title>Delete Budget</Modal.Title>
        </Modal.Header>
        <Modal.Body className="px-4">
          <Alert variant="warning" className="mb-0">
            <AlertTriangle size={20} className="me-2" />
            Are you sure you want to delete the budget for <strong>{budgetToDelete?.category}</strong>?
            This action cannot be undone.
          </Alert>
        </Modal.Body>
        <Modal.Footer className="border-0 px-4">
          <Button variant="outline-secondary" onClick={() => setShowDeleteBudgetModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDeleteBudget}>
            <Trash2 size={16} className="me-2" />
            Delete Budget
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Dashboard;