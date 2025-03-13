import { useState, useEffect } from 'react';
import { useFollowups } from '../hooks/useFollowups';
import { useStudentData } from '../context/StudentDataContext';
import FollowupForm from '../components/followups/FollowupForm';
import FollowupsTable from '../components/followups/FollowupsTable';
import StudentSearch from '../components/common/StudentSearch';
import Form, { FormMessage } from '../components/common/Form';
import '../styles/pages/FollowupPage.css';

/**
 * Page component for managing followups
 */
const FollowupPage = ({ user, queryParams }) => {
  // Define state for filters
  const [filterType, setFilterType] = useState('responsible');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedStudentName, setSelectedStudentName] = useState('');

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
    savePendingStatusChanges,
    setFilters,
    teamStudents
  } = useFollowups(user?.id);
  
  // Student context is used to check if a pre-selected student was provided
  const { selectedStudent, clearSelectedStudent } = useStudentData();

  console.log("FollowupPage rendered with queryParams:", queryParams);
  if (queryParams) {
    console.log("queryParams type:", typeof queryParams);
    console.log("queryParams methods:", Object.getOwnPropertyNames(Object.getPrototypeOf(queryParams)));
  }

  // Process query parameters if passed from another page
  useEffect(() => {
    // Debug log the query parameters
    console.log("FollowupPage received queryParams:", queryParams);
    
    if (queryParams) {
      // Check for student filter
      const studentId = queryParams.get('student_id');
      const studentName = queryParams.get('student_name');
      
      console.log("Extracted student_id:", studentId);
      console.log("Extracted student_name:", studentName);
      
      if (studentId && studentName) {
        setSelectedStudentId(studentId);
        setSelectedStudentName(studentName);
        setFilters({
          studentId: studentId
        });
        
        console.log("Set filters with studentId:", studentId);
      }
    }
  }, [queryParams, setFilters]);

  // Use pre-selected student from context if available
  useEffect(() => {
    if (selectedStudent) {
      setSelectedStudentId(selectedStudent.id);
      setSelectedStudentName(selectedStudent.name);
      setFilters({
        studentId: selectedStudent.id
      });
      
      // Clear selected student from context
      clearSelectedStudent();
    }
  }, [selectedStudent, clearSelectedStudent, setFilters]);

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

  // Handler for status filter change
  const handleFilterStatusChange = () => {
    // Toggle between Active and Completed
    const newStatus = filterStatus === 'Active' ? 'Completed' : 'Active';
    changeFilterStatus(newStatus);
  };

  // Handler for status checkbox change
  const handleStatusChange = (followupId, checked) => {
    console.log("Page handling status change:", followupId, checked);
    toggleFollowupStatus(followupId, checked);
  };

  // Handler for saving status changes
  const handleSaveStatuses = async () => {
    console.log("Page handling save statuses");
    await savePendingStatusChanges();
  };

  // Handler for filter type change
  const handleFilterTypeChange = () => {
    // Toggle between 'responsible' and 'team'
    const newFilterType = filterType === 'responsible' ? 'team' : 'responsible';
    setFilterType(newFilterType);
    setFilters({
      filterType: newFilterType,
      studentId: selectedStudentId
    });
  };

  // Handler for student selection
  const handleStudentSelect = (student) => {
    setSelectedStudentId(student.id);
    setSelectedStudentName(student.name);
    setFilters({
      filterType,
      studentId: student.id
    });
  };

  // Handler for clearing student filter
  const handleClearStudentFilter = () => {
    setSelectedStudentId('');
    setSelectedStudentName('');
    setFilters({
      filterType,
      studentId: null
    });
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
          <FormMessage type="error">{error}</FormMessage>
        ) : (
          <>
            <div className="table-filters-container">
              <div className="student-filter-wrapper">
                <div className="student-filter-container">
                  <label htmlFor="student-search">Student:</label>
                  <StudentSearch
                    id="student-search"
                    value={selectedStudentName}
                    onChange={setSelectedStudentName}
                    onSelect={handleStudentSelect}
                    placeholder="Filter by student"
                    className="filter-student-search"
                  />
                  {selectedStudentId && (
                    <button 
                      className="clear-filter-button"
                      onClick={handleClearStudentFilter}
                      title="Clear student filter"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  )}
                </div>
              </div>
              
              <div className="table-toggles">
                {/* View filter toggle */}
                <div className="filter-toggle">
                  <label className="switch">
                    <input 
                      type="checkbox" 
                      checked={filterType === 'team'} 
                      onChange={handleFilterTypeChange} 
                    />
                    <span className="slider round"></span>
                  </label>
                  <span className="toggle-label">
                    {filterType === 'responsible' ? 'My Followups' : 'Team Followups'}
                  </span>
                </div>
                
                {/* Status filter toggle */}
                <div className="filter-toggle">
                  <label className="switch">
                    <input 
                      type="checkbox" 
                      checked={filterStatus === 'Completed'} 
                      onChange={handleFilterStatusChange} 
                    />
                    <span className="slider round"></span>
                  </label>
                  <span className="toggle-label">
                    {filterStatus === 'Active' ? 'Active Followups' : 'Completed Followups'}
                  </span>
                </div>
              </div>
            </div>
            
            <FollowupsTable 
              followups={followups} 
              onView={handleViewFollowup}
              onEdit={handleEditButtonClick}
              onDelete={handleDeleteFollowup}
              pendingStatusChanges={pendingStatusChanges}
              onStatusChange={handleStatusChange}
              onSaveStatuses={handleSaveStatuses}
              loading={loading}
            />
          </>
        )}
      </section>
    </>
  );
};

export default FollowupPage;