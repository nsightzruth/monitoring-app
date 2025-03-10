import { supabase } from './config';

/**
 * Team service for handling team-related operations
 */
export const teamService = {
  /**
   * Get teams for the current staff member
   * @param {string} staffId - Staff ID
   * @returns {Promise<Array>} - Array of team objects
   */
  getTeamsByStaff: async (staffId) => {
    try {
      // Get teams for the current staff member
      const { data, error } = await supabase
        .from('StaffTeams')
        .select(`
          team_id,
          Team:team_id (
            id,
            name
          )
        `)
        .eq('staff_id', staffId);
        
      if (error) throw error;
      
      // Use Set to filter out duplicate team IDs before mapping
      const uniqueTeamIds = [...new Set(data.map(item => item.team_id))];
      
      // Extract and format unique team data
      const teamsData = uniqueTeamIds.map(teamId => {
        const teamData = data.find(item => item.team_id === teamId);
        return {
          id: teamData.Team.id,
          name: teamData.Team.name
        };
      });
      
      return teamsData;
    } catch (error) {
      console.error('Error fetching teams:', error);
      throw error;
    }
  },

  /**
   * Get all teams
   * @returns {Promise<Array>} - Array of team objects
   */
  getAllTeams: async () => {
    try {
      const { data, error } = await supabase
        .from('Team')
        .select('*')
        .order('name');
        
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching all teams:', error);
      throw error;
    }
  },

  /**
   * Get a team by ID
   * @param {string} id - Team ID
   * @returns {Promise<Object>} - Team object
   */
  getTeamById: async (id) => {
    try {
      const { data, error } = await supabase
        .from('Team')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching team:', error);
      throw error;
    }
  },

  /**
   * Get students with active referrals in a team
   * @param {string} teamId - Team ID
   * @param {Array<string>} validStatuses - Array of valid statuses to include
   * @returns {Promise<Array>} - Array of student objects with referral data
   */
  getTeamStudentsWithReferrals: async (teamId, validStatuses = ['New', 'In Progress', 'On Watch', 'Closed']) => {
    try {
      // 1. First get all students in the selected team
      const { data: studentsData, error: studentsError } = await supabase
        .from('Student')
        .select('id, name, grade, photo')
        .eq('team_id', teamId);
        
      if (studentsError) throw studentsError;
      
      // Prepare to fetch data for all students at once
      const studentIds = studentsData.map(student => student.id);
      
      // 2. Fetch referrals for all these students in a single query
      const { data: referralsData, error: referralsError } = await supabase
        .from('Referrals')
        .select('id, student_id, referral_type, referral_reason, referral_notes, status, created_at')
        .in('student_id', studentIds)
        .in('status', validStatuses)
        .order('created_at', { ascending: false });
        
      if (referralsError) throw referralsError;
      
      // Filter students who have referrals with valid statuses
      const studentsWithValidReferrals = studentsData.filter(student => {
        return referralsData.some(ref => ref.student_id === student.id);
      });
      
      return {
        students: studentsWithValidReferrals,
        referrals: referralsData
      };
    } catch (error) {
      console.error('Error fetching team students with referrals:', error);
      throw error;
    }
  }
};