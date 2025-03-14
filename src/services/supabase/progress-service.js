import { supabase } from './config';

/**
 * Service for handling progress monitoring operations
 */
export const progressService = {
  /**
   * Get progress entries for students based on user's teams and teacher relationships
   * @param {string} staffId - Staff ID
   * @param {boolean} activeOnly - Whether to only include entries from active followups
   * @returns {Promise<Array>} - Array of progress entries with student information
   */
  getProgressEntries: async (staffId, activeOnly = true) => {
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
            console.log('No teams found for staff');
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
      
      const uniqueStudents = Object.values(uniqueStudentMap);
      
      // If no students found, return empty array early
      if (uniqueStudents.length === 0) {
        console.log('No related students found');
        return [];
      }
      
      // Get student IDs
      const studentIds = uniqueStudents.map(student => student.id);
      
      // First get followups of type 'Intervention' for these students
      let followupQuery = supabase
        .from('Followup')
        .select('id, student_id, followup_status')
        .eq('type', 'Intervention')
        .in('student_id', studentIds);
      
      // Apply status filter if activeOnly is true
      if (activeOnly) {
        followupQuery = followupQuery.eq('followup_status', 'Active');
      }
        
      const { data: interventionFollowups, error: followupsError } = await followupQuery;
        
      if (followupsError) {
        console.error('Error fetching intervention followups:', followupsError);
        throw followupsError;
      }
            
      if (!interventionFollowups || interventionFollowups.length === 0) {
        console.log('No intervention followups found');
        return [];
      }
      
      // Get followup IDs
      const followupIds = interventionFollowups.map(f => f.id);
      
      // Get progress entries for these followups
      const { data: progressEntries, error: progressError } = await supabase
        .from('Progress')
        .select(`
          id, date, applied, value, created_at, updated_at,
          student_id, staff_id, followup_id,
          Student:student_id (name, grade),
          Followup:followup_id (type, intervention, metric, start_date, end_date, followup_status)
        `)
        .in('followup_id', followupIds)
        .order('date', { ascending: true });
        
      if (progressError) {
        console.error('Error fetching progress entries:', progressError);
        throw progressError;
      }
            
      // Format the data to include student and followup information
      const formattedData = (progressEntries || []).map(entry => ({
        id: entry.id,
        date: entry.date,
        applied: entry.applied || false,
        value: entry.value || null,
        studentId: entry.student_id,
        studentName: entry.Student?.name || 'Unknown Student',
        grade: entry.Student?.grade || '',
        followupId: entry.followup_id,
        intervention: entry.Followup?.intervention || 'Unknown Intervention',
        metric: entry.Followup?.metric || 'Unknown Metric',
        startDate: entry.Followup?.start_date || null,
        endDate: entry.Followup?.end_date || null,
        followupStatus: entry.Followup?.followup_status || 'Unknown',
        staffId: entry.staff_id
      }));
      
      return formattedData;
    } catch (error) {
      console.error('Error fetching progress entries:', error);
      throw error;
    }
  },

  /**
   * Update progress entries
   * @param {Array} updates - Array of objects with id and updates
   * @returns {Promise<Object>} - Result of the operation
   */
  updateProgressEntries: async (updates) => {
    try {
      if (!updates || updates.length === 0) {
        return { success: true, message: 'No updates to process' };
      }
      
      const timestamp = new Date().toISOString();
      const results = [];
      
      // Process updates in chunks to avoid hitting rate limits
      const chunkSize = 50;
      for (let i = 0; i < updates.length; i += chunkSize) {
        const chunk = updates.slice(i, i + chunkSize);
        
        // Process each update in the chunk
        for (const update of chunk) {
          const { id, applied, value } = update;
          
          // Skip updates without an ID
          if (!id) continue;
          
          const updateData = {
            updated_at: timestamp
          };
          
          // Only include fields that are actually being updated
          if (applied !== undefined) updateData.applied = applied;
          if (value !== undefined) updateData.value = value;
          
          const { data, error } = await supabase
            .from('Progress')
            .update(updateData)
            .eq('id', id)
            .select();
            
          if (error) throw error;
          
          if (data && data.length > 0) {
            results.push(data[0]);
          }
        }
      }
      
      return { success: true, data: results };
    } catch (error) {
      console.error('Error updating progress entries:', error);
      return { success: false, error: error.message };
    }
  }
};

/**
 * Generate an array of date strings (YYYY-MM-DD) between start and end dates
 * Only includes weekdays (Monday to Friday)
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @returns {Array<string>} - Array of date strings for weekdays only
 */
function generateDateRange(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const dates = [];
  
  // Use UTC dates to avoid timezone issues
  start.setUTCHours(0, 0, 0, 0);
  end.setUTCHours(0, 0, 0, 0);
    
  // Create current date and iterate through range
  let current = new Date(start);
  while (current <= end) {
    const day = current.getUTCDay(); // 0 is Sunday, 6 is Saturday
    
    // Only include weekdays (1-5 = Monday to Friday)
    if (day >= 1 && day <= 5) {
      // Format as YYYY-MM-DD string
      const dateString = current.toISOString().split('T')[0];
      dates.push(dateString);
      console.log(`Added date: ${dateString}, day of week: ${day}`);
    } else {
      console.log(`Skipping weekend date: ${current.toISOString().split('T')[0]}, day of week: ${day}`);
    }
    
    // Move to next day
    current.setUTCDate(current.getUTCDate() + 1);
  }
  
  console.log(`Generated ${dates.length} weekday dates`);
  return dates;
}