import { supabase } from './config';
import { incidentService } from './incident-service';

/**
 * Followup service for handling followup-related operations
 */
export const followupService = {
  /**
   * Get followups with flexible filtering options
   * @param {Object} options - Query options
   * @param {string} options.staffId - Staff ID
   * @param {string} options.filterType - Filter type: 'responsible' (default), 'team', 'all'
   * @param {string} options.status - Filter by status (optional)
   * @param {string} options.studentId - Filter by student ID (optional)
   * @returns {Promise<Array>} - Array of followup objects
   */
  getFollowups: async (options) => {
    const { 
      staffId, 
      filterType = 'responsible', 
      status = null,
      studentId = null
    } = options;

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
      
      // Apply different filters based on filterType
      if (filterType === 'responsible') {
        // Only show followups where the user is responsible
        query = query.eq('responsible_person', staffId);
      } else if (filterType === 'team') {
        // We need to get all students in the user's teams first to filter
        const { data: teamStudents } = await supabase.rpc('get_team_students_for_staff', {
          staff_id_param: staffId
        });
        
        if (teamStudents && teamStudents.length > 0) {
          const studentIds = teamStudents.map(s => s.student_id);
          query = query.in('student_id', studentIds);
        }
      }
      // For 'all', we don't apply any staff-based filters
      
      // Filter by status if provided
      if (status) {
        query = query.eq('followup_status', status);
      }
      
      // Filter by student if provided
      if (studentId) {
        query = query.eq('student_id', studentId);
      }
      
      // Exclude deleted followups
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
   * Get all students from teams that the staff member is part of
   * @param {string} staffId - Staff ID
   * @returns {Promise<Array>} - Array of student objects
   */
  getTeamStudents: async (staffId) => {
    try {
      // Use RPC function to get all students in the staff member's teams
      const { data, error } = await supabase.rpc('get_team_students_for_staff', {
        staff_id_param: staffId
      });
      
      if (error) throw error;
      
      // Deduplicate students
      const uniqueStudents = [];
      const studentIds = new Set();
      
      data.forEach(student => {
        if (!studentIds.has(student.student_id)) {
          studentIds.add(student.student_id);
          uniqueStudents.push({
            id: student.student_id,
            name: student.student_name,
            grade: student.grade
          });
        }
      });
      
      return uniqueStudents.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error('Error fetching team students:', error);
      return [];
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
      
      // 3. Format note content based on followup type
      let noteContent = '';
      
      if (followup.type === 'Intervention') {
        noteContent = `Completed ${followup.type} followup: ${followup.intervention || ''} measured by ${followup.metric || ''}`;
        if (followup.start_date && followup.end_date) {
          noteContent += ` from ${followup.start_date} to ${followup.end_date}`;
        }
        if (followup.followup_notes) {
          noteContent += `. ${followup.followup_notes}`;
        }
      } else {
        noteContent = `Completed ${followup.type} followup: ${followup.followup_notes || ''}`;
      }
      
      // 4. Create a note to document the completion
      const incidentData = {
        studentId: followup.student_id,
        studentName: followup.Student?.name || 'Unknown Student',
        type: 'Note',
        date: new Date().toISOString().split('T')[0],
        time: '',
        note: noteContent,
        isDraft: false
      };
      
      const note = await incidentService.createIncident(incidentData, staffId);
      
      return { 
        success: true, 
        data: { 
          followup: updatedFollowup[0],
          note
        }
      };
    } catch (error) {
      console.error('Error marking followup as complete:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get followups where the staff member is mentioned
   * @param {string} staffId - Staff ID
   * @param {string} status - Filter by status (optional)
   * @returns {Promise<Array>} - Array of followup objects
   */
  getFollowupsByStaff: async (staffId, status = null) => {
    return followupService.getFollowups({
      staffId,
      filterType: 'all',
      status
    });
  },

  /**
   * Get followups where the staff member is the responsible person
   * @param {string} staffId - Staff ID
   * @param {string} status - Filter by status (optional)
   * @returns {Promise<Array>} - Array of followup objects
   */
  getFollowupsByResponsiblePerson: async (staffId, status = null) => {
    return followupService.getFollowups({
      staffId,
      filterType: 'responsible',
      status
    });
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
  },

  /**
   * Get followups for a specific student
   * @param {string} studentId - Student ID
   * @param {string} status - Filter by status (optional)
   * @returns {Promise<Array>} - Array of followup objects
   */
  getFollowupsByStudent: async (studentId, status = null) => {
    try {
      return followupService.getFollowups({
        staffId: null, // Not filtering by staff
        filterType: 'all',
        status,
        studentId
      });
    } catch (error) {
      console.error('Error fetching student followups:', error);
      return [];
    }
  }
};

export default followupService;