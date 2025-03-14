import React, { useEffect } from 'react';
import { useQuickAdd } from '../hooks/useQuickAdd';
import { FormMessage } from '../components/common/Form';
import Button from '../components/common/Button';
import '../styles/pages/QuickAddPage.css';

/**
 * Page component for quickly incrementing progress values
 */
const QuickAddPage = ({ user }) => {
  // Use our quick add hook
  const {
    progressEntries,
    loading,
    error,
    updateStatus,
    fetchTodayEntries,
    incrementValue,
    decrementValue
  } = useQuickAdd(user?.id);

  // Get today's date in a readable format
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Handle increment button click
  const handleIncrement = async (entryId, event) => {
    try {
      // Add a brief animation to give visual feedback
      if (event && event.currentTarget) {
        event.currentTarget.classList.add('button-success');
        // Remove the class after animation completes
        setTimeout(() => {
          if (event.currentTarget) {
            event.currentTarget.classList.remove('button-success');
          }
        }, 400);
      }
      
      await incrementValue(entryId);
    } catch (err) {
      console.error('Error incrementing value:', err);
    }
  };

  // Handle decrement button click
  const handleDecrement = async (entryId, event, e) => {
    // Stop the event from bubbling to the parent button
    e.stopPropagation();
    
    try {
      // Add a brief animation to give visual feedback
      if (event && event.currentTarget) {
        event.currentTarget.classList.add('button-success');
        // Remove the class after animation completes
        setTimeout(() => {
          if (event.currentTarget) {
            event.currentTarget.classList.remove('button-success');
          }
        }, 400);
      }
      
      await decrementValue(entryId);
    } catch (err) {
      console.error('Error decrementing value:', err);
    }
  };

  // Refresh data when component mounts
  useEffect(() => {
    if (user?.id) {
      fetchTodayEntries();
    }
  }, [fetchTodayEntries, user?.id]);

  // Get color class based on index
  const getColorClass = (index) => {
    const colorIndex = (index % 4) + 1; // Cycle through 4 colors (1-4)
    return `color-${colorIndex}`;
  };

  return (
    <section className="table-section">
      <div className="quick-add-header">
        <h2>Quick Add</h2>
        <div className="quick-add-date">{today}</div>
      </div>

      {error && (
        <FormMessage type="error">{error}</FormMessage>
      )}

      {updateStatus.error && (
        <FormMessage type="error">{updateStatus.error}</FormMessage>
      )}

      {/* Success feedback now provided at the button level */}

      {loading ? (
        <div className="loading-container">
          <svg className="loading-spinner" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="4"></circle>
            <path d="M12 2C6.48 2 2 6.48 2 12" stroke="currentColor" strokeWidth="4"></path>
          </svg>
        </div>
      ) : progressEntries.length === 0 ? (
        <div className="no-entries-message">
          <h3 className="no-entries-title">No active progress entries for today</h3>
          <p className="no-entries-info">
            To use Quick Add, you need to have active intervention followups for students that have progress entries scheduled for today.
          </p>
          <div className="no-entries-steps">
            <p>Here's how to set this up:</p>
            <ol>
              <li>Go to the Followups page</li>
              <li>Create a new followup with type "Intervention"</li>
              <li>Set Start Date and End Date to include today</li>
              <li>Submit the followup</li>
            </ol>
          </div>
          <Button 
            variant="primary" 
            onClick={fetchTodayEntries}
            className="mt-4"
          >
            Refresh Data
          </Button>
        </div>
      ) : (
        <div className="quick-add-container">
          <div className="quick-add-buttons">
            {progressEntries.map((entry, index) => (
              <div className="button-row" key={entry.id}>
                <button
                  className={`quick-add-button ${getColorClass(index)}`}
                  onClick={(e) => handleIncrement(entry.id, e)}
                  disabled={updateStatus.loading}
                  aria-label={`Increment count for ${entry.studentName}`}
                >
                  <div className="student-info">
                    <span className="student-name-quick">{entry.studentName}</span>
                    <div className="student-details">
                      {entry.grade && <span className="student-grade-quick">{entry.grade}</span>}
                      <span className="metric-name">{entry.metric}</span>
                    </div>
                  </div>
                  
                  <div className="value-display">
                    <span className="value-text">{entry.value ?? 0}</span>
                  </div>
                </button>
                
                <button
                  className="decrement-button"
                  onClick={(e) => handleDecrement(entry.id, e.currentTarget, e)}
                  disabled={updateStatus.loading || (entry.value === 0 || entry.value === null)}
                  aria-label={`Decrement count for ${entry.studentName}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default QuickAddPage;