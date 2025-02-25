// src/components/common/Button.jsx
import { Link } from 'react-router-dom';

const Button = ({ 
  children, 
  type = 'button', 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  disabled = false, 
  to = null, 
  onClick, 
  fullWidth = false,
  isLoading = false,
  icon = null,
  ...props 
}) => {
  // Button style variants
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800 focus:ring-gray-500',
    success: 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
    warning: 'bg-yellow-500 hover:bg-yellow-600 text-white focus:ring-yellow-500',
    info: 'bg-blue-400 hover:bg-blue-500 text-white focus:ring-blue-400',
    light: 'bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 focus:ring-gray-400',
    dark: 'bg-gray-800 hover:bg-gray-900 text-white focus:ring-gray-700',
    link: 'bg-transparent hover:bg-gray-100 text-blue-600 hover:text-blue-800 p-0 focus:ring-transparent',
    outline: 'bg-transparent hover:bg-gray-50 text-gray-700 border border-gray-300 focus:ring-gray-400',
    'outline-primary': 'bg-transparent hover:bg-blue-50 text-blue-600 border border-blue-600 focus:ring-blue-400',
  };

  // Button sizes
  const sizes = {
    xs: 'py-1 px-2 text-xs',
    sm: 'py-1.5 px-3 text-sm',
    md: 'py-2 px-4 text-sm',
    lg: 'py-2.5 px-5 text-base',
    xl: 'py-3 px-6 text-lg',
  };

  // Base styles for all buttons
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200';
  
  // Additional styles based on props
  const styleClasses = [
    baseStyles,
    variants[variant],
    sizes[size],
    fullWidth ? 'w-full' : '',
    disabled || isLoading ? 'opacity-60 cursor-not-allowed' : '',
    className
  ].filter(Boolean).join(' ');

  // For link buttons (using React Router)
  if (to) {
    return (
      <Link
        to={to}
        className={styleClasses}
        {...props}
      >
        {icon && <span className="mr-2">{icon}</span>}
        {children}
      </Link>
    );
  }

  // For regular buttons
  return (
    <button
      type={type}
      className={styleClasses}
      disabled={disabled || isLoading}
      onClick={onClick}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {icon && !isLoading && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
};

export default Button;