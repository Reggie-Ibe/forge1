// src/components/projects/ProjectCard.jsx
import { Link } from 'react-router-dom';
import Card from '../common/Card';
import Badge from '../common/Badge';

const ProjectCard = ({ project }) => {
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
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  // Calculate funding progress
  const fundingProgress = (project.currentFunding / project.fundingGoal) * 100;

  // SDG color mapping
  const sdgColors = {
    1: '#E5243B', // No Poverty
    2: '#DDA63A', // Zero Hunger
    3: '#4C9F38', // Good Health
    4: '#C5192D', // Quality Education
    5: '#FF3A21', // Gender Equality
    6: '#26BDE2', // Clean Water
    7: '#FCC30B', // Affordable Energy
    8: '#A21942', // Decent Work
    9: '#FD6925', // Industry & Innovation
    10: '#DD1367', // Reduced Inequalities
    11: '#FD9D24', // Sustainable Cities
    12: '#BF8B2E', // Responsible Consumption
    13: '#3F7E44', // Climate Action
    14: '#0A97D9', // Life Below Water
    15: '#56C02B', // Life on Land
    16: '#00689D', // Peace & Justice
    17: '#19486A', // Partnerships
  };

  return (
    <Card
      className="h-full flex flex-col transition-all duration-300 hover:shadow-md"
      title={
        <Link to={`/projects/${project.id}`} className="hover:text-blue-600 transition-colors">
          {project.title}
        </Link>
      }
      subtitle={formatDate(project.createdAt)}
    >
      <div className="flex-grow">
        <p className="text-gray-600 mb-4">
          {project.description.length > 120
            ? `${project.description.substring(0, 120)}...`
            : project.description}
        </p>

        <div className="flex flex-wrap gap-2 mb-4">
          <Badge variant="primary">{project.category}</Badge>
          {project.sdgs?.map((sdg) => (
            <Badge
              key={sdg}
              className="text-white"
              style={{
                backgroundColor: sdgColors[sdg] || '#888888',
              }}
            >
              SDG {sdg}
            </Badge>
          ))}
          <Badge
            variant={
              project.status === 'active'
                ? 'success'
                : project.status === 'pending'
                ? 'warning'
                : 'default'
            }
          >
            {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
          </Badge>
        </div>
      </div>

      <div>
        <div className="flex justify-between text-sm text-gray-500 mb-1">
          <span>Funding Progress</span>
          <span>
            {formatCurrency(project.currentFunding)} / {formatCurrency(project.fundingGoal)}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-blue-600 h-2.5 rounded-full"
            style={{ width: `${Math.min(fundingProgress, 100)}%` }}
          ></div>
        </div>
        <div className="text-right text-xs text-gray-500 mt-1">
          {fundingProgress.toFixed(1)}% funded
        </div>
      </div>

      <div className="mt-4">
        <Link
          to={`/projects/${project.id}`}
          className="inline-flex items-center justify-center w-full py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          View Details
        </Link>
      </div>
    </Card>
  );
};

export default ProjectCard;