import { useState, useEffect } from 'react';
import { useForm } from '../../hooks/useForm';
import { createValidator, isEmpty } from '../../utils/validation';
import { useStudentData } from '../../context/StudentDataContext';
import { getTodayForInput, getCurrentTimeForInput } from '../../utils/dateUtils';
import Form, { FormRow, FormActions } from '../common/Form';
import FormMessage from '../common/Form';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';
import StudentSearch from '../common/StudentSearch';
import '../../styles/components/IncidentNoteForm.css';

// Get today's date and time for default values using the utility functions
const formattedDate = getTodayForInput();
const formattedTime = getCurrentTimeForInput();

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
 * Component for submitting new incidents and notes or editing existing ones
 * 
 * @param {Object} props - Component props
 * @param {Function} props.onSubmit - Function to call when submitting a new record
 * @param {Function} props.onEdit - Function to call when editing an existing record
 * @param {Object} props.incidentToView - Record to view
 * @param {boolean} props.editMode - Whether the form is in edit mode
 * @param {Function} props.onReset - Function to call when resetting the form
 */
const IncidentNoteForm = ({ onSubmit, onEdit, incidentToView, editMode = false, onReset }) => {
  // Access student context to find if there's a pre-selected student
  const { selectedStudent, clearSelectedStudent } = useStudentData();
  
  // Track if we're in view mode (viewing existing record)
  const [viewMode, setViewMode] = useState(false);
  // Track if we're in edit mode
  const [isEditMode, setIsEditMode] = useState(editMode);
  // Track if the student is valid (exists in the database)
  const [validStudent, setValidStudent] = useState(false);
  // Track any server errors
  const [serverError, setServerError] = useState(null);
  // Track success message
  const [successMessage, setSuccessMessage] = useState(null);
  
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
      if (!validStudent && !isEditMode) {
        return { success: false, error: 'Please select a valid student from the suggestions' };
      }

      try {
        setServerError(null);
        setSuccessMessage(null);
        
        let result;
        if (isEditMode && incidentToView) {
          // Edit existing record
          result = await onEdit(incidentToView.id, {
            type: formData.type,
            date: formData.date,
            time: formData.time,
            location: formData.location,
            offense: formData.offense,
            note: formData.note,
            studentName: formData.studentName // Include student name in edit
          });
        } else {
          // Create new record
          result = await onSubmit(formData);
        }
        
        if (result.success) {
          // Reset form on success
          if (!isEditMode) {
            resetForm();
            setValidStudent(false);
          } else {
            // In edit mode, just exit edit mode
            setIsEditMode(false);
            setViewMode(true);
          }
          setSuccessMessage(isEditMode ? 'Record updated successfully!' : 'Record submitted successfully!');
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
    if (selectedStudent && !incidentToView) {
      setFormValues(prevData => ({
        ...prevData,
        studentName: selectedStudent.name || '',
        studentId: selectedStudent.id || ''
      }));
      setValidStudent(true);
      
      // Clear the selected student from context after using it
      clearSelectedStudent();
    }
  }, [selectedStudent, clearSelectedStudent, incidentToView, setFormValues]);

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
      setIsEditMode(editMode);
      setValidStudent(true);
    } else {
      setViewMode(false);
      setIsEditMode(false);
      // Only reset valid student if it's not prefilled from context
      if (!selectedStudent) {
        setValidStudent(false);
      }
    }
  }, [incidentToView, editMode, setFormValues, selectedStudent]);

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
    setIsEditMode(false);
    setValidStudent(false);
    setServerError(null);
    setSuccessMessage(null);
    if (onReset) {
      onReset();
    }
  };
  
  // Handle edit button click
  const handleEditClick = () => {
    setIsEditMode(true);
    setViewMode(false);
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
      
      {viewMode && !isEditMode && (
        <div className="view-mode-banner">
          <p>Viewing existing record - Form is in read-only mode</p>
        </div>
      )}
      
      {isEditMode && (
        <div className="edit-mode-banner">
          <p>Editing existing record</p>
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
              disabled={isSubmitting || (viewMode && !isEditMode)}
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
            disabled={isSubmitting || (viewMode && !isEditMode)}
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
            disabled={isSubmitting || (viewMode && !isEditMode)}
            required
          />
          
          <Input
            id="time"
            name="time"
            type="time"
            label="Time"
            value={values.time}
            onChange={handleChange}
            disabled={isSubmitting || (viewMode && !isEditMode)}
          />
        </FormRow>
        
        {(values.type === 'Incident' || ((viewMode || isEditMode) && incidentToView?.type === 'Incident')) && (
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
              disabled={isSubmitting || (viewMode && !isEditMode)}
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
              disabled={isSubmitting || (viewMode && !isEditMode)}
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
              disabled={isSubmitting || (viewMode && !isEditMode)}
              required={values.type === 'Note'}
              className="incident-note-textarea"
            />
            {touched.note && errors.note && (
              <span className="form-error">{errors.note}</span>
            )}
          </div>
        </div>
        
        <FormActions>
          {viewMode && !isEditMode ? (
            <>
              <Button 
                type="button" 
                variant="secondary" 
                onClick={handleReset}
              >
                New Record
              </Button>
              
              <Button 
                type="button" 
                variant="primary" 
                onClick={handleEditClick}
              >
                Edit Record
              </Button>
            </>
          ) : (
            <>
              <Button 
                type="button" 
                variant="secondary" 
                onClick={handleReset}
              >
                {isEditMode ? 'Cancel Edit' : 'Reset Form'}
              </Button>
              
              <Button 
                type="submit" 
                variant="primary" 
                isLoading={isSubmitting}
                disabled={isSubmitting || (!validStudent && !isEditMode)}
              >
                {isEditMode ? 'Save Changes' : 'Submit'}
              </Button>
            </>
          )}
        </FormActions>
      </Form>
    </div>
  );
};

export default IncidentNoteForm;