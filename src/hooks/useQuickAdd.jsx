import { useState, useEffect, useCallback } from 'react';
import { quickAddService } from '../services/supabase';

/**
 * Custom hook for managing Quick Add functionality
 * 
 * @param {string} staffId - Staff ID to fetch progress data for
 * @returns {Object} - Quick Add data and operations
 */
export const useQuickAdd = (staffId) => {
  const [progressEntries, setProgressEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updateStatus, setUpdateStatus] = useState({ loading: false, error: null, success: false });

  // Fetch progress entries when staffId changes
  useEffect(() => {
    if (staffId) {
      fetchTodayEntries();
    }
  }, [staffId]);

  /**
   * Fetch today's progress entries for the current staff member
   */
  const fetchTodayEntries = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await quickAddService.getTodayProgressEntries(staffId);
      setProgressEntries(data);
    } catch (err) {
      console.error('Error fetching today progress entries:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [staffId]);

  /**
   * Increment the value for a progress entry
   * @param {string} entryId - ID of the entry to increment
   */
  const incrementValue = useCallback(async (entryId) => {
    try {
      setUpdateStatus({ loading: true, error: null, success: false });
      
      const updatedEntry = await quickAddService.incrementProgressValue(entryId);
      
      // Update state with the updated entry
      setProgressEntries(prevEntries => 
        prevEntries.map(entry => 
          entry.id === entryId 
            ? { ...entry, value: updatedEntry.value } 
            : entry
        )
      );
      
      setUpdateStatus({ loading: false, error: null, success: true });
      
      // Reset success status after 1.5 seconds
      setTimeout(() => {
        setUpdateStatus(prev => ({ ...prev, success: false }));
      }, 1500);
      
      return updatedEntry;
    } catch (err) {
      console.error('Error incrementing value:', err);
      setUpdateStatus({ loading: false, error: err.message, success: false });
      throw err;
    }
  }, []);

  /**
   * Decrement the value for a progress entry
   * @param {string} entryId - ID of the entry to decrement
   */
  const decrementValue = useCallback(async (entryId) => {
    try {
      setUpdateStatus({ loading: true, error: null, success: false });
      
      const updatedEntry = await quickAddService.decrementProgressValue(entryId);
      
      // Update state with the updated entry
      setProgressEntries(prevEntries => 
        prevEntries.map(entry => 
          entry.id === entryId 
            ? { ...entry, value: updatedEntry.value } 
            : entry
        )
      );
      
      setUpdateStatus({ loading: false, error: null, success: true });
      
      // Reset success status after 1.5 seconds
      setTimeout(() => {
        setUpdateStatus(prev => ({ ...prev, success: false }));
      }, 1500);
      
      return updatedEntry;
    } catch (err) {
      console.error('Error decrementing value:', err);
      setUpdateStatus({ loading: false, error: err.message, success: false });
      throw err;
    }
  }, []);
  
  /**
   * Toggle the applied status for a progress entry
   * @param {string} entryId - ID of the entry to toggle
   */
  const toggleApplied = useCallback(async (entryId) => {
    try {
      setUpdateStatus({ loading: true, error: null, success: false });
      
      const updatedEntry = await quickAddService.toggleAppliedStatus(entryId);
      
      // Update state with the updated entry
      setProgressEntries(prevEntries => 
        prevEntries.map(entry => 
          entry.id === entryId 
            ? { ...entry, applied: updatedEntry.applied } 
            : entry
        )
      );
      
      setUpdateStatus({ loading: false, error: null, success: true });
      
      // Reset success status after 1.5 seconds
      setTimeout(() => {
        setUpdateStatus(prev => ({ ...prev, success: false }));
      }, 1500);
      
      return updatedEntry;
    } catch (err) {
      console.error('Error toggling applied status:', err);
      setUpdateStatus({ loading: false, error: err.message, success: false });
      throw err;
    }
  }, []);

  return {
    progressEntries,
    loading,
    error,
    updateStatus,
    fetchTodayEntries,
    incrementValue,
    decrementValue,
    toggleApplied
  };
};

export default useQuickAdd;