// src/services/ruleEngine.js
/**
 * Rule Engine Service for automated escrow releases
 * This service evaluates rule conditions and triggers appropriate actions
 */

// Rule Types
const RULE_TYPES = {
    MILESTONE_COMPLETED: 'milestone_completed',
    VERIFICATION_COUNT: 'verification_count',
    TIME_PASSED: 'time_passed',
    EXTERNAL_CONDITION: 'external_condition',
    PROJECT_FUNDING: 'project_funding'
  };
  
  // Action Types
  const ACTION_TYPES = {
    RELEASE_FUNDS: 'release_funds',
    NOTIFY: 'notify',
    UPDATE_STATUS: 'update_status'
  };
  
  /**
   * Check if a rule's conditions are met
   * @param {Object} rule - Rule definition
   * @param {Object} context - Context data for evaluation
   * @returns {boolean} - Whether all required conditions are met
   */
  const evaluateRuleConditions = async (rule, context) => {
    const { conditions } = rule;
    let allRequiredConditionsMet = true;
    
    // Track which conditions are met for detailed reporting
    const conditionResults = {};
    
    for (const condition of conditions) {
      const conditionMet = await evaluateCondition(condition, context);
      conditionResults[condition.type] = conditionMet;
      
      // If a required condition is not met, the rule fails
      if (condition.required && !conditionMet) {
        allRequiredConditionsMet = false;
      }
    }
    
    return {
      passed: allRequiredConditionsMet,
      conditionResults,
      totalConditions: conditions.length,
      metConditions: Object.values(conditionResults).filter(result => result).length
    };
  };
  
  /**
   * Evaluate a single condition
   * @param {Object} condition - Condition to evaluate
   * @param {Object} context - Context data for evaluation
   * @returns {boolean} - Whether the condition is met
   */
  const evaluateCondition = async (condition, context) => {
    const { type } = condition;
    
    switch (type) {
      case RULE_TYPES.MILESTONE_COMPLETED:
        return evaluateMilestoneCompleted(condition, context);
        
      case RULE_TYPES.VERIFICATION_COUNT:
        return evaluateVerificationCount(condition, context);
        
      case RULE_TYPES.TIME_PASSED:
        return evaluateTimePassed(condition, context);
        
      case RULE_TYPES.EXTERNAL_CONDITION:
        return await evaluateExternalCondition(condition, context);
        
      case RULE_TYPES.PROJECT_FUNDING:
        return evaluateProjectFunding(condition, context);
        
      default:
        console.warn(`Unknown condition type: ${type}`);
        return false;
    }
  };
  
  /**
   * Check if a milestone is completed and verified
   */
  const evaluateMilestoneCompleted = (condition, context) => {
    const { milestoneId } = condition;
    const { milestones = [] } = context;
    
    const milestone = milestones.find(m => m.id.toString() === milestoneId.toString());
    
    if (!milestone) {
      console.warn(`Milestone ${milestoneId} not found in context`);
      return false;
    }
    
    return milestone.status === 'completed' && milestone.adminApproved === true;
  };
  
  /**
   * Check if enough verifications have been submitted
   */
  const evaluateVerificationCount = (condition, context) => {
    const { minimumCount, milestoneId } = condition;
    const { verifications = [] } = context;
    
    // If milestone is specified, count verifications for that milestone
    const relevantVerifications = milestoneId
      ? verifications.filter(v => v.milestoneId.toString() === milestoneId.toString())
      : verifications;
    
    return relevantVerifications.length >= minimumCount;
  };
  
  /**
   * Check if enough time has passed since a specific event
   */
  const evaluateTimePassed = (condition, context) => {
    const { hours, afterEvent, timestamp } = condition;
    const targetTimestamp = getEventTimestamp(afterEvent, context) || timestamp;
    
    if (!targetTimestamp) {
      console.warn(`No timestamp found for event: ${afterEvent}`);
      return false;
    }
    
    const targetDate = new Date(targetTimestamp);
    const now = new Date();
    const diffMs = now - targetDate;
    const diffHours = diffMs / (1000 * 60 * 60);
    
    return diffHours >= hours;
  };
  
  /**
   * Get timestamp for a specific event
   */
  const getEventTimestamp = (eventType, context) => {
    switch (eventType) {
      case 'verification_complete':
        // Get the latest verification timestamp
        if (context.verifications && context.verifications.length > 0) {
          const latestVerification = [...context.verifications].sort(
            (a, b) => new Date(b.verificationDate) - new Date(a.verificationDate)
          )[0];
          return latestVerification.verificationDate;
        }
        return null;
        
      case 'milestone_completion':
        if (context.milestones && context.milestones.length > 0) {
          const latestCompletedMilestone = [...context.milestones]
            .filter(m => m.status === 'completed' && m.completedDate)
            .sort((a, b) => new Date(b.completedDate) - new Date(a.completedDate))[0];
          return latestCompletedMilestone?.completedDate;
        }
        return null;
        
      case 'investment_date':
        if (context.investment && context.investment.createdAt) {
          return context.investment.createdAt;
        }
        return null;
        
      default:
        return null;
    }
  };
  
  /**
   * Check conditions from external data sources
   */
  const evaluateExternalCondition = async (condition, context) => {
    const { provider, condition: conditionName, value } = condition;
    
    // Implement integrations with external providers here
    switch (provider) {
      case 'github':
        return await checkGithubCondition(conditionName, value, context);
        
      case 'website':
        return await checkWebsiteCondition(conditionName, value, context);
        
      case 'app_store':
        return await checkAppStoreCondition(conditionName, value, context);
        
      default:
        console.warn(`Unknown external provider: ${provider}`);
        return false;
    }
  };
  
  /**
   * Check if a project has reached a funding threshold
   */
  const evaluateProjectFunding = (condition, context) => {
    const { percentage, amount } = condition;
    const { project } = context;
    
    if (!project) {
      console.warn('Project data not found in context');
      return false;
    }
    
    if (percentage) {
      const fundingPercentage = (project.currentFunding / project.fundingGoal) * 100;
      return fundingPercentage >= percentage;
    }
    
    if (amount) {
      return project.currentFunding >= amount;
    }
    
    return false;
  };
  
  /**
   * Execute rule actions when conditions are met
   * @param {Object} rule - Rule definition
   * @param {Object} context - Context data
   * @param {Object} evaluationResult - Result of rule evaluation
   * @returns {Array} - Results of executed actions
   */
  const executeRuleActions = async (rule, context, evaluationResult) => {
    const { actions } = rule;
    const results = [];
    
    for (const action of actions) {
      try {
        const result = await executeAction(action, context, evaluationResult);
        results.push({
          actionType: action.type,
          success: true,
          result
        });
      } catch (error) {
        console.error('Error executing action:', error);
        results.push({
          actionType: action.type,
          success: false,
          error: error.message
        });
      }
    }
    
    return results;
  };
  
  /**
   * Execute a single action
   */
  const executeAction = async (action, context, evaluationResult) => {
    const { type } = action;
    
    switch (type) {
      case ACTION_TYPES.RELEASE_FUNDS:
        return await releaseFunds(action, context);
        
      case ACTION_TYPES.NOTIFY:
        return await sendNotifications(action, context, evaluationResult);
        
      case ACTION_TYPES.UPDATE_STATUS:
        return await updateStatus(action, context);
        
      default:
        throw new Error(`Unknown action type: ${type}`);
    }
  };
  
  /**
   * Release funds according to the action parameters
   */
  const releaseFunds = async (action, context) => {
    const { amount, percentage, targetWallet } = action;
    const { investment, project, apiUrl } = context;
    
    if (!investment) {
      throw new Error('Investment data not found in context');
    }
    
    // Calculate the release amount
    let releaseAmount;
    if (amount) {
      releaseAmount = amount;
    } else if (percentage) {
      releaseAmount = (investment.amount * percentage) / 100;
    } else {
      throw new Error('Either amount or percentage must be specified');
    }
    
    // Find the appropriate phase in the disbursement schedule
    const phase = findUnreleasedPhase(investment, releaseAmount);
    if (!phase) {
      throw new Error('No matching phase found in disbursement schedule');
    }
    
    // Update the investment record
    const updatedSchedule = investment.disbursementSchedule.map(p => 
      p === phase ? { ...p, released: true, releaseDate: new Date().toISOString() } : p
    );
    
    const updatedInvestment = {
      ...investment,
      disbursementSchedule: updatedSchedule
    };
    
    // Save the updated investment
    const investmentResponse = await fetch(`${apiUrl}/investments/${investment.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatedInvestment),
    });
    
    if (!investmentResponse.ok) {
      throw new Error('Failed to update investment record');
    }
    
    // Create a transaction record
    const transaction = {
      projectId: project.id,
      investmentId: investment.id,
      type: 'release',
      amount: releaseAmount,
      fromEscrowAccount: `escrow-${project.id}`,
      toWalletId: targetWallet === 'project-owner' ? `wallet-${project.userId}` : targetWallet,
      status: 'completed',
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      description: `Automated release: ${phase.phase}`,
      relatedMilestoneId: context.milestone?.id,
      automatedRelease: true,
      ruleId: context.rule.id
    };
    
    const transactionResponse = await fetch(`${apiUrl}/escrowTransactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(transaction),
    });
    
    if (!transactionResponse.ok) {
      throw new Error('Failed to create transaction record');
    }
    
    return {
      phase: phase.phase,
      amount: releaseAmount,
      investment: updatedInvestment,
      transaction: await transactionResponse.json()
    };
  };
  
  /**
   * Find an unreleased phase that matches the specified amount
   */
  const findUnreleasedPhase = (investment, targetAmount) => {
    if (!investment.disbursementSchedule) {
      return null;
    }
    
    // Find an unreleased phase with a matching amount (with small tolerance for rounding)
    return investment.disbursementSchedule.find(phase => 
      !phase.released && Math.abs(phase.amount - targetAmount) < 0.01
    );
  };
  
  /**
   * Send notifications to specified targets
   */
  const sendNotifications = async (action, context, evaluationResult) => {
    const { targets, template } = action;
    const { project, investment, apiUrl } = context;
    
    // Determine recipients
    const recipientIds = [];
    
    if (targets.includes('project_owner') && project) {
      recipientIds.push(project.userId);
    }
    
    if (targets.includes('investors') && investment) {
      recipientIds.push(investment.userId);
    }
    
    if (targets.includes('admin')) {
      // Get admin users
      const adminsResponse = await fetch(`${apiUrl}/users?role=admin`);
      if (adminsResponse.ok) {
        const admins = await adminsResponse.json();
        recipientIds.push(...admins.map(admin => admin.id));
      }
    }
    
    // Generate notification content based on template
    const content = generateNotificationContent(template, context, evaluationResult);
    
    // Create notification records
    const notifications = recipientIds.map(userId => ({
      userId,
      type: 'escrow',
      title: content.title,
      message: content.message,
      createdAt: new Date().toISOString(),
      read: false,
      relatedProjectId: project?.id,
      relatedInvestmentId: investment?.id,
      data: {
        ruleId: context.rule.id,
        actionType: 'notify'
      }
    }));
    
    // Save notifications
    const savedNotifications = [];
    for (const notification of notifications) {
      const response = await fetch(`${apiUrl}/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notification),
      });
      
      if (response.ok) {
        savedNotifications.push(await response.json());
      }
    }
    
    return {
      recipientCount: savedNotifications.length,
      notifications: savedNotifications
    };
  };
  
  /**
   * Generate notification content from template
   */
  const generateNotificationContent = (template, context, evaluationResult) => {
    const { project, investment, milestone } = context;
    
    switch (template) {
      case 'funds_released':
        return {
          title: 'Funds Released',
          message: `Funds have been automatically released for project "${project.title}" based on milestone completion.`
        };
        
      case 'milestone_verified':
        return {
          title: 'Milestone Verified',
          message: `Milestone "${milestone.title}" for project "${project.title}" has been verified.`
        };
        
      case 'pending_verification':
        return {
          title: 'Verification Required',
          message: `Milestone "${milestone.title}" for project "${project.title}" is awaiting your verification.`
        };
        
      default:
        return {
          title: 'Escrow Update',
          message: `An update has occurred for project "${project.title}".`
        };
    }
  };
  
  /**
   * Update status of related entities
   */
  const updateStatus = async (action, context) => {
    const { entity, entityId, status } = action;
    const { apiUrl } = context;
    
    const entityId = entityId || getEntityIdFromContext(entity, context);
    if (!entityId) {
      throw new Error(`Entity ID not found for ${entity}`);
    }
    
    let endpoint;
    switch (entity) {
      case 'milestone':
        endpoint = `${apiUrl}/milestones/${entityId}`;
        break;
      case 'project':
        endpoint = `${apiUrl}/projects/${entityId}`;
        break;
      case 'investment':
        endpoint = `${apiUrl}/investments/${entityId}`;
        break;
      default:
        throw new Error(`Unknown entity type: ${entity}`);
    }
    
    const response = await fetch(endpoint, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update ${entity} status`);
    }
    
    return {
      entity,
      entityId,
      status,
      updated: true
    };
  };
  
  /**
   * Get entity ID from context
   */
  const getEntityIdFromContext = (entity, context) => {
    switch (entity) {
      case 'milestone':
        return context.milestone?.id;
      case 'project':
        return context.project?.id;
      case 'investment':
        return context.investment?.id;
      default:
        return null;
    }
  };
  
  /**
   * External API integrations
   */
  
  // GitHub integration
  const checkGithubCondition = async (condition, value, context) => {
    // Placeholder for GitHub API integration
    // In a real implementation, this would use the GitHub API to check conditions
    // like tag releases, commit counts, etc.
    console.log('GitHub condition check not implemented');
    return false;
  };
  
  // Website check integration
  const checkWebsiteCondition = async (condition, value, context) => {
    // Placeholder for website checking
    // This would implement checks for domain availability, specific content, etc.
    console.log('Website condition check not implemented');
    return false;
  };
  
  // App Store integration
  const checkAppStoreCondition = async (condition, value, context) => {
    // Placeholder for App Store API integration
    // This would check for app availability, ratings, etc.
    console.log('App Store condition check not implemented');
    return false;
  };
  
  /**
   * Main function to process a rule
   * @param {Object} rule - Rule definition
   * @param {Object} context - Context data for evaluation
   * @returns {Object} - Result of rule processing
   */
  const processRule = async (rule, context) => {
    // First, evaluate the rule conditions
    const evaluationResult = await evaluateRuleConditions(rule, context);
    
    // Record the evaluation attempt
    const evaluationRecord = {
      ruleId: rule.id,
      projectId: context.project?.id,
      timestamp: new Date().toISOString(),
      conditionsPassed: evaluationResult.passed,
      conditionResults: evaluationResult.conditionResults,
      metConditions: evaluationResult.metConditions,
      totalConditions: evaluationResult.totalConditions
    };
    
    // Save evaluation record
    try {
      await fetch(`${context.apiUrl}/ruleEvaluations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(evaluationRecord),
      });
    } catch (error) {
      console.error('Failed to save rule evaluation record:', error);
    }
    
    // If conditions are met, execute the actions
    let actionResults = [];
    if (evaluationResult.passed) {
      actionResults = await executeRuleActions(rule, context, evaluationResult);
    }
    
    return {
      ruleId: rule.id,
      ruleName: rule.name,
      evaluated: true,
      passed: evaluationResult.passed,
      conditionResults: evaluationResult.conditionResults,
      actionResults: actionResults,
      timestamp: new Date().toISOString()
    };
  };
  
  /**
   * Process all active rules for a specific project
   * @param {string} projectId - Project ID
   * @param {Object} contextData - Additional context data
   * @returns {Array} - Results of all processed rules
   */
  const processRulesForProject = async (projectId, contextData = {}) => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    
    try {
      // Fetch project data
      const projectResponse = await fetch(`${apiUrl}/projects/${projectId}`);
      if (!projectResponse.ok) {
        throw new Error('Project not found');
      }
      const project = await projectResponse.json();
      
      // Fetch all active rules for this project
      const rulesResponse = await fetch(`${apiUrl}/releaseRules?projectId=${projectId}&active=true`);
      if (!rulesResponse.ok) {
        throw new Error('Failed to fetch rules');
      }
      const rules = await rulesResponse.json();
      
      // Fetch milestones
      const milestonesResponse = await fetch(`${apiUrl}/milestones?projectId=${projectId}`);
      const milestones = milestonesResponse.ok ? await milestonesResponse.json() : [];
      
      // Fetch verifications
      const verificationsResponse = await fetch(`${apiUrl}/verifications?projectId=${projectId}`);
      const verifications = verificationsResponse.ok ? await verificationsResponse.json() : [];
      
      // Fetch investments
      const investmentsResponse = await fetch(`${apiUrl}/investments?projectId=${projectId}`);
      const investments = investmentsResponse.ok ? await investmentsResponse.json() : [];
      
      // Build context for rule evaluation
      const baseContext = {
        apiUrl,
        project,
        milestones,
        verifications,
        investments,
        ...contextData
      };
      
      // Process each rule
      const results = [];
      for (const rule of rules) {
        // For rules that target specific milestones or investments, we need to process them individually
        if (rule.targetType === 'milestone' && rule.targetIds) {
          for (const milestoneId of rule.targetIds) {
            const milestone = milestones.find(m => m.id.toString() === milestoneId.toString());
            if (milestone) {
              const context = { ...baseContext, milestone, rule };
              const result = await processRule(rule, context);
              results.push(result);
            }
          }
        } else if (rule.targetType === 'investment' && rule.targetIds) {
          for (const investmentId of rule.targetIds) {
            const investment = investments.find(i => i.id.toString() === investmentId.toString());
            if (investment) {
              const context = { ...baseContext, investment, rule };
              const result = await processRule(rule, context);
              results.push(result);
            }
          }
        } else {
          // General project rule
          const context = { ...baseContext, rule };
          const result = await processRule(rule, context);
          results.push(result);
        }
      }
      
      return results;
      
    } catch (error) {
      console.error('Error processing rules:', error);
      throw error;
    }
  };
  
  export default {
    processRule,
    processRulesForProject,
    evaluateRuleConditions,
    executeRuleActions,
    RULE_TYPES,
    ACTION_TYPES
  };