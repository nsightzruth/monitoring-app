import React from 'react';
import '../../styles/components/FloatingActionButton.css';

/**
 * Floating action button component
 * 
 * @param {Object} props - Component props
 * @param {Function} props.onClick - Click handler
 * @param {React.ReactNode} props.icon - Icon to display
 * @param {string} props.title - Button title for accessibility
 * @param {string} props.ariaLabel - ARIA label for accessibility
 * @param {string} props.className - Additional CSS class
 */
const FloatingActionButton = ({ 
  onClick, 
  icon, 
  title = '', 
  ariaLabel, 
  className = '',
  ...rest
}) => {
  return (
    <button
      className={`fab ${className}`}
      onClick={onClick}
      title={title}
      aria-label={ariaLabel || title}
      {...rest}
    >
      {icon}
    </button>
  );
};

export default FloatingActionButton;