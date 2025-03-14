import { useState, useEffect } from 'react';
import useProgressMonitoring from '../hooks/useProgressMonitoring';
import ProgressMonitoringTable from '../components/progress/ProgressMonitoringTable';
import { FormMessage } from '../components/common/Form';
import '../styles/pages/ProgressMonitoringPage.css';

/**
 * Page component for progress monitoring
 */
const ProgressMonitoringPage = ({ user }) => {
  const [groupByStudent, setGroupByStudent] = useState(true);
  
  // Use our progress monitoring hook
  const {
    progressEntries,
    loading,
    error,
    fetchProgressEntries,
    saveStatus,
    activeOnly,
    toggleApplied,
    updateValue,
    saveChanges,
    resetChanges,
    getCurrentValue,
    hasPendingChanges,
    toggleActiveOnly
  } = useProgressMonitoring(user?.id);

  // Handle toggle for grouping
  const handleToggleGrouping = () => {
    setGroupByStudent(!groupByStudent);
  };

  // Handle saving changes
  const handleSaveChanges = async () => {
    await saveChanges();
  };

  // Handle discarding changes
  const handleDiscardChanges = () => {
    if (window.confirm('Are you sure you want to discard all unsaved changes?')) {
      resetChanges();
    }
  };
  
  // Refresh data when the component mounts
  useEffect(() => {
    // Force refresh data when component mounts
    if (user?.id) {
      fetchProgressEntries();
    }
  }, [fetchProgressEntries, user?.id]);

  return (
    <>
      <section className="table-section">
        <h2>Progress Monitoring</h2>
        
        {error && (
          <FormMessage type="error">{error}</FormMessage>
        )}
        
        {saveStatus.error && (
          <FormMessage type="error">{saveStatus.error}</FormMessage>
        )}
        
        {saveStatus.success && (
          <FormMessage type="success">Changes saved successfully!</FormMessage>
        )}
        
        <div className="table-filters-container">
          <div className="action-buttons">
            {hasPendingChanges() && (
              <>
                <button 
                  className="save-button" 
                  onClick={handleSaveChanges}
                  disabled={saveStatus.loading}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                    <polyline points="17 21 17 13 7 13 7 21"></polyline>
                    <polyline points="7 3 7 8 15 8"></polyline>
                  </svg>
                  Save Changes
                </button>
                
                <button 
                  className="discard-button" 
                  onClick={handleDiscardChanges}
                  disabled={saveStatus.loading}
                >
                  Discard Changes
                </button>
              </>
            )}
          </div>
          
          <div className="table-toggles">
            {/* Group by toggle */}
            <div className="filter-toggle">
              <label className="switch">
                <input 
                  type="checkbox" 
                  checked={groupByStudent} 
                  onChange={handleToggleGrouping} 
                />
                <span className="slider round"></span>
              </label>
              <span className="toggle-label">
                {groupByStudent ? 'Grouped by Student' : 'Chronological View'}
              </span>
            </div>
            
            {/* Active only toggle */}
            <div className="filter-toggle">
              <label className="switch">
                <input 
                  type="checkbox" 
                  checked={activeOnly} 
                  onChange={toggleActiveOnly} 
                />
                <span className="slider round"></span>
              </label>
              <span className="toggle-label">
                {activeOnly ? 'Active Followups Only' : 'All Followups'}
              </span>
            </div>
            
            {/* Refresh button */}
            <button 
              className="refresh-button" 
              onClick={fetchProgressEntries}
              disabled={loading}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 4v6h-6"></path>
                <path d="M1 20v-6h6"></path>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
              </svg>
              Refresh
            </button>
          </div>
        </div>
        
        {/* Debug info */}
        {progressEntries.length === 0 && !loading && (
          <div className="debug-info">
            <p>No progress entries found. This could be because:</p>
            <ul>
              <li>There are no intervention followups for students related to you</li>
              {activeOnly && <li>You have the "Active Followups Only" filter enabled - try toggling it off</li>}
              <li>You're not assigned as a teacher to any students</li>
              <li>You're not part of any teams with students</li>
            </ul>
            <p>Staff ID being used: {user?.id || 'Unknown'}</p>
            <p>Current filter: {activeOnly ? 'Active followups only' : 'All followups'}</p>
          </div>
        )}
        
        <ProgressMonitoringTable 
          entries={progressEntries}
          loading={loading}
          groupByStudent={groupByStudent}
          onToggleApplied={toggleApplied}
          onUpdateValue={updateValue}
          getCurrentValue={getCurrentValue}
        />
      </section>
    </>
  );
};

export default ProgressMonitoringPage;