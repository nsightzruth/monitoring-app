import React, { useMemo } from 'react';
import { formatLocalDate } from '../../utils/dateUtils';
import '../../styles/components/ProgressMonitoringTable.css';

/**
 * Table component for displaying and editing progress monitoring entries
 * 
 * @param {Object} props - Component props
 * @param {Array} props.entries - Array of progress entry objects
 * @param {boolean} props.loading - Whether the data is loading
 * @param {boolean} props.groupByStudent - Whether to group entries by student
 * @param {Function} props.onToggleApplied - Function to call when toggling applied status
 * @param {Function} props.onUpdateValue - Function to call when updating value
 * @param {Function} props.getCurrentValue - Function to get current value (including pending changes)
 */
const ProgressMonitoringTable = ({ 
  entries = [], 
  loading = false,
  groupByStudent = true,
  onToggleApplied,
  onUpdateValue,
  getCurrentValue
}) => {
  // Calculate organized data based on grouping preference
  const organizedData = useMemo(() => {
    if (!entries || entries.length === 0) {
      return [];
    }
        
    // Get today's date as a string in YYYY-MM-DD format
    const today = new Date();
    const todayString = today.getFullYear() + '-' + 
      String(today.getMonth() + 1).padStart(2, '0') + '-' + 
      String(today.getDate()).padStart(2, '0');
    
    // Filter to show only today or earlier dates using string comparison
    const filteredEntries = entries.filter(entry => {
      // Compare date strings (YYYY-MM-DD format) to avoid time zone issues
      return entry.date && entry.date <= todayString;
    });
        
    if (groupByStudent) {
      // Group entries by student
      const studentGroups = {};
      
      filteredEntries.forEach(entry => {
        if (!entry || !entry.studentId) {
          console.warn('Invalid entry found:', entry);
          return;
        }
        
        const studentId = entry.studentId;
        if (!studentGroups[studentId]) {
          studentGroups[studentId] = {
            studentId,
            studentName: entry.studentName || 'Unknown Student',
            grade: entry.grade || '',
            entries: []
          };
        }
        
        studentGroups[studentId].entries.push(entry);
      });
      
      // Sort entries by date for each student (descending)
      Object.values(studentGroups).forEach(group => {
        group.entries.sort((a, b) => {
          if (a.date > b.date) return -1;
          if (a.date < b.date) return 1;
          return 0;
        });
      });
      
      // Convert to array and sort by student name
      return Object.values(studentGroups).sort((a, b) => 
        a.studentName.localeCompare(b.studentName)
      );
    } else {
      // Sort by date (newest first - descending order)
      return [...filteredEntries].sort((a, b) => {
        if (a.date > b.date) return -1;
        if (a.date < b.date) return 1;
        return 0;
      });
    }
  }, [entries, groupByStudent]);

  // Handle checkbox change for applied status
  const handleAppliedChange = (entry) => {
    if (onToggleApplied) {
      onToggleApplied(entry.id);
    }
  };

  // Handle value input change
  const handleValueChange = (entry, e) => {
    if (onUpdateValue) {
      onUpdateValue(entry.id, e.target.value);
    }
  };

  // Render loading state
  if (loading) {
    return (
      <div className="progress-table-loading">
        Loading progress data...
      </div>
    );
  }

  // Render empty state with detailed message
  if (!entries || entries.length === 0) {
    return (
      <div className="progress-table-empty">
        <p>No intervention progress data available. Create an intervention followup to start monitoring progress.</p>
        <p className="debug-info-small">To create progress entries:</p>
        <ol className="debug-info-small">
          <li>Go to the Followups page</li>
          <li>Create a new followup with type "Intervention"</li>
          <li>Make sure to set Start Date and End Date</li>
          <li>Submit the followup</li>
        </ol>
      </div>
    );
  }

  // Render table for grouped by student view
  if (groupByStudent) {
    return (
      <div className="progress-table-container">
        {organizedData.map(group => (
          <div key={group.studentId} className="student-group">
            <div className="student-header">
              <h3>{group.studentName}</h3>
              {group.grade && <span className="student-grade">Grade: {group.grade}</span>}
            </div>
            
            <table className="progress-table">
              <thead>
                <tr>
                  <th className="equal-width">Date</th>
                  <th className="equal-width">Intervention</th>
                  <th className="equal-width">Applied?</th>
                  <th className="equal-width">Metric</th>
                  <th className="equal-width">Value</th>
                </tr>
              </thead>
              <tbody>
                {group.entries.map(entry => (
                  <tr key={entry.id}>
                    <td>{formatLocalDate(entry.date, 'MMM dd yyyy')}</td>
                    <td className="intervention-cell">{entry.intervention}</td>
                    <td className="applied-cell">
                      <input 
                        type="checkbox"
                        checked={getCurrentValue(entry.id, 'applied')}
                        onChange={() => handleAppliedChange(entry)}
                        className="applied-checkbox"
                      />
                    </td>
                    <td>{entry.metric}</td>
                    <td className="value-cell">
                      <input 
                        type="number"
                        value={getCurrentValue(entry.id, 'value') ?? ''}
                        onChange={(e) => handleValueChange(entry, e)}
                        className="value-input"
                        placeholder="Enter value"
                        step="0.01"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    );
  } 
  
  // Render table for chronological view
  return (
    <div className="progress-table-container">
      <table className="progress-table">
        <thead>
          <tr>
            <th className="equal-width">Student</th>
            <th className="equal-width">Date</th>
            <th className="equal-width">Intervention</th>
            <th className="equal-width">Applied?</th>
            <th className="equal-width">Metric</th>
            <th className="equal-width">Value</th>
          </tr>
        </thead>
        <tbody>
          {organizedData.map(entry => (
            <tr key={entry.id}>
              <td className="student-cell">
                <div className="student-name">{entry.studentName}</div>
                {entry.grade && <div className="student-grade">{entry.grade}</div>}
              </td>
              <td>{formatLocalDate(entry.date, 'MMM dd yyyy')}</td>
              <td className="intervention-cell">{entry.intervention}</td>
              <td className="applied-cell">
                <input 
                  type="checkbox"
                  checked={getCurrentValue(entry.id, 'applied')}
                  onChange={() => handleAppliedChange(entry)}
                  className="applied-checkbox"
                />
              </td>
              <td>{entry.metric}</td>
              <td className="value-cell">
                <input 
                  type="number"
                  value={getCurrentValue(entry.id, 'value') ?? ''}
                  onChange={(e) => handleValueChange(entry, e)}
                  className="value-input"
                  placeholder="Enter value"
                  step="0.01"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ProgressMonitoringTable;