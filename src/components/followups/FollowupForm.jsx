import { useState, useEffect } from 'react';
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

/**
 * Simplified component for submitting new followups - focused on fixing submission issues
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
  
  // State for form
  const [viewMode, setViewMode] = useState(false);
  const [isEditMode, setIsEditMode] = useState(editMode);
  const [validStudent, setValidStudent] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form data state
  const [formData, setFormData] = useState({
    studentName: '',
    studentId: '',
    type: FOLLOWUP_TYPES[3].value, // 'Test'
    responsiblePerson: '',
    followupNotes: '',
    intervention: '',
    metric: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: ''
  });
  
  // Form errors state
  const [formErrors, setFormErrors] = useState({});
  
  // Prepare team members for dropdown - do this early
  const responsiblePersonOptions = teamMembers.map(member => ({
    value: member.id,
    label: member.name
  }));

  // When team members load, if there's only one, auto-select it
  useEffect(() => {
    if (teamMembers.length === 1 && !formData.responsiblePerson && !followupToView) {
      setFormData(prev => ({
        ...prev,
        responsiblePerson: teamMembers[0].id
      }));
      
      // Clear any error related to responsiblePerson
      if (formErrors.responsiblePerson) {
        setFormErrors(prev => {
          const newErrors = {...prev};
          delete newErrors.responsiblePerson;
          return newErrors;
        });
      }
    }
  }, [teamMembers, formData.responsiblePerson, followupToView, formErrors]);

  // Use pre-selected student if available
  useEffect(() => {
    if (selectedStudent && !followupToView) {
      setFormData(prev => ({
        ...prev,
        studentName: selectedStudent.name || '',
        studentId: selectedStudent.id || ''
      }));
      setValidStudent(true);
      clearSelectedStudent();
    }
  }, [selectedStudent, clearSelectedStudent, followupToView]);

  // Update form when followupToView changes
  useEffect(() => {
    if (followupToView) {
      setFormData({
        studentName: followupToView.student_name || '',
        studentId: followupToView.student_id || '',
        type: followupToView.type || FOLLOWUP_TYPES[0].value,
        responsiblePerson: followupToView.responsible_person || '',
        followupNotes: followupToView.followup_notes || '',
        intervention: followupToView.intervention || '',
        metric: followupToView.metric || '',
        startDate: followupToView.start_date || new Date().toISOString().split('T')[0],
        endDate: followupToView.end_date || ''
      });
      setViewMode(true);
      setIsEditMode(editMode);
      setValidStudent(true);
      
      // Clear validation errors when viewing existing followup
      setFormErrors({});
    } else {
      setViewMode(false);
      setIsEditMode(false);
      if (!selectedStudent) {
        setValidStudent(false);
      }
    }
  }, [followupToView, editMode, selectedStudent]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Debug logging
    console.log(`Field ${name} changed to:`, value);
    
    // Clear errors for this field when value changes
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  // Handle field change directly (for custom inputs)
  const handleFieldChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Debug logging
    console.log(`Field ${name} changed directly to:`, value);
    
    // Clear errors for this field when value changes
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Handle student selection from the dropdown
  const handleStudentSelect = (student) => {
    setFormData(prev => ({
      ...prev,
      studentName: student.name,
      studentId: student.id
    }));
    setValidStudent(true);
  };

  // Validate form data
  const validateForm = (data) => {
    const errors = {};
    
    // Basic validations
    if (!data.studentName) {
      errors.studentName = 'Student name is required';
    }
    
    if (!data.type) {
      errors.type = 'Type is required';
    }
    
    // Debug logging to help identify the issue
    console.log('Validating responsiblePerson value:', data.responsiblePerson);
    console.log('Type of responsiblePerson:', typeof data.responsiblePerson);
    console.log('Is empty check:', !data.responsiblePerson);
    
    // FIXED: More robust check for responsiblePerson
    if (!data.responsiblePerson && data.responsiblePerson !== 0) {
      errors.responsiblePerson = 'Responsible person is required';
    }
    
    // Type-specific validations
    if (data.type === 'Intervention') {
      if (!data.intervention) {
        errors.intervention = 'Intervention details are required';
      }
      
      if (!data.metric) {
        errors.metric = 'Metric is required';
      }
      
      if (!data.startDate) {
        errors.startDate = 'Start date is required';
      }
      
      if (!data.endDate) {
        errors.endDate = 'End date is required';
      }
    } else {
      // For non-intervention types
      if (!data.followupNotes) {
        errors.followupNotes = 'Followup notes are required';
      }
    }
    
    return errors;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if we have a valid student
    if (!validStudent && !isEditMode) {
      setServerError('Please select a valid student from the suggestions');
      return;
    }
    
    // Debug log current form state
    console.log('Form data before validation:', formData);
    console.log('Team members available:', teamMembers);
    console.log('Responsible person options:', responsiblePersonOptions);
    
    // Validate form data
    const errors = validateForm(formData);
    setFormErrors(errors);
    
    // If there are errors, don't submit
    if (Object.keys(errors).length > 0) {
      console.log('Validation errors:', errors);
      return;
    }
    
    try {
      setIsSubmitting(true);
      setServerError(null);
      setSuccessMessage(null);
      
      console.log('Submitting form data:', formData);
      
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
      
      console.log('Submission result:', result);
      
      if (result.success) {
        // Success handling
        if (!isEditMode) {
          // Reset form for new submissions
          setFormData({
            studentName: '',
            studentId: '',
            type: FOLLOWUP_TYPES[3].value, // 'Test'
            responsiblePerson: '',
            followupNotes: '',
            intervention: '',
            metric: '',
            startDate: new Date().toISOString().split('T')[0],
            endDate: ''
          });
          setValidStudent(false);
        } else {
          // In edit mode, exit edit mode on success
          setIsEditMode(false);
          setViewMode(true);
        }
        
        setSuccessMessage(isEditMode ? 'Followup updated successfully!' : 'Followup submitted successfully!');
      } else {
        setServerError(result.error || 'Failed to submit followup');
      }
    } catch (error) {
      console.error('Error submitting followup:', error);
      setServerError(error.message || 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle form reset
  const handleReset = () => {
    setFormData({
      studentName: '',
      studentId: '',
      type: FOLLOWUP_TYPES[3].value, // 'Test'
      responsiblePerson: '',
      followupNotes: '',
      intervention: '',
      metric: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: ''
    });
    setFormErrors({});
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
      
      <form onSubmit={handleSubmit} className="followup-form">
        <div className="inline-form-group">
          <label htmlFor="studentName">Student Name:</label>
          <div className="student-search-container">
            <StudentSearch
              id="studentName"
              value={formData.studentName}
              onChange={(value) => {
                handleFieldChange('studentName', value);
                if (validStudent && value !== formData.studentName) {
                  setValidStudent(false);
                }
              }}
              onSelect={handleStudentSelect}
              disabled={isSubmitting || (viewMode && !isEditMode)}
              required
            />
            {formErrors.studentName && (
              <span className="form-error">{formErrors.studentName}</span>
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
            value={formData.type}
            onChange={handleChange}
            error={!!formErrors.type}
            errorMessage={formErrors.type}
            disabled={isSubmitting || (viewMode && !isEditMode)}
            required
          />
          
          <FormField
            type="select"
            id="responsiblePerson"
            name="responsiblePerson"
            label="Responsible Person"
            options={responsiblePersonOptions}
            value={formData.responsiblePerson}
            onChange={handleChange}
            error={!!formErrors.responsiblePerson}
            errorMessage={formErrors.responsiblePerson}
            disabled={isSubmitting || (viewMode && !isEditMode)}
            required
          />
        </FormRow>
        
        {/* Show intervention fields if type is Intervention */}
        {formData.type === 'Intervention' && (
          <div className="intervention-section">
            <h3>Intervention Details</h3>
            <FormRow>
              <FormField
                type="text"
                id="intervention"
                name="intervention"
                label="Intervention"
                value={formData.intervention}
                onChange={handleChange}
                error={!!formErrors.intervention}
                errorMessage={formErrors.intervention}
                placeholder="Describe the intervention"
                disabled={isSubmitting || (viewMode && !isEditMode)}
                required
              />
              
              <FormField
                type="text"
                id="metric"
                name="metric"
                label="Metric"
                value={formData.metric}
                onChange={handleChange}
                error={!!formErrors.metric}
                errorMessage={formErrors.metric}
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
                value={formData.startDate}
                onChange={handleChange}
                error={!!formErrors.startDate}
                errorMessage={formErrors.startDate}
                disabled={isSubmitting || (viewMode && !isEditMode)}
                required
              />
              
              <FormField
                type="date"
                id="endDate"
                name="endDate"
                label="End Date"
                value={formData.endDate}
                onChange={handleChange}
                error={!!formErrors.endDate}
                errorMessage={formErrors.endDate}
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
            value={formData.followupNotes}
            onChange={handleChange}
            error={!!formErrors.followupNotes}
            errorMessage={formErrors.followupNotes}
            placeholder="Additional details or context"
            disabled={isSubmitting || (viewMode && !isEditMode)}
            required={formData.type !== 'Intervention'}
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
                disabled={isSubmitting || (viewMode && !isEditMode)}
              >
                {isEditMode ? 'Save Changes' : 'Submit Followup'}
              </Button>
            </>
          )}
        </FormActions>
      </form>
    </div>
  );
};

export default FollowupForm;