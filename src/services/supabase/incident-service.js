import { supabase } from './config';

/**
 * Incident service for handling incident and note-related operations
 */
export const incidentService = {
  /**
     * Get incidents and notes for the current staff member
     * @param {string} staffId - Staff ID
     * @param {boolean} includeDrafts - Whether to include draft records
     * @returns {Promise<Array>} - Array of incident/note objects
     */
  getIncidentsByStaff: async (staffId, includeDrafts = false) => {
    try {
      let query = supabase
        .from('IncidentsNotes')
        .select(`
          id, date, time, type, location, offense, note, 
          draft_status, created_at, student_id, staff_id,
          Student:student_id (name, grade)
        `)
        .eq('staff_id', staffId);
      
      // Filter out drafts if not requested
      if (!includeDrafts) {
        query = query.eq('draft_status', false);
      }
      
      // Execute the query
      const { data, error } = await query.order('created_at', { ascending: false });
          
      if (error) throw error;
      
      // Format the data to include student name and grade
      const formattedData = data.map(record => ({
        ...record,
        student_name: record.Student?.name || 'Unknown Student',
        grade: record.Student?.grade || '',
      }));
      
      return formattedData || [];
    } catch (error) {
      console.error('Error fetching incidents and notes:', error);
      throw error;
    }
  },

  /**
   * Get draft incidents and notes for the current staff member
   * @param {string} staffId - Staff ID
   * @returns {Promise<Array>} - Array of draft incident/note objects
   */
  getDraftsByStaff: async (staffId) => {
    try {
      const { data, error } = await supabase
        .from('IncidentsNotes')
        .select(`
          id, date, time, type, location, offense, note, 
          draft_status, created_at, student_id, staff_id,
          Student:student_id (name, grade)
        `)
        .eq('staff_id', staffId)
        .eq('draft_status', true)
        .order('created_at', { ascending: false });
          
      if (error) throw error;
      
      // Format the data to include student name and grade
      const formattedData = data.map(record => ({
        ...record,
        student_name: record.Student?.name || null,
        grade: record.Student?.grade || '',
      }));
      
      return formattedData || [];
    } catch (error) {
      console.error('Error fetching draft incidents and notes:', error);
      throw error;
    }
  },

  /**
     * Create a new incident or note
     * @param {Object} recordData - Incident/note data object
     * @param {string} recordData.studentId - Student ID (optional for drafts)
     * @param {string} recordData.studentName - Student name (optional for drafts)
     * @param {string} recordData.type - Record type (Incident or Note)
     * @param {string} recordData.date - Date in ISO format (YYYY-MM-DD)
     * @param {string} recordData.time - Time in format HH:MM (optional)
     * @param {string} recordData.location - Location (for Incidents only)
     * @param {string} recordData.offense - Offense (for Incidents only)
     * @param {string} recordData.note - Note content
     * @param {boolean} recordData.isDraft - Whether this is a draft record
     * @param {string} staffId - Staff ID creating the record
     * @returns {Promise<Object>} - The created incident/note object
     */
  createIncident: async (recordData, staffId) => {
    try {
      const recordObject = {
        student_id: recordData.studentId || null,
        student_name: recordData.studentName || null,
        type: recordData.type || 'Note',
        date: recordData.date || new Date().toISOString().split('T')[0],
        time: recordData.time || null,
        location: recordData.type === 'Incident' ? recordData.location : null,
        offense: recordData.type === 'Incident' ? recordData.offense : null,
        note: recordData.note || '',
        draft_status: recordData.isDraft || false,
        staff_id: staffId
      };
      
      const { data, error } = await supabase
        .from('IncidentsNotes')
        .insert([recordObject])
        .select(`
          id, date, time, type, location, offense, note, 
          draft_status, created_at, student_id, student_name, staff_id,
          Student:student_id (name, grade)
        `);
          
      if (error) throw error;
      
      // Format the returned data
      const formattedRecord = {
        ...data[0],
        student_name: data[0].student_name || data[0].Student?.name || null,
        grade: data[0].Student?.grade || '',
      };
      
      return formattedRecord;
    } catch (error) {
      console.error('Error creating incident/note:', error);
      throw error;
    }
  },

  /**
     * Update an existing incident or note
     * @param {string} recordId - ID of the record to update
     * @param {Object} recordData - Updated incident/note data
     * @param {string} recordData.type - Record type (Incident or Note)
     * @param {string} recordData.date - Date in ISO format (YYYY-MM-DD)
     * @param {string} recordData.time - Time in format HH:MM (optional)
     * @param {string} recordData.location - Location (for Incidents only)
     * @param {string} recordData.offense - Offense (for Incidents only)
     * @param {string} recordData.note - Note content
     * @param {string} recordData.studentId - Student ID (for completing drafts)
     * @param {string} recordData.studentName - Student name (for completing drafts)
     * @param {boolean} recordData.isDraft - Whether this is a draft record
     * @returns {Promise<Object>} - The updated incident/note object
     */
  updateIncident: async (recordId, recordData) => {
    try {
      const updateObject = {
        type: recordData.type,
        date: recordData.date,
        time: recordData.time || null,
        location: recordData.type === 'Incident' ? recordData.location : null,
        offense: recordData.type === 'Incident' ? recordData.offense : null,
        note: recordData.note,
        updated_at: new Date().toISOString()
      };
      
      // Include student information if provided (for completing drafts)
      if (recordData.studentId) {
        updateObject.student_id = recordData.studentId;
      }
      
      // Include student name if provided
      if (recordData.studentName) {
        updateObject.student_name = recordData.studentName;
      }
      
      // Update draft status if specified
      if (recordData.isDraft !== undefined) {
        updateObject.draft_status = recordData.isDraft;
      }
      
      const { data, error } = await supabase
        .from('IncidentsNotes')
        .update(updateObject)
        .eq('id', recordId)
        .select(`
          id, date, time, type, location, offense, note, 
          draft_status, created_at, updated_at, student_id, student_name, staff_id,
          Student:student_id (name, grade)
        `);
          
      if (error) throw error;
      
      // Format the returned data
      const formattedRecord = {
        ...data[0],
        student_name: data[0].student_name || data[0].Student?.name || 'Unknown Student',
        grade: data[0].Student?.grade || '',
      };
      
      return formattedRecord;
    } catch (error) {
      console.error('Error updating incident/note:', error);
      throw error;
    }
  },

  /**
   * Delete an incident or note
   * @param {string} recordId - ID of the record to delete
   * @returns {Promise<void>}
   */
  deleteIncident: async (recordId) => {
    try {
      const { error } = await supabase
        .from('IncidentsNotes')
        .delete()
        .eq('id', recordId);
          
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting incident/note:', error);
      throw error;
    }
  },

  /**
     * Get incidents and notes for a specific student
     * @param {string} studentId - Student ID
     * @returns {Promise<Array>} - Array of incident/note objects
     */
  getIncidentsByStudent: async (studentId) => {
    try {
      const { data, error } = await supabase
        .from('IncidentsNotes')
        .select('id, date, time, type, location, offense, note, created_at')
        .eq('student_id', studentId)
        .eq('draft_status', false)
        .order('date', { ascending: false });
          
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching student incidents:', error);
      throw error;
    }
  }
}