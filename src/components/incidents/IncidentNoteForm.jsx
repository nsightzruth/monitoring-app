import { useState, useEffect, useRef } from 'react';
import { useForm } from '../../hooks/useForm';
import { createValidator, isEmpty } from '../../utils/validation';
import { useStudentData } from '../../context/StudentDataContext';
import { getTodayForInput, getCurrentTimeForInput } from '../../utils/dateUtils';
import Form, { FormGroup, FormRow, FormActions, FormMessage } from '../common/Form';
import FormField from '../common/FormField';
import Button from '../common/Button';
import StudentSearch from '../common/StudentSearch';
import '../../styles/components/Form.css';

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
    setFormValues,
    setTouched
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

  const studentWasPrefilled = useRef(false);
  useEffect(() => {
    // Case 1: We have an incident to view
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
      
      // Reset our flag since we're viewing an incident
      studentWasPrefilled.current = false;
    } 
    // Case 2: We have a selectedStudent from context
    else if (selectedStudent) {
      console.log('Prefilling from selectedStudent:', selectedStudent);
      
      setFormValues(prevData => ({
        ...prevData,
        studentName: selectedStudent.name || '',
        studentId: selectedStudent.id || ''
      }));
      
      // Set the touched state for these fields
      setTouched(prev => ({
        ...prev,
        studentName: true,
        studentId: true
      }));
      
      setValidStudent(true);
      
      // Set our flag to remember we prefilled a student
      studentWasPrefilled.current = true;
      
      // Clear the selected student
      clearSelectedStudent();
    }
    // Case 3: No incident to view or selected student - reset the form 
    else {
      // Only reset the form if we didn't just prefill from a student
      if (!studentWasPrefilled.current) {
        setViewMode(false);
        setIsEditMode(false);
        setValidStudent(false);
      }
    }
  }, [incidentToView, selectedStudent, editMode, setFormValues, setTouched, clearSelectedStudent, formattedDate, formattedTime]);

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

  const submitForm = (e) => {
    console.log('FollowupForm submission:', {
      studentName: values.studentName,
      studentId: values.studentId,
      validStudent: validStudent
    });

    // First ensure we have valid student data regardless of the validStudent flag
    if (!values.studentId && !isEditMode) {
      console.log('Form validation failed - missing student information');
      setServerError('Please select a valid student from the suggestions');
      return;
    }

    // Now call the original handleSubmit from useForm
    handleSubmit(e);
  };

  return (
    <div className="incident-note-form-container">
      {serverError && (
        <FormMessage type="error">{serverError}</FormMessage>
      )}
      
      {successMessage && (
        <FormMessage type="success">{successMessage}</FormMessage>
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
      
      <Form onSubmit={submitForm} className="incident-note-form">
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
          <FormField
            type="select"
            id="type"
            name="type"
            label="Type"
            options={INCIDENT_NOTE_TYPES}
            value={values.type}
            onChange={handleChange}
            disabled={isSubmitting || (viewMode && !isEditMode)}
            required
          />
          
          <FormField
            type="date"
            id="date"
            name="date"
            label="Date"
            value={values.date}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.date && !!errors.date}
            errorMessage={errors.date}
            disabled={isSubmitting || (viewMode && !isEditMode)}
            required
          />
          
          <FormField
            type="time"
            id="time"
            name="time"
            label="Time"
            value={values.time}
            onChange={handleChange}
            disabled={isSubmitting || (viewMode && !isEditMode)}
          />
        </FormRow>
        
        {(values.type === 'Incident' || ((viewMode || isEditMode) && incidentToView?.type === 'Incident')) && (
          <FormRow>
            <FormField
              type="text"
              id="location"
              name="location"
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
            
            <FormField
              type="text"
              id="offense"
              name="offense"
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
        
        <FormGroup>
          <FormField
            type="textarea"
            id="note"
            name="note"
            label="Note"
            value={values.note}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.note && !!errors.note}
            errorMessage={errors.note}
            placeholder="Additional details or context"
            disabled={isSubmitting || (viewMode && !isEditMode)}
            required={values.type === 'Note'}
          />
        </FormGroup>
        
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
                disabled={isSubmitting || ((!values.studentName || !values.studentId) && !isEditMode)}
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