// src/components/common/Input.jsx
import { forwardRef } from 'react';

const Input = forwardRef(({
  type = 'text',
  label,
  id,
  name,
  placeholder,
  value,
  onChange,
  onBlur,
  disabled = false,
  readOnly = false,
  error,
  helperText,
  className = '',
  labelClassName = '',
  inputClassName = '',
  fullWidth = true,
  icon,
  iconPosition = 'left',
  endAdornment,
  ...props
}, ref) => {
  // Generate ID if not provided
  const inputId = id || name || Math.random().toString(36).substring(2, 9);
  
  // Base classes
  const baseInputClasses = [
    'block rounded-md shadow-sm',
    'focus:ring-blue-500 focus:border-blue-500',
    error ? 'border-red-300 text-red-900 placeholder-red-300' : 'border-gray-300',
    disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : '',
    readOnly ? 'bg-gray-50' : '',
    icon && iconPosition === 'left' ? 'pl-10' : '',
    icon && iconPosition === 'right' ? 'pr-10' : '',
    endAdornment ? 'pr-10' : '',
    inputClassName,
  ].filter(Boolean).join(' ');

  // Container classes
  const containerClasses = [
    'relative',
    fullWidth ? 'w-full' : '',
    className,
  ].filter(Boolean).join(' ');

  // Label classes
  const labelClasses = [
    'block text-sm font-medium text-gray-700 mb-1',
    error ? 'text-red-500' : '',
    labelClassName,
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClasses}>
      {label && (
        <label htmlFor={inputId} className={labelClasses}>
          {label}
        </label>
      )}
      
      <div className="relative">
        {icon && iconPosition === 'left' && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {icon}
          </div>
        )}
        
        <input
          ref={ref}
          type={type}
          name={name}
          id={inputId}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          readOnly={readOnly}
          className={`py-2 px-3 w-full text-sm ${baseInputClasses}`}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper-text` : undefined}
          {...props}
        />
        
        {icon && iconPosition === 'right' && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            {icon}
          </div>
        )}
        
        {endAdornment && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            {endAdornment}
          </div>
        )}
      </div>
      
      {error && (
        <p className="mt-1 text-sm text-red-600" id={`${inputId}-error`}>
          {error}
        </p>
      )}
      
      {helperText && !error && (
        <p className="mt-1 text-xs text-gray-500" id={`${inputId}-helper-text`}>
          {helperText}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;