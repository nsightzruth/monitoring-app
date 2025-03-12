/**
 * Check if a user has admin privileges
 * @param {Object} supabase - Supabase client
 * @param {string} userId - The user's ID to check
 * @returns {Promise<boolean>} - Whether the user has admin privileges
 */
export const checkAdminAccess = async (supabase, userId) => {
  if (!supabase || !userId) {
    console.error('Missing required parameters for checkAdminAccess');
    return false;
  }

  try {
    // Query the Staff table to check if the user has admin privileges
    const { data, error } = await supabase
      .from('Staff')
      .select('is_admin')
      .eq('id', userId)
      .single();
      
    if (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
    
    // Return true only if is_admin is explicitly true
    return data && data.is_admin === true;
  } catch (err) {
    console.error('Unexpected error checking admin status:', err);
    return false;
  }
};
  
/**
 * Check if a user has permission for a specific action
 * @param {Object} supabase - Supabase client
 * @param {string} userId - The user's ID to check
 * @param {string} resource - The resource being accessed (table name)
 * @param {string} action - The action being performed (read, create, update, delete)
 * @returns {Promise<boolean>} - Whether the user has permission
 */
export const checkPermission = async (supabase, userId, resource, action) => {
  if (!supabase || !userId) {
    console.error('Missing required parameters for checkPermission');
    return false;
  }
  
  try {
    // For simple implementation, check if the user is an admin
    const isAdmin = await checkAdminAccess(supabase, userId);
    return isAdmin;
  } catch (err) {
    console.error('Error checking permissions:', err);
    return false;
  }
};