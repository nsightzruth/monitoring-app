import { useState, useEffect, useCallback } from 'react';
import { incidentService } from '../services/supabase';

/**
 * Custom hook for managing incidents and notes data and operations
 * 
 * @param {string} staffId - Staff ID to fetch incidents for
 * @returns {Object} - Incidents data and operations
 */
export const useIncidents = (staffId) => {
  const [records, setRecords] = useState([]);
  const [currentRecord, setCurrentRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitStatus, setSubmitStatus] = useState({ loading: false, error: null, success: false });

  // Fetch incidents and notes when staffId changes
  useEffect(() => {
    if (staffId) {
      fetchIncidents();
    }
  }, [staffId]);

  /**
   * Fetch incidents and notes for the current staff member
   */
  const fetchIncidents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await incidentService.getIncidentsByStaff(staffId);
      setRecords(data);
    } catch (err) {
      console.error('Error fetching incidents and notes:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [staffId]);

  /**
   * Add a new incident or note
   * @param {Object} recordData - Incident/note data to add
   * @returns {Promise<Object>} - Result of the operation
   */
  const addIncident = useCallback(async (recordData) => {
    try {
      setSubmitStatus({ loading: true, error: null, success: false });
      
      const newRecord = await incidentService.createIncident(recordData, staffId);
      
      // Update state with the new record
      setRecords(prevRecords => [newRecord, ...prevRecords]);
      
      setSubmitStatus({ loading: false, error: null, success: true });
      return { success: true, data: newRecord };
    } catch (err) {
      console.error('Error adding incident/note:', err);
      setSubmitStatus({ loading: false, error: err.message, success: false });
      return { success: false, error: err.message };
    }
  }, [staffId]);

  /**
   * Set the current record to view
   * @param {Object} record - Incident/note record to view
   */
  const viewRecord = useCallback((record) => {
    setCurrentRecord(record);
  }, []);

  /**
   * Reset the current record
   */
  const resetCurrentRecord = useCallback(() => {
    setCurrentRecord(null);
  }, []);

  /**
   * Reset the submit status
   */
  const resetSubmitStatus = useCallback(() => {
    setSubmitStatus({ loading: false, error: null, success: false });
  }, []);

  /**
   * Get incidents and notes for a specific student
   * @param {string} studentId - Student ID
   * @returns {Promise<Array>} - Array of incident/note records
   */
  const getStudentIncidents = useCallback(async (studentId) => {
    try {
      return await incidentService.getIncidentsByStudent(studentId);
    } catch (err) {
      console.error('Error fetching student incidents:', err);
      return [];
    }
  }, []);

  return {
    records,
    currentRecord,
    loading,
    error,
    submitStatus,
    fetchIncidents,
    addIncident,
    viewRecord,
    resetCurrentRecord,
    resetSubmitStatus,
    getStudentIncidents
  };
};