import { supabase } from './config';

/**
 * Incident service for handling incident and note-related operations
 */
export const incidentService = {
  /**
   * Get incidents and notes for the current staff member
   * @param {string} staffId - Staff ID
   * @returns {Promise<Array>} - Array of incident/note objects
   */
  getIncidentsByStaff: async (staffId) => {
    try {
      const { data, error } = await supabase
        .from('IncidentsNotes')
        .select(`
          id, date, time, type, location, offense, note, 
          draft_status, created_at, student_id, staff_id,
          Student:student_id (name, grade)
        `)
        .eq('staff_id', staffId)
        .order('created_at', { ascending: false });
          
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
   * Create a new incident or note
   * @param {Object} recordData - Incident/note data object
   * @param {string} recordData.studentId - Student ID
   * @param {string} recordData.studentName - Student name 
   * @param {string} recordData.type - Record type (Incident or Note)
   * @param {string} recordData.date - Date in ISO format (YYYY-MM-DD)
   * @param {string} recordData.time - Time in format HH:MM (optional)
   * @param {string} recordData.location - Location (for Incidents only)
   * @param {string} recordData.offense - Offense (for Incidents only)
   * @param {string} recordData.note - Note content
   * @param {string} staffId - Staff ID creating the record
   * @returns {Promise<Object>} - The created incident/note object
   */
  createIncident: async (recordData, staffId) => {
    try {
      const recordObject = {
        student_id: recordData.studentId,
        student_name: recordData.studentName,
        type: recordData.type,
        date: recordData.date,
        time: recordData.time || null,
        location: recordData.type === 'Incident' ? recordData.location : null,
        offense: recordData.type === 'Incident' ? recordData.offense : null,
        note: recordData.note,
        draft_status: false,
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
        student_name: data[0].student_name || data[0].Student?.name || 'Unknown Student',
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
      
      // Include student name if provided
      if (recordData.studentName) {
        updateObject.student_name = recordData.studentName;
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
        .order('date', { ascending: false });
          
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching student incidents:', error);
      throw error;
    }
  }
};