// src/components/common/Select.jsx
import { forwardRef } from 'react';

const Select = forwardRef(({
  label,
  id,
  name,
  value,
  onChange,
  onBlur,
  options = [],
  placeholder = 'Select an option',
  disabled = false,
  error,
  helperText,
  className = '',
  labelClassName = '',
  selectClassName = '',
  fullWidth = true,
  ...props
}, ref) => {
  // Generate ID if not provided
  const selectId = id || name || Math.random().toString(36).substring(2, 9);
  
  // Base classes
  const baseSelectClasses = [
    'block appearance-none rounded-md shadow-sm border-gray-300',
    'focus:ring-blue-500 focus:border-blue-500',
    error ? 'border-red-300 text-red-900' : '',
    disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : '',
    selectClassName,
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
        <label htmlFor={selectId} className={labelClasses}>
          {label}
        </label>
      )}
      
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          className={`py-2 pl-3 pr-10 w-full text-sm ${baseSelectClasses}`}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${selectId}-error` : helperText ? `${selectId}-helper-text` : undefined}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          
          {options.map((option) => {
            // Handle both array of objects and array of strings
            const optionValue = typeof option === 'object' ? option.value : option;
            const optionLabel = typeof option === 'object' ? option.label : option;
            
            return (
              <option key={optionValue} value={optionValue}>
                {optionLabel}
              </option>
            );
          })}
        </select>
        
        {/* Custom dropdown icon */}
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </div>
      </div>
      
      {error && (
        <p className="mt-1 text-sm text-red-600" id={`${selectId}-error`}>
          {error}
        </p>
      )}
      
      {helperText && !error && (
        <p className="mt-1 text-xs text-gray-500" id={`${selectId}-helper-text`}>
          {helperText}
        </p>
      )}
    </div>
  );
});

Select.displayName = 'Select';

export default Select;