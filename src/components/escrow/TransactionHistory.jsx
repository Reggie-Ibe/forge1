// src/components/escrow/TransactionHistory.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const TransactionHistory = ({ projectId, limit = 0 }) => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [projects, setProjects] = useState({});
  const [users, setUsers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    type: '',
    dateRange: 'all'
  });
  
  useEffect(() => {
    fetchTransactions();
  }, [projectId]);
  
  const fetchTransactions = async () => {
    setLoading(true);
    setError('');
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      // Fetch escrow transactions
      let url = `${apiUrl}/escrowTransactions?`;
      if (projectId) {
        url += `projectId=${projectId}&`;
      }
      url += '_sort=createdAt&_order=desc';
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch transaction history');
      }
      
      let transactionsData = await response.json();
      
      // Apply limit if specified
      if (limit > 0) {
        transactionsData = transactionsData.slice(0, limit);
      }
      
      setTransactions(transactionsData);
      
      // Fetch related projects and users
      const projectIds = [...new Set(transactionsData.map(t => t.projectId))];
      const userIds = [...new Set([
        ...transactionsData.map(t => t.fromUserId),
        ...transactionsData.map(t => t.toUserId),
        ...transactionsData.map(t => t.approvedBy)
      ].filter(Boolean))];
      
      const projectsData = {};
      const usersData = {};
      
      // Fetch projects
      for (const pid of projectIds) {
        if (pid) {
          const projectResponse = await fetch(`${apiUrl}/projects/${pid}`);
          if (projectResponse.ok) {
            const project = await projectResponse.json();
            projectsData[pid] = project;
          }
        }
      }
      
      // Fetch users
      for (const uid of userIds) {
        if (uid) {
          const userResponse = await fetch(`${apiUrl}/users/${uid}`);
          if (userResponse.ok) {
            const userData = await userResponse.json();
            usersData[uid] = userData;
          }
        }
      }
      
      setProjects(projectsData);
      setUsers(usersData);
      
    } catch (err) {
      console.error('Error fetching transaction history:', err);
      setError(err.message || 'Failed to load transaction history');
    } finally {
      setLoading(false);
    }
  };
  
  // Apply filters to transactions
  const getFilteredTransactions = () => {
    return transactions.filter(transaction => {
      // Filter by type
      if (filters.type && transaction.type !== filters.type) {
        return false;
      }
      
      // Filter by date range
      if (filters.dateRange !== 'all') {
        const transactionDate = new Date(transaction.createdAt);
        const now = new Date();
        
        if (filters.dateRange === 'today') {
          return transactionDate.toDateString() === now.toDateString();
        } else if (filters.dateRange === 'week') {
          const oneWeekAgo = new Date(now.setDate(now.getDate() - 7));
          return transactionDate >= oneWeekAgo;
        } else if (filters.dateRange === 'month') {
          const oneMonthAgo = new Date(now.setMonth(now.getMonth() - 1));
          return transactionDate >= oneMonthAgo;
        }
      }
      
      return true;
    });
  };
  
  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };
  
  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Get transaction type display
  const getTransactionTypeDisplay = (type) => {
    switch (type) {
      case 'deposit':
        return 'Deposit to Escrow';
      case 'release':
        return 'Release from Escrow';
      case 'refund':
        return 'Refund from Escrow';
      case 'transfer':
        return 'Transfer';
      default:
        return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };
  
  // Get transaction color class
  const getTransactionColorClass = (type) => {
    switch (type) {
      case 'deposit':
        return 'bg-blue-100 text-blue-800';
      case 'release':
        return 'bg-green-100 text-green-800';
      case 'refund':
        return 'bg-yellow-100 text-yellow-800';
      case 'transfer':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Handle filter change
  const handleFilterChange = (name, value) => {
    setFilters({
      ...filters,
      [name]: value
    });
  };
  
  // Get user name
  const getUserName = (userId) => {
    if (!userId) return 'System';
    
    const user = users[userId];
    if (user) {
      return `${user.firstName} ${user.lastName}`;
    }
    
    return `User #${userId}`;
  };
  
  // Get project name
  const getProjectName = (projectId) => {
    if (!projectId) return 'N/A';
    
    const project = projects[projectId];
    if (project) {
      return project.title;
    }
    
    return `Project #${projectId}`;
  };
  
  if (loading) {
    return <div className="flex justify-center py-4"><div className="animate-spin h-6 w-6 border-4 border-blue-500 rounded-full border-t-transparent"></div></div>;
  }
  
  if (error) {
    return <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4">{error}</div>;
  }
  
  const filteredTransactions = getFilteredTransactions();
  
  return (
    <div className="transaction-history bg-white rounded-lg shadow">
      <div className="p-4 border-b flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-800">
          {projectId ? 'Project Escrow Transactions' : 'Escrow Transaction History'}
        </h3>
        
        {!limit && (
          <div className="flex space-x-2">
            <select
              className="block w-full pl-3 pr-10 py-1.5 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
            >
              <option value="">All Types</option>
              <option value="deposit">Deposits</option>
              <option value="release">Releases</option>
              <option value="refund">Refunds</option>
              <option value="transfer">Transfers</option>
            </select>
            
            <select
              className="block w-full pl-3 pr-10 py-1.5 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              value={filters.dateRange}
              onChange={(e) => handleFilterChange('dateRange', e.target.value)}
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>
          </div>
        )}
      </div>
      
      {filteredTransactions.length === 0 ? (
        <div className="p-6 text-center">
          <p className="text-gray-500">No transactions found</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction ID</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                {!projectId && (
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                )}
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">From</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">To</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTransactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {transaction.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(transaction.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getTransactionColorClass(transaction.type)}`}>
                      {getTransactionTypeDisplay(transaction.type)}
                    </span>
                  </td>
                  {!projectId && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getProjectName(transaction.projectId)}
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getUserName(transaction.fromUserId)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getUserName(transaction.toUserId)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                    {formatCurrency(transaction.amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      transaction.status === 'completed' ? 'bg-green-100 text-green-800' :
                      transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      transaction.status === 'failed' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {limit > 0 && transactions.length > limit && (
        <div className="p-4 border-t text-center">
          <button 
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            onClick={() => {/* Add view all handler */}}
          >
            View All Transactions
          </button>
        </div>
      )}
    </div>
  );
};

export default TransactionHistory;