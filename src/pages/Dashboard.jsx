// src/pages/Dashboard.jsx
import { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  BarChart, Bar, PieChart, Pie, Cell 
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [activeView, setActiveView] = useState('overview');
  const [fundingTrend, setFundingTrend] = useState([]);
  const [milestoneMetrics, setMilestoneMetrics] = useState({ completed: 0, inProgress: 0, pending: 0, total: 0 });
  const [sdgImpact, setSdgImpact] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    // Fetch dashboard data
    fetchDashboardData();
  }, [isAuthenticated, navigate]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    
    try {
      // In a real app, these would be API calls
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      // Fetch projects
      if (user) {
        const projectsResponse = await fetch(`${apiUrl}/projects?userId=${user.id}`);
        if (projectsResponse.ok) {
          const projectsData = await projectsResponse.json();
          setProjects(projectsData);
        }
      }
      
      // For demo purposes, we'll use mock data
      setMockData();
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const setMockData = () => {
    // Mock funding trend data
    setFundingTrend([
      { month: 'Jan', funding: 125000 },
      { month: 'Feb', funding: 210000 },
      { month: 'Mar', funding: 350000 },
      { month: 'Apr', funding: 475000 },
      { month: 'May', funding: 520000 },
      { month: 'Jun', funding: 620000 }
    ]);

    // Mock milestone metrics
    setMilestoneMetrics({ 
      completed: 10, 
      inProgress: 5, 
      pending: 3, 
      total: 18 
    });

    // Mock SDG impact data
    setSdgImpact([
      { name: 'No Poverty', value: 5, color: '#E5243B' },
      { name: 'Zero Hunger', value: 3, color: '#DDA63A' },
      { name: 'Clean Water', value: 4, color: '#4C9F38' },
      { name: 'Climate Action', value: 6, color: '#3F7E44' },
      { name: 'Quality Education', value: 2, color: '#C5192D' }
    ]);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(value);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="text-center bg-white p-8 shadow-md rounded-lg">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-xl font-bold mt-4">Error</h2>
          <p className="mt-2 text-gray-600">{error}</p>
          <button 
            onClick={fetchDashboardData} 
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* View Tabs */}
        <div className="mb-6 flex space-x-2 overflow-x-auto">
          {['overview', 'funding', 'milestones', 'impact'].map((view) => (
            <button
              key={view}
              onClick={() => setActiveView(view)}
              className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
                activeView === view 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              } shadow-sm`}
            >
              {view.charAt(0).toUpperCase() + view.slice(1)}
            </button>
          ))}
        </div>
        
        {/* Welcome Card */}
        {activeView === 'overview' && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Welcome back, {user?.firstName || 'User'}!
            </h2>
            <p className="text-gray-600">
              Here's an overview of your {user?.role === 'investor' ? 'investments' : 'projects'} performance.
            </p>
          </div>
        )}
        
        {/* Content based on active view */}
        <div className="bg-white shadow rounded-lg p-6">
          {/* Overview */}
          {activeView === 'overview' && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Funding Overview</h2>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={fundingTrend}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis 
                      tickFormatter={(value) => `$${value / 1000}k`}
                      domain={[0, 'dataMax + 100000']}
                    />
                    <Tooltip 
                      formatter={(value) => [formatCurrency(value), 'Funding']}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="funding" 
                      stroke="#3B82F6" 
                      strokeWidth={2}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
          
          {/* Funding */}
          {activeView === 'funding' && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Monthly Funding</h2>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={fundingTrend}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis 
                      tickFormatter={(value) => `$${value / 1000}k`}
                    />
                    <Tooltip 
                      formatter={(value) => [formatCurrency(value), 'Funding']}
                    />
                    <Legend />
                    <Bar dataKey="funding" fill="#10B981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-blue-800 text-lg font-medium mb-2">Total Funding</h3>
                  <p className="text-blue-900 text-2xl font-bold">
                    {formatCurrency(fundingTrend.reduce((acc, item) => acc + item.funding, 0))}
                  </p>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="text-green-800 text-lg font-medium mb-2">Average Monthly</h3>
                  <p className="text-green-900 text-2xl font-bold">
                    {formatCurrency(fundingTrend.reduce((acc, item) => acc + item.funding, 0) / fundingTrend.length)}
                  </p>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="text-purple-800 text-lg font-medium mb-2">Growth Rate</h3>
                  <p className="text-purple-900 text-2xl font-bold">
                    {fundingTrend.length > 1 ? 
                      `${(((fundingTrend[fundingTrend.length - 1].funding / fundingTrend[0].funding) - 1) * 100).toFixed(1)}%` : 
                      'N/A'}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Milestones */}
          {activeView === 'milestones' && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Milestone Completion</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <div className="flex items-center">
                    <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Total</p>
                      <p className="text-xl font-bold text-gray-900">{milestoneMetrics.total}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <div className="flex items-center">
                    <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mr-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Completed</p>
                      <p className="text-xl font-bold text-gray-900">{milestoneMetrics.completed}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <div className="flex items-center">
                    <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center mr-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">In Progress</p>
                      <p className="text-xl font-bold text-gray-900">{milestoneMetrics.inProgress}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <div className="flex items-center">
                    <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mr-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Pending</p>
                      <p className="text-xl font-bold text-gray-900">{milestoneMetrics.pending}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="overflow-hidden bg-white shadow sm:rounded-lg mt-6">
                <div className="px-4 py-5 sm:px-6">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">Recent Updates</h3>
                </div>
                <div className="border-t border-gray-200">
                  <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Prototype Development</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                      <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                        In Progress
                      </span>
                      <p className="mt-1">Engineering team is finalizing the first working prototype. Expected completion next week.</p>
                    </dd>
                  </div>
                  <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Patent Application</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                      <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                        Pending
                      </span>
                      <p className="mt-1">Legal team is preparing documentation for patent application.</p>
                    </dd>
                  </div>
                  <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Market Research</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                        Completed
                      </span>
                      <p className="mt-1">Initial market research and competitive analysis has been completed.</p>
                    </dd>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Impact */}
          {activeView === 'impact' && (
            <div>
              <h2 className="text-lg font-semibold mb-4">SDG Impact</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={sdgImpact}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        dataKey="value"
                      >
                        {sdgImpact.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                <div>
                  <h3 className="text-md font-medium mb-4">Impact Breakdown</h3>
                  <div className="space-y-4">
                    {sdgImpact.map((sdg, index) => (
                      <div key={index} className="flex items-center">
                        <div 
                          className="w-4 h-4 mr-2" 
                          style={{ backgroundColor: sdg.color }}
                        ></div>
                        <div className="flex-1">
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium text-gray-700">{sdg.name}</span>
                            <span className="text-sm font-medium text-gray-700">{sdg.value} projects</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="h-2 rounded-full" 
                              style={{ 
                                width: `${(sdg.value / sdgImpact.reduce((acc, item) => acc + item.value, 0)) * 100}%`,
                                backgroundColor: sdg.color 
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="mt-8">
                <h3 className="text-md font-medium mb-4">Impact Stories</h3>
                <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                  <p className="text-green-700 font-medium">Project Spotlight: Clean Water Initiative</p>
                  <p className="text-green-600 mt-2">
                    Our clean water project has successfully provided access to clean drinking water for over 5,000 people in rural communities, contributing directly to SDG 6 (Clean Water and Sanitation).
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;