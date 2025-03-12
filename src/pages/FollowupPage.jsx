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
    pendingStatusChanges,
    addFollowup,
    updateFollowup,
    deleteFollowup,
    viewFollowup,
    resetCurrentFollowup,
    changeFilterStatus,
    toggleFollowupStatus,
    savePendingStatusChanges
  } = useFollowups(user?.id);
  
  // Student context is used to check if a student was pre-selected
  const { selectedStudent } = useStudentData();

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

  // Handler for deleting a followup
  const handleDeleteFollowup = async (followupId) => {
    await deleteFollowup(followupId);
  };

  // Handler for filter change
  const handleFilterChange = (newStatus) => {
    changeFilterStatus(newStatus);
  };

  // Handler for status change
  const handleStatusChange = (followupId, checked) => {
    toggleFollowupStatus(followupId, checked);
  };

  // Handler for saving status changes
  const handleSaveStatuses = async () => {
    await savePendingStatusChanges();
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
        
        {error ? (
          <p className="error-message">{error}</p>
        ) : (
          <FollowupsTable 
            followups={followups} 
            onView={handleViewFollowup}
            onEdit={handleEditButtonClick}
            onDelete={handleDeleteFollowup}
            pendingStatusChanges={pendingStatusChanges}
            onStatusChange={handleStatusChange}
            onSaveStatuses={handleSaveStatuses}
            filterStatus={filterStatus}
            onFilterChange={handleFilterChange}
            loading={loading}
          />
        )}
      </section>
    </>
  );
};

export default FollowupPage;