// src/components/common/Card.jsx
import { Link } from 'react-router-dom';

const Card = ({
  children,
  title,
  subtitle,
  footer,
  headerAction,
  to,
  className = '',
  bodyClassName = '',
  onClick,
  isHoverable = false,
  isClickable = false,
  isLoading = false,
}) => {
  // Base styles
  const baseCardClasses = [
    'bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200',
    className,
    isHoverable ? 'transition-all duration-200 hover:shadow-md' : '',
    isClickable || to ? 'cursor-pointer' : '',
  ].filter(Boolean).join(' ');

  // Body classes
  const bodyClasses = [
    'p-4',
    bodyClassName,
  ].filter(Boolean).join(' ');

  // Content
  const content = (
    <>
      {(title || subtitle || headerAction) && (
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <div>
            {title && <h3 className="text-lg font-medium text-gray-800">{title}</h3>}
            {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      
      <div className={bodyClasses}>
        {isLoading ? (
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        ) : (
          children
        )}
      </div>
      
      {footer && (
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
          {footer}
        </div>
      )}
    </>
  );

  // If we have a link
  if (to) {
    return (
      <Link to={to} className={baseCardClasses}>
        {content}
      </Link>
    );
  }

  // If card is clickable
  if (onClick) {
    return (
      <div className={baseCardClasses} onClick={onClick} role="button" tabIndex={0}>
        {content}
      </div>
    );
  }

  // Default card
  return (
    <div className={baseCardClasses}>
      {content}
    </div>
  );
};

export default Card;