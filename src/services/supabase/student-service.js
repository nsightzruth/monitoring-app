import { supabase } from './config';

/**
 * Student service for handling student-related operations
 */
export const studentService = {
  /**
   * Search students by name
   * @param {string} query - Search query (minimum 3 characters)
   * @param {number} limit - Maximum number of results to return
   * @returns {Promise<Array>} - Array of student objects
   */
  searchStudents: async (query, limit = 10) => {
    if (!query || query.length < 3) {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('Student')
        .select('id, name, grade')
        .ilike('name', `%${query}%`)
        .order('name')
        .limit(limit);
        
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching students:', error);
      throw error;
    }
  },

  /**
   * Get a student by ID
   * @param {string} id - Student ID
   * @returns {Promise<Object>} - Student object
   */
  getStudentById: async (id) => {
    try {
      const { data, error } = await supabase
        .from('Student')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching student:', error);
      throw error;
    }
  },

  /**
   * Get students by team ID
   * @param {string} teamId - Team ID
   * @returns {Promise<Array>} - Array of student objects
   */
  getStudentsByTeam: async (teamId) => {
    try {
      const { data, error } = await supabase
        .from('Student')
        .select('id, name, grade, photo')
        .eq('team_id', teamId);
        
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching students by team:', error);
      throw error;
    }
  },
  
  /**
   * Add a review record for a student
   * @param {string} studentId - Student ID
   * @param {string} reviewDate - Review date in ISO format (YYYY-MM-DD)
   * @returns {Promise<Object>} - The created review record
   */
  addStudentReview: async (studentId, reviewDate = null) => {
    try {
      // If no review date is provided, use today's date
      const date = reviewDate || new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('Reviews')
        .insert([{
          student_id: studentId,
          review_date: date,
        }])
        .select();
        
      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error('Error adding student review:', error);
      throw error;
    }
  },
  
  /**
   * Get reviews for a student
   * @param {string} studentId - Student ID
   * @returns {Promise<Array>} - Array of review objects
   */
  getStudentReviews: async (studentId) => {
    try {
      const { data, error } = await supabase
        .from('Reviews')
        .select('*')
        .eq('student_id', studentId)
        .order('review_date', { ascending: false });
        
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching student reviews:', error);
      throw error;
    }
  }
};