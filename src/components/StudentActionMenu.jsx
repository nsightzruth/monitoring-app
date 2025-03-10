import { useRef, useEffect } from 'react';

const StudentActionMenu = ({ 
  studentId, 
  isOpen, 
  onToggle, 
  onMarkReviewed,
  onAddNote,
  student,
  isLoading,
  menuRef
}) => {
  const localMenuRef = useRef(null);
  
  // Use menuRef from props if provided, otherwise use local ref
  const finalMenuRef = menuRef || localMenuRef;

  // Close menu when clicking outside if using local ref
  useEffect(() => {
    if (!menuRef) {
      const handleClickOutside = (event) => {
        if (finalMenuRef.current && !finalMenuRef.current.contains(event.target)) {
          if (isOpen) {
            onToggle(null);
          }
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen, onToggle, menuRef]);

  const handleAddNote = () => {
    if (onAddNote && student) {
      onAddNote(student);
      onToggle(null); // Close menu after clicking
    }
  };

  return (
    <div className="menu-container" ref={isOpen ? finalMenuRef : null}>
      <button 
        className="menu-button" 
        onClick={() => onToggle(studentId)}
        aria-label="Open menu"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="1"></circle>
          <circle cx="12" cy="5" r="1"></circle>
          <circle cx="12" cy="19" r="1"></circle>
        </svg>
      </button>
      
      {isOpen && (
        <div className="dropdown-menu">
          <button 
            className="menu-item" 
            onClick={() => onMarkReviewed(studentId)}
            disabled={isLoading}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 11l3 3L22 4"></path>
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
            </svg>
            Reviewed today
          </button>
          
          <button 
            className="menu-item" 
            onClick={handleAddNote}
            disabled={isLoading}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
            Add note
          </button>
        </div>
      )}
    </div>
  );
};

export default StudentActionMenu;