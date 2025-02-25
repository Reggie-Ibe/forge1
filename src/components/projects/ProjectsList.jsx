// src/components/projects/ProjectsList.jsx
import { useState, useEffect } from 'react';
import ProjectCard from './ProjectCard';
import Button from '../common/Button';
import Select from '../common/Select';
import Input from '../common/Input';

const ProjectsList = ({ initialProjects = [], isLoading = false }) => {
  const [projects, setProjects] = useState(initialProjects);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  // Extract unique categories from projects
  const categories = [...new Set(projects.map(project => project.category))];
  
  // Status options
  const statuses = ['active', 'pending', 'completed', 'canceled'];

  // Update filtered projects when filters change
  useEffect(() => {
    let result = [...projects];
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        project => 
          project.title.toLowerCase().includes(term) || 
          project.description.toLowerCase().includes(term)
      );
    }
    
    // Apply category filter
    if (categoryFilter) {
      result = result.filter(project => project.category === categoryFilter);
    }
    
    // Apply status filter
    if (statusFilter) {
      result = result.filter(project => project.status === statusFilter);
    }
    
    // Apply sorting
    if (sortBy === 'newest') {
      result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === 'oldest') {
      result.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (sortBy === 'mostFunded') {
      result.sort((a, b) => b.currentFunding - a.currentFunding);
    } else if (sortBy === 'leastFunded') {
      result.sort((a, b) => a.currentFunding - b.currentFunding);
    } else if (sortBy === 'goalHighToLow') {
      result.sort((a, b) => b.fundingGoal - a.fundingGoal);
    } else if (sortBy === 'goalLowToHigh') {
      result.sort((a, b) => a.fundingGoal - b.fundingGoal);
    }
    
    setFilteredProjects(result);
  }, [projects, searchTerm, categoryFilter, statusFilter, sortBy]);

  // Reset filters
  const resetFilters = () => {
    setSearchTerm('');
    setCategoryFilter('');
    setStatusFilter('');
    setSortBy('newest');
  };

  // Handle external updates to projects
  useEffect(() => {
    setProjects(initialProjects);
  }, [initialProjects]);

  // Loading state
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="animate-pulse bg-white rounded-lg shadow-sm h-64 border border-gray-200">
            <div className="h-6 bg-gray-200 rounded-t-lg"></div>
            <div className="p-4">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="flex gap-2 mb-4">
                <div className="h-6 w-16 bg-gray-200 rounded"></div>
                <div className="h-6 w-16 bg-gray-200 rounded"></div>
              </div>
              <div className="h-2 bg-gray-200 rounded-full mt-4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded mt-4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* Filters section */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <Input
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={
              <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            }
          />
          
          <Select
            placeholder="Filter by category"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            options={[
              { value: '', label: 'All Categories' },
              ...categories.map(category => ({ value: category, label: category }))
            ]}
          />
          
          <Select
            placeholder="Filter by status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: '', label: 'All Statuses' },
              ...statuses.map(status => ({ 
                value: status, 
                label: status.charAt(0).toUpperCase() + status.slice(1) 
              }))
            ]}
          />
          
          <Select
            placeholder="Sort by"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            options={[
              { value: 'newest', label: 'Newest First' },
              { value: 'oldest', label: 'Oldest First' },
              { value: 'mostFunded', label: 'Most Funded' },
              { value: 'leastFunded', label: 'Least Funded' },
              { value: 'goalHighToLow', label: 'Goal: High to Low' },
              { value: 'goalLowToHigh', label: 'Goal: Low to High' },
            ]}
          />
        </div>
        
        <div className="flex justify-between mt-4">
          <div className="text-sm text-gray-500">
            Showing {filteredProjects.length} of {projects.length} projects
          </div>
          <Button
            variant="light"
            size="sm"
            onClick={resetFilters}
            disabled={!searchTerm && !categoryFilter && !statusFilter && sortBy === 'newest'}
          >
            Reset Filters
          </Button>
        </div>
      </div>
      
      {/* Results */}
      {filteredProjects.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
          <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No projects found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your search or filter criteria.
          </p>
          <div className="mt-6">
            <Button variant="primary" size="sm" onClick={resetFilters}>
              Reset Filters
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectsList;