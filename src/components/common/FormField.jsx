import React from 'react';
import Input from './Input';
import Select from './Select';
import '../../styles/components/FormField.css';

/**
 * FormField component to standardize form field rendering across the application
 * Wraps Input, Select, and textarea components with consistent styling and error handling
 * 
 * @param {Object} props - Component props
 * @param {string} props.type - Field type (text, select, textarea, etc.)
 * @param {string} props.id - Field ID
 * @param {string} props.name - Field name
 * @param {string} props.label - Field label
 * @param {any} props.value - Field value
 * @param {Function} props.onChange - Change handler
 * @param {Function} props.onBlur - Blur handler
 * @param {boolean} props.error - Whether the field has an error
 * @param {string} props.errorMessage - Error message to display
 * @param {boolean} props.required - Whether the field is required
 * @param {boolean} props.disabled - Whether the field is disabled
 * @param {string} props.placeholder - Field placeholder
 * @param {Array} props.options - Options for select fields
 * @param {string} props.className - Additional CSS class
 */
const FormField = ({
  type = 'text',
  id,
  name,
  label,
  value,
  onChange,
  onBlur,
  error = false,
  errorMessage = '',
  required = false,
  disabled = false,
  placeholder = '',
  options = [],
  className = '',
  ...rest
}) => {
  // Common props for all field types
  const fieldProps = {
    id,
    name: name || id,
    value,
    onChange,
    onBlur,
    error,
    errorMessage,
    required,
    disabled,
    placeholder,
    ...rest
  };

  // Render different field types
  const renderField = () => {
    switch (type) {
      case 'select':
        return <Select {...fieldProps} options={options} label={label} />;
      
      case 'textarea':
        return (
          <div className="textarea-container">
            <label htmlFor={id} className="form-field-label">
              {label}{required && <span className="field-required">*</span>}
            </label>
            <div className="textarea-field-container">
              <textarea
                className={`form-textarea ${error ? 'form-textarea--error' : ''}`}
                rows={4}
                {...fieldProps}
              />
              {error && errorMessage && (
                <p className="form-field-error">{errorMessage}</p>
              )}
            </div>
          </div>
        );
      
      default:
        return <Input {...fieldProps} type={type} label={label} />;
    }
  };

  return (
    <div className={`form-field ${className}`}>
      {renderField()}
    </div>
  );
};

export default FormField;