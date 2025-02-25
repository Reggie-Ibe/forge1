// src/pages/Projects.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import ProjectsList from '../components/projects/ProjectsList';
import Button from '../components/common/Button';
import Alert from '../components/common/Alert';

const Projects = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    setError('');
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      // Fetch all projects for investors, or just user's projects for innovators
      const endpoint = user?.role === 'investor' 
        ? `${apiUrl}/projects` 
        : `${apiUrl}/projects?userId=${user?.id}`;
        
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }
      
      const data = await response.json();
      setProjects(data);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError('Failed to load projects. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header section */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {user?.role === 'investor' ? 'Browse Projects' : 'My Projects'}
          </h1>
          <p className="text-gray-600 mt-1">
            {user?.role === 'investor' 
              ? 'Discover innovative projects to invest in' 
              : 'Manage your innovation projects'}
          </p>
        </div>
        
        {user?.role === 'innovator' && (
          <Button 
            variant="primary"
            onClick={() => setShowCreateModal(true)}
            icon={
              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            }
          >
            Create Project
          </Button>
        )}
      </div>
      
      {/* Error alert */}
      {error && (
        <Alert 
          variant="danger" 
          title="Error" 
          className="mb-6"
          dismissible
        >
          {error}
        </Alert>
      )}
      
      {/* Projects list */}
      <ProjectsList initialProjects={projects} isLoading={loading} />
      
      {/* Create project modal - to be implemented */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Create New Project</h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Project creation form will be implemented in the next phase.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <Button
                  variant="primary"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowCreateModal(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;