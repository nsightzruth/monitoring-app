// This utility handles admin authentication and permission checks

/**
 * Check if a user has admin privileges
 * @param {Object} supabase - Supabase client
 * @param {string} userId - The user's ID to check
 * @returns {Promise<boolean>} - Whether the user has admin privileges
 */
export const checkAdminAccess = async (supabase, userId) => {
    try {
      // In a real application, this would query a roles table or check a specific
      // admin flag in the user's profile
      const { data, error } = await supabase
        .from('Staff')
        .select('is_admin')
        .eq('id', userId)
        .single();
        
      if (error) {
        console.error('Error checking admin status:', error);
        return false;
      }
      
      // For development, you might want to hardcode this to true initially
      // return true;
      
      // For production, properly check the admin flag
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
    // For simple apps, this might just delegate to checkAdminAccess
    // For more complex apps, you would implement granular permissions
    
    try {
      // Example of how you might check granular permissions
      // This assumes a Permissions table that has records like:
      // { role_id: '123', resource: 'Staff', action: 'create', allowed: true }
      
      // First get the user's role(s)
      const { data: roles, error: rolesError } = await supabase
        .from('StaffRoles')
        .select('role_id')
        .eq('staff_id', userId);
        
      if (rolesError || !roles.length) {
        return false;
      }
      
      // Then check if any of their roles have permission for this action
      const roleIds = roles.map(r => r.role_id);
      
      const { data: permissions, error: permissionsError } = await supabase
        .from('Permissions')
        .select('allowed')
        .in('role_id', roleIds)
        .eq('resource', resource)
        .eq('action', action);
        
      if (permissionsError || !permissions.length) {
        return false;
      }
      
      // If any role has permission, return true
      return permissions.some(p => p.allowed);
      
      // For simplicity during development, you might just do:
      // return true;
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
    try {
      // Check if Staff table already has is_admin column
      const { data: columnExists, error: columnError } = await supabase
        .rpc('check_column_exists', { 
          table_name: 'Staff', 
          column_name: 'is_admin' 
        });
      
      if (columnError) {
        console.error('Error checking if column exists:', columnError);
        return;
      }
      
      // If the column doesn't exist, add it
      if (!columnExists) {
        // You would typically do this in a migration or via SQL
        // For this example, we'll show how you might handle it in code
        
        // Note: In Supabase, directly modifying schema would typically be done
        // through the Supabase dashboard or migrations rather than RPC
        console.log('Column is_admin should be added to Staff table');
      }
      
      // For roles and permissions, you would create tables if they don't exist
      // Again, typically done through migrations or the dashboard
      console.log('Roles and permissions tables should be created if needed');
      
      // Then you might want to insert an initial admin user if none exists
      const { data: adminExists, error: adminError } = await supabase
        .from('Staff')
        .select('id')
        .eq('is_admin', true)
        .limit(1);
        
      if (adminError) {
        console.error('Error checking for admin users:', adminError);
        return;
      }
      
      if (!adminExists || adminExists.length === 0) {
        console.log('Initial admin user should be created');
        // You would create an admin user here
      }
    } catch (err) {
      console.error('Error setting up admin tables:', err);
    }
  };