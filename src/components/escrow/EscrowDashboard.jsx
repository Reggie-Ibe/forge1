// src/components/escrow/EscrowDashboard.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const EscrowDashboard = ({ projectId }) => {
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [investments, setInvestments] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [escrowBalance, setEscrowBalance] = useState(0);
  const [pendingReleases, setPendingReleases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    fetchProjectData();
  }, [projectId]);
  
  const fetchProjectData = async () => {
    setLoading(true);
    setError('');
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      // Fetch project details
      const projectResponse = await fetch(`${apiUrl}/projects/${projectId}`);
      if (!projectResponse.ok) throw new Error('Project not found');
      
      const projectData = await projectResponse.json();
      setProject(projectData);
      
      // Fetch investments for this project
      const investmentsResponse = await fetch(`${apiUrl}/investments?projectId=${projectId}`);
      if (investmentsResponse.ok) {
        const investmentsData = await investmentsResponse.json();
        setInvestments(investmentsData);
        
        // Calculate total escrow balance
        const totalInvested = investmentsData.reduce((sum, inv) => sum + inv.amount, 0);
        let totalReleased = 0;
        
        // Calculate released funds
        investmentsData.forEach(investment => {
          if (investment.disbursementSchedule) {
            investment.disbursementSchedule.forEach(phase => {
              if (phase.released) {
                totalReleased += phase.amount;
              }
            });
          }
        });
        
        setEscrowBalance(totalInvested - totalReleased);
        
        // Identify pending releases
        const pending = [];
        investmentsData.forEach(investment => {
          if (investment.disbursementSchedule) {
            investment.disbursementSchedule.forEach(phase => {
              if (!phase.released && phase.status === 'pending_approval') {
                pending.push({
                  investmentId: investment.id,
                  phase: phase.phase,
                  amount: phase.amount,
                  investorId: investment.userId
                });
              }
            });
          }
        });
        
        setPendingReleases(pending);
      }
      
      // Fetch milestones
      const milestonesResponse = await fetch(`${apiUrl}/milestones?projectId=${projectId}`);
      if (milestonesResponse.ok) {
        const milestonesData = await milestonesResponse.json();
        setMilestones(milestonesData);
      }
      
    } catch (err) {
      console.error('Error fetching project data:', err);
      setError(err.message || 'Failed to load project data');
    } finally {
      setLoading(false);
    }
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
      month: 'long',
      day: 'numeric',
    });
  };

  // Calculate milestone completion percentage
  const getMilestoneProgress = () => {
    if (!milestones.length) return 0;
    
    const completedCount = milestones.filter(m => 
      m.status === 'completed' && m.adminApproved
    ).length;
    
    return (completedCount / milestones.length) * 100;
  };
  
  if (loading) {
    return <div className="flex justify-center py-8"><div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div></div>;
  }
  
  if (error) {
    return <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">{error}</div>;
  }
  
  if (!project) {
    return <div className="text-center py-8">Project not found</div>;
  }

  return (
    <div className="escrow-dashboard">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-700 mb-2 flex items-center">
            <span className="mr-2">💰</span> Escrow Balance
          </h3>
          <p className="text-2xl font-bold text-blue-600">{formatCurrency(escrowBalance)}</p>
          <p className="text-sm text-gray-500">Total funds in escrow</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-700 mb-2 flex items-center">
            <span className="mr-2">✅</span> Released Funds
          </h3>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(project.currentFunding)}
          </p>
          <p className="text-sm text-gray-500">
            {project.fundingGoal ? `${Math.round((project.currentFunding / project.fundingGoal) * 100)}% of goal` : 'Total released'}
          </p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-700 mb-2 flex items-center">
            <span className="mr-2">⏳</span> Pending Release
          </h3>
          <p className="text-2xl font-bold text-yellow-600">
            {formatCurrency(pendingReleases.reduce((sum, pr) => sum + pr.amount, 0))}
          </p>
          <p className="text-sm text-gray-500">{pendingReleases.length} pending approvals</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-700 mb-2 flex items-center">
            <span className="mr-2">🎯</span> Milestone Progress
          </h3>
          <p className="text-2xl font-bold text-purple-600">
            {Math.round(getMilestoneProgress())}%
          </p>
          <p className="text-sm text-gray-500">
            {milestones.filter(m => m.status === 'completed' && m.adminApproved).length} of {milestones.length} completed
          </p>
        </div>
      </div>
      
      {/* Transaction History Section */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-700">Recent Escrow Transactions</h3>
          <button className="text-blue-600 hover:text-blue-800 text-sm">View All</button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Milestone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Investor</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {/* Example transaction rows - in a real app, map through actual transactions */}
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">2023-02-15</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Release</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Prototype Completion</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Investor #1</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">$25,000</td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Completed</span>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">2023-01-10</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Release</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Initial Release</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Investor #2</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">$15,000</td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Completed</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Pending Verifications */}
      {pendingReleases.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Pending Fund Releases</h3>
          
          <div className="space-y-4">
            {pendingReleases.map((release, index) => (
              <div key={index} className="border border-yellow-200 bg-yellow-50 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-900">{release.phase}</p>
                    <p className="text-sm text-gray-600">Investor #{release.investorId}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{formatCurrency(release.amount)}</p>
                    <p className="text-xs text-yellow-600">Awaiting verification</p>
                  </div>
                </div>
                <div className="mt-4 flex justify-end space-x-2">
                  <button className="px-3 py-1 bg-white border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50">
                    View Details
                  </button>
                  <button className="px-3 py-1 bg-blue-600 rounded-md text-sm text-white hover:bg-blue-700">
                    Verify & Approve
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Milestone Verification Status */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-medium text-gray-700 mb-4">Milestone Verification Status</h3>
        
        <div className="space-y-6">
          {milestones.map((milestone, index) => (
            <div key={milestone.id} className="border-l-4 pl-4 pb-2" style={{ 
              borderColor: milestone.status === 'completed' && milestone.adminApproved 
                ? '#10B981' // green for completed
                : milestone.status === 'completed' && !milestone.adminApproved 
                ? '#F59E0B' // yellow for awaiting approval
                : milestone.status === 'inProgress' 
                ? '#3B82F6' // blue for in progress
                : '#9CA3AF' // gray for pending
            }}>
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium text-gray-900">{milestone.title}</h4>
                  <p className="text-sm text-gray-600">{milestone.description.substring(0, 100)}...</p>
                </div>
                <div className="flex items-center">
                  {milestone.status === 'completed' && milestone.adminApproved ? (
                    <span className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                      Verified & Completed
                    </span>
                  ) : milestone.status === 'completed' && !milestone.adminApproved ? (
                    <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                      Awaiting Verification
                    </span>
                  ) : milestone.status === 'inProgress' ? (
                    <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                      In Progress
                    </span>
                  ) : (
                    <span className="bg-gray-100 text-gray-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                      Pending
                    </span>
                  )}
                </div>
              </div>
              
              {milestone.status === 'completed' && !milestone.adminApproved && (
                <div className="mt-3 flex justify-end">
                  <button className="px-3 py-1 bg-blue-600 rounded-md text-sm text-white hover:bg-blue-700">
                    Review & Verify
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EscrowDashboard;