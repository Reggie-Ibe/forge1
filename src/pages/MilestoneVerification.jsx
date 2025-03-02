// src/pages/MilestoneVerification.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import VerificationForm from '../components/verification/VerificationForm';

const MilestoneVerification = () => {
  const { projectId, milestoneId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [milestone, setMilestone] = useState(null);
  const [project, setProject] = useState(null);
  const [existingVerifications, setExistingVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMilestoneData();
  }, [projectId, milestoneId]);

  const fetchMilestoneData = async () => {
    setLoading(true);
    setError('');
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      // Fetch milestone data
      const milestoneResponse = await fetch(`${apiUrl}/milestones/${milestoneId}`);
      if (!milestoneResponse.ok) {
        throw new Error('Milestone not found');
      }
      
      const milestoneData = await milestoneResponse.json();
      
      // Verify milestone belongs to specified project
      if (milestoneData.projectId.toString() !== projectId) {
        throw new Error('Milestone does not belong to this project');
      }
      
      setMilestone(milestoneData);
      
      // Fetch project data
      const projectResponse = await fetch(`${apiUrl}/projects/${projectId}`);
      if (!projectResponse.ok) {
        throw new Error('Project not found');
      }
      
      const projectData = await projectResponse.json();
      setProject(projectData);
      
      // Verify permission to submit verification
      // Only admin, investor, or independent verifier role can verify
      if (!['admin', 'investor'].includes(user.role)) {
        throw new Error('You do not have permission to verify this milestone');
      }
      
      // Verify milestone status
      if (milestoneData.status !== 'completed' || milestoneData.adminApproved) {
        throw new Error('This milestone is not available for verification');
      }
      
      // Fetch existing verifications
      const verificationsResponse = await fetch(`${apiUrl}/verifications?milestoneId=${milestoneId}`);
      if (verificationsResponse.ok) {
        const verificationsData = await verificationsResponse.json();
        
        // Check if user has already submitted a verification
        const userVerification = verificationsData.find(v => v.verifierId === user.id);
        if (userVerification) {
          throw new Error('You have already submitted a verification for this milestone');
        }
        
        setExistingVerifications(verificationsData);
      }
      
    } catch (err) {
      console.error('Error fetching milestone data:', err);
      setError(err.message || 'Failed to load milestone data');
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationSubmit = (verification) => {
    // Navigate back to project detail page after successful submission
    navigate(`/projects/${projectId}`, {
      state: { message: 'Verification submitted successfully' }
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          <p className="font-semibold">Error</p>
          <p>{error}</p>
        </div>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          onClick={() => navigate(`/projects/${projectId}`)}
        >
          Back to Project
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <button
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 mb-4"
          onClick={() => navigate(`/projects/${projectId}`)}
        >
          ← Back to Project
        </button>
        <h1 className="text-2xl font-semibold text-gray-800">Milestone Verification</h1>
        <p className="text-gray-600">
          Project: {project?.title}
        </p>
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
        <div className="p-4 border-b bg-gray-50">
          <h2 className="text-lg font-medium text-gray-800">Milestone Details</h2>
        </div>
        <div className="p-4">
          <h3 className="font-medium text-gray-900 text-lg">{milestone?.title}</h3>
          <p className="text-gray-600 mt-1">{milestone?.description}</p>
          
          <div className="mt-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
              Awaiting Verification
            </span>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b bg-gray-50">
          <h2 className="text-lg font-medium text-gray-800">Submit Verification</h2>
        </div>
        <div className="p-4">
          <p className="text-gray-600 mb-4">
            Please review the milestone and verify its completion. 
            Your verification helps maintain project quality and transparency.
          </p>
          
          {existingVerifications.length > 0 && (
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                This milestone has {existingVerifications.length} previous {existingVerifications.length === 1 ? 'verification' : 'verifications'}.
              </p>
            </div>
          )}
          
          <VerificationForm 
            milestone={milestone} 
            onVerificationSubmit={handleVerificationSubmit} 
          />
        </div>
      </div>
    </div>
  );
};

export default MilestoneVerification;