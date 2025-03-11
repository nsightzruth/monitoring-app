import { useState, useEffect } from 'react';
import { useForm } from '../../hooks/useForm';
import { createValidator, isEmpty } from '../../utils/validation';
import { useStudentData } from '../../context/StudentDataContext';
import Form, { FormRow, FormActions } from '../common/Form';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';
import StudentSearch from '../common/StudentSearch';
import '../../styles/components/IncidentNoteForm.css';

// Get today's date and time for default values
const today = new Date();
// Format date as YYYY-MM-DD using local timezone
const formattedDate = today.getFullYear() + '-' + 
                      String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                      String(today.getDate()).padStart(2, '0');
// Format time as HH:MM
const formattedTime = String(today.getHours()).padStart(2, '0') + ':' + 
                      String(today.getMinutes()).padStart(2, '0');

// Incident/note types
const INCIDENT_NOTE_TYPES = [
  { value: 'Incident', label: 'Incident' },
  { value: 'Note', label: 'Note' }
];

// Form validation rules
const createIncidentValidator = (formData) => {
  const baseRules = {
    studentName: [
      { test: isEmpty, message: 'Student name is required' }
    ],
    date: [
      { test: isEmpty, message: 'Date is required' }
    ]
  };

  // Add type-specific validation
  if (formData.type === 'Incident') {
    return {
      ...baseRules,
      location: [
        { test: isEmpty, message: 'Location is required for incidents' }
      ],
      offense: [
        { test: isEmpty, message: 'Offense is required for incidents' }
      ]
    };
  } else { // Note type
    return {
      ...baseRules,
      note: [
        { test: isEmpty, message: 'Note is required' }
      ]
    };
  }
};

/**
 * Component for submitting new incidents and notes
 */
const IncidentNoteForm = ({ onSubmit, incidentToView, onReset }) => {
  // Access student context to find if there's a pre-selected student
  const { selectedStudent, clearSelectedStudent } = useStudentData();
  
  // Track if we're in view mode (viewing existing record)
  const [viewMode, setViewMode] = useState(false);
  // Track if the student is valid (exists in the database)
  const [validStudent, setValidStudent] = useState(false);
  // Track any server errors
  const [serverError, setServerError] = useState(null);
  // Track success message
  const [successMessage, setSuccessMessage] = useState(null);
  // Track if we've processed the selected student to avoid infinite loops
  const [hasProcessedSelectedStudent, setHasProcessedSelectedStudent] = useState(false);
  
  // Initialize form hook with dynamic validation
  const {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm,
    setFormValues
  } = useForm(
    // Initial values
    {
      studentName: '',
      studentId: '',
      type: INCIDENT_NOTE_TYPES[1].value, // Default to "Note"
      date: formattedDate,
      time: formattedTime,
      location: '',
      offense: '',
      note: ''
    },
    // Dynamic validator function
    (formData) => {
      const validator = createValidator(createIncidentValidator(formData));
      return validator(formData);
    },
    // Submit handler
    async (formData) => {
      if (!validStudent) {
        return { success: false, error: 'Please select a valid student from the suggestions' };
      }

      try {
        setServerError(null);
        setSuccessMessage(null);
        
        const result = await onSubmit(formData);
        
        if (result.success) {
          // Reset form on success
          resetForm();
          setValidStudent(false);
          setHasProcessedSelectedStudent(false);
          setSuccessMessage('Record submitted successfully!');
          return result;
        } else {
          setServerError(result.error || 'Failed to submit record');
          throw new Error(result.error || 'Failed to submit record');
        }
      } catch (error) {
        console.error('Error submitting record:', error);
        setServerError(error.message || 'An unexpected error occurred');
        throw error;
      }
    }
  );

  // Use pre-selected student if available (from team dashboard)
  useEffect(() => {
    // Only process the selectedStudent once and only if it exists and we're not viewing an existing record
    if (selectedStudent && !incidentToView && !hasProcessedSelectedStudent) {
      console.log('Pre-filling form with selected student:', selectedStudent);
      
      // Update form values
      setFormValues({
        ...values,
        studentName: selectedStudent.name || '',
        studentId: selectedStudent.id || ''
      });
      
      // Mark student as valid
      setValidStudent(true);
      
      // Mark that we've processed this student
      setHasProcessedSelectedStudent(true);
      
      // Clear the selected student from context
      clearSelectedStudent();
    }
  }, [selectedStudent, hasProcessedSelectedStudent, incidentToView, values]);

  // Update form when incidentToView changes
  useEffect(() => {
    if (incidentToView) {
      setFormValues({
        studentName: incidentToView.student_name || '',
        studentId: incidentToView.student_id || '',
        type: incidentToView.type || INCIDENT_NOTE_TYPES[1].value,
        date: incidentToView.date || formattedDate,
        time: incidentToView.time || formattedTime,
        location: incidentToView.location || '',
        offense: incidentToView.offense || '',
        note: incidentToView.note || ''
      });
      setViewMode(true);
      setValidStudent(true);
      setHasProcessedSelectedStudent(true); // Prevent conflicts with selectedStudent
    } else {
      setViewMode(false);
      // Only reset valid student if it's not prefilled from context
      if (!selectedStudent && !hasProcessedSelectedStudent) {
        setValidStudent(false);
      }
    }
  }, [incidentToView, setFormValues, selectedStudent, hasProcessedSelectedStudent]);

  // Handle student selection from the dropdown
  const handleStudentSelect = (student) => {
    setFormValues({
      ...values,
      studentName: student.name,
      studentId: student.id
    });
    setValidStudent(true);
  };

  // Handle form reset
  const handleReset = () => {
    resetForm();
    setViewMode(false);
    setValidStudent(false);
    setServerError(null);
    setSuccessMessage(null);
    setHasProcessedSelectedStudent(false); 
    if (onReset) {
      onReset();
    }
  };

  return (
    <div className="incident-note-form-container">
      {serverError && (
        <div className="form-message form-message--error">
          {serverError}
        </div>
      )}
      
      {successMessage && (
        <div className="form-message form-message--success">
          {successMessage}
        </div>
      )}
      
      {viewMode && (
        <div className="view-mode-banner">
          <p>Viewing existing record - Form is in read-only mode</p>
        </div>
      )}
      
      <Form onSubmit={handleSubmit} className="incident-note-form">
        <div className="inline-form-group">
          <label htmlFor="studentName">Student Name:</label>
          <div className="student-search-container">
            <StudentSearch
              value={values.studentName}
              onChange={(value) => {
                handleChange('studentName', value);
                if (validStudent && value !== values.studentName) {
                  setValidStudent(false);
                }
              }}
              onSelect={handleStudentSelect}
              disabled={isSubmitting || viewMode}
              required
            />
            {touched.studentName && errors.studentName && (
              <span className="form-error">{errors.studentName}</span>
            )}
          </div>
        </div>
        
        <FormRow>
          <Select
            id="type"
            name="type"
            label="Type"
            options={INCIDENT_NOTE_TYPES}
            value={values.type}
            onChange={handleChange}
            disabled={isSubmitting || viewMode}
            required
          />
          
          <Input
            id="date"
            name="date"
            type="date"
            label="Date"
            value={values.date}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.date && !!errors.date}
            errorMessage={errors.date}
            disabled={isSubmitting || viewMode}
            required
          />
          
          <Input
            id="time"
            name="time"
            type="time"
            label="Time"
            value={values.time}
            onChange={handleChange}
            disabled={isSubmitting || viewMode}
          />
        </FormRow>
        
        {(values.type === 'Incident' || (viewMode && incidentToView?.type === 'Incident')) && (
          <FormRow>
            <Input
              id="location"
              name="location"
              type="text"
              label="Location"
              value={values.location}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.location && !!errors.location}
              errorMessage={errors.location}
              placeholder="Where did the incident occur?"
              disabled={isSubmitting || viewMode}
              required={values.type === 'Incident'}
            />
            
            <Input
              id="offense"
              name="offense"
              type="text"
              label="Offense"
              value={values.offense}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.offense && !!errors.offense}
              errorMessage={errors.offense}
              placeholder="What was the offense?"
              disabled={isSubmitting || viewMode}
              required={values.type === 'Incident'}
            />
          </FormRow>
        )}
        
        <div className="textarea-container">
          <label htmlFor="note">Note:</label>
          <div className="textarea-field-container">
            <textarea
              id="note"
              name="note"
              value={values.note}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Additional details or context"
              rows={4}
              disabled={isSubmitting || viewMode}
              required={values.type === 'Note'}
              className="incident-note-textarea"
            />
            {touched.note && errors.note && (
              <span className="form-error">{errors.note}</span>
            )}
          </div>
        </div>
        
        <FormActions>
          <Button 
            type="button" 
            variant="secondary" 
            onClick={handleReset}
          >
            {viewMode ? 'New Record' : 'Reset Form'}
          </Button>
          
          <Button 
            type="submit" 
            variant="primary" 
            isLoading={isSubmitting}
            disabled={isSubmitting || viewMode || !validStudent}
          >
            Submit
          </Button>
        </FormActions>
      </Form>
    </div>
  );
};

export default IncidentNoteForm;