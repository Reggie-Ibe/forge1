// src/components/escrow/VerificationStatusBoard.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const VerificationStatusBoard = ({ milestone, verifications = [] }) => {
  const { user } = useAuth();
  const [verifiers, setVerifiers] = useState({});
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (milestone && verifications.length > 0) {
      fetchVerifierDetails();
    } else {
      setLoading(false);
    }
  }, [milestone, verifications]);
  
  const fetchVerifierDetails = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      // Get unique verifier IDs
      const verifierIds = [...new Set(verifications.map(v => v.verifierId))];
      
      // Fetch user details for each verifier
      const verifiersData = {};
      for (const verifierId of verifierIds) {
        const response = await fetch(`${apiUrl}/users/${verifierId}`);
        if (response.ok) {
          const userData = await response.json();
          verifiersData[verifierId] = userData;
        }
      }
      
      setVerifiers(verifiersData);
    } catch (error) {
      console.error('Error fetching verifier details:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Get verifier name
  const getVerifierName = (verifierId) => {
    const verifier = verifiers[verifierId];
    if (verifier) {
      return `${verifier.firstName} ${verifier.lastName}`;
    }
    return `User #${verifierId}`;
  };
  
  // Get verifier role display
  const getVerifierRoleDisplay = (role) => {
    switch (role) {
      case 'admin':
        return 'Administrator';
      case 'investor':
        return 'Lead Investor';
      case 'innovator':
        return 'Project Owner';
      default:
        return role.charAt(0).toUpperCase() + role.slice(1);
    }
  };
  
  if (!milestone) {
    return <div className="text-center py-4">No milestone selected</div>;
  }
  
  const verificationRequired = milestone.verificationRequired || 1;
  const verificationProgress = verifications.length / verificationRequired * 100;
  
  return (
    <div className="verification-status-board bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 border-b">
        <h3 className="text-lg font-medium text-gray-800">Verification Status</h3>
        <p className="text-sm text-gray-600 mt-1">
          Milestone: {milestone.title}
        </p>
      </div>
      
      <div className="p-4">
        {/* Progress indicator */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium text-gray-700">Verification Progress</span>
            <span className="text-sm font-semibold text-gray-700">
              {verifications.length} of {verificationRequired} complete
            </span>
          </div>
          <div className="overflow-hidden h-2 rounded-full bg-gray-200">
            <div 
              className="h-full bg-blue-600 rounded-full" 
              style={{ width: `${Math.min(verificationProgress, 100)}%` }}
            ></div>
          </div>
        </div>
        
        {/* Verification timeline */}
        <div className="mt-6">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Verification Timeline</h4>
          
          {loading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin h-5 w-5 border-2 border-blue-500 rounded-full border-t-transparent"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {verifications.map((verification) => (
                <div key={verification.id} className="relative pl-8 pb-4">
                  {/* Vertical line */}
                  <div className="absolute top-0 left-3 h-full w-px bg-gray-200"></div>
                  
                  {/* Circle marker */}
                  <div className="absolute top-0 left-0 mt-1 w-6 h-6 rounded-full bg-blue-100 border-2 border-blue-500 flex items-center justify-center">
                    <svg className="w-3 h-3 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  
                  {/* Content */}
                  <div>
                    <div className="text-sm">
                      <span className="font-medium text-gray-900">
                        {getVerifierName(verification.verifierId)}
                      </span>
                      <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                        {getVerifierRoleDisplay(verification.verifierRole)}
                      </span>
                    </div>
                    <time className="block text-xs text-gray-500 mt-0.5">
                      {formatDate(verification.verificationDate)}
                    </time>
                    {verification.comment && (
                      <p className="text-sm text-gray-600 mt-1">
                        {verification.comment}
                      </p>
                    )}
                    
                    {/* Show criteria details in a collapsible section */}
                    {verification.criteriaVerified && verification.criteriaVerified.length > 0 && (
                      <div className="mt-2 text-xs text-gray-500">
                        <details>
                          <summary className="cursor-pointer">View verification details</summary>
                          <div className="mt-2 ml-2 space-y-1">
                            {verification.criteriaVerified.map((criterion, index) => (
                              <div key={index} className="flex items-start">
                                <span className={`flex-shrink-0 inline-block h-4 w-4 rounded-full ${criterion.verified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} flex items-center justify-center text-xs`}>
                                  {criterion.verified ? '✓' : '✕'}
                                </span>
                                <span className="ml-2">{criterion.comment || 'No comments'}</span>
                              </div>
                            ))}
                          </div>
                        </details>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {verifications.length < verificationRequired && (
                <div className="relative pl-8 pb-4">
                  {/* Vertical line */}
                  <div className="absolute top-0 left-3 h-full w-px bg-gray-200"></div>
                  
                  {/* Circle marker */}
                  <div className="absolute top-0 left-0 mt-1 w-6 h-6 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
                    <span className="text-gray-400 text-xs">+</span>
                  </div>
                  
                  {/* Content */}
                  <div>
                    <div className="text-sm text-gray-400">
                      Waiting for {verificationRequired - verifications.length} more {verificationRequired - verifications.length === 1 ? 'verification' : 'verifications'}
                    </div>
                    
                    {(user.role === 'admin' || user.role === 'investor') && (
                      <Link 
                        to={`/projects/${milestone.projectId}/milestones/${milestone.id}/verify`}
                        className="inline-block mt-2 px-3 py-1 text-xs font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700"
                      >
                        Submit Verification
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerificationStatusBoard;