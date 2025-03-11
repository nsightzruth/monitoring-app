import { supabase } from './config';

/**
 * Admin service for handling admin-related operations
 */
export const adminService = {
  /**
   * Check if a user is an admin
   * @param {string} userId - The user ID to check
   * @returns {Promise<boolean>} - Whether the user is an admin
   */
  isAdmin: async (userId) => {
    if (!userId) return false;
    
    try {
      console.log('Checking admin status for user:', userId);
      
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
      
      return data && data.is_admin === true;
    } catch (error) {
      console.error('Unexpected error checking admin status:', error);
      return false;
    }
  },

  /**
   * Get data from a specific table
   * @param {string} tableName - Table name
   * @returns {Promise<Array>} - Array of records from the table
   */
  getTableData: async (tableName) => {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error(`Error fetching ${tableName} data:`, error);
      throw error;
    }
  },

  /**
   * Create a new record in a table
   * @param {string} tableName - Table name
   * @param {Object} recordData - Record data to insert
   * @returns {Promise<Object>} - The created record
   */
  createRecord: async (tableName, recordData) => {
    try {
      // Add timestamps
      const submitData = { 
        ...recordData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from(tableName)
        .insert([submitData])
        .select();
        
      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error(`Error creating record in ${tableName}:`, error);
      throw error;
    }
  },

  /**
   * Update an existing record in a table
   * @param {string} tableName - Table name
   * @param {string} id - Record ID
   * @param {Object} recordData - Record data to update
   * @returns {Promise<Object>} - The updated record
   */
  updateRecord: async (tableName, id, recordData) => {
    try {
      // Add updated timestamp
      const submitData = { 
        ...recordData,
        updated_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from(tableName)
        .update(submitData)
        .eq('id', id)
        .select();
        
      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error(`Error updating record in ${tableName}:`, error);
      throw error;
    }
  },

  /**
   * Delete a record from a table
   * @param {string} tableName - Table name
   * @param {string} id - Record ID
   * @returns {Promise<void>}
   */
  deleteRecord: async (tableName, id) => {
    try {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id);
        
      if (error) throw error;
    } catch (error) {
      console.error(`Error deleting record from ${tableName}:`, error);
      throw error;
    }
  },

  /**
   * Get data for relations (foreign key references)
   * @param {string} tableName - Table name
   * @param {Array<Object>} fields - Fields with foreign key information
   * @returns {Promise<Object>} - Object with relation data
   */
  getRelationData: async (tableName, fields) => {
    try {
      const relationData = {};
      
      // Find fields that are foreign keys
      const foreignKeyFields = fields.filter(field => field.foreignKey);
      
      // Fetch relational data for foreign keys
      for (const field of foreignKeyFields) {
        const { data, error } = await supabase
          .from(field.foreignKey)
          .select('id, name')
          .order('name');
          
        if (error) throw error;
        
        relationData[field.name] = data || [];
      }
      
      return relationData;
    } catch (error) {
      console.error('Error fetching relation data:', error);
      throw error;
    }
  },

  /**
   * Create necessary admin-related tables if they don't exist
   * This is useful for setting up a new Supabase instance
   */
  setupAdminTables: async () => {
    try {
      // Check if Staff table has is_admin column
      const { data: staffColumns, error: columnsError } = await supabase
        .rpc('get_table_columns', { table_name: 'Staff' });
      
      if (columnsError) {
        console.error('Error checking table columns:', columnsError);
        return { error: columnsError.message };
      }
      
      const hasIsAdminColumn = staffColumns.some(col => col.column_name === 'is_admin');
      
      // Then check if any admin user exists
      const { data: adminExists, error: adminError } = await supabase
        .from('Staff')
        .select('id')
        .eq('is_admin', true)
        .limit(1);
        
      if (adminError) {
        console.error('Error checking for admin users:', adminError);
        return { error: adminError.message };
      }
      
      return {
        hasIsAdminColumn,
        adminExists: adminExists && adminExists.length > 0
      };
    } catch (error) {
      console.error('Error setting up admin tables:', error);
      return { error: error.message };
    }
  }
}