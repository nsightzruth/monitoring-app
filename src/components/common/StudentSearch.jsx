import { useState, useEffect, useRef } from 'react';
import { useStudentData } from '../../context/StudentDataContext';
import '../../styles/components/StudentSearch.css';

/**
 * Reusable student search component with autocomplete
 */
const StudentSearch = ({ 
  id,
  name,
  value = '',
  onChange,
  onSelect,
  disabled = false,
  required = false,
  placeholder = "Enter student's full name (min 3 characters)",
  className = ''
}) => {
  // Use the StudentDataContext instead of the useStudent hook
  const { searchStudents, searchResults, isSearching } = useStudentData();
  const [inputValue, setInputValue] = useState(value);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Refs for handling clicks outside the suggestion box
  const suggestionsRef = useRef(null);
  const inputRef = useRef(null);
  
  // Timeout for debouncing search
  const searchTimeout = useRef(null);

  // Update local state when prop value changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Handle outside clicks to close suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target) &&
        inputRef.current && 
        !inputRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle input change and trigger search
  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    // Call parent onChange handler
    if (onChange) {
      onChange(newValue);
    }
    
    // Debounce search
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    
    if (newValue.length >= 3) {
      searchTimeout.current = setTimeout(() => {
        searchStudents(newValue);
        setShowSuggestions(true);
      }, 300);
    } else {
      setShowSuggestions(false);
    }
  };

  // Handle student selection from suggestions
  const handleStudentSelect = (student) => {
    setInputValue(student.name);
    setShowSuggestions(false);
    
    // Call parent onSelect handler
    if (onSelect) {
      onSelect(student);
    }
  };

  // Generate a unique ID if none is provided
  const inputId = id || `student-search-${Math.random().toString(36).substr(2, 9)}`;
  const inputName = name || inputId;

  return (
    <div className={`student-search-container ${className}`}>
      <input
        type="text"
        id="studentName"
        name={inputName}
        value={inputValue}
        onChange={handleInputChange}
        onFocus={() => inputValue.length >= 3 && searchResults.length > 0 && setShowSuggestions(true)}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        ref={inputRef}
        className="student-search-input"
        aria-label="Search for student"
        aria-autocomplete="list"
        aria-controls={showSuggestions ? `${inputId}-suggestions` : undefined}
        aria-expanded={showSuggestions}
      />
      
      {isSearching && (
        <div className="search-indicator" aria-live="polite">
          Searching...
        </div>
      )}
      
      {showSuggestions && searchResults.length > 0 && (
        <ul 
          id={`${inputId}-suggestions`}
          className="suggestions-list" 
          ref={suggestionsRef}
          role="listbox"
        >
          {searchResults.map(student => (
            <li 
              key={student.id}
              id={`suggestion-${student.id}`}
              onClick={() => handleStudentSelect(student)}
              className="suggestion-item"
              role="option"
              aria-selected={inputValue === student.name}
            >
              {student.name} {student.grade ? `(${student.grade})` : ''}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default StudentSearch;