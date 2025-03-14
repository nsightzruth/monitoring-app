import { supabase } from './config';

/**
 * Service for handling quick add operations
 */
export const quickAddService = {
  /**
   * Get today's progress entries for students based on user's teams and teacher relationships
   * @param {string} staffId - Staff ID
   * @returns {Promise<Array>} - Array of progress entries with student information
   */
  getTodayProgressEntries: async (staffId) => {
    try {
      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];
      
      // Get students from team relationships and teacher-student relationships
      const students = await getRelatedStudents(staffId);
      
      // If no students found, return empty array early
      if (students.length === 0) {
        return [];
      }
      
      // Get student IDs
      const studentIds = students.map(student => student.id);
      
      // Get active intervention followups for these students
      const { data: interventionFollowups, error: followupsError } = await supabase
        .from('Followup')
        .select('id, student_id, followup_status, intervention, metric, start_date, end_date')
        .eq('type', 'Intervention')
        .eq('followup_status', 'Active')
        .in('student_id', studentIds);
        
      if (followupsError) {
        throw followupsError;
      }
            
      if (!interventionFollowups || interventionFollowups.length === 0) {
        return [];
      }
      
      // Filter followups where today is within the start and end date range
      const activeFollowups = interventionFollowups.filter(followup => {
        return followup.start_date && 
               followup.end_date && 
               followup.start_date <= today && 
               today <= followup.end_date;
      });
      
      if (activeFollowups.length === 0) {
        return [];
      }
      
      // Get followup IDs
      const followupIds = activeFollowups.map(f => f.id);
      
      // Get progress entries for these followups for today
      const { data: progressEntries, error: progressError } = await supabase
        .from('Progress')
        .select(`
          id, date, applied, value, created_at, updated_at,
          student_id, staff_id, followup_id,
          Student:student_id (name, grade),
          Followup:followup_id (intervention, metric)
        `)
        .in('followup_id', followupIds)
        .eq('date', today);
        
      if (progressError) {
        throw progressError;
      }
            
      // Format the data to include student and followup information
      const formattedData = (progressEntries || []).map(entry => ({
        id: entry.id,
        date: entry.date,
        applied: entry.applied || false,
        value: entry.value,
        studentId: entry.student_id,
        studentName: entry.Student?.name || 'Unknown Student',
        grade: entry.Student?.grade || '',
        followupId: entry.followup_id,
        intervention: entry.Followup?.intervention || 'Unknown Intervention',
        metric: entry.Followup?.metric || 'Unknown Metric',
        staffId: entry.staff_id
      }));
      
      return formattedData;
    } catch (error) {
      console.error('Error fetching today progress entries:', error);
      throw error;
    }
  },

  /**
   * Increment the value of a progress entry
   * @param {string} entryId - Progress entry ID
   * @returns {Promise<Object>} - Updated progress entry
   */
  incrementProgressValue: async (entryId) => {
    try {
      // First get the current value
      const { data: currentEntry, error: fetchError } = await supabase
        .from('Progress')
        .select('value')
        .eq('id', entryId)
        .single();
        
      if (fetchError) throw fetchError;
      
      // Calculate new value (treat null as 0)
      const currentValue = currentEntry.value === null ? 0 : currentEntry.value;
      const newValue = currentValue + 1;
      
      // Update the entry
      const { data: updatedEntry, error: updateError } = await supabase
        .from('Progress')
        .update({ 
          value: newValue,
          updated_at: new Date().toISOString()
        })
        .eq('id', entryId)
        .select();
        
      if (updateError) throw updateError;
      
      return updatedEntry[0];
    } catch (error) {
      console.error('Error incrementing progress value:', error);
      throw error;
    }
  },

  /**
   * Decrement the value of a progress entry (but never below zero)
   * @param {string} entryId - Progress entry ID
   * @returns {Promise<Object>} - Updated progress entry
   */
  decrementProgressValue: async (entryId) => {
    try {
      // First get the current value
      const { data: currentEntry, error: fetchError } = await supabase
        .from('Progress')
        .select('value')
        .eq('id', entryId)
        .single();
        
      if (fetchError) throw fetchError;
      
      // Calculate new value (ensure we don't go below 0)
      const currentValue = currentEntry.value === null ? 0 : currentEntry.value;
      const newValue = Math.max(0, currentValue - 1);
      
      // Update the entry
      const { data: updatedEntry, error: updateError } = await supabase
        .from('Progress')
        .update({ 
          value: newValue,
          updated_at: new Date().toISOString()
        })
        .eq('id', entryId)
        .select();
        
      if (updateError) throw updateError;
      
      return updatedEntry[0];
    } catch (error) {
      console.error('Error decrementing progress value:', error);
      throw error;
    }
  },
  
  /**
   * Toggle the applied status of a progress entry
   * @param {string} entryId - Progress entry ID
   * @returns {Promise<Object>} - Updated progress entry
   */
  toggleAppliedStatus: async (entryId) => {
    try {
      // First get the current applied status
      const { data: currentEntry, error: fetchError } = await supabase
        .from('Progress')
        .select('applied')
        .eq('id', entryId)
        .single();
        
      if (fetchError) throw fetchError;
      
      // Toggle applied status
      const newApplied = !(currentEntry.applied || false);
      
      // Update the entry
      const { data: updatedEntry, error: updateError } = await supabase
        .from('Progress')
        .update({ 
          applied: newApplied,
          updated_at: new Date().toISOString()
        })
        .eq('id', entryId)
        .select();
        
      if (updateError) throw updateError;
      
      return updatedEntry[0];
    } catch (error) {
      console.error('Error toggling applied status:', error);
      throw error;
    }
  }
};

/**
 * Get students related to a staff member through teams or teacher relationships
 * @param {string} staffId - Staff ID
 * @returns {Promise<Array>} - Array of student objects
 */
async function getRelatedStudents(staffId) {
  try {
    // Get students from team relationships
    const getTeamStudents = async (staffId) => {
      try {
        // Get teams for staff member
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
        
        // Get students in these teams
        const { data: students, error: studentsError } = await supabase
          .from('Student')
          .select('id, name, grade')
          .in('team_id', teamIds);
          
        if (studentsError) throw studentsError;          
        return students || [];
      } catch (error) {
        console.error('Error getting team students:', error);
        return [];
      }
    };
    
    // Get students from teacher-student relationships
    const getTeacherStudents = async (staffId) => {
      try {
        const { data: teacherLinks, error: teacherError } = await supabase
          .from('Teacher')
          .select('student_id, Student:student_id(id, name, grade)')
          .eq('staff_id', staffId);
          
        if (teacherError) throw teacherError;
                  
        // Extract student data from the relationships
        const students = (teacherLinks || [])
          .filter(link => link.Student) // Filter out any null relations
          .map(link => ({
            id: link.student_id,
            name: link.Student.name,
            grade: link.Student.grade
          }));
          
        return students;
      } catch (error) {
        console.error('Error getting teacher students:', error);
        return [];
      }
    };
    
    // Get students from both sources
    const teamStudents = await getTeamStudents(staffId);
    const teacherStudents = await getTeacherStudents(staffId);
    
    // Combine and deduplicate
    const allStudents = [...teamStudents, ...teacherStudents];
    const uniqueStudentMap = {};
    
    allStudents.forEach(student => {
      if (student && student.id) {
        uniqueStudentMap[student.id] = student;
      }
    });
    
    return Object.values(uniqueStudentMap);
  } catch (error) {
    console.error('Error getting related students:', error);
    return [];
  }
}