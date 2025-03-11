import { useState, useCallback, useEffect, useRef } from 'react';

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
  
  // Use refs to prevent infinite loops
  const validationInProgress = useRef(false);
  const latestValues = useRef(values);
  const latestTouched = useRef(touched);
  const prevErrors = useRef({});

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
      setTouched(prev => {
        const newTouched = {
          ...prev,
          [name]: true
        };
        latestTouched.current = newTouched;
        return newTouched;
      });
    } else {
      // Called as handleChange(event)
      const { name, value, type, checked } = eventOrName.target;
      
      setValues(prev => {
        const newValues = {
          ...prev,
          // Handle checkboxes differently
          [name]: type === 'checkbox' ? checked : value
        };
        latestValues.current = newValues;
        return newValues;
      });
      
      // Mark field as touched
      setTouched(prev => {
        const newTouched = {
          ...prev,
          [name]: true
        };
        latestTouched.current = newTouched;
        return newTouched;
      });
    }
  }, []);

  /**
   * Handle input blur
   * @param {Event} e - Blur event
   */
  const handleBlur = useCallback((e) => {
    const { name } = e.target;
    
    // Mark field as touched
    setTouched(prev => {
      const newTouched = {
        ...prev,
        [name]: true
      };
      latestTouched.current = newTouched;
      return newTouched;
    });
    
    // Run validation for this field only
    if (!validationInProgress.current) {
      validationInProgress.current = true;
      
      try {
        const validationErrors = validate(latestValues.current);
        
        if (validationErrors[name]) {
          setErrors(prev => {
            const newErrors = {
              ...prev,
              [name]: validationErrors[name]
            };
            prevErrors.current = newErrors;
            return newErrors;
          });
        } else if (prevErrors.current[name]) {
          setErrors(prev => {
            const newErrors = {...prev};
            delete newErrors[name];
            prevErrors.current = newErrors;
            return newErrors;
          });
        }
      } finally {
        validationInProgress.current = false;
      }
    }
  }, [validate]);
  
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
    latestTouched.current = allTouched;
    
    // Validate all fields
    const validationErrors = validate(values);
    setErrors(validationErrors);
    prevErrors.current = validationErrors;
    
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
    latestValues.current = initialValues;
    setErrors({});
    prevErrors.current = {};
    setTouched({});
    latestTouched.current = {};
    setIsSubmitting(false);
    setSubmitError('');
    setSubmitSuccess('');
  }, [initialValues]);
  
  /**
   * Set form values programmatically
   * @param {Object|Function} newValues - New form values or updater function
   */
  const setFormValues = useCallback((newValues) => {
    setValues(prev => {
      const updatedValues = typeof newValues === 'function' 
        ? newValues(prev) 
        : { ...prev, ...newValues };
      
      // Update the latestValues ref
      latestValues.current = updatedValues;
      return updatedValues;
    });
  }, []);
  
  // Update latestValues ref when values change
  useEffect(() => {
    latestValues.current = values;
  }, [values]);
  
  // Update latestTouched ref when touched changes
  useEffect(() => {
    latestTouched.current = touched;
  }, [touched]);
  
  // Prevent infinite loops and unnecessary error state updates
  useEffect(() => {
    // Run validation when component mounts to initialize errors
    if (!validationInProgress.current) {
      validationInProgress.current = true;
      
      try {
        const allErrors = validate(values);
        const touchedErrors = {};
        
        // Only set errors for touched fields
        Object.keys(touched).forEach(key => {
          if (touched[key] && allErrors[key]) {
            touchedErrors[key] = allErrors[key];
          }
        });
        
        // Only update errors if they've actually changed
        const touchedErrorKeys = Object.keys(touchedErrors);
        const prevErrorKeys = Object.keys(prevErrors.current);
        
        if (
          touchedErrorKeys.length !== prevErrorKeys.length ||
          touchedErrorKeys.some(key => touchedErrors[key] !== prevErrors.current[key]) ||
          prevErrorKeys.some(key => !touchedErrors[key])
        ) {
          setErrors(touchedErrors);
          prevErrors.current = touchedErrors;
        }
      } finally {
        validationInProgress.current = false;
      }
    }
  }, [validate]); // Run only on mount
  
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