// This utility handles admin authentication and permission checks

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
    console.log('Checking admin status for user:', userId);
    
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
    
    console.log('Admin check result:', data);
    
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
    if (isAdmin) {
      return true;
    }
    
    // Additional permission logic could be implemented here
    // For more complex apps, you would implement granular permissions
    
    return false;
  } catch (err) {
    console.error('Error checking permissions:', err);
    return false;
  }
};
  
/**
 * Create necessary admin-related tables if they don't exist
 * This is useful for setting up a new Supabase instance
 * @param {Object} supabase - Supabase client
 */
export const setupAdminTables = async (supabase) => {
  if (!supabase) {
    console.error('Supabase client is required for setupAdminTables');
    return;
  }
  
  try {
    console.log('Setting up admin tables...');
    
    // Check if Staff table has the necessary columns
    const { data: tableInfo, error: tableError } = await supabase
      .rpc('get_table_info', { table_name: 'Staff' });
      
    if (tableError) {
      console.error('Error checking table info:', tableError);
      return;
    }
    
    console.log('Staff table info:', tableInfo);
    
    // Check if any admin user exists
    const { data: adminExists, error: adminError } = await supabase
      .from('Staff')
      .select('id')
      .eq('is_admin', true)
      .limit(1);
      
    if (adminError) {
      console.error('Error checking for admin users:', adminError);
      return;
    }
    
    console.log('Admin users exist:', adminExists && adminExists.length > 0);
    
    // Return the setup status
    return {
      tableExists: !!tableInfo,
      adminExists: adminExists && adminExists.length > 0
    };
  } catch (err) {
    console.error('Error setting up admin tables:', err);
    return {
      tableExists: false,
      adminExists: false,
      error: err.message
    };
  }
};