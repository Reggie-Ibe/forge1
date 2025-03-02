// src/components/escrow/MilestoneTimeline.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const MilestoneTimeline = ({ projectId, milestones, investments }) => {
  const { user } = useAuth();
  const [timelineItems, setTimelineItems] = useState([]);
  
  useEffect(() => {
    if (milestones && investments) {
      generateTimelineItems();
    }
  }, [milestones, investments]);
  
  const generateTimelineItems = () => {
    // Create a combined timeline of milestones and funding releases
    const items = [];
    
    // Add milestone items
    milestones.forEach(milestone => {
      items.push({
        type: 'milestone',
        id: `milestone-${milestone.id}`,
        title: milestone.title,
        description: milestone.description,
        date: milestone.dueDate,
        status: milestone.status,
        approved: milestone.adminApproved,
        completedDate: milestone.completedDate,
        approvedDate: milestone.approvedDate,
        weight: milestone.weight || 0.25, // Default to 25% if not specified
        data: milestone
      });
    });
    
    // Add investment release items
    investments.forEach(investment => {
      if (investment.disbursementSchedule) {
        investment.disbursementSchedule.forEach(phase => {
          items.push({
            type: 'release',
            id: `release-${investment.id}-${phase.phase.replace(/\s+/g, '-').toLowerCase()}`,
            title: phase.phase,
            description: phase.condition,
            date: phase.releaseDate || null, // Might be null if not released yet
            status: phase.released ? 'completed' : 'pending',
            amount: phase.amount,
            percentage: phase.percentage,
            investmentId: investment.id,
            investorId: investment.userId,
            data: { ...phase, investmentId: investment.id }
          });
        });
      }
    });
    
    // Sort the timeline by date
    items.sort((a, b) => {
      // If both have dates, compare them
      if (a.date && b.date) {
        return new Date(a.date) - new Date(b.date);
      }
      // Put items without dates at the end
      if (!a.date) return 1;
      if (!b.date) return -1;
      return 0;
    });
    
    setTimelineItems(items);
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
    if (!dateString) return 'TBD';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Format relative time (e.g., "in 2 days" or "3 days ago")
  const formatRelativeTime = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 0) {
      return `in ${diffDays} ${diffDays === 1 ? 'day' : 'days'}`;
    } else if (diffDays < 0) {
      return `${Math.abs(diffDays)} ${Math.abs(diffDays) === 1 ? 'day' : 'days'} ago`;
    } else {
      return 'today';
    }
  };
  
  // Get status color
  const getStatusColor = (item) => {
    if (item.type === 'milestone') {
      if (item.status === 'completed' && item.approved) {
        return 'bg-green-500'; // Completed and approved
      } else if (item.status === 'completed' && !item.approved) {
        return 'bg-yellow-500'; // Completed but not approved
      } else if (item.status === 'inProgress') {
        return 'bg-blue-500'; // In progress
      } else {
        return 'bg-gray-300'; // Pending
      }
    } else if (item.type === 'release') {
      if (item.status === 'completed') {
        return 'bg-green-500'; // Released
      } else {
        return 'bg-indigo-300'; // Pending release
      }
    }
    
    return 'bg-gray-300';
  };
  
  // Find the active (current) item
  const findActiveItemIndex = () => {
    // First, look for in-progress milestones
    const inProgressIndex = timelineItems.findIndex(
      item => item.type === 'milestone' && item.status === 'inProgress'
    );
    
    if (inProgressIndex !== -1) return inProgressIndex;
    
    // Then, look for the first pending milestone
    const pendingIndex = timelineItems.findIndex(
      item => item.type === 'milestone' && item.status === 'pending'
    );
    
    if (pendingIndex !== -1) return pendingIndex;
    
    // If no in-progress or pending milestones, find the first pending release
    const pendingReleaseIndex = timelineItems.findIndex(
      item => item.type === 'release' && item.status === 'pending'
    );
    
    if (pendingReleaseIndex !== -1) return pendingReleaseIndex;
    
    // If everything is complete, return the last item
    if (timelineItems.length > 0) {
      return timelineItems.length - 1;
    }
    
    return -1;
  };
  
  const activeItemIndex = findActiveItemIndex();
  
  if (!milestones || !investments) {
    return <div className="text-center py-4">Loading timeline...</div>;
  }
  
  if (timelineItems.length === 0) {
    return <div className="text-center py-4">No timeline items available</div>;
  }
  
  return (
    <div className="milestone-timeline">
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200"></div>
        
        {/* Timeline items */}
        <div className="space-y-8">
          {timelineItems.map((item, index) => (
            <div key={item.id} className={`relative pl-20 ${index === activeItemIndex ? 'opacity-100' : 'opacity-70'}`}>
              {/* Circle indicator */}
              <div className={`absolute left-6 w-5 h-5 rounded-full z-10 transform -translate-x-1/2 ${getStatusColor(item)}`}></div>
              
              {/* Content */}
              <div className={`p-4 rounded-lg border ${index === activeItemIndex ? 'border-blue-300 shadow-md' : 'border-gray-200'}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-lg font-medium text-gray-900">{item.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-sm text-gray-500">{formatDate(item.date)}</span>
                    {item.date && (
                      <span className="text-xs text-gray-400">{formatRelativeTime(item.date)}</span>
                    )}
                  </div>
                </div>
                
                {/* Item-specific details */}
                {item.type === 'milestone' && (
                  <div className="mt-3">
                    <div className="flex items-center">
                      <div className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        item.status === 'completed' && item.approved ? 'bg-green-100 text-green-800' :
                        item.status === 'completed' && !item.approved ? 'bg-yellow-100 text-yellow-800' :
                        item.status === 'inProgress' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {item.status === 'completed' && item.approved ? 'Completed & Verified' :
                         item.status === 'completed' && !item.approved ? 'Awaiting Verification' :
                         item.status === 'inProgress' ? 'In Progress' : 'Pending'}
                      </div>
                      <span className="ml-2 text-xs text-gray-500">Weight: {(item.weight * 100).toFixed(0)}%</span>
                    </div>
                    
                    {item.completedDate && (
                      <p className="text-xs text-gray-500 mt-1">
                        Completed on {formatDate(item.completedDate)}
                      </p>
                    )}
                    
                    {item.status === 'completed' && !item.approved && user.role === 'admin' && (
                      <div className="mt-3">
                        <Link 
                          to={`/projects/${projectId}/milestones/${item.data.id}/verify`}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                        >
                          Review & Verify
                        </Link>
                      </div>
                    )}
                  </div>
                )}
                
                {item.type === 'release' && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          item.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-indigo-100 text-indigo-800'
                        }`}>
                          {item.status === 'completed' ? 'Released' : 'Pending Release'}
                        </div>
                        <span className="ml-2 text-xs text-gray-500">{item.percentage}% of investment</span>
                      </div>
                      <span className="font-semibold text-gray-900">{formatCurrency(item.amount)}</span>
                    </div>
                    
                    {item.status === 'completed' && item.date && (
                      <p className="text-xs text-gray-500 mt-1">
                        Released on {formatDate(item.date)}
                      </p>
                    )}
                    
                    {item.status !== 'completed' && user.role === 'admin' && (
                      <div className="mt-3">
                        <button 
                          className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                          onClick={() => {/* Add release funds handling */}}
                        >
                          Release Funds
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MilestoneTimeline;