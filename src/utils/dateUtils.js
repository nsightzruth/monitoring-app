import { format, parseISO } from 'date-fns';

/**
 * Format a date string or Date object to a localized display format
 * @param {string|Date} dateValue - Date string or Date object
 * @param {string} formatString - Format string for date-fns
 * @returns {string} - Formatted date string in local timezone
 */
export const formatLocalDate = (dateValue, formatString = 'MMM dd yyyy') => {
  if (!dateValue) return '';
  
  try {
    // Parse the date if it's a string
    const date = typeof dateValue === 'string' ? parseISO(dateValue) : dateValue;
    
    // Format the date using the provided format string
    return format(date, formatString);
  } catch (error) {
    console.error('Date formatting error:', error, 'for date:', dateValue);
    return String(dateValue);
  }
};

/**
 * Format a date and time to a localized display format
 * @param {string|Date} dateValue - Date string or Date object
 * @param {string|null} timeValue - Time string in format HH:MM (optional)
 * @param {string} formatString - Format string for date-fns
 * @returns {string} - Formatted date and time string in local timezone
 */
export const formatLocalDateTime = (dateValue, timeValue, formatString = 'MMM dd yyyy h:mm a') => {
  if (!dateValue) return '';
  
  try {
    let date;
    
    // If we have both date and time, combine them
    if (timeValue && typeof dateValue === 'string') {
      date = parseISO(`${dateValue}T${timeValue}`);
    } else {
      // Otherwise just parse the date
      date = typeof dateValue === 'string' ? parseISO(dateValue) : dateValue;
    }
    
    // Format the date using the provided format string
    return format(date, formatString);
  } catch (error) {
    console.error('Date/time formatting error:', error, 'for date:', dateValue, 'time:', timeValue);
    return timeValue ? `${String(dateValue)} ${timeValue}` : String(dateValue);
  }
};

/**
 * Get today's date in YYYY-MM-DD format for form inputs
 * @returns {string} - Today's date in YYYY-MM-DD format
 */
export const getTodayForInput = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

/**
 * Get current time in HH:MM format for form inputs
 * @returns {string} - Current time in HH:MM format
 */
export const getCurrentTimeForInput = () => {
  const now = new Date();
  return now.toTimeString().slice(0, 5);
};