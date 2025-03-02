// src/components/verification/VerificationForm.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const VerificationForm = ({ milestone, onVerificationSubmit }) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [verificationData, setVerificationData] = useState({
    comment: '',
    criteria: []
  });
  
  // Initialize criteria from milestone
  useEffect(() => {
    if (milestone && milestone.criteria) {
      setVerificationData({
        ...verificationData,
        criteria: milestone.criteria.map(criterion => ({
          id: criterion.id,
          description: criterion.description,
          required: criterion.required,
          verified: false,
          comment: ''
        }))
      });
    }
  }, [milestone]);
  
  const handleCriterionVerification = (criterionId, verified) => {
    setVerificationData({
      ...verificationData,
      criteria: verificationData.criteria.map(c => 
        c.id === criterionId ? { ...c, verified } : c
      )
    });
  };
  
  const handleCriterionComment = (criterionId, comment) => {
    setVerificationData({
      ...verificationData,
      criteria: verificationData.criteria.map(c => 
        c.id === criterionId ? { ...c, comment } : c
      )
    });
  };
  
  const handleCommentChange = (e) => {
    setVerificationData({
      ...verificationData,
      comment: e.target.value
    });
  };
  
  const isFormValid = () => {
    // Check if all required criteria are verified
    const requiredCriteria = verificationData.criteria.filter(c => c.required);
    return requiredCriteria.every(c => c.verified);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isFormValid()) {
      setError('Please verify all required criteria');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    setSuccess('');
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      // Prepare verification data
      const verification = {
        milestoneId: milestone.id,
        projectId: milestone.projectId,
        verifierId: user.id,
        verifierRole: user.role,
        verificationDate: new Date().toISOString(),
        status: 'approved',
        comment: verificationData.comment,
        criteriaVerified: verificationData.criteria.map(c => ({
          criterionId: c.id,
          verified: c.verified,
          comment: c.comment
        }))
      };
      
      // Submit verification to API
      const response = await fetch(`${apiUrl}/verifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(verification),
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit verification');
      }
      
      const result = await response.json();
      
      // Also update the milestone status if this is the final approval
      if (user.role === 'admin') {
        const milestoneResponse = await fetch(`${apiUrl}/milestones/${milestone.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            adminApproved: true,
            approvedBy: user.id,
            approvedDate: new Date().toISOString(),
          }),
        });
        
        if (!milestoneResponse.ok) {
          throw new Error('Failed to update milestone status');
        }
      }
      
      setSuccess('Verification submitted successfully');
      
      // Call the callback function if provided
      if (onVerificationSubmit) {
        onVerificationSubmit(result);
      }
      
    } catch (err) {
      console.error('Error submitting verification:', err);
      setError(err.message || 'Failed to submit verification');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!milestone) {
    return <div className="text-center py-4">No milestone selected for verification</div>;
  }
  
  return (
    <div className="verification-form bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Milestone Verification</h2>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4">
          {success}
        </div>
      )}
      
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-700 mb-2">Milestone Details</h3>
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900">{milestone.title}</h4>
          <p className="text-sm text-gray-600 mt-1">{milestone.description}</p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit}>
        <h3 className="text-lg font-medium text-gray-700 mb-3">Verification Criteria</h3>
        
        <div className="space-y-4 mb-6">
          {verificationData.criteria.map((criterion) => (
            <div key={criterion.id} className="p-4 border rounded-lg">
              <div className="flex items-start">
                <div className="flex-1">
                  <div className="flex items-center">
                    <span className="font-medium text-gray-900">{criterion.description}</span>
                    {criterion.required ? (
                      <span className="ml-2 bg-red-100 text-red-800 text-xs font-semibold px-2.5 py-0.5 rounded">Required</span>
                    ) : (
                      <span className="ml-2 bg-gray-100 text-gray-800 text-xs font-semibold px-2.5 py-0.5 rounded">Optional</span>
                    )}
                  </div>
                </div>
                <div className="ml-4">
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      className="form-checkbox h-5 w-5 text-blue-600"
                      checked={criterion.verified}
                      onChange={(e) => handleCriterionVerification(criterion.id, e.target.checked)}
                      disabled={isSubmitting}
                    />
                    <span className="ml-2 text-gray-700">Verified</span>
                  </label>
                </div>
              </div>
              
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Comments
                </label>
                <textarea
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  rows="2"
                  placeholder="Add any comments about this criterion..."
                  value={criterion.comment}
                  onChange={(e) => handleCriterionComment(criterion.id, e.target.value)}
                  disabled={isSubmitting}
                ></textarea>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Overall Verification Comments
          </label>
          <textarea
            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
            rows="4"
            placeholder="Add any overall comments about this milestone verification..."
            value={verificationData.comment}
            onChange={handleCommentChange}
            disabled={isSubmitting}
          ></textarea>
        </div>
        
        <div className="flex justify-end">
          <button
            type="button"
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 mr-3"
            disabled={isSubmitting}
            onClick={() => window.history.back()}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            disabled={isSubmitting || !isFormValid()}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : 'Submit Verification'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default VerificationForm;