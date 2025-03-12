import { useState, useEffect, useCallback } from 'react';
import { followupService } from '../services/supabase';

/**
 * Custom hook for managing followups data and operations
 * 
 * @param {string} staffId - Staff ID to fetch followups for
 * @returns {Object} - Followups data and operations
 */
export const useFollowups = (staffId) => {
  const [followups, setFollowups] = useState([]);
  const [currentFollowup, setCurrentFollowup] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitStatus, setSubmitStatus] = useState({ loading: false, error: null, success: false });
  const [editMode, setEditMode] = useState(false);
  const [filterStatus, setFilterStatus] = useState('Active');
  const [pendingStatusChanges, setPendingStatusChanges] = useState({});

  // Fetch followups when staffId or filterStatus changes
  useEffect(() => {
    if (staffId) {
      fetchFollowups();
      fetchTeamMembers();
    }
  }, [staffId, filterStatus]);

  /**
   * Fetch followups for the current staff member
   */
  const fetchFollowups = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get followups where the current user is the responsible person
      const data = await followupService.getFollowupsByResponsiblePerson(staffId, filterStatus);
      setFollowups(data);
    } catch (err) {
      console.error('Error fetching followups:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [staffId, filterStatus]);

  /**
   * Fetch team members for the current staff member
   */
  const fetchTeamMembers = useCallback(async () => {
    try {
      const members = await followupService.getTeamMembers(staffId);
      setTeamMembers(members);
    } catch (err) {
      console.error('Error fetching team members:', err);
      // Don't set error state here as it's not critical
    }
  }, [staffId]);

  /**
   * Add a new followup
   * @param {Object} followupData - Followup data to add
   * @returns {Promise<Object>} - Result of the operation
   */
  const addFollowup = useCallback(async (followupData) => {
    try {
      setSubmitStatus({ loading: true, error: null, success: false });
      
      const newFollowup = await followupService.createFollowup(followupData);
      
      // Update state with the new followup
      setFollowups(prevFollowups => [newFollowup, ...prevFollowups]);
      
      setSubmitStatus({ loading: false, error: null, success: true });
      return { success: true, data: newFollowup };
    } catch (err) {
      console.error('Error adding followup:', err);
      setSubmitStatus({ loading: false, error: err.message, success: false });
      return { success: false, error: err.message };
    }
  }, []);

  /**
   * Update an existing followup
   * @param {string} followupId - ID of the followup to update
   * @param {Object} followupData - Updated data
   * @returns {Promise<Object>} - Result of the operation
   */
  const updateFollowup = useCallback(async (followupId, followupData) => {
    try {
      setSubmitStatus({ loading: true, error: null, success: false });
      
      const updatedFollowup = await followupService.updateFollowup(followupId, followupData);
      
      // Update state with the edited followup
      setFollowups(prevFollowups => 
        prevFollowups.map(followup => 
          followup.id === followupId ? updatedFollowup : followup
        )
      );
      
      setSubmitStatus({ loading: false, error: null, success: true });
      return { success: true, data: updatedFollowup };
    } catch (err) {
      console.error('Error updating followup:', err);
      setSubmitStatus({ loading: false, error: err.message, success: false });
      return { success: false, error: err.message };
    }
  }, []);

  /**
   * Mark a followup as complete
   * @param {string} followupId - ID of the followup to complete
   * @returns {Promise<Object>} - Result of the operation
   */
  const completeFollowup = useCallback(async (followupId) => {
    try {
      setSubmitStatus({ loading: true, error: null, success: false });
      
      const result = await followupService.markFollowupComplete(followupId, staffId);
      
      if (result.success) {
        // Refresh followups after marking as complete
        fetchFollowups();
        
        setSubmitStatus({ loading: false, error: null, success: true });
        return { success: true, data: result.data };
      } else {
        throw new Error(result.error || 'Failed to complete followup');
      }
    } catch (err) {
      console.error('Error completing followup:', err);
      setSubmitStatus({ loading: false, error: err.message, success: false });
      return { success: false, error: err.message };
    }
  }, [staffId, fetchFollowups]);

  /**
   * Delete a followup
   * @param {string} followupId - ID of the followup to delete
   * @returns {Promise<boolean>} - Whether the deletion was successful
   */
  const deleteFollowup = useCallback(async (followupId) => {
    try {
      const success = await followupService.deleteFollowup(followupId);
      
      if (success) {
        // Remove the deleted followup from state
        setFollowups(prevFollowups => 
          prevFollowups.filter(followup => followup.id !== followupId)
        );
        
        return true;
      } else {
        throw new Error('Failed to delete followup');
      }
    } catch (err) {
      console.error('Error deleting followup:', err);
      return false;
    }
  }, []);

  /**
   * Set the current followup to view or edit
   * @param {Object} followup - Followup to view or edit
   * @param {boolean} isEdit - Whether to put the form in edit mode
   */
  const viewFollowup = useCallback((followup, isEdit = false) => {
    setCurrentFollowup(followup);
    setEditMode(isEdit);
  }, []);

  /**
   * Reset the current followup
   */
  const resetCurrentFollowup = useCallback(() => {
    setCurrentFollowup(null);
    setEditMode(false);
  }, []);

  /**
   * Reset the submit status
   */
  const resetSubmitStatus = useCallback(() => {
    setSubmitStatus({ loading: false, error: null, success: false });
  }, []);

  /**
   * Change the filter status
   * @param {string} status - New status to filter by
   */
  const changeFilterStatus = useCallback((status) => {
    setFilterStatus(status);
  }, []);

  /**
     * Toggle a followup's status in the pending changes
     * @param {string} followupId - ID of the followup to toggle
     * @param {boolean} checked - Whether the checkbox is checked
     */
  const toggleFollowupStatus = useCallback((followupId, checked) => {
    setPendingStatusChanges(prev => ({
      ...prev,
      [followupId]: checked ? 'Completed' : 'Active'
    }));
  }, []);

  /**
   * Save all pending status changes
   * @returns {Promise<Object>} - Result of the operation
   */
  const savePendingStatusChanges = useCallback(async () => {
    try {
      setSubmitStatus({ loading: true, error: null, success: false });
      
      // Prepare the updates
      const updates = Object.entries(pendingStatusChanges).map(([id, status]) => ({
        id,
        status
      }));
      
      // Skip if there are no updates
      if (updates.length === 0) {
        setSubmitStatus({ loading: false, error: null, success: true });
        return { success: true, data: [] };
      }
      
      const result = await followupService.updateFollowupStatuses(updates);
      
      if (result.success) {
        // Clear pending changes
        setPendingStatusChanges({});
        
        // Refresh the followups list
        await fetchFollowups();
        
        setSubmitStatus({ loading: false, error: null, success: true });
        return result;
      } else {
        throw new Error(result.error || 'Failed to update followup statuses');
      }
    } catch (err) {
      console.error('Error saving status changes:', err);
      setSubmitStatus({ loading: false, error: err.message, success: false });
      return { success: false, error: err.message };
    }
  }, [pendingStatusChanges, fetchFollowups]);

  return {
    followups,
    currentFollowup,
    teamMembers,
    loading,
    error,
    submitStatus,
    editMode,
    filterStatus,
    pendingStatusChanges,
    fetchFollowups,
    addFollowup,
    updateFollowup,
    completeFollowup,
    deleteFollowup,
    viewFollowup,
    resetCurrentFollowup,
    resetSubmitStatus,
    changeFilterStatus,
    toggleFollowupStatus,
    savePendingStatusChanges
  };
};