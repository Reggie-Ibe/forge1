// src/components/admin/RuleConfiguration.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const RuleConfiguration = ({ projectId }) => {
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRule, setSelectedRule] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formError, setFormError] = useState('');
  
  // New rule template
  const newRuleTemplate = {
    projectId: projectId,
    name: '',
    description: '',
    conditions: [
      { type: 'milestone_completed', milestoneId: '', required: true }
    ],
    actions: [
      { type: 'release_funds', amount: 'percentage', value: 25, targetWallet: 'project-owner' },
      { type: 'notify', targets: ['project_owner', 'investors'], template: 'funds_released' }
    ],
    active: true,
    createdBy: user?.id || '',
    createdAt: new Date().toISOString()
  };
  
  // Form state for editing
  const [formData, setFormData] = useState({ ...newRuleTemplate });
  
  useEffect(() => {
    if (projectId) {
      fetchProjectData();
    }
  }, [projectId]);
  
  const fetchProjectData = async () => {
    setLoading(true);
    setError('');
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      // Fetch project data
      const projectResponse = await fetch(`${apiUrl}/projects/${projectId}`);
      if (!projectResponse.ok) {
        throw new Error('Project not found');
      }
      
      const projectData = await projectResponse.json();
      setProject(projectData);
      
      // Fetch milestones
      const milestonesResponse = await fetch(`${apiUrl}/milestones?projectId=${projectId}`);
      if (milestonesResponse.ok) {
        const milestonesData = await milestonesResponse.json();
        setMilestones(milestonesData);
      }
      
      // Fetch existing rules
      const rulesResponse = await fetch(`${apiUrl}/releaseRules?projectId=${projectId}`);
      if (rulesResponse.ok) {
        const rulesData = await rulesResponse.json();
        setRules(rulesData);
      }
      
    } catch (err) {
      console.error('Error fetching project data:', err);
      setError(err.message || 'Failed to load project data');
    } finally {
      setLoading(false);
    }
  };
  
  const handleCreateRule = () => {
    setFormData({ ...newRuleTemplate, projectId });
    setSelectedRule(null);
    setIsEditing(true);
    setFormError('');
  };
  
  const handleEditRule = (rule) => {
    setFormData({ ...rule });
    setSelectedRule(rule);
    setIsEditing(true);
    setFormError('');
  };
  
  const handleCancelEdit = () => {
    setIsEditing(false);
    setFormError('');
  };
  
  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  const handleAddCondition = () => {
    setFormData({
      ...formData,
      conditions: [
        ...formData.conditions,
        { type: 'verification_count', minimumCount: 2, required: true }
      ]
    });
  };
  
  const handleRemoveCondition = (index) => {
    const newConditions = [...formData.conditions];
    newConditions.splice(index, 1);
    setFormData({
      ...formData,
      conditions: newConditions
    });
  };
  
  const handleConditionChange = (index, field, value) => {
    const newConditions = [...formData.conditions];
    newConditions[index] = { 
      ...newConditions[index], 
      [field]: value 
    };
    setFormData({
      ...formData,
      conditions: newConditions
    });
  };
  
  const handleAddAction = () => {
    setFormData({
      ...formData,
      actions: [
        ...formData.actions,
        { type: 'notify', targets: ['project_owner'], template: 'milestone_verified' }
      ]
    });
  };
  
  const handleRemoveAction = (index) => {
    const newActions = [...formData.actions];
    newActions.splice(index, 1);
    setFormData({
      ...formData,
      actions: newActions
    });
  };
  
  const handleActionChange = (index, field, value) => {
    const newActions = [...formData.actions];
    newActions[index] = { 
      ...newActions[index], 
      [field]: value 
    };
    setFormData({
      ...formData,
      actions: newActions
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    
    // Basic validation
    if (!formData.name.trim()) {
      setFormError('Rule name is required');
      return;
    }
    
    if (formData.conditions.length === 0) {
      setFormError('At least one condition is required');
      return;
    }
    
    if (formData.actions.length === 0) {
      setFormError('At least one action is required');
      return;
    }
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      // Update or create rule
      const method = selectedRule ? 'PUT' : 'POST';
      const url = selectedRule 
        ? `${apiUrl}/releaseRules/${selectedRule.id}` 
        : `${apiUrl}/releaseRules`;
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to ${selectedRule ? 'update' : 'create'} rule`);
      }
      
      // Refresh rules list
      await fetchProjectData();
      
      // Reset form
      setIsEditing(false);
      setSelectedRule(null);
      
    } catch (err) {
      console.error('Error saving rule:', err);
      setFormError(err.message || `Failed to ${selectedRule ? 'update' : 'create'} rule`);
    }
  };
  
  const handleDeleteRule = async (ruleId) => {
    if (!window.confirm('Are you sure you want to delete this rule?')) {
      return;
    }
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      const response = await fetch(`${apiUrl}/releaseRules/${ruleId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete rule');
      }
      
      // Refresh rules list
      await fetchProjectData();
      
    } catch (err) {
      console.error('Error deleting rule:', err);
      setError(err.message || 'Failed to delete rule');
    }
  };
  
  const handleToggleRuleActive = async (rule) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      const response = await fetch(`${apiUrl}/releaseRules/${rule.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ active: !rule.active }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to ${rule.active ? 'deactivate' : 'activate'} rule`);
      }
      
      // Refresh rules list
      await fetchProjectData();
      
    } catch (err) {
      console.error('Error toggling rule status:', err);
      setError(err.message || `Failed to ${rule.active ? 'deactivate' : 'activate'} rule`);
    }
  };
  
  if (loading) {
    return <div className="flex justify-center py-4"><div className="animate-spin h-6 w-6 border-4 border-blue-500 rounded-full border-t-transparent"></div></div>;
  }
  
  return (
    <div className="rule-configuration">
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          {error}
        </div>
      )}
      
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Automated Release Rules</h2>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          onClick={handleCreateRule}
          disabled={isEditing}
        >
          Create New Rule
        </button>
      </div>
      
      {/* Edit Form */}
      {isEditing && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-medium mb-4">{selectedRule ? 'Edit' : 'Create'} Rule</h3>
          
          {formError && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
              {formError}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rule Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter rule name"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                rows="2"
                placeholder="Describe the purpose of this rule"
              ></textarea>
            </div>
            
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Conditions
                </label>
                <button
                  type="button"
                  onClick={handleAddCondition}
                  className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm"
                >
                  Add Condition
                </button>
              </div>
              
              {formData.conditions.map((condition, index) => (
                <div key={index} className="mb-3 p-3 border border-gray-300 rounded-md">
                  <div className="flex justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">Condition {index + 1}</label>
                    <button
                      type="button"
                      onClick={() => handleRemoveCondition(index)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Type</label>
                      <select
                        value={condition.type}
                        onChange={(e) => handleConditionChange(index, 'type', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                      >
                        <option value="milestone_completed">Milestone Completed</option>
                        <option value="verification_count">Verification Count</option>
                        <option value="time_passed">Time Passed</option>
                        <option value="project_funding">Project Funding</option>
                      </select>
                    </div>
                    
                    {condition.type === 'milestone_completed' && (
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Milestone</label>
                        <select
                          value={condition.milestoneId}
                          onChange={(e) => handleConditionChange(index, 'milestoneId', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                        >
                          <option value="">Select Milestone</option>
                          {milestones.map((milestone) => (
                            <option key={milestone.id} value={milestone.id}>
                              {milestone.title}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    
                    {condition.type === 'verification_count' && (
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Minimum Count</label>
                        <input
                          type="number"
                          value={condition.minimumCount || 2}
                          onChange={(e) => handleConditionChange(index, 'minimumCount', parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                          min="1"
                        />
                      </div>
                    )}
                    
                    {condition.type === 'time_passed' && (
                      <>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Hours</label>
                          <input
                            type="number"
                            value={condition.hours || 24}
                            onChange={(e) => handleConditionChange(index, 'hours', parseInt(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                            min="1"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">After Event</label>
                          <select
                            value={condition.afterEvent || 'verification_complete'}
                            onChange={(e) => handleConditionChange(index, 'afterEvent', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                          >
                            <option value="verification_complete">Verification Complete</option>
                            <option value="milestone_completion">Milestone Completion</option>
                            <option value="investment_date">Investment Date</option>
                          </select>
                        </div>
                      </>
                    )}
                    
                    {condition.type === 'project_funding' && (
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Percentage Funded</label>
                        <input
                          type="number"
                          value={condition.percentage || 50}
                          onChange={(e) => handleConditionChange(index, 'percentage', parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                          min="1"
                          max="100"
                        />
                      </div>
                    )}
                    
                    <div className="md:col-span-2">
                      <label className="inline-flex items-center">
                        <input
                          type="checkbox"
                          checked={condition.required !== false}
                          onChange={(e) => handleConditionChange(index, 'required', e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                        />
                        <span className="ml-2 text-sm text-gray-700">Required condition</span>
                      </label>
                    </div>
                  </div>
                </div>
              ))}
              
              {formData.conditions.length === 0 && (
                <p className="text-red-600 text-sm">Add at least one condition</p>
              )}
            </div>
            
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Actions
                </label>
                <button
                  type="button"
                  onClick={handleAddAction}
                  className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm"
                >
                  Add Action
                </button>
              </div>
              
              {formData.actions.map((action, index) => (
                <div key={index} className="mb-3 p-3 border border-gray-300 rounded-md">
                  <div className="flex justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">Action {index + 1}</label>
                    <button
                      type="button"
                      onClick={() => handleRemoveAction(index)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Type</label>
                      <select
                        value={action.type}
                        onChange={(e) => handleActionChange(index, 'type', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                      >
                        <option value="release_funds">Release Funds</option>
                        <option value="notify">Send Notification</option>
                        <option value="update_status">Update Status</option>
                      </select>
                    </div>
                    
                    {action.type === 'release_funds' && (
                      <>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Amount Type</label>
                          <select
                            value={action.amount || 'percentage'}
                            onChange={(e) => handleActionChange(index, 'amount', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                          >
                            <option value="percentage">Percentage</option>
                            <option value="fixed">Fixed Amount</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">
                            {action.amount === 'fixed' ? 'Amount ($)' : 'Percentage (%)'}
                          </label>
                          <input
                            type="number"
                            value={action.value || 25}
                            onChange={(e) => handleActionChange(index, 'value', parseInt(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                            min="1"
                            max={action.amount === 'percentage' ? 100 : undefined}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Target Wallet</label>
                          <select
                            value={action.targetWallet || 'project-owner'}
                            onChange={(e) => handleActionChange(index, 'targetWallet', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                          >
                            <option value="project-owner">Project Owner</option>
                          </select>
                        </div>
                      </>
                    )}
                    
                    {action.type === 'notify' && (
                      <>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Template</label>
                          <select
                            value={action.template || 'funds_released'}
                            onChange={(e) => handleActionChange(index, 'template', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                          >
                            <option value="funds_released">Funds Released</option>
                            <option value="milestone_verified">Milestone Verified</option>
                            <option value="pending_verification">Pending Verification</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Recipients</label>
                          <div className="space-y-1 mt-1">
                            <label className="inline-flex items-center">
                              <input
                                type="checkbox"
                                checked={action.targets?.includes('project_owner')}
                                onChange={(e) => {
                                  const newTargets = action.targets?.filter(t => t !== 'project_owner') || [];
                                  if (e.target.checked) newTargets.push('project_owner');
                                  handleActionChange(index, 'targets', newTargets);
                                }}
                                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                              />
                              <span className="ml-2 text-sm text-gray-700">Project Owner</span>
                            </label>
                            <label className="inline-flex items-center">
                              <input
                                type="checkbox"
                                checked={action.targets?.includes('investors')}
                                onChange={(e) => {
                                  const newTargets = action.targets?.filter(t => t !== 'investors') || [];
                                  if (e.target.checked) newTargets.push('investors');
                                  handleActionChange(index, 'targets', newTargets);
                                }}
                                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                              />
                              <span className="ml-2 text-sm text-gray-700">Investors</span>
                            </label>
                            <label className="inline-flex items-center">
                              <input
                                type="checkbox"
                                checked={action.targets?.includes('admin')}
                                onChange={(e) => {
                                  const newTargets = action.targets?.filter(t => t !== 'admin') || [];
                                  if (e.target.checked) newTargets.push('admin');
                                  handleActionChange(index, 'targets', newTargets);
                                }}
                                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                              />
                              <span className="ml-2 text-sm text-gray-700">Admins</span>
                            </label>
                          </div>
                        </div>
                      </>
                    )}
                    
                    {action.type === 'update_status' && (
                      <>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Entity</label>
                          <select
                            value={action.entity || 'milestone'}
                            onChange={(e) => handleActionChange(index, 'entity', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                          >
                            <option value="milestone">Milestone</option>
                            <option value="project">Project</option>
                            <option value="investment">Investment</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                          <input
                            type="text"
                            value={action.status || 'completed'}
                            onChange={(e) => handleActionChange(index, 'status', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
              
              {formData.actions.length === 0 && (
                <p className="text-red-600 text-sm">Add at least one action</p>
              )}
            </div>
            
            <div className="mb-4">
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  name="active"
                  checked={formData.active}
                  onChange={handleFormChange}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
                <span className="ml-2 text-sm text-gray-700">Rule is active</span>
              </label>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {selectedRule ? 'Update Rule' : 'Create Rule'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Rules List */}
      {!isEditing && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {rules.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-gray-500">No automated release rules defined yet</p>
              <button
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onClick={handleCreateRule}
              >
                Create First Rule
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rule Name</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Conditions</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {rules.map((rule) => (
                    <tr key={rule.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{rule.name}</div>
                        <div className="text-sm text-gray-500">{rule.description}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {rule.conditions.map((condition, index) => (
                            <div key={index} className="mb-1">
                              {condition.type === 'milestone_completed' && (
                                

                                <>
                                  <span className="font-medium">Milestone Completed:</span>{' '}
                                  {milestones.find(m => m.id.toString() === condition.milestoneId?.toString())?.title || 'Unknown milestone'}
                                </>
                              )}
                              {condition.type === 'verification_count' && (
                                <>
                                  <span className="font-medium">Verification Count:</span> {condition.minimumCount || 0} verifications
                                </>
                              )}
                              {condition.type === 'time_passed' && (
                                <>
                                  <span className="font-medium">Time Passed:</span> {condition.hours || 24} hours after {condition.afterEvent || 'event'}
                                </>
                              )}
                              {condition.type === 'project_funding' && (
                                <>
                                  <span className="font-medium">Project Funding:</span> {condition.percentage || 0}% funded
                                </>
                              )}
                              {condition.required === false && <span className="text-gray-500 text-xs ml-1">(optional)</span>}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {rule.actions.map((action, index) => (
                            <div key={index} className="mb-1">
                              {action.type === 'release_funds' && (
                                <>
                                  <span className="font-medium">Release Funds:</span>{' '}
                                  {action.amount === 'fixed' 
                                    ? `$${action.value || 0}` 
                                    : `${action.value || 0}%`} to {action.targetWallet || 'project-owner'}
                                </>
                              )}
                              {action.type === 'notify' && (
                                <>
                                  <span className="font-medium">Notify:</span>{' '}
                                  {action.targets?.join(', ') || 'nobody'} using {action.template || 'default'} template
                                </>
                              )}
                              {action.type === 'update_status' && (
                                <>
                                  <span className="font-medium">Update Status:</span>{' '}
                                  Set {action.entity || 'entity'} to {action.status || 'status'}
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          rule.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {rule.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
  <button
    onClick={() => handleToggleRuleActive(rule)}
    className={rule.active 
      ? "text-red-600 hover:text-red-900 mr-4" 
      : "text-green-600 hover:text-green-900 mr-4"}
  >
    {rule.active ? 'Deactivate' : 'Activate'}
  </button>
  <button
    onClick={() => handleEditRule(rule)}
    className="text-blue-600 hover:text-blue-900 mr-4"
  >
    Edit
  </button>
  <button
    onClick={() => handleDeleteRule(rule.id)}
    className="text-red-600 hover:text-red-900"
  >
    Delete
  </button>
    </td>
     </tr> 
         ))}
            </tbody>
            </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RuleConfiguration;