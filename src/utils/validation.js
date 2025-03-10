/**
 * Validation utility functions for forms
 */

/**
 * Check if a value is empty (null, undefined, empty string, or only whitespace)
 * @param {*} value - Value to check
 * @returns {boolean} - Whether the value is empty
 */
export const isEmpty = (value) => {
  return value === null || 
         value === undefined || 
         (typeof value === 'string' && value.trim() === '');
};

/**
 * Check if a value is a valid email
 * @param {string} value - Email to validate
 * @returns {boolean} - Whether the email is valid
 */
export const isValidEmail = (value) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
};

/**
 * Check if a value is a valid date in YYYY-MM-DD format
 * @param {string} value - Date string to validate
 * @returns {boolean} - Whether the date is valid
 */
export const isValidDate = (value) => {
  // Check if it's a string and matches YYYY-MM-DD format
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  
  // Check if it's a valid date
  const date = new Date(value);
  return !isNaN(date.getTime());
};

/**
 * Check if a value has minimum length
 * @param {string} value - Value to check
 * @param {number} minLength - Minimum length
 * @returns {boolean} - Whether the value has minimum length
 */
export const hasMinLength = (value, minLength) => {
  return typeof value === 'string' && value.length >= minLength;
};

/**
 * Check if a value has maximum length
 * @param {string} value - Value to check
 * @param {number} maxLength - Maximum length
 * @returns {boolean} - Whether the value has maximum length
 */
export const hasMaxLength = (value, maxLength) => {
  return typeof value === 'string' && value.length <= maxLength;
};

/**
 * Create a validator function for a form
 * @param {Object} validationRules - Validation rules for each field
 * @returns {Function} - Validator function that takes form values and returns errors
 * 
 * Example usage:
 * const validate = createValidator({
 *   name: [
 *     { test: isEmpty, message: 'Name is required' },
 *     { test: (val) => hasMinLength(val, 3), message: 'Name must be at least 3 characters' }
 *   ],
 *   email: [
 *     { test: isEmpty, message: 'Email is required' },
 *     { test: isValidEmail, message: 'Email is invalid' }
 *   ]
 * });
 */
export const createValidator = (validationRules) => {
  return (values) => {
    const errors = {};
    
    Object.entries(validationRules).forEach(([fieldName, rules]) => {
      // Get the field value
      const value = values[fieldName];
      
      // Run each rule until one fails
      for (const rule of rules) {
        // For empty check, we want the test to return true if the value IS empty
        if (rule.test === isEmpty) {
          if (isEmpty(value)) {
            errors[fieldName] = rule.message;
            break;
          }
        } 
        // For other tests, we want the test to return true if the value is valid
        else if (!rule.test(value)) {
          errors[fieldName] = rule.message;
          break;
        }
      }
    });
    
    return errors;
  };
};