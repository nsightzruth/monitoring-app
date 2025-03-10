import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Button from './Button';
import '../../styles/components/Modal.css';

/**
 * Modal component for displaying content in a modal dialog
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Function to call when the modal is closed
 * @param {string} props.title - Modal title
 * @param {React.ReactNode} props.children - Modal content
 * @param {string} props.size - Modal size ('sm', 'md', 'lg', 'xl')
 * @param {boolean} props.closeOnOutsideClick - Whether to close the modal when clicking outside
 * @param {string} props.className - Additional CSS class
 * @param {React.ReactNode} props.footer - Modal footer content
 */
const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  closeOnOutsideClick = true,
  className = '',
  footer,
  ...rest
}) => {
  const modalRef = useRef(null);

  // Close modal when pressing Escape
  useEffect(() => {
    const handleEscapeKey = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen, onClose]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Click outside to close
  const handleBackdropClick = (e) => {
    if (closeOnOutsideClick && modalRef.current && !modalRef.current.contains(e.target)) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div 
        className={`modal modal--${size} ${className}`} 
        ref={modalRef}
        {...rest}
      >
        <div className="modal-header">
          {title && <h2 className="modal-title">{title}</h2>}
          <Button 
            className="modal-close" 
            variant="ghost" 
            size="sm"
            onClick={onClose}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            }
            aria-label="Close"
          />
        </div>
        <div className="modal-body">
          {children}
        </div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );

  // Use portal to render the modal at the end of the document body
  return createPortal(modalContent, document.body);
};

export default Modal;