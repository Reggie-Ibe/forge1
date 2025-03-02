// src/components/verification/VerificationList.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const VerificationList = ({ milestone }) => {
  const { user } = useAuth();
  const [verifications, setVerifications] = useState([]);
  const [verifiers, setVerifiers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    if (milestone) {
      fetchVerifications();
    }
  }, [milestone]);
  
  const fetchVerifications = async () => {
    setLoading(true);
    setError('');
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      // Fetch verifications for this milestone
      const response = await fetch(`${apiUrl}/verifications?milestoneId=${milestone.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch verifications');
      }
      
      const verificationsData = await response.json();
      setVerifications(verificationsData);
      
      // Fetch verifier details
      const verifierIds = [...new Set(verificationsData.map(v => v.verifierId))];
      const verifiersData = {};
      
      for (const verifierId of verifierIds) {
        const verifierResponse = await fetch(`${apiUrl}/users/${verifierId}`);
        if (verifierResponse.ok) {
          const verifierData = await verifierResponse.json();
          verifiersData[verifierId] = verifierData;
        }
      }
      
      setVerifiers(verifiersData);
      
    } catch (err) {
      console.error('Error fetching verifications:', err);
      setError(err.message || 'Failed to load verifications');
    } finally {
      setLoading(false);
    }
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
  
  if (!milestone) {
    return <div className="text-center py-4">No milestone selected</div>;
  }
  
  if (loading) {
    return <div className="flex justify-center py-4"><div className="animate-spin h-6 w-6 border-4 border-blue-500 rounded-full border-t-transparent"></div></div>;
  }
  
  if (error) {
    return <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4">{error}</div>;
  }
  
  return (
    <div className="verification-list bg-white rounded-lg shadow">
      <div className="p-4 border-b">
        <h3 className="text-lg font-medium text-gray-800">Verification History</h3>
        <p className="text-sm text-gray-600 mt-1">
          This milestone requires {milestone.verificationRequired || 1} verifications
        </p>
      </div>
      
      {verifications.length === 0 ? (
        <div className="p-6 text-center">
          <p className="text-gray-500">No verifications submitted yet</p>
          {(user.role === 'admin' || user.role === 'investor') && (
            <Link 
              to={`/projects/${milestone.projectId}/milestones/${milestone.id}/verify`} 
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              Submit Verification
            </Link>
          )}
        </div>
      ) : (
        <div className="p-4">
          <div className="space-y-6">
            {verifications.map((verification) => {
              const verifier = verifiers[verification.verifierId] || { 
                firstName: 'User', 
                lastName: `#${verification.verifierId}`,
                role: verification.verifierRole
              };
              
              return (
                <div key={verification.id} className="border-l-4 border-blue-500 pl-4 pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 font-semibold">
                          {verifier.firstName?.[0]}{verifier.lastName?.[0]}
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">
                            {verifier.firstName} {verifier.lastName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {verifier.role.charAt(0).toUpperCase() + verifier.role.slice(1)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatDate(verification.verificationDate)}
                    </div>
                  </div>
                  
                  {verification.comment && (
                    <div className="mt-3 text-sm text-gray-700">
                      <p className="font-medium">Comments:</p>
                      <p className="mt-1">{verification.comment}</p>
                    </div>
                  )}
                  
                  <div className="mt-3">
                    <p className="text-sm font-medium text-gray-700 mb-2">Criteria verified:</p>
                    <div className="space-y-2">
                      {verification.criteriaVerified.map((criterion) => {
                        const criterionDetails = milestone.criteria.find(c => c.id === criterion.criterionId);
                        
                        return (
                          <div key={criterion.criterionId} className="flex items-start">
                            <div className={`flex-shrink-0 h-5 w-5 rounded-full ${criterion.verified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} flex items-center justify-center`}>
                              {criterion.verified ? '✓' : '✕'}
                            </div>
                            <div className="ml-2">
                              <p className="text-sm text-gray-900">{criterionDetails?.description || `Criterion #${criterion.criterionId}`}</p>
                              {criterion.comment && (
                                <p className="text-xs text-gray-500 mt-1">{criterion.comment}</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {verifications.length < (milestone.verificationRequired || 1) && (user.role === 'admin' || user.role === 'investor') && (
            <div className="mt-6 text-center">
              <Link 
                to={`/projects/${milestone.projectId}/milestones/${milestone.id}/verify`} 
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
              >
                Submit Verification
              </Link>
              <p className="text-sm text-gray-500 mt-2">
                {(milestone.verificationRequired || 1) - verifications.length} more {(milestone.verificationRequired || 1) - verifications.length === 1 ? 'verification' : 'verifications'} required
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VerificationList;