import { useState, useEffect, useCallback } from 'react';
import { progressService } from '../services/supabase';

/**
 * Custom hook for managing progress monitoring data and operations
 * 
 * @param {string} staffId - Staff ID to fetch progress data for
 * @returns {Object} - Progress data and operations
 */
export const useProgressMonitoring = (staffId) => {
  const [progressEntries, setProgressEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pendingChanges, setPendingChanges] = useState({});
  const [saveStatus, setSaveStatus] = useState({ loading: false, error: null, success: false });
  const [activeOnly, setActiveOnly] = useState(true);

  // Fetch progress entries when staffId changes
  useEffect(() => {
    if (staffId) {
      fetchProgressEntries();
    }
  }, [staffId, activeOnly]);

  /**
   * Fetch progress entries for the current staff member
   */
  const fetchProgressEntries = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await progressService.getProgressEntries(staffId, activeOnly);
      setProgressEntries(data);
      
      // Clear any pending changes on fresh load
      setPendingChanges({});
    } catch (err) {
      console.error('Error fetching progress entries:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [staffId, activeOnly]);

  /**
   * Toggle between showing active-only followups or all followups
   */
  const toggleActiveOnly = useCallback(() => {
    setActiveOnly(prev => !prev);
  }, []);

  /**
   * Update a progress entry in the pending changes
   * @param {string} entryId - ID of the entry to update
   * @param {string} field - Field to update ('applied' or 'value')
   * @param {any} value - New value
   */
  const updateEntry = useCallback((entryId, field, value) => {
    // Get the existing pending changes for this entry or create a new object
    const existingChanges = pendingChanges[entryId] || {};
    
    // Update the specified field
    const updatedChanges = {
      ...existingChanges,
      id: entryId,
      [field]: value
    };
    
    // Update the pending changes state
    setPendingChanges(prev => ({
      ...prev,
      [entryId]: updatedChanges
    }));
  }, [pendingChanges]);

  /**
   * Toggle the applied status for a progress entry
   * @param {string} entryId - ID of the entry to toggle
   */
  const toggleApplied = useCallback((entryId) => {
    // Find the current entry
    const entry = progressEntries.find(e => e.id === entryId);
    if (!entry) return;
    
    // Get the current applied value (from pending changes if it exists, otherwise from the entry)
    const currentApplied = pendingChanges[entryId]?.applied !== undefined 
      ? pendingChanges[entryId].applied 
      : entry.applied;
    
    // Toggle the applied value
    updateEntry(entryId, 'applied', !currentApplied);
  }, [progressEntries, pendingChanges, updateEntry]);

  /**
   * Update the value for a progress entry
   * @param {string} entryId - ID of the entry to update
   * @param {number|string} value - New value
   */
  const updateValue = useCallback((entryId, value) => {
    // Convert to number or null if empty
    const numValue = value === '' ? null : parseFloat(value);
    updateEntry(entryId, 'value', numValue);
  }, [updateEntry]);

  /**
   * Save all pending changes
   * @returns {Promise<Object>} - Result of the operation
   */
  const saveChanges = useCallback(async () => {
    try {
      setSaveStatus({ loading: true, error: null, success: false });
      
      // Convert pending changes object to array
      const updates = Object.values(pendingChanges).filter(update => update.id);
      
      // Skip if there are no updates
      if (updates.length === 0) {
        setSaveStatus({ loading: false, error: null, success: true });
        return { success: true };
      }
      
      // Submit the updates
      const result = await progressService.updateProgressEntries(updates);
      
      if (result.success) {
        // Clear pending changes on success
        setPendingChanges({});
        
        // Refresh the progress entries to get the latest data
        await fetchProgressEntries();
        
        setSaveStatus({ loading: false, error: null, success: true });
        
        // Reset success status after 3 seconds
        setTimeout(() => {
          setSaveStatus(prev => ({ ...prev, success: false }));
        }, 3000);
        
        return { success: true };
      } else {
        throw new Error(result.error || 'Failed to save changes');
      }
    } catch (err) {
      console.error('Error saving changes:', err);
      setSaveStatus({ loading: false, error: err.message, success: false });
      return { success: false, error: err.message };
    }
  }, [pendingChanges, fetchProgressEntries]);

  /**
   * Reset pending changes without saving
   */
  const resetChanges = useCallback(() => {
    setPendingChanges({});
  }, []);

  /**
   * Get the current value for a field (including pending changes)
   * @param {string} entryId - ID of the entry
   * @param {string} field - Field name ('applied' or 'value')
   * @returns {any} - Current value
   */
  const getCurrentValue = useCallback((entryId, field) => {
    // Check if there's a pending change for this field
    if (pendingChanges[entryId] && pendingChanges[entryId][field] !== undefined) {
      return pendingChanges[entryId][field];
    }
    
    // Otherwise, get the value from the entry
    const entry = progressEntries.find(e => e.id === entryId);
    return entry ? entry[field] : null;
  }, [progressEntries, pendingChanges]);

  /**
   * Check if there are any pending changes
   * @returns {boolean} - Whether there are any pending changes
   */
  const hasPendingChanges = useCallback(() => {
    return Object.keys(pendingChanges).length > 0;
  }, [pendingChanges]);

  return {
    progressEntries,
    loading,
    error,
    pendingChanges,
    saveStatus,
    activeOnly,
    fetchProgressEntries,
    toggleApplied,
    updateValue,
    saveChanges,
    resetChanges,
    getCurrentValue,
    hasPendingChanges,
    toggleActiveOnly
  };
};

export default useProgressMonitoring;