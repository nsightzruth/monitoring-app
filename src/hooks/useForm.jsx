import { useState, useCallback, useEffect } from 'react';

/**
 * Custom hook for handling form state and validation
 * 
 * @param {Object} initialValues - Initial form values
 * @param {Function} validate - Validation function
 * @param {Function} onSubmit - Submit handler
 * @returns {Object} - Form handling utilities
 */
export const useForm = (initialValues = {}, validate = () => ({}), onSubmit = () => {}) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  /**
   * Handle input change
   * @param {Event|string} eventOrName - Event object or field name
   * @param {*} valueOrEvent - Field value or event object
   */
  const handleChange = useCallback((eventOrName, valueOrEvent) => {
    // Support both event objects and direct (name, value) parameters
    if (typeof eventOrName === 'string') {
      // Called as handleChange('name', value)
      const name = eventOrName;
      const value = valueOrEvent;
      
      setValues(prev => ({
        ...prev,
        [name]: value
      }));
      
      // Mark field as touched
      setTouched(prev => ({
        ...prev,
        [name]: true
      }));
    } else {
      // Called as handleChange(event)
      const { name, value, type, checked } = eventOrName.target;
      
      setValues(prev => ({
        ...prev,
        // Handle checkboxes differently
        [name]: type === 'checkbox' ? checked : value
      }));
      
      // Mark field as touched
      setTouched(prev => ({
        ...prev,
        [name]: true
      }));
    }
  }, []);

  /**
   * Handle input blur
   * @param {Event} e - Blur event
   */
  const handleBlur = useCallback((e) => {
    const { name } = e.target;
    
    // Mark field as touched
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));
    
    // Validate single field
    const validationErrors = validate(values);
    setErrors(validationErrors);
  }, [values, validate]);
  
  /**
   * Handle form submission
   * @param {Event} e - Submit event
   */
  const handleSubmit = useCallback(async (e) => {
    if (e) e.preventDefault();
    
    // Mark all fields as touched
    const allTouched = Object.keys(values).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {});
    
    setTouched(allTouched);
    
    // Validate all fields
    const validationErrors = validate(values);
    setErrors(validationErrors);
    
    // Check if there are any errors
    if (Object.keys(validationErrors).length === 0) {
      setIsSubmitting(true);
      setSubmitError('');
      setSubmitSuccess('');
      
      try {
        await onSubmit(values);
        setSubmitSuccess('Form submitted successfully!');
      } catch (error) {
        setSubmitError(error.message || 'An error occurred while submitting the form.');
      } finally {
        setIsSubmitting(false);
      }
    }
  }, [values, validate, onSubmit]);
  
  /**
   * Reset form to initial values
   */
  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
    setSubmitError('');
    setSubmitSuccess('');
  }, [initialValues]);
  
  /**
   * Set form values programmatically
   * @param {Object} newValues - New form values
   */
  const setFormValues = useCallback((newValues) => {
    setValues(prev => ({
      ...prev,
      ...newValues
    }));
  }, []);
  
  // Run validation when values change
  useEffect(() => {
    // Only validate touched fields
    const touchedErrors = {};
    const validationErrors = validate(values);
    
    Object.keys(touched).forEach(key => {
      if (touched[key] && validationErrors[key]) {
        touchedErrors[key] = validationErrors[key];
      }
    });
    
    setErrors(touchedErrors);
  }, [values, touched, validate]);
  
  return {
    values,
    errors,
    touched,
    isSubmitting,
    submitError,
    submitSuccess,
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm,
    setFormValues
  };
};