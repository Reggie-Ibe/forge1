import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeView, setActiveView] = useState('overview');
  const [fundingTrend, setFundingTrend] = useState([]);
  const [milestoneMetrics, setMilestoneMetrics] = useState({ completed: 0, inProgress: 0, pending: 0, total: 0 });
  const [sdgImpact, setSdgImpact] = useState([]);

  useEffect(() => {
    const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      navigate('/login');
    }
    fetchMockData();
  }, []);

  const fetchMockData = () => {
    setFundingTrend([
      { month: 'Jan', funding: 125000 },
      { month: 'Feb', funding: 210000 },
      { month: 'Mar', funding: 350000 },
      { month: 'Apr', funding: 475000 },
      { month: 'May', funding: 520000 },
      { month: 'Jun', funding: 620000 }
    ]);

    setMilestoneMetrics({ completed: 10, inProgress: 5, pending: 3, total: 18 });

    setSdgImpact([
      { name: 'No Poverty', value: 5 },
      { name: 'Zero Hunger', value: 3 },
      { name: 'Clean Water', value: 4 }
    ]);
  };

  return (
    <div className="bg-gray-50 p-6 rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Dashboard</h1>
      <div className="mb-4 flex space-x-4">
        {['overview', 'funding', 'milestones', 'impact'].map((view) => (
          <button
            key={view}
            onClick={() => setActiveView(view)}
            className={`px-4 py-2 text-sm font-medium ${
              activeView === view ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'
            } rounded`}
          >
            {view.charAt(0).toUpperCase() + view.slice(1)}
          </button>
        ))}
      </div>

      {activeView === 'overview' && (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={fundingTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="funding" stroke="#3B82F6" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {activeView === 'funding' && (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={fundingTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="funding" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {activeView === 'milestones' && (
        <div className="p-4 bg-white shadow rounded">
          <h2 className="text-lg font-semibold mb-2">Milestone Completion</h2>
          <p>Completed: {milestoneMetrics.completed}</p>
          <p>In Progress: {milestoneMetrics.inProgress}</p>
          <p>Pending: {milestoneMetrics.pending}</p>
        </div>
      )}

      {activeView === 'impact' && (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={sdgImpact} cx="50%" cy="50%" outerRadius={80} fill="#8884d8" label>
                {sdgImpact.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={['#E5243B', '#DDA63A', '#4C9F38'][index % 3]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
