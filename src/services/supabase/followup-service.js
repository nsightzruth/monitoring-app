import { supabase } from './config';

/**
 * Followup service for handling followup-related operations
 */
export const followupService = {
  /**
   * Get followups where the staff member is mentioned
   * @param {string} staffId - Staff ID
   * @param {string} status - Filter by status (optional)
   * @returns {Promise<Array>} - Array of followup objects
   */
  getFollowupsByStaff: async (staffId, status = null) => {
    try {
      let query = supabase
        .from('Followup')
        .select(`
          id, type, intervention, metric, start_date, end_date, 
          followup_notes, created_at, updated_at, student_id, 
          responsible_person, followup_status,
          Student:student_id (name, grade),
          Staff:responsible_person (name)
        `);
      
      // Filter by status if provided
      if (status) {
        query = query.eq('followup_status', status);
      }
      
      // Execute the query
      const { data, error } = await query.order('updated_at', { ascending: false });
          
      if (error) throw error;
      
      // Format the data to include student and staff name
      const formattedData = data.map(record => ({
        ...record,
        student_name: record.Student?.name || 'Unknown Student',
        grade: record.Student?.grade || '',
        responsible_person_name: record.Staff?.name || 'Unassigned',
      }));
      
      return formattedData || [];
    } catch (error) {
      console.error('Error fetching followups:', error);
      throw error;
    }
  },

  /**
   * Get followups where the staff member is the responsible person
   * @param {string} staffId - Staff ID
   * @param {string} status - Filter by status (optional)
   * @returns {Promise<Array>} - Array of followup objects
   */
  getFollowupsByResponsiblePerson: async (staffId, status = null) => {
    try {
      let query = supabase
        .from('Followup')
        .select(`
          id, type, intervention, metric, start_date, end_date, 
          followup_notes, created_at, updated_at, student_id, 
          responsible_person, followup_status,
          Student:student_id (name, grade),
          Staff:responsible_person (name)
        `)
        .eq('responsible_person', staffId);
      
      // Filter by status if provided
      if (status) {
        query = query.eq('followup_status', status);
      }
      
      // Also filter out deleted followups
      query = query.neq('followup_status', 'Deleted');
      
      // Execute the query
      const { data, error } = await query.order('updated_at', { ascending: false });
          
      if (error) throw error;
      
      // Format the data to include student and staff name
      const formattedData = data.map(record => ({
        ...record,
        student_name: record.Student?.name || 'Unknown Student',
        grade: record.Student?.grade || '',
        responsible_person_name: record.Staff?.name || 'Unassigned',
      }));
      
      return formattedData || [];
    } catch (error) {
      console.error('Error fetching followups:', error);
      throw error;
    }
  },

  /**
   * Get followups for a team
   * @param {string} teamId - Team ID
   * @param {string} status - Filter by status (optional)
   * @returns {Promise<Array>} - Array of followup objects
   */
  getFollowupsByTeam: async (teamId, status = null) => {
    try {
      let query = supabase
        .from('Followup')
        .select(`
          id, type, intervention, metric, start_date, end_date, 
          followup_notes, created_at, updated_at, student_id, 
          responsible_person, followup_status,
          Student:student_id (name, grade, team_id),
          Staff:responsible_person (name)
        `);
      
      // Filter by status if provided
      if (status) {
        query = query.eq('followup_status', status);
      }
      
      // Execute the query
      const { data, error } = await query.order('updated_at', { ascending: false });
          
      if (error) throw error;
      
      // Filter results to only include students in the specified team
      const teamFollowups = data.filter(record => 
        record.Student && record.Student.team_id === teamId
      );
      
      // Format the data to include student and staff name
      const formattedData = teamFollowups.map(record => ({
        ...record,
        student_name: record.Student?.name || 'Unknown Student',
        grade: record.Student?.grade || '',
        responsible_person_name: record.Staff?.name || 'Unassigned',
      }));
      
      return formattedData || [];
    } catch (error) {
      console.error('Error fetching team followups:', error);
      throw error;
    }
  },

  /**
   * Get followups for a specific student
   * @param {string} studentId - Student ID
   * @param {string} status - Filter by status (optional)
   * @returns {Promise<Array>} - Array of followup objects
   */
  getFollowupsByStudent: async (studentId, status = null) => {
    try {
      let query = supabase
        .from('Followup')
        .select(`
          id, type, intervention, metric, start_date, end_date, 
          followup_notes, created_at, updated_at, 
          responsible_person, followup_status,
          Staff:responsible_person (name)
        `)
        .eq('student_id', studentId);
      
      // Filter by status if provided
      if (status) {
        query = query.eq('followup_status', status);
      }

      // Filter out deleted followups
      query = query.neq('followup_status', 'Deleted');
      
      // Execute the query
      const { data, error } = await query.order('updated_at', { ascending: false });
          
      if (error) throw error;
      
      // Format the data to include responsible person name
      const formattedData = data.map(record => ({
        ...record,
        responsible_person_name: record.Staff?.name || 'Unassigned',
      }));
      
      return formattedData || [];
    } catch (error) {
      console.error('Error fetching student followups:', error);
      throw error;
    }
  },

  /**
   * Create a new followup
   * @param {Object} followupData - Followup data
   * @param {string} followupData.studentId - Student ID
   * @param {string} followupData.type - Followup type
   * @param {string} followupData.responsiblePerson - Staff ID of responsible person
   * @param {string} followupData.followupNotes - Followup notes
   * @param {string} followupData.intervention - Intervention description (for intervention type)
   * @param {string} followupData.metric - Measurement metric (for intervention type)
   * @param {string} followupData.startDate - Start date (for intervention type)
   * @param {string} followupData.endDate - End date (for intervention type)
   * @returns {Promise<Object>} - The created followup object
   */
  createFollowup: async (followupData) => {
    try {
      const now = new Date().toISOString();
      
      const followupObject = {
        student_id: followupData.studentId,
        type: followupData.type,
        responsible_person: followupData.responsiblePerson,
        followup_notes: followupData.followupNotes || '',
        followup_status: 'Active',
        created_at: now,
        updated_at: now
      };
      
      // Add intervention-specific fields if applicable
      if (followupData.type === 'Intervention') {
        followupObject.intervention = followupData.intervention;
        followupObject.metric = followupData.metric;
        followupObject.start_date = followupData.startDate;
        followupObject.end_date = followupData.endDate;
      }
      
      const { data, error } = await supabase
        .from('Followup')
        .insert([followupObject])
        .select(`
          id, type, intervention, metric, start_date, end_date, 
          followup_notes, created_at, updated_at, student_id, 
          responsible_person, followup_status,
          Student:student_id (name, grade),
          Staff:responsible_person (name)
        `);
          
      if (error) throw error;
      
      // Format the returned data
      const formattedRecord = {
        ...data[0],
        student_name: data[0].Student?.name || 'Unknown Student',
        grade: data[0].Student?.grade || '',
        responsible_person_name: data[0].Staff?.name || 'Unassigned',
      };
      
      return formattedRecord;
    } catch (error) {
      console.error('Error creating followup:', error);
      throw error;
    }
  },

  /**
   * Update a followup
   * @param {string} followupId - Followup ID
   * @param {Object} followupData - Updated followup data
   * @returns {Promise<Object>} - The updated followup object
   */
  updateFollowup: async (followupId, followupData) => {
    try {
      const updateObject = {
        ...followupData,
        updated_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('Followup')
        .update(updateObject)
        .eq('id', followupId)
        .select(`
          id, type, intervention, metric, start_date, end_date, 
          followup_notes, created_at, updated_at, student_id, 
          responsible_person, followup_status,
          Student:student_id (name, grade),
          Staff:responsible_person (name)
        `);
          
      if (error) throw error;
      
      // Format the returned data
      const formattedRecord = {
        ...data[0],
        student_name: data[0].Student?.name || 'Unknown Student',
        grade: data[0].Student?.grade || '',
        responsible_person_name: data[0].Staff?.name || 'Unassigned',
      };
      
      return formattedRecord;
    } catch (error) {
      console.error('Error updating followup:', error);
      throw error;
    }
  },

  /**
   * Mark a followup as complete and create a note
   * @param {string} followupId - Followup ID
   * @param {string} staffId - Staff ID completing the followup
   * @returns {Promise<Object>} - Result with status and data
   */
  markFollowupComplete: async (followupId, staffId) => {
    try {
      // Start a Supabase transaction
      // Note: Supabase doesn't support true transactions yet, so we'll do this in steps
      
      // 1. Get the followup details
      const { data: followup, error: fetchError } = await supabase
        .from('Followup')
        .select(`
          id, type, intervention, metric, start_date, end_date, 
          followup_notes, student_id, responsible_person, followup_status,
          Student:student_id (name)
        `)
        .eq('id', followupId)
        .single();
        
      if (fetchError) throw fetchError;
      
      // 2. Update the followup status to 'Completed'
      const { data: updatedFollowup, error: updateError } = await supabase
        .from('Followup')
        .update({ 
          followup_status: 'Completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', followupId)
        .select();
        
      if (updateError) throw updateError;
      
      // 3. Create a note to document the completion
      const today = new Date().toISOString().split('T')[0];
      const studentName = followup.Student?.name || 'Unknown Student';
      
      let noteContent;
      if (followup.type === 'Intervention') {
        noteContent = `Completed ${followup.type} followup: ${followup.intervention || ''} measured by ${followup.metric || ''} from ${followup.start_date || ''} to ${followup.end_date || ''}. ${followup.followup_notes || ''}`;
      } else {
        noteContent = `Completed ${followup.type} followup: ${followup.followup_notes || ''}`;
      }
      
      const { data: note, error: noteError } = await supabase
        .from('IncidentsNotes')
        .insert([{
          student_id: followup.student_id,
          student_name: studentName,
          type: 'Note',
          date: today,
          note: noteContent,
          draft_status: false,
          staff_id: staffId
        }])
        .select();
        
      if (noteError) throw noteError;
      
      return { 
        success: true, 
        data: { 
          followup: updatedFollowup[0],
          note: note[0]
        }
      };
    } catch (error) {
      console.error('Error marking followup as complete:', error);
      return { success: false, error: error.message };
    }
  },

  /**
     * Mark a followup as deleted
     * @param {string} followupId - Followup ID
     * @returns {Promise<boolean>} - Success status
     */
  deleteFollowup: async (followupId) => {
    try {
      const { error } = await supabase
        .from('Followup')
        .update({ 
          followup_status: 'Deleted',
          updated_at: new Date().toISOString()
        })
        .eq('id', followupId);
          
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error marking followup as deleted:', error);
      return false;
    }
  },

  /**
   * Update the status of multiple followups
   * @param {Array<Object>} statusUpdates - Array of { id, status } objects
   * @returns {Promise<Object>} - Result with success and data
   */
  updateFollowupStatuses: async (statusUpdates) => {
    try {
      const results = [];
      const now = new Date().toISOString();
      
      // Process updates in batches
      for (const update of statusUpdates) {
        const { data, error } = await supabase
          .from('Followup')
          .update({ 
            followup_status: update.status,
            updated_at: now
          })
          .eq('id', update.id)
          .select();
          
        if (error) throw error;
        
        if (data && data.length > 0) {
          results.push(data[0]);
        }
      }
      
      return { success: true, data: results };
    } catch (error) {
      console.error('Error updating followup statuses:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get all team members for staff
   * @param {string} staffId - Staff ID
   * @returns {Promise<Array>} - Array of team members
   */
  getTeamMembers: async (staffId) => {
    try {
      // First get the teams this staff is in
      const { data: staffTeams, error: teamsError } = await supabase
        .from('StaffTeams')
        .select('team_id')
        .eq('staff_id', staffId);
        
      if (teamsError) throw teamsError;
      
      if (!staffTeams || staffTeams.length === 0) {
        return [];
      }
      
      // Extract team IDs
      const teamIds = staffTeams.map(team => team.team_id);
      
      // Get all staff in these teams
      const { data: teamMembers, error: membersError } = await supabase
        .from('StaffTeams')
        .select(`
          staff_id,
          Staff:staff_id (id, name, email)
        `)
        .in('team_id', teamIds);
        
      if (membersError) throw membersError;
      
      // Use a map to deduplicate staff members
      const staffMap = new Map();
      
      teamMembers.forEach(member => {
        if (member.Staff && !staffMap.has(member.Staff.id)) {
          staffMap.set(member.Staff.id, {
            id: member.Staff.id,
            name: member.Staff.name,
            email: member.Staff.email
          });
        }
      });
      
      // Convert map to array
      const uniqueStaff = Array.from(staffMap.values());
      
      return uniqueStaff;
    } catch (error) {
      console.error('Error fetching team members:', error);
      throw error;
    }
  }
}; 