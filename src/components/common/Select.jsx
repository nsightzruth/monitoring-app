import React, { forwardRef, useEffect } from 'react';
import '../../styles/components/Select.css';

/**
 * Select component with inline layout and validation states
 */
const Select = forwardRef(({
  id,
  name,
  label,
  options = [],
  value,
  onChange,
  error = false,
  errorMessage,
  disabled = false,
  placeholder = 'Select an option',
  required = false,
  className = '',
  ...rest
}, ref) => {
  const selectClass = `
    select
    ${error ? 'select--error' : ''}
    ${className}
  `;

  // Use id as name if name is not provided
  const selectName = name || id;
  
  // Debug logging for value
  useEffect(() => {
    console.log(`Select (${id}) value:`, value);
    console.log(`Select (${id}) type:`, typeof value);
    console.log(`Select (${id}) options:`, options);
  }, [id, value, options]);

  return (
    <div className="select-container inline-layout">
      {label && (
        <label 
          className="select-label" 
          htmlFor={id}
        >
          {label}
          {required && <span className="select-required">*</span>}
        </label>
      )}
      
      <div className="select-field-container">
        <div className="select-wrapper">
          <select
            id={id}
            name={selectName}
            ref={ref}
            value={value || ''} // FIXED: Ensure empty string for null/undefined values
            onChange={onChange}
            disabled={disabled}
            required={required}
            className={selectClass.trim()}
            aria-invalid={error}
            aria-errormessage={error ? `${id}-error` : undefined}
            {...rest}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          
          <div className="select-arrow">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
        </div>
        
        {error && errorMessage && (
          <p id={`${id}-error`} className="select-error-message">
            {errorMessage}
          </p>
        )}
      </div>
    </div>
  );
});

export default Select;