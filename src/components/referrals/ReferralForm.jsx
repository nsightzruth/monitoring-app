import { useState, useEffect } from 'react';
import { useForm } from '../../hooks/useForm';
import { createValidator, isEmpty } from '../../utils/validation';
import { useStudentData } from '../../context/StudentDataContext';
import Form, { FormRow, FormActions } from '../common/Form';
import FormMessage from '../common/Form';
import Select from '../common/Select';
import Button from '../common/Button';
import StudentSearch from '../common/StudentSearch';
import '../../styles/components/ReferralForm.css';

// Referral form validation rules
const referralValidator = createValidator({
  studentName: [
    { test: isEmpty, message: 'Student name is required' }
  ]
});

// Constants for dropdown options
const REFERRAL_TYPES = [
  { value: 'Academic Concern', label: 'Academic Concern' },
  { value: 'Behavioral Issue', label: 'Behavioral Issue' },
  { value: 'Attendance', label: 'Attendance' },
  { value: 'Counseling Need', label: 'Counseling Need' },
  { value: 'Other', label: 'Other' }
];

const REFERRAL_REASONS = [
  { value: 'Parent', label: 'Parent' },
  { value: 'Teacher', label: 'Teacher' },
  { value: 'Team', label: 'Team' },
  { value: 'Attendance', label: 'Attendance' },
  { value: 'Other', label: 'Other' }
];


/**
 * Component for submitting new referrals
 */
const ReferralForm = ({ onSubmit, referralToView, onReset }) => {

  
  // Access student context to find if there's a pre-selected student
  const { selectedStudent, clearSelectedStudent } = useStudentData();
  // Track if we're in view mode (viewing existing referral)
  const [viewMode, setViewMode] = useState(false);
  // Track if the student is valid (exists in the database)
  const [validStudent, setValidStudent] = useState(false);
  // Track any server errors
  const [serverError, setServerError] = useState(null);
  // Track success message
  const [successMessage, setSuccessMessage] = useState(null);

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
      referralType: REFERRAL_TYPES[0].value,
      referralReason: REFERRAL_REASONS[0].value,
      referralNotes: ''
    },
    // Validator function
    referralValidator,
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
          setSuccessMessage('Referral submitted successfully!');
          return result;
        } else {
          setServerError(result.error || 'Failed to submit referral');
          throw new Error(result.error || 'Failed to submit referral');
        }
      } catch (error) {
        console.error('Error submitting referral:', error);
        setServerError(error.message || 'An unexpected error occurred');
        throw error;
      }
    }
  );

  // Use pre-selected student if available (from team dashboard)
  useEffect(() => {
    if (selectedStudent && !referralToView) {
      setFormValues(prevData => ({
        ...prevData,
        studentName: selectedStudent.name || '',
        studentId: selectedStudent.id || ''
      }));
      setValidStudent(true);
      
      // Clear the selected student from context after using it
      clearSelectedStudent();
    }
  }, [selectedStudent, clearSelectedStudent, referralToView, setFormValues]);

  // Update form when referralToView changes
  useEffect(() => {
    if (referralToView) {
      setFormValues({
        studentName: referralToView.student_name || '',
        studentId: referralToView.student_id || '',
        referralType: referralToView.referral_type || REFERRAL_TYPES[0].value,
        referralReason: referralToView.referral_reason || REFERRAL_REASONS[0].value,
        referralNotes: referralToView.referral_notes || ''
      });
      setViewMode(true);
      setValidStudent(true);
    } else {
      setViewMode(false);
      // Only reset valid student if it's not prefilled from context
      if (!selectedStudent) {
        setValidStudent(false);
      }
    }
  }, [referralToView, setFormValues, selectedStudent]);

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
    if (onReset) {
      onReset();
    }
  };

  return (
    <div className="referral-form-container">
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
          <p>Viewing existing referral - Form is in read-only mode</p>
        </div>
      )}
      
      <Form onSubmit={handleSubmit} className="referral-form">
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
            id="referralType"
            name="referralType"
            label="Type of Referral"
            options={REFERRAL_TYPES}
            value={values.referralType}
            onChange={handleChange}
            disabled={isSubmitting || viewMode}
            required
          />
          
          <Select
            id="referralReason"
            name="referralReason"
            label="Reason for Referral"
            options={REFERRAL_REASONS}
            value={values.referralReason}
            onChange={handleChange}
            disabled={isSubmitting || viewMode}
            required
          />
        </FormRow>
        
        <div className="textarea-container">
          <label htmlFor="referralNotes">Referral Notes:</label>
          <textarea
            id="referralNotes"
            name="referralNotes"
            value={values.referralNotes}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Additional details or context"
            rows={4}
            disabled={isSubmitting || viewMode}
            className="referral-notes-textarea"
          />
        </div>
        
        <FormActions>
          <Button 
            type="button" 
            variant="secondary" 
            onClick={handleReset}
          >
            {viewMode ? 'New Referral' : 'Reset Form'}
          </Button>
          
          <Button 
            type="submit" 
            variant="primary" 
            isLoading={isSubmitting}
            disabled={isSubmitting || viewMode || !validStudent}
          >
            Submit Referral
          </Button>
        </FormActions>
      </Form>
    </div>
  );
};

export default ReferralForm;