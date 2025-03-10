import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import '../styles/IncidentNoteForm.css';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const INCIDENT_NOTE_TYPES = ['Incident', 'Note'];

const IncidentNoteForm = ({ onSubmit, incidentToView, onReset }) => {
  const today = new Date();
  const formattedDate = today.toISOString().split('T')[0];
  const formattedTime = today.toTimeString().slice(0, 5);
  
  const [formData, setFormData] = useState({
    studentName: '',
    studentId: '',
    type: INCIDENT_NOTE_TYPES[1], // Default to "Note"
    date: formattedDate,
    time: formattedTime,
    location: '',
    offense: '',
    note: '',
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [viewMode, setViewMode] = useState(false);
  
  // Student autocomplete states
  const [studentSuggestions, setStudentSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [validStudent, setValidStudent] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  
  // Refs for handling clicks outside the suggestion box
  const suggestionsRef = useRef(null);
  const inputRef = useRef(null);
  
  // Timeout for debouncing search
  const searchTimeout = useRef(null);

  // Update form when incidentToView changes
  useEffect(() => {
    if (incidentToView) {
      setFormData({
        studentName: incidentToView.student_name || '',
        studentId: incidentToView.student_id || '',
        type: incidentToView.type || INCIDENT_NOTE_TYPES[1],
        date: incidentToView.date || formattedDate,
        time: incidentToView.time || formattedTime,
        location: incidentToView.location || '',
        offense: incidentToView.offense || '',
        note: incidentToView.note || '',
      });
      setViewMode(true);
      setValidStudent(true);
    } else {
      setViewMode(false);
      setValidStudent(false);
    }
  }, [incidentToView]);

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

  // Search for students when name input changes
  useEffect(() => {
    // Only search if not in view mode and input is at least 3 characters
    if (!viewMode && formData.studentName.length >= 3) {
      // Clear any existing timeout
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
      
      // Debounce the search
      searchTimeout.current = setTimeout(() => {
        searchStudents(formData.studentName);
      }, 300);
    } else {
      setStudentSuggestions([]);
      setShowSuggestions(false);
    }
    
    // Clean up timeout on component unmount
    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [formData.studentName, viewMode]);

  const searchStudents = async (query) => {
    if (query.length < 3) return;
    
    try {
      setIsSearching(true);
      
      // Search for students with names containing the query string
      const { data, error } = await supabase
        .from('Student')
        .select('id, name, grade')
        .ilike('name', `%${query}%`)
        .order('name')
        .limit(10);
      
      if (error) throw error;
      
      setStudentSuggestions(data || []);
      setShowSuggestions(data && data.length > 0);
      
      // Check if the exact name exists in the results
      const exactMatch = data?.some(student => 
        student.name.toLowerCase() === query.toLowerCase()
      );
      setValidStudent(exactMatch);
      
    } catch (err) {
      console.error("Error searching students:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'studentName') {
      // For student name, update validation state too
      setValidStudent(false);
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleStudentSelect = (studentName, studentId) => {
    setFormData(prev => ({
      ...prev,
      studentName,
      studentId
    }));
    setValidStudent(true);
    setShowSuggestions(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Form validation
    if (!formData.studentName.trim()) {
      setMessage({ text: 'Student name is required', type: 'error' });
      return;
    }
    
    // Validate that the student exists in the database
    if (!validStudent) {
      setMessage({ text: 'Please select a valid student from the suggestions', type: 'error' });
      return;
    }

    // Type-specific validation
    if (formData.type === 'Incident') {
      if (!formData.location.trim() || !formData.offense.trim()) {
        setMessage({ text: 'Location and Offense are required for Incidents', type: 'error' });
        return;
      }
    } else { // Note type
      if (!formData.note.trim()) {
        setMessage({ text: 'Note is required for Notes type', type: 'error' });
        return;
      }
    }
    
    try {
      setSubmitting(true);
      setMessage({ text: '', type: '' });
      
      const result = await onSubmit(formData);
      
      if (result.success) {
        // Reset form on success
        setFormData({
          studentName: '',
          studentId: '',
          type: INCIDENT_NOTE_TYPES[1],
          date: formattedDate,
          time: formattedTime,
          location: '',
          offense: '',
          note: ''
        });
        setMessage({ text: 'Record submitted successfully!', type: 'success' });
        setValidStudent(false);
      } else {
        setMessage({ text: result.error || 'Failed to submit record', type: 'error' });
      }
    } catch (error) {
      setMessage({ text: 'An unexpected error occurred', type: 'error' });
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      studentName: '',
      studentId: '',
      type: INCIDENT_NOTE_TYPES[1],
      date: formattedDate,
      time: formattedTime,
      location: '',
      offense: '',
      note: ''
    });
    setMessage({ text: '', type: '' });
    setViewMode(false);
    setValidStudent(false);
    if (onReset) {
      onReset();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="incident-note-form">
      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}
      
      {viewMode && (
        <div className="view-mode-banner">
          <p>Viewing existing record - Form is in read-only mode</p>
        </div>
      )}
      
      <div className="inline-form-group">
        <label htmlFor="studentName">Student Name:</label>
        <div className="autocomplete-container">
          <input
            type="text"
            id="studentName"
            name="studentName"
            value={formData.studentName}
            onChange={handleChange}
            onFocus={() => formData.studentName.length >= 3 && setShowSuggestions(true)}
            placeholder="Enter student's full name (min 3 characters)"
            disabled={submitting || viewMode}
            required
            ref={inputRef}
            className={!formData.studentName || validStudent ? '' : 'invalid-input'}
          />
          {isSearching && (
            <div className="search-indicator">studentName
              Searching...
            </div>
          )}
          {showSuggestions && studentSuggestions.length > 0 && (
            <ul className="suggestions-list" ref={suggestionsRef}>
              {studentSuggestions.map(student => (
                <li 
                  key={student.id}
                  onClick={() => handleStudentSelect(student.name, student.id)}
                  className={formData.studentId === student.id ? 'selected' : ''}
                >
                  {student.name} {student.grade ? `(${student.grade})` : ''}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      
      <div className="form-row">
        <div className="inline-form-group">
          <label htmlFor="type">Type:</label>
          <select
            id="type"
            name="type"
            value={formData.type}
            onChange={handleChange}
            disabled={submitting || viewMode}
            required
          >
            {INCIDENT_NOTE_TYPES.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
        
        <div className="inline-form-group">
          <label htmlFor="date">Date:</label>
          <input
            type="date"
            id="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            disabled={submitting || viewMode}
            required
          />
        </div>
        
        <div className="inline-form-group">
          <label htmlFor="time">Time:</label>
          <input
            type="time"
            id="time"
            name="time"
            value={formData.time}
            onChange={handleChange}
            disabled={submitting || viewMode}
          />
        </div>
      </div>
      
      {(formData.type === 'Incident' || viewMode && incidentToView?.type === 'Incident') && (
        <div className="form-row">
          <div className="inline-form-group">
            <label htmlFor="location">Location:</label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="Where did the incident occur?"
              disabled={submitting || viewMode}
              required={formData.type === 'Incident'}
            />
          </div>
          
          <div className="inline-form-group">
            <label htmlFor="offense">Offense:</label>
            <input
              type="text"
              id="offense"
              name="offense"
              value={formData.offense}
              onChange={handleChange}
              placeholder="What was the offense?"
              disabled={submitting || viewMode}
              required={formData.type === 'Incident'}
            />
          </div>
        </div>
      )}
      
      <div className="inline-form-group">
        <label htmlFor="note">Note:</label>
        <textarea
          id="note"
          name="note"
          value={formData.note}
          onChange={handleChange}
          placeholder="Additional details or context"
          rows={4}
          disabled={submitting || viewMode}
          required={formData.type === 'Note'}
        />
      </div>
      
      <div className="form-actions">
        <button 
          type="button" 
          className="reset-button" 
          onClick={handleReset}
        >
          {viewMode ? 'New Record' : 'Reset Form'}
        </button>
        
        <button 
          type="submit" 
          className="submit-button" 
          disabled={submitting || viewMode || !validStudent}
        >
          {submitting ? 'Submitting...' : 'Submit'}
        </button>
      </div>
    </form>
  );
};

export default IncidentNoteForm;