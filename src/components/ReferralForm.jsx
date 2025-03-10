import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import '../styles/ReferralForm.css';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const REFERRAL_TYPES = [
  'Academic Concern',
  'Behavioral Issue',
  'Attendance',
  'Counseling Need',
  'Other'
];

const REFERRAL_REASONS = [
  'Parent',
  'Teacher',
  'Team',
  'Attendance',
  'Other'
];

const ReferralForm = ({ onSubmit, referralToView, onReset }) => {
  const [formData, setFormData] = useState({
    studentName: '',
    studentId: '', // Added studentId field to track the selected student's ID
    referralType: REFERRAL_TYPES[0],
    referralReason: REFERRAL_REASONS[0],
    referralNotes: ''
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

  // Update form when referralToView changes
  useEffect(() => {
    console.log("referralToView changed:", referralToView);
    if (referralToView) {
      setFormData({
        studentName: referralToView.student_name || '',
        studentId: referralToView.student_id || '',
        referralType: referralToView.referral_type || REFERRAL_TYPES[0],
        referralReason: referralToView.referral_reason || REFERRAL_REASONS[0],
        referralNotes: referralToView.referral_notes || ''
      });
      setViewMode(true);
      setValidStudent(true);
    } else {
      setViewMode(false);
      setValidStudent(false);
    }
  }, [referralToView]);

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
        .select('id, name')
        .ilike('name', `%${query}%`)
        .order('name')
        .limit(10);
      
      if (error) throw error;
      
      console.log("Found students:", data);
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
    
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleStudentSelect = (studentName, studentId) => {
    setFormData((prev) => ({
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
    
    try {
      setSubmitting(true);
      setMessage({ text: '', type: '' });
      
      const result = await onSubmit(formData);
      
      if (result.success) {
        // Reset form on success
        setFormData({
          studentName: '',
          studentId: '',
          referralType: REFERRAL_TYPES[0],
          referralReason: REFERRAL_REASONS[0],
          referralNotes: ''
        });
        setMessage({ text: 'Referral submitted successfully!', type: 'success' });
        setValidStudent(false);
      } else {
        setMessage({ text: result.error || 'Failed to submit referral', type: 'error' });
      }
    } catch (error) {
      setMessage({ text: 'An unexpected error occurred', type: 'error' });
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    console.log("Reset button clicked");
    setFormData({
      studentName: '',
      studentId: '',
      referralType: REFERRAL_TYPES[0],
      referralReason: REFERRAL_REASONS[0],
      referralNotes: ''
    });
    setMessage({ text: '', type: '' });
    setViewMode(false);
    setValidStudent(false);
    if (onReset) {
      onReset();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="referral-form">
      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}
      
      {viewMode && (
        <div className="view-mode-banner">
          <p>Viewing existing referral - Form is in read-only mode</p>
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
            <div className="search-indicator">
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
                  {student.name}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      
      <div className="form-row">
        <div className="inline-form-group">
          <label htmlFor="referralType">Type of Referral:</label>
          <select
            id="referralType"
            name="referralType"
            value={formData.referralType}
            onChange={handleChange}
            disabled={submitting || viewMode}
            required
          >
            {REFERRAL_TYPES.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
        
        <div className="inline-form-group">
          <label htmlFor="referralReason">Reason for Referral:</label>
          <select
            id="referralReason"
            name="referralReason"
            value={formData.referralReason}
            onChange={handleChange}
            disabled={submitting || viewMode}
            required
          >
            {REFERRAL_REASONS.map(reason => (
              <option key={reason} value={reason}>{reason}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="inline-form-group">
        <label htmlFor="referralNotes">Referral Notes:</label>
        <textarea
          id="referralNotes"
          name="referralNotes"
          value={formData.referralNotes}
          onChange={handleChange}
          placeholder="Additional details or context"
          rows={4}
          disabled={submitting || viewMode}
        />
      </div>
      
      <div className="form-actions">
        <button 
          type="button" 
          className="reset-button" 
          onClick={handleReset}
        >
          {viewMode ? 'New Referral' : 'Reset Form'}
        </button>
        
        <button 
          type="submit" 
          className="submit-button" 
          disabled={submitting || viewMode || !validStudent}
        >
          {submitting ? 'Submitting...' : 'Submit Referral'}
        </button>
      </div>
    </form>
  );
};

export default ReferralForm;