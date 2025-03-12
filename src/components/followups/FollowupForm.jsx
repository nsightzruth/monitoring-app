import { useState, useEffect } from 'react';
import { useForm } from '../../hooks/useForm';
import { createValidator, isEmpty } from '../../utils/validation';
import { useStudentData } from '../../context/StudentDataContext';
import Form, { FormGroup, FormRow, FormActions, FormMessage } from '../common/Form';
import FormField from '../common/FormField';
import Button from '../common/Button';
import StudentSearch from '../common/StudentSearch';
import '../../styles/components/Form.css';

// Followup types
const FOLLOWUP_TYPES = [
  { value: 'Intervention', label: 'Intervention' },
  { value: 'Parent Communication', label: 'Parent Communication' },
  { value: 'Psychologist', label: 'Psychologist' },
  { value: 'Test', label: 'Test' },
  { value: 'Other', label: 'Other' }
];

// Create a dynamic validator function based on form data
const createFollowupValidator = (formData) => {
  const baseRules = {
    studentName: [
      { test: isEmpty, message: 'Student name is required' }
    ],
    type: [
      { test: isEmpty, message: 'Followup type is required' }
    ],
    responsiblePerson: [
      { test: isEmpty, message: 'Responsible person is required' }
    ]
  };

  // Add type-specific validation
  if (formData.type === 'Intervention') {
    return {
      ...baseRules,
      intervention: [
        { test: isEmpty, message: 'Intervention details are required' }
      ],
      metric: [
        { test: isEmpty, message: 'Measurement metric is required' }
      ],
      startDate: [
        { test: isEmpty, message: 'Start date is required' }
      ],
      endDate: [
        { test: isEmpty, message: 'End date is required' }
      ]
    };
  } else {
    // For non-intervention types, followup notes are mandatory
    return {
      ...baseRules,
      followupNotes: [
        { test: isEmpty, message: 'Followup notes are required for this type' }
      ]
    };
  }
};

/**
 * Component for submitting new followups
 */
const FollowupForm = ({ 
  onSubmit, 
  onEdit, 
  followupToView, 
  editMode = false, 
  onReset,
  teamMembers = []
}) => {
  // Access student context to find if there's a pre-selected student
  const { selectedStudent, clearSelectedStudent } = useStudentData();
  
  // Track if we're in view mode (viewing existing followup)
  const [viewMode, setViewMode] = useState(false);
  // Track if we're in edit mode
  const [isEditMode, setIsEditMode] = useState(editMode);
  // Track if the student is valid (exists in the database)
  const [validStudent, setValidStudent] = useState(false);
  // Track any server errors
  const [serverError, setServerError] = useState(null);
  // Track success message
  const [successMessage, setSuccessMessage] = useState(null);

  // Get today's date for default values
  const todayDate = new Date().toISOString().split('T')[0];
  
  // Initialize form hook
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
      type: FOLLOWUP_TYPES[3].value, // Index 3 corresponds to 'Test'
      responsiblePerson: '',
      followupNotes: '',
      intervention: '',
      metric: '',
      startDate: todayDate,
      endDate: ''
    },
    // Dynamic validator function
    (formData) => {
      const validator = createValidator(createFollowupValidator(formData));
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
        if (isEditMode && followupToView) {
          // Edit existing followup
          const updateData = {
            type: formData.type,
            responsible_person: formData.responsiblePerson,
            followup_notes: formData.followupNotes,
            intervention: formData.type === 'Intervention' ? formData.intervention : null,
            metric: formData.type === 'Intervention' ? formData.metric : null,
            start_date: formData.type === 'Intervention' ? formData.startDate : null,
            end_date: formData.type === 'Intervention' ? formData.endDate : null
          };
          
          result = await onEdit(followupToView.id, updateData);
        } else {
          // Create new followup
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
          setSuccessMessage(isEditMode ? 'Followup updated successfully!' : 'Followup submitted successfully!');
          return result;
        } else {
          setServerError(result.error || 'Failed to submit followup');
          throw new Error(result.error || 'Failed to submit followup');
        }
      } catch (error) {
        console.error('Error submitting followup:', error);
        setServerError(error.message || 'An unexpected error occurred');
        throw error;
      }
    }
  );

  // Use pre-selected student if available (from team dashboard)
  useEffect(() => {
    if (selectedStudent && !followupToView) {
      setFormValues(prevData => ({
        ...prevData,
        studentName: selectedStudent.name || '',
        studentId: selectedStudent.id || ''
      }));
      setValidStudent(true);
      
      // Clear the selected student from context after using it
      clearSelectedStudent();
    }
  }, [selectedStudent, clearSelectedStudent, followupToView, setFormValues]);

  // Update form when followupToView changes
  useEffect(() => {
    if (followupToView) {
      setFormValues({
        studentName: followupToView.student_name || '',
        studentId: followupToView.student_id || '',
        type: followupToView.type || FOLLOWUP_TYPES[0].value,
        responsiblePerson: followupToView.responsible_person || '',
        followupNotes: followupToView.followup_notes || '',
        intervention: followupToView.intervention || '',
        metric: followupToView.metric || '',
        startDate: followupToView.start_date || todayDate,
        endDate: followupToView.end_date || ''
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
  }, [followupToView, editMode, setFormValues, selectedStudent, todayDate]);

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

  // Prepare team members for dropdown
  const responsiblePersonOptions = teamMembers.map(member => ({
    value: member.id,
    label: member.name
  }));

  return (
    <div className="followup-form-container">
      {serverError && (
        <FormMessage type="error">{serverError}</FormMessage>
      )}
      
      {successMessage && (
        <FormMessage type="success">{successMessage}</FormMessage>
      )}
      
      {viewMode && !isEditMode && (
        <div className="view-mode-banner">
          <p>Viewing existing followup - Form is in read-only mode</p>
        </div>
      )}
      
      {isEditMode && (
        <div className="edit-mode-banner">
          <p>Editing existing followup</p>
        </div>
      )}
      
      <Form onSubmit={handleSubmit} className="followup-form">
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
            label="Followup Type"
            options={FOLLOWUP_TYPES}
            value={values.type}
            onChange={handleChange}
            disabled={isSubmitting || (viewMode && !isEditMode)}
            required
          />
          
          <FormField
            type="select"
            id="responsiblePerson"
            name="responsiblePerson"
            label="Responsible Person"
            options={responsiblePersonOptions}
            value={values.responsiblePerson}
            onChange={handleChange}
            disabled={isSubmitting || (viewMode && !isEditMode)}
            required
          />
        </FormRow>
        
        {/* Show intervention fields if type is Intervention */}
        {values.type === 'Intervention' && (
          <div className="intervention-section">
            <h3>Intervention Details</h3>
            <FormRow>
              <FormField
                type="text"
                id="intervention"
                name="intervention"
                label="Intervention"
                value={values.intervention}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.intervention && !!errors.intervention}
                errorMessage={errors.intervention}
                placeholder="Describe the intervention"
                disabled={isSubmitting || (viewMode && !isEditMode)}
                required
              />
              
              <FormField
                type="text"
                id="metric"
                name="metric"
                label="Metric"
                value={values.metric}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.metric && !!errors.metric}
                errorMessage={errors.metric}
                placeholder="How will this be measured?"
                disabled={isSubmitting || (viewMode && !isEditMode)}
                required
              />
            </FormRow>
            
            <FormRow>
              <FormField
                type="date"
                id="startDate"
                name="startDate"
                label="Start Date"
                value={values.startDate}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.startDate && !!errors.startDate}
                errorMessage={errors.startDate}
                disabled={isSubmitting || (viewMode && !isEditMode)}
                required
              />
              
              <FormField
                type="date"
                id="endDate"
                name="endDate"
                label="End Date"
                value={values.endDate}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.endDate && !!errors.endDate}
                errorMessage={errors.endDate}
                disabled={isSubmitting || (viewMode && !isEditMode)}
                required
              />
            </FormRow>
          </div>
        )}
        
        <FormGroup>
          <FormField
            type="textarea"
            id="followupNotes"
            name="followupNotes"
            label="Followup Notes"
            value={values.followupNotes}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.followupNotes && !!errors.followupNotes}
            errorMessage={errors.followupNotes}
            placeholder="Additional details or context"
            disabled={isSubmitting || (viewMode && !isEditMode)}
            required={values.type !== 'Intervention'}
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
                New Followup
              </Button>
              
              <Button 
                type="button" 
                variant="primary" 
                onClick={handleEditClick}
              >
                Edit Followup
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
                {isEditMode ? 'Save Changes' : 'Submit Followup'}
              </Button>
            </>
          )}
        </FormActions>
      </Form>
    </div>
  );
};

export default FollowupForm;