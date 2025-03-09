import { useState, useEffect } from 'react';
import '../styles/ReferralForm.css';

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
    referralType: REFERRAL_TYPES[0],
    referralReason: REFERRAL_REASONS[0],
    referralNotes: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [viewMode, setViewMode] = useState(false);

  // Update form when referralToView changes
  useEffect(() => {
    if (referralToView) {
      setFormData({
        studentName: referralToView.student_name || '',
        referralType: referralToView.referral_type || REFERRAL_TYPES[0],
        referralReason: referralToView.referral_reason || REFERRAL_REASONS[0],
        referralNotes: referralToView.referral_notes || ''
      });
      setViewMode(true);
    } else {
      setViewMode(false);
    }
  }, [referralToView]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Form validation
    if (!formData.studentName.trim()) {
      setMessage({ text: 'Student name is required', type: 'error' });
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
          referralType: REFERRAL_TYPES[0],
          referralReason: REFERRAL_REASONS[0],
          referralNotes: ''
        });
        setMessage({ text: 'Referral submitted successfully!', type: 'success' });
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
    setFormData({
      studentName: '',
      referralType: REFERRAL_TYPES[0],
      referralReason: REFERRAL_REASONS[0],
      referralNotes: ''
    });
    setMessage({ text: '', type: '' });
    setViewMode(false);
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
        <input
          type="text"
          id="studentName"
          name="studentName"
          value={formData.studentName}
          onChange={handleChange}
          placeholder="Enter student's full name"
          disabled={submitting || viewMode}
          required
        />
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
          disabled={submitting || viewMode}
        >
          {submitting ? 'Submitting...' : 'Submit Referral'}
        </button>
      </div>
    </form>
  );
};

export default ReferralForm;