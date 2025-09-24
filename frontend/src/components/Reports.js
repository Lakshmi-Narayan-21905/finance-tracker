import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Container,
  Row,
  Col,
  Card,
  ButtonGroup,
  Button,
  Form,
  Alert,
  Badge,
  Modal,
  ListGroup
} from 'react-bootstrap';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Calendar,
  DollarSign,
  Target,
  Activity,
  Plus,
  Minus
} from 'lucide-react';

const Reports = () => {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState('6months');
  const [selectedView, setSelectedView] = useState('overview');
  const [selectedDate, setSelectedDate] = useState(null);
  const [showDateDetails, setShowDateDetails] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Color palette for charts
  const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#06B6D4', '#F97316', '#84CC16'];
  
  useEffect(() => {
    fetchData();
  }, [timeRange]);

const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      // Both API calls now use the timeRange state variable
      const [transactionsRes, summaryRes] = await Promise.all([
        axios.get(`/api/transactions?limit=1000&timeRange=${timeRange}`),
        // CHANGE HERE: Added the timeRange query parameter to the summary endpoint
        axios.get(`/api/transactions/summary?timeRange=${timeRange}`) 
      ]);
      
      setTransactions(transactionsRes.data.transactions || []);
      setSummary(summaryRes.data || {});
    } catch (error) {
      setError('Failed to load analytics data. Please try again later.');
      console.error('Error fetching analytics data:', error);
      
      // Clear data on error to show the "No Data" message
      setTransactions([]);
      setSummary({});
    } finally {
      setLoading(false);
    }
  };

  // Process data for monthly trends
  const getMonthlyTrends = () => {
    const monthlyData = {};
    
    transactions.forEach(transaction => {
      let transactionDate;
      if (transaction.date instanceof Date) {
        transactionDate = transaction.date;
      } else if (transaction.date?.$date) {
        transactionDate = new Date(transaction.date.$date.$numberLong);
      } else {
        transactionDate = new Date(transaction.date);
      }
      
      const monthKey = `${transactionDate.getFullYear()}-${String(transactionDate.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { month: monthKey, income: 0, expenses: 0, net: 0 };
      }
      
      if (transaction.type === 'income') {
        monthlyData[monthKey].income += parseFloat(transaction.amount?.$numberInt || transaction.amount);
      } else {
        monthlyData[monthKey].expenses += parseFloat(transaction.amount?.$numberInt || transaction.amount);
      }
      
      monthlyData[monthKey].net = monthlyData[monthKey].income - monthlyData[monthKey].expenses;
    });
    
    return Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));
  };

  // Process data for daily spending trends - LAST 7 DAYS ONLY
  const getDailyTrends = () => {
    const dailyData = {};
    const today = new Date();
    const last7Days = new Date(today);
    last7Days.setDate(last7Days.getDate() - 7);
    
    transactions.forEach(transaction => {
      let transactionDate;
      if (transaction.date instanceof Date) {
        transactionDate = transaction.date;
      } else if (transaction.date?.$date) {
        transactionDate = new Date(transaction.date.$date.$numberLong);
      } else {
        transactionDate = new Date(transaction.date);
      }
      
      // Filter for last 7 days only
      if (transactionDate >= last7Days && transactionDate <= today) {
        const dateKey = transactionDate.toISOString().split('T')[0];
        
        if (!dailyData[dateKey]) {
          dailyData[dateKey] = { date: dateKey, income: 0, expenses: 0, net: 0 };
        }
        
        const amount = parseFloat(transaction.amount?.$numberInt || transaction.amount);
        
        if (transaction.type === 'income') {
          dailyData[dateKey].income += amount;
        } else {
          dailyData[dateKey].expenses += amount;
        }
        
        dailyData[dateKey].net = dailyData[dateKey].income - dailyData[dateKey].expenses;
      }
    });
    
    // Fill in missing days with zero values for the last 7 days
    const result = [];
    const currentDate = new Date(last7Days);
    
    while (currentDate <= today) {
      const dateKey = currentDate.toISOString().split('T')[0];
      result.push({
        date: dateKey,
        income: dailyData[dateKey]?.income || 0,
        expenses: dailyData[dateKey]?.expenses || 0,
        net: dailyData[dateKey]?.net || 0,
        // Add formatted date for better display
        formattedDate: currentDate.toLocaleDateString('en-US', { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric' 
        }),
        // Short format for bar chart labels
        shortDate: currentDate.toLocaleDateString('en-US', { 
          weekday: 'narrow', 
          day: 'numeric' 
        })
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return result;
  };

  // Process data for expense pie chart
  const getExpensePieData = () => {
    const expenseData = {};
    
    transactions.filter(t => t.type === 'expense').forEach(transaction => {
      const category = transaction.category;
      const amount = parseFloat(transaction.amount?.$numberInt || transaction.amount);
      
      if (!expenseData[category]) {
        expenseData[category] = 0;
      }
      expenseData[category] += amount;
    });
    
    return Object.entries(expenseData).map(([category, amount]) => ({
      name: category,
      value: amount
    })).sort((a, b) => b.value - a.value);
  };

  // Process data for income pie chart
  const getIncomePieData = () => {
    const incomeData = {};
    
    transactions.filter(t => t.type === 'income').forEach(transaction => {
      const category = transaction.category;
      const amount = parseFloat(transaction.amount?.$numberInt || transaction.amount);
      
      if (!incomeData[category]) {
        incomeData[category] = 0;
      }
      incomeData[category] += amount;
    });
    
    return Object.entries(incomeData).map(([category, amount]) => ({
      name: category,
      value: amount
    })).sort((a, b) => b.value - a.value);
  };

  // Get calendar data for the current month
  const getCalendarData = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // Get first day of month and last day of month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Create calendar grid
    const calendar = [];
    const currentDate = new Date(firstDay);
    
    // Add days from previous month to fill the first week
    const startDay = firstDay.getDay();
    for (let i = 0; i < startDay; i++) {
      const prevDate = new Date(firstDay);
      prevDate.setDate(prevDate.getDate() - (startDay - i));
      calendar.push({
        date: new Date(prevDate),
        isCurrentMonth: false,
        income: 0,
        expenses: 0,
        transactions: []
      });
    }
    
    // Add days of current month
    while (currentDate <= lastDay) {
      const dateKey = currentDate.toISOString().split('T')[0];
      const dayTransactions = transactions.filter(transaction => {
        let transactionDate;
        if (transaction.date instanceof Date) {
          transactionDate = transaction.date;
        } else if (transaction.date?.$date) {
          transactionDate = new Date(transaction.date.$date.$numberLong);
        } else {
          transactionDate = new Date(transaction.date);
        }
        return transactionDate.toISOString().split('T')[0] === dateKey;
      });
      
      const income = dayTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + parseFloat(t.amount?.$numberInt || t.amount), 0);
      
      const expenses = dayTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + parseFloat(t.amount?.$numberInt || t.amount), 0);
      
      calendar.push({
        date: new Date(currentDate),
        isCurrentMonth: true,
        income,
        expenses,
        net: income - expenses,
        transactions: dayTransactions || []
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return calendar;
  };

  // Get transactions for a specific date
  const getDateTransactions = (date) => {
    if (!date) return [];
    const dateKey = date.toISOString().split('T')[0];
    return transactions.filter(transaction => {
      let transactionDate;
      if (transaction.date instanceof Date) {
        transactionDate = transaction.date;
      } else if (transaction.date?.$date) {
        transactionDate = new Date(transaction.date.$date.$numberLong);
      } else {
        transactionDate = new Date(transaction.date);
      }
      return transactionDate.toISOString().split('T')[0] === dateKey;
    });
  };

  // Safe data processing with defaults
  const monthlyTrends = getMonthlyTrends() || [];
  const expensePieData = getExpensePieData() || [];
  const incomePieData = getIncomePieData() || [];
  const dailyTrends = getDailyTrends() || [];
  const calendarData = getCalendarData() || [];

  const handleDateClick = (date) => {
    setSelectedDate(date);
    setShowDateDetails(true);
  };

  const navigateMonth = (direction) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + direction);
    setCurrentMonth(newMonth);
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-3 shadow-sm">
          <p className="fw-bold mb-1">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="mb-0" style={{ color: entry.color }}>
              {entry.dataKey}: ${entry.value?.toFixed(2)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const DailyTrendsTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0]?.payload;
      return (
        <div className="bg-white p-3 border rounded-3 shadow-sm">
          <p className="fw-bold mb-1">{data?.formattedDate || label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="mb-0" style={{ color: entry.color }}>
              {entry.name}: ${entry.value?.toFixed(2)}
            </p>
          ))}
          {payload[0]?.payload && (
            <p className="mb-0 fw-bold mt-1">
              Net: ${payload[0].payload.net?.toFixed(2)}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  const PieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white p-3 border rounded-3 shadow-sm">
          <p className="fw-bold mb-1">{data.payload.name}</p>
          <p className="mb-0">${data.value?.toFixed(2)}</p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p>Loading analytics...</p>
        </div>
      </Container>
    );
  }

  // --- NEW: RENDER THIS VIEW IF THERE ARE NO TRANSACTIONS ---
  if (!loading && transactions.length === 0) {
    return (
      <Container 
          className="d-flex justify-content-center align-items-center" 
          style={{ minHeight: '80vh' }}
      >
          <div className="text-center text-muted">
              {error && (
                <Alert variant="warning" className="mb-4">
                  {error}
                </Alert>
              )}
              <BarChart3 size={48} className="mb-3" />
              <h4>No Financial Data Found</h4>
              <p>Start by adding your first transaction to see your reports.</p>
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
      <style>{`
      .custom-btn:hover {
        background-color: #0099ff6c !important; 
        color: white !important;         
      }
      
        .hover-card {
          transition: all 0.3s ease;
          border: 1px solid #007bff !important;
        }
        
        .hover-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 123, 255, 0.15) !important;
          border: 1px solid #0056b3 !important;
        }
        
        .calendar-day {
          border: 1px solid #e9ecef;
          padding: 8px;
          min-height: 100px;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          flex-direction: column;
        }
        
        .calendar-day.current-month {
          background-color: white;
        }
        
        .calendar-day.current-month:hover {
          background-color: rgba(0, 123, 255, 0.1);
          border-color: #007bff;
          transform: translateY(-1px);
          box-shadow: 0 2px 10px rgba(0, 123, 255, 0.1);
        }
        
        .calendar-day.other-month {
          background-color: #f8f9fa;
          color: #6c757d;
        }
        
        .calendar-day.has-transactions {
          background-color: #fff3cd;
          border-color: #ffc107;
        }
        
        .calendar-day.has-transactions:hover {
          background-color: rgba(255, 193, 7, 0.2);
          border-color: #e0a800;
        }
        
        .day-number {
          font-weight: bold;
          margin-bottom: 5px;
          font-size: 0.9rem;
        }
        
        .day-financials {
          font-size: 0.75rem;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
        }
        
        .income-indicator, .expense-indicator {
          display: flex;
          align-items: center;
          gap: 2px;
          margin-bottom: 2px;
        }
        
        .calendar-day-header {
          text-align: center;
          padding: 10px;
          font-weight: bold;
          background-color: #f8f9fa;
          border-bottom: 1px solid #dee2e6;
        }
        
        .calendar-grid {
          display: flex;
          flex-direction: column;
        }
        
        .calendar-header {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          border-bottom: 2px solid #dee2e6;
        }
        
        .calendar-body {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          grid-auto-rows: 1fr;
          gap: 1px;
          background-color: #dee2e6;
          border: 1px solid #dee2e6;
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

        .calendar-container {
          background: white;
          border-radius: 8px;
          overflow: hidden;
        }
      `}</style>

      {/* Header */}
      <Row className="my-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="mb-0 text-dark fw-bold">Financial Analytics</h2>
              <p className="text-muted mb-0">Detailed insights into your financial patterns</p>
            </div>
            <div className="d-flex gap-3 align-items-center">
             
            </div>
          </div>
        </Col>
      </Row>

      {/* Key Metrics */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="border-0 shadow-sm h-100 metric-card">
            <Card.Body className="text-center">
              <div className="bg-primary bg-opacity-10 p-3 rounded-circle d-inline-flex mb-3">
                <DollarSign className="text-primary" size={24} />
              </div>
              <h6 className="text-muted mb-1">Average Monthly Income</h6>
              <h4 className="mb-0 text-primary fw-bold">
                ${monthlyTrends.length ? (monthlyTrends.reduce((sum, month) => sum + month.income, 0) / monthlyTrends.length).toFixed(0) : '0'}
              </h4>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm h-100 metric-card">
            <Card.Body className="text-center">
              <div className="bg-danger bg-opacity-10 p-3 rounded-circle d-inline-flex mb-3">
                <TrendingDown className="text-danger" size={24} />
              </div>
              <h6 className="text-muted mb-1">Average Monthly Expenses</h6>
              <h4 className="mb-0 text-danger fw-bold">
                ${monthlyTrends.length ? (monthlyTrends.reduce((sum, month) => sum + month.expenses, 0) / monthlyTrends.length).toFixed(0) : '0'}
              </h4>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm h-100 metric-card">
            <Card.Body className="text-center">
              <div className="bg-success bg-opacity-10 p-3 rounded-circle d-inline-flex mb-3">
                <Target className="text-success" size={24} />
              </div>
              <h6 className="text-muted mb-1">Savings Rate</h6>
              <h4 className="mb-0 text-success fw-bold">
                {summary.income ? ((summary.balance / summary.income) * 100).toFixed(1) : '0'}%
              </h4>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm h-100 metric-card">
            <Card.Body className="text-center">
              <div className="bg-warning bg-opacity-10 p-3 rounded-circle d-inline-flex mb-3">
                <BarChart3 className="text-warning" size={24} />
              </div>
              <h6 className="text-muted mb-1">Total Transactions</h6>
              <h4 className="mb-0 text-warning fw-bold">
                {transactions.length}
              </h4>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* View Toggle - Only Overview and Trends */}
      <Row className="mb-4">
        <Col>
          <Card className="border-0 shadow-sm">
            <Card.Body className="py-2">
              <ButtonGroup className="w-100">
                <Button
                  variant={selectedView === 'overview' ? 'primary' : 'outline-primary'}
                  onClick={() => setSelectedView('overview')}
                  className="d-flex align-items-center justify-content-center gap-2 custom-btn"
                >
                  <BarChart3 size={16} />
                  Overview
                </Button>
                <Button
                  variant={selectedView === 'trends' ? 'primary' : 'outline-primary'}
                  onClick={() => setSelectedView('trends')}
                  className="d-flex align-items-center justify-content-center gap-2 custom-btn"
                >
                  <TrendingUp size={16} />
                  Trends
                </Button>
              </ButtonGroup>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Overview View */}
      {selectedView === 'overview' && (
        <>
          {/* Monthly Trends Chart */}
          <Row className="mb-4">
            <Col>
              <Card className="border-0 shadow-sm hover-card">
                <Card.Header className="bg-white border-0 py-3">
                  <h5 className="mb-0 d-flex align-items-center gap-2">
                    <TrendingUp size={20} /> Monthly Income vs Expenses
                  </h5>
                </Card.Header>
                <Card.Body>
                  <ResponsiveContainer width="100%" height={400}>
                    <AreaChart data={monthlyTrends}>
                      <defs>
                        <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="month" 
                        stroke="#6B7280"
                        fontSize={12}
                      />
                      <YAxis 
                        stroke="#6B7280"
                        fontSize={12}
                        tickFormatter={(value) => `$${value}`}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="income"
                        stackId="1"
                        stroke="#10B981"
                        fill="url(#incomeGradient)"
                        name="Income"
                      />
                      <Area
                        type="monotone"
                        dataKey="expenses"
                        stackId="2"
                        stroke="#EF4444"
                        fill="url(#expenseGradient)"
                        name="Expenses"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Pie Charts Row */}
          <Row className="mb-4">
            <Col md={6}>
              <Card className="border-0 shadow-sm h-100 hover-card">
                <Card.Header className="bg-white border-0 py-3">
                  <h5 className="mb-0 d-flex align-items-center gap-2">
                    <BarChart3 size={20} /> Expense Breakdown
                  </h5>
                </Card.Header>
                <Card.Body>
                  <ResponsiveContainer width="100%" height={350}>
                    <PieChart>
                      <Pie
                        data={expensePieData}
                        cx="50%"
                        cy="50%"
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {expensePieData.map((entry, index) => (
                          <Cell key={`expense-cell-${index}`} fill={colors[index % colors.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<PieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <Card className="border-0 shadow-sm h-100 hover-card">
                <Card.Header className="bg-white border-0 py-3">
                  <h5 className="mb-0 d-flex align-items-center gap-2">
                    <Target size={20} /> Income Sources
                  </h5>
                </Card.Header>
                <Card.Body>
                  <ResponsiveContainer width="100%" height={350}>
                    <PieChart>
                      <Pie
                        data={incomePieData}
                        cx="50%"
                        cy="50%"
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {incomePieData.map((entry, index) => (
                          <Cell key={`income-cell-${index}`} fill={colors[index % colors.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<PieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      )}

      {/* Trends View */}
      {selectedView === 'trends' && (
        <Row className="mb-4">
          <Col>
            <Card className="border-0 shadow-sm hover-card">
              <Card.Header className="bg-white border-0 py-3">
                <h5 className="mb-0 d-flex align-items-center gap-2">
                  <Activity size={20} /> Daily Financial Trends (Last 7 Days)
                </h5>
              </Card.Header>
              <Card.Body>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={dailyTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="shortDate" 
                      stroke="#6B7280"
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="#6B7280"
                      fontSize={12}
                      tickFormatter={(value) => `$${value}`}
                    />
                    <Tooltip content={<DailyTrendsTooltip />} />
                    <Legend />
                    <Bar
                      dataKey="income"
                      fill="#10B981"
                      name="Income"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="expenses"
                      fill="#EF4444"
                      name="Expenses"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Financial Calendar - Always displayed below Overview/Trends */}
      <Row className="mb-4">
        <Col>
          <Card className="border-0 shadow-sm hover-card">
            <Card.Header className="bg-white border-0 py-3">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0 d-flex align-items-center gap-2">
                  <Calendar size={20} /> Financial Calendar - {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h5>
                <div className="d-flex gap-2">
                  <Button variant="outline-secondary" size="sm" onClick={() => navigateMonth(-1)}>
                    &larr; Prev
                  </Button>
                  <Button variant="outline-secondary" size="sm" onClick={() => setCurrentMonth(new Date())}>
                    Today
                  </Button>
                  <Button variant="outline-secondary" size="sm" onClick={() => navigateMonth(1)}>
                    Next &rarr;
                  </Button>
                </div>
              </div>
            </Card.Header>
            <Card.Body className="p-0">
              <div className="calendar-container">
                <div className="calendar-header">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="calendar-day-header">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="calendar-body">
                  {calendarData.map((day, index) => (
                    <div
                      key={index}
                      className={`calendar-day ${day.isCurrentMonth ? 'current-month' : 'other-month'} ${
                        day.transactions.length > 0 ? 'has-transactions' : ''
                      }`}
                      onClick={() => day.isCurrentMonth && handleDateClick(day.date)}
                    >
                      <div className="day-number">
                        {day.date.getDate()}
                      </div>
                      <div className="day-financials">
                        {day.income > 0 && (
                          <div className="income-indicator text-success">
                            <Plus size={10} />
                            <small>${day.income}</small>
                          </div>
                        )}
                        {day.expenses > 0 && (
                          <div className="expense-indicator text-danger">
                            <Minus size={10} />
                            <small>${day.expenses}</small>
                          </div>
                        )}
                        {day.transactions.length > 0 && (
                          <Badge 
  bg="warning" 
  text="dark" 
  className="w-100" 
  style={{ fontSize: '0.7rem' }}
>
  {day.transactions.length}{" "}
  {day.transactions.length === 1 ? "transaction" : "transactions"}
</Badge>

                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Date Details Modal */}
      <Modal show={showDateDetails} onHide={() => setShowDateDetails(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            Transactions for {selectedDate?.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedDate && (
            <>
              <div className="d-flex gap-3 mb-3">
                <Badge bg="success" className="fs-6">
                  Income: ${getDateTransactions(selectedDate).filter(t => t.type === 'income').reduce((sum, t) => sum + parseFloat(t.amount?.$numberInt || t.amount), 0).toFixed(2)}
                </Badge>
                <Badge bg="danger" className="fs-6">
                  Expenses: ${getDateTransactions(selectedDate).filter(t => t.type === 'expense').reduce((sum, t) => sum + parseFloat(t.amount?.$numberInt || t.amount), 0).toFixed(2)}
                </Badge>
                <Badge bg="primary" className="fs-6">
                  Net: ${(getDateTransactions(selectedDate).filter(t => t.type === 'income').reduce((sum, t) => sum + parseFloat(t.amount?.$numberInt || t.amount), 0) - getDateTransactions(selectedDate).filter(t => t.type === 'expense').reduce((sum, t) => sum + parseFloat(t.amount?.$numberInt || t.amount), 0)).toFixed(2)}
                </Badge>
              </div>
              <ListGroup variant="flush">
                {getDateTransactions(selectedDate).map(transaction => (
                  <ListGroup.Item key={transaction._id} className="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="mb-1">{transaction.description}</h6>
                      <small className="text-muted">{transaction.category}</small>
                    </div>
                    <Badge bg={transaction.type === 'income' ? 'success' : 'danger'}>
                      {transaction.type === 'income' ? '+' : '-'}${parseFloat(transaction.amount?.$numberInt || transaction.amount).toFixed(2)}
                    </Badge>
                  </ListGroup.Item>
                ))}
                {getDateTransactions(selectedDate).length === 0 && (
                  <ListGroup.Item className="text-center text-muted">
                    No transactions for this date
                  </ListGroup.Item>
                )}
              </ListGroup>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDateDetails(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Reports;