import { useState } from 'react';
import { useFollowups } from '../hooks/useFollowups';
import { useStudentData } from '../context/StudentDataContext';
import FollowupForm from '../components/followups/FollowupForm';
import FollowupsTable from '../components/followups/FollowupsTable';
import '../styles/pages/FollowupPage.css';

/**
 * Page component for managing followups
 */
const FollowupPage = ({ user }) => {
  // Use our followups hook
  const {
    followups,
    currentFollowup,
    teamMembers,
    loading,
    error,
    editMode,
    filterStatus,
    addFollowup,
    updateFollowup,
    completeFollowup,
    deleteFollowup,
    viewFollowup,
    resetCurrentFollowup,
    changeFilterStatus
  } = useFollowups(user?.id);
  
  // Student context is used to check if a student was pre-selected
  const { selectedStudent } = useStudentData();

  // Filter status options
  const statusOptions = [
    { value: 'Active', label: 'Active Followups' },
    { value: 'Completed', label: 'Completed Followups' },
    { value: null, label: 'All Followups' }
  ];

  // Handler for form submission
  const handleSubmitFollowup = async (formData) => {
    return await addFollowup(formData);
  };

  // Handler for editing a followup
  const handleEditFollowup = async (followupId, formData) => {
    return await updateFollowup(followupId, formData);
  };

  // Handler for viewing a followup
  const handleViewFollowup = (followup) => {
    viewFollowup(followup);
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handler for editing a followup
  const handleEditButtonClick = (followup) => {
    viewFollowup(followup, true);
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handler for completing a followup
  const handleCompleteFollowup = async (followupId) => {
    await completeFollowup(followupId);
  };

  // Handler for deleting a followup
  const handleDeleteFollowup = async (followupId) => {
    await deleteFollowup(followupId);
  };

  // Handler for filter change
  const handleFilterChange = (e) => {
    changeFilterStatus(e.target.value === 'null' ? null : e.target.value);
  };

  return (
    <>
      <section className="form-section">
        <h2>{currentFollowup && editMode ? 'Edit Followup' : 'Create New Followup'}</h2>
        <FollowupForm 
          onSubmit={handleSubmitFollowup}
          onEdit={handleEditFollowup}
          followupToView={currentFollowup}
          editMode={editMode}
          onReset={resetCurrentFollowup}
          teamMembers={teamMembers}
        />
      </section>
      
      <section className="table-section">
        <h2>Your Followups</h2>
        
        <div className="filter-container">
          <label htmlFor="status-filter">Filter by status:</label>
          <select 
            id="status-filter"
            className="filter-select"
            value={filterStatus === null ? 'null' : filterStatus}
            onChange={handleFilterChange}
          >
            {statusOptions.map(option => (
              <option key={option.label} value={option.value === null ? 'null' : option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        
        {error ? (
          <p className="error-message">{error}</p>
        ) : (
          <FollowupsTable 
            followups={followups} 
            onView={handleViewFollowup}
            onEdit={handleEditButtonClick}
            onComplete={handleCompleteFollowup}
            onDelete={handleDeleteFollowup}
            loading={loading}
          />
        )}
      </section>
    </>
  );
};

export default FollowupPage;