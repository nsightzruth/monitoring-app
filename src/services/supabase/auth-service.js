import { supabase } from './config';

/**
 * Service for handling authentication-related operations
 */
export const authService = {
  /**
   * Log in a user with email and password
   * @param {string} email - The user's email
   * @param {string} password - The user's password
   * @returns {Promise<Object>} - The logged in user object
   * @throws {Error} - If login fails
   */
  async login(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      return data.user;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  /**
   * Sign out the current user
   * @returns {Promise<void>}
   * @throws {Error} - If logout fails
   */
  async logout() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  },

  /**
   * Get the current logged in user
   * @returns {Promise<Object|null>} - The current user or null if not logged in
   */
  async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      return user;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  },

  /**
   * Subscribe to auth state changes
   * @param {Function} callback - The callback to execute when auth state changes
   * @returns {Object} - The subscription object
   */
  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
  },

  /**
   * Get the Supabase client instance
   * @returns {Object} - The Supabase client
   */
  getSupabase() {
    return supabase;
  }
};

export default authService;