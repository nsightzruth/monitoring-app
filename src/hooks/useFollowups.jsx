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
  const [teamStudents, setTeamStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitStatus, setSubmitStatus] = useState({ loading: false, error: null, success: false });
  const [editMode, setEditMode] = useState(false);
  const [filterStatus, setFilterStatus] = useState('Active');
  const [pendingStatusChanges, setPendingStatusChanges] = useState({});
  
  // New state for additional filters
  const [filters, setFilterState] = useState({
    filterType: 'responsible',
    studentId: null
  });

  // Fetch followups when staffId, filterStatus, or filters change
  useEffect(() => {
    if (staffId) {
      fetchFollowups();
      fetchTeamMembers();
      fetchTeamStudents();
    }
  }, [staffId, filterStatus, filters]);

  /**
   * Set filters for followups
   * @param {Object} newFilters - New filter values
   */
  const setFilters = useCallback((newFilters) => {
    setFilterState(prevFilters => ({
      ...prevFilters,
      ...newFilters
    }));
  }, []);

  /**
   * Fetch followups with current filters applied
   */
  const fetchFollowups = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Prepare options with all current filters
      const options = {
        staffId,
        filterType: filters.filterType,
        status: filterStatus,
        studentId: filters.studentId
      };
      
      // Use the new flexible getFollowups method
      const data = await followupService.getFollowups(options);
      setFollowups(data);
    } catch (err) {
      console.error('Error fetching followups:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [staffId, filterStatus, filters]);

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
   * Fetch students from the teams the staff member belongs to
   */
  const fetchTeamStudents = useCallback(async () => {
    try {
      const students = await followupService.getTeamStudents(staffId);
      setTeamStudents(students);
    } catch (err) {
      console.error('Error fetching team students:', err);
      // Don't set error state here as it's not critical
    }
  }, [staffId]);

  /**
   * Add a new followup - SIMPLIFIED version for better debugging
   * @param {Object} formData - Form data for the new followup
   * @returns {Promise<Object>} - Result of the operation
   */
  const addFollowup = useCallback(async (formData) => {
    try {
      // Show loading state
      setSubmitStatus({ loading: true, error: null, success: false });
      
      // Log the data to help with debugging
      console.log('Creating followup with data:', formData);
      
      // Prepare the data for the service call
      const followupData = {
        studentId: formData.studentId,
        type: formData.type,
        responsiblePerson: formData.responsiblePerson,
        followupNotes: formData.followupNotes || '',
        intervention: formData.intervention,
        metric: formData.metric,
        startDate: formData.startDate,
        endDate: formData.endDate
      };
      
      // Call the service
      const newFollowup = await followupService.createFollowup(followupData);
      
      // Update the state with the new followup
      setFollowups(prevFollowups => [newFollowup, ...prevFollowups]);
      
      // Set success state
      setSubmitStatus({ loading: false, error: null, success: true });
      
      return { success: true, data: newFollowup };
    } catch (err) {
      // Handle and log errors
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
      
      // Log data for debugging
      console.log('Updating followup:', followupId, followupData);
      
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
        await fetchFollowups();
        
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
    console.log("Toggling status:", followupId, checked ? 'Completed' : 'Active');
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
      
      console.log("Saving status changes:", pendingStatusChanges);
      
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
      
      const results = [];
      
      // Process each update
      for (const update of updates) {
        if (update.status === 'Completed') {
          // For each completed followup, mark it complete and create a note
          console.log("Completing followup:", update.id);
          
          // FIXED: Directly use the markFollowupComplete service function
          // This ensures the note creation functionality from the service is used
          const result = await followupService.markFollowupComplete(update.id, staffId);
          if (result.success) {
            results.push(result.data);
          } else {
            console.error("Error completing followup:", update.id, result.error);
          }
        } else {
          // For other status changes, just update the status
          console.log("Updating followup status:", update.id, update.status);
          const updatedFollowup = await followupService.updateFollowup(update.id, {
            followup_status: update.status
          });
          results.push(updatedFollowup);
        }
      }
      
      // Clear pending changes
      setPendingStatusChanges({});
      
      // Refresh the followups list
      await fetchFollowups();
      
      setSubmitStatus({ loading: false, error: null, success: true });
      return { success: true, data: results };
    } catch (err) {
      console.error('Error saving status changes:', err);
      setSubmitStatus({ loading: false, error: err.message, success: false });
      return { success: false, error: err.message };
    }
  }, [pendingStatusChanges, staffId, fetchFollowups]);

  /**
   * Get draft incidents and notes for the current staff member
   * @returns {Promise<Array>} - Array of draft incident/note records
   */
  const getDraftsByStaff = useCallback(async () => {
    try {
      return await followupService.getDraftsByStaff(staffId);
    } catch (err) {
      console.error('Error fetching drafts:', err);
      return [];
    }
  }, [staffId]);

  return {
    followups,
    currentFollowup,
    teamMembers,
    teamStudents,
    loading,
    error,
    submitStatus,
    editMode,
    filterStatus,
    pendingStatusChanges,
    filters,
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
    savePendingStatusChanges,
    setFilters,
    getDraftsByStaff
  };
};

export default useFollowups;