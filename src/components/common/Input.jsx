import React, { forwardRef } from 'react';
import '../../styles/components/Input.css';

/**
 * Input component with validation states and icon support
 */
const Input = forwardRef(({
  id,
  name,
  type = 'text',
  label,
  value = '', // Default to empty string to ensure controlled component
  onChange,
  onBlur,
  error = false,
  errorMessage,
  disabled = false,
  placeholder,
  required = false,
  icon,
  className = '',
  ...rest
}, ref) => {
  
  const inputClass = `
    input
    ${error ? 'input--error' : ''}
    ${icon ? 'input--with-icon' : ''}
    ${className}
  `;

  // Use id as name if name is not provided
  const inputName = name || id;

  // Create a wrapped onChange handler 
  const handleChange = (e) => {
    if (onChange) {
      onChange(e);
    }
  };

  return (
    <div className="input-container inline-layout">
      {label && (
        <label 
          className="input-label" 
          htmlFor={id}
        >
          {label}
          {required && <span className="input-required">*</span>}
        </label>
      )}
      
      <div className="input-field-container">
        <input
          id={id}
          name={inputName}
          ref={ref}
          type={type}
          value={value}
          onChange={handleChange}
          onBlur={onBlur}
          disabled={disabled}
          placeholder={placeholder}
          required={required}
          className={inputClass.trim()}
          aria-invalid={error}
          aria-errormessage={error ? `${id}-error` : undefined}
          {...rest}
        />
      
      {error && errorMessage && (
        <p id={`${id}-error`} className="input-error-message">
          {errorMessage}
        </p>
      )}
      </div>
    </div>
  );
});

export default Input;