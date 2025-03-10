import React from 'react';
import '../../styles/components/Button.css';

/**
 * Button component with various variants
 * 
 * @param {Object} props - Component props
 * @param {string} props.variant - Button variant ('primary', 'secondary', 'danger', 'ghost')
 * @param {string} props.size - Button size ('sm', 'md', 'lg')
 * @param {boolean} props.isLoading - Whether the button is in loading state
 * @param {boolean} props.disabled - Whether the button is disabled
 * @param {string} props.type - Button type attribute
 * @param {string} props.className - Additional CSS class
 * @param {React.ReactNode} props.children - Button content
 * @param {Function} props.onClick - Click handler
 * @param {string} props.icon - Optional icon to display (as SVG)
 */
const Button = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  type = 'button',
  className = '',
  children,
  onClick,
  icon,
  ...rest
}) => {
  const buttonClass = `
    button 
    button--${variant} 
    button--${size}
    ${isLoading ? 'button--loading' : ''}
    ${icon ? 'button--with-icon' : ''}
    ${className}
  `;

  return (
    <button
      type={type}
      className={buttonClass.trim()}
      disabled={disabled || isLoading}
      onClick={onClick}
      {...rest}
    >
      {isLoading && (
        <span className="button__spinner" aria-hidden="true">
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
            <path d="M12 22c5.523 0 10-4.477 10-10h-3c0 3.866-3.134 7-7 7s-7-3.134-7-7H2c0 5.523 4.477 10 10 10z"></path>
          </svg>
        </span>
      )}
      
      {icon && !isLoading && (
        <span className="button__icon">
          {icon}
        </span>
      )}
      
      <span className="button__text">{children}</span>
    </button>
  );
};

/**
 * Icon Button component - a circular button with just an icon
 */
export const IconButton = ({
  variant = 'ghost',
  size = 'md',
  title,
  icon,
  ...props
}) => {
  return (
    <Button
      variant={variant}
      size={size}
      className="button--icon-only"
      aria-label={title}
      title={title}
      icon={icon}
      {...props}
    />
  );
};

export default Button;