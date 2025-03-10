import React from 'react';
import '../../styles/components/Form.css';

/**
 * Form component with standardized layout and actions
 */
const Form = ({ children, onSubmit, className = '', ...rest }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) onSubmit(e);
  };

  return (
    <form onSubmit={handleSubmit} className={`form ${className}`} {...rest}>
      {children}
    </form>
  );
};

/**
 * FormGroup component for grouping form elements
 */
export const FormGroup = ({ children, className = '', ...rest }) => {
  return (
    <div className={`form-group ${className}`} {...rest}>
      {children}
    </div>
  );
};

/**
 * FormRow component for horizontal layout of form elements
 */
export const FormRow = ({ children, className = '', ...rest }) => {
  return (
    <div className={`form-row ${className}`} {...rest}>
      {children}
    </div>
  );
};

/**
 * FormActions component for form buttons
 */
export const FormActions = ({ children, className = '', ...rest }) => {
  return (
    <div className={`form-actions ${className}`} {...rest}>
      {children}
    </div>
  );
};

/**
 * FormMessage component for displaying form-level messages (success/error)
 */
export const FormMessage = ({ 
  type = 'info', 
  children, 
  className = '',
  ...rest 
}) => {
  if (!children) return null;
  
  return (
    <div className={`form-message form-message--${type} ${className}`} {...rest}>
      {children}
    </div>
  );
};

export default Form;