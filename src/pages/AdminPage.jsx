import { useState, useEffect } from 'react';
import { adminService } from '../services/supabase';
import '../styles/pages/AdminPage.css';

const TABLES = {
  STAFF: 'Staff',
  STAFF_TEAMS: 'StaffTeams',
  REFERRALS: 'Referrals',
  TEACHER: 'Teacher',
  STUDENT: 'Student',
  TEAM: 'Team'
};

const TABLE_SCHEMAS = {
  [TABLES.STAFF]: [
    { name: 'id', type: 'uuid', primaryKey: true, editable: false },
    { name: 'name', type: 'text', required: true },
    { name: 'email', type: 'varchar', required: true },
    { name: 'is_admin', type: 'bool', required: false },
    { name: 'created_at', type: 'timestamp', editable: false },
    { name: 'updated_at', type: 'timestamp', editable: false }
  ],
  [TABLES.STAFF_TEAMS]: [
    { name: 'id', type: 'uuid', primaryKey: true, editable: false },
    { name: 'staff_id', type: 'uuid', foreignKey: TABLES.STAFF, required: true },
    { name: 'team_id', type: 'uuid', foreignKey: TABLES.TEAM, required: true },
    { name: 'created_at', type: 'timestamp', editable: false },
    { name: 'updated_at', type: 'timestamp', editable: false }
  ],
  [TABLES.REFERRALS]: [
    { name: 'id', type: 'uuid', primaryKey: true, editable: false },
    { name: 'student_name', type: 'varchar', required: true },
    { name: 'referral_type', type: 'text', required: true },
    { name: 'referral_reason', type: 'text', required: true },
    { name: 'referral_notes', type: 'text' },
    { name: 'status', type: 'text', required: true },
    { name: 'created_at', type: 'timestamp', editable: false },
    { name: 'updated_at', type: 'timestamp', editable: false },
    { name: 'student_id', type: 'uuid', foreignKey: TABLES.STUDENT },
    { name: 'staff_id', type: 'uuid', foreignKey: TABLES.STAFF, required: true }
  ],
  [TABLES.TEACHER]: [
    { name: 'id', type: 'uuid', primaryKey: true, editable: false },
    { name: 'created_at', type: 'timestamp', editable: false },
    { name: 'updated_at', type: 'timestamp', editable: false },
    { name: 'student_id', type: 'uuid', foreignKey: TABLES.STUDENT },
    { name: 'staff_id', type: 'uuid', foreignKey: TABLES.STAFF, required: true }
  ],
  [TABLES.STUDENT]: [
    { name: 'id', type: 'uuid', primaryKey: true, editable: false },
    { name: 'name', type: 'varchar', required: true },
    { name: 'grade', type: 'varchar' },
    { name: 'photo', type: 'varchar' },
    { name: 'created_at', type: 'timestamp', editable: false },
    { name: 'updated_at', type: 'timestamp', editable: false },
    { name: 'team_id', type: 'uuid', foreignKey: TABLES.TEAM }
  ],
  [TABLES.TEAM]: [
    { name: 'id', type: 'uuid', primaryKey: true, editable: false },
    { name: 'name', type: 'varchar', required: true },
    { name: 'created_at', type: 'timestamp', editable: false },
    { name: 'updated_at', type: 'timestamp', editable: false }
  ]
};

const AdminPage = ({ user, supabase }) => {
  const [activeTable, setActiveTable] = useState(TABLES.STAFF);
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({});
  const [mode, setMode] = useState('list'); // list, create, edit
  const [relations, setRelations] = useState({});
  const [currentId, setCurrentId] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Check if user is an admin
  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user || !supabase) {
        setIsAdmin(false);
        return;
      }

      try {
        // Get user roles or check a specific admin flag
        const { data, error } = await supabase
          .from('Staff')
          .select('is_admin')
          .eq('id', user.id)
          .single();
          
        if (error) {
          console.error('Error fetching admin status:', error);
          throw error;
        }
        
        // Use the actual admin status from the database
        setIsAdmin(data?.is_admin === true);
      } catch (err) {
        console.error('Error checking admin role:', err);
        setIsAdmin(false);
      }
    };
    
    checkAdminRole();
  }, [user, supabase]);

  // Fetch table data when active table changes
  useEffect(() => {
    if (isAdmin && supabase) {
      fetchTableData();
      fetchRelationData();
    }
  }, [activeTable, isAdmin, supabase]);

  // Reset form data when switching modes
  useEffect(() => {
    if (mode === 'create') {
      const newFormData = {};
      TABLE_SCHEMAS[activeTable].forEach(field => {
        if (!field.editable === false) {
          newFormData[field.name] = '';
        }
      });
      setFormData(newFormData);
      setCurrentId(null);
    }
  }, [mode, activeTable]);

  const fetchTableData = async () => {
    if (!supabase) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from(activeTable)
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      setTableData(data || []);
    } catch (err) {
      console.error(`Error fetching ${activeTable} data:`, err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchRelationData = async () => {
    if (!supabase) return;
    
    const relationData = {};
    
    try {
      // Find fields that are foreign keys
      const foreignKeyFields = TABLE_SCHEMAS[activeTable].filter(field => field.foreignKey);
      
      // Fetch relational data for foreign keys
      for (const field of foreignKeyFields) {
        const { data, error } = await supabase
          .from(field.foreignKey)
          .select('id, name')
          .order('name');
          
        if (error) throw error;
        
        relationData[field.name] = data || [];
      }
      
      setRelations(relationData);
    } catch (err) {
      console.error('Error fetching relation data:', err);
    }
  };

  const handleTableChange = (tableName) => {
    setActiveTable(tableName);
    setMode('list');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreate = () => {
    setMode('create');
  };

  const handleEdit = (item) => {
    // Transform data for the form
    const editData = { ...item };
    setFormData(editData);
    setCurrentId(item.id);
    setMode('edit');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) {
      return;
    }
    
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from(activeTable)
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      // Refresh data after deletion
      fetchTableData();
    } catch (err) {
      console.error('Error deleting item:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      // Prepare the data
      const submitData = { ...formData };
      
      // Add timestamps
      if (mode === 'create') {
        submitData.created_at = new Date().toISOString();
      }
      submitData.updated_at = new Date().toISOString();
      
      let result;
      
      if (mode === 'create') {
        // Insert new record
        result = await supabase
          .from(activeTable)
          .insert([submitData])
          .select();
      } else if (mode === 'edit') {
        // Update existing record
        result = await supabase
          .from(activeTable)
          .update(submitData)
          .eq('id', currentId)
          .select();
      }
      
      if (result.error) throw result.error;
      
      // Return to list view and refresh data
      setMode('list');
      fetchTableData();
    } catch (err) {
      console.error('Error submitting form:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setMode('list');
    setError(null);
  };

  // Render appropriate form field based on field type
  const renderFormField = (field) => {
    if (field.editable === false && mode === 'create') {
      return null;
    }
    
    const disabled = field.editable === false || loading;
    
    // If this is a foreign key field, render a select
    if (field.foreignKey && relations[field.name]) {
      return (
        <div className="form-group" key={field.name}>
          <label htmlFor={field.name}>{field.name.replace('_', ' ')}</label>
          <select
            id={field.name}
            name={field.name}
            value={formData[field.name] || ''}
            onChange={handleInputChange}
            disabled={disabled}
            required={field.required}
          >
            <option value="">Select {field.name.replace('_', ' ')}</option>
            {relations[field.name].map(item => (
              <option key={item.id} value={item.id}>{item.name || item.id}</option>
            ))}
          </select>
        </div>
      );
    }
    
    // For boolean fields
    if (field.type === 'bool') {
      return (
        <div className="form-group" key={field.name}>
          <label htmlFor={field.name} className="checkbox-label">
            <input
              type="checkbox"
              id={field.name}
              name={field.name}
              checked={formData[field.name] || false}
              onChange={(e) => setFormData(prev => ({ ...prev, [field.name]: e.target.checked }))}
              disabled={disabled}
            />
            {field.name.replace('_', ' ')}
          </label>
        </div>
      );
    }
    
    // For text, varchar, uuid fields
    if (field.type === 'text' || field.type === 'varchar' || field.type === 'uuid') {
      return (
        <div className="form-group" key={field.name}>
          <label htmlFor={field.name}>{field.name.replace('_', ' ')}</label>
          <input
            type="text"
            id={field.name}
            name={field.name}
            value={formData[field.name] || ''}
            onChange={handleInputChange}
            disabled={disabled}
            required={field.required}
          />
        </div>
      );
    }
    
    // For timestamp fields
    if (field.type === 'timestamp') {
      return (
        <div className="form-group" key={field.name}>
          <label htmlFor={field.name}>{field.name.replace('_', ' ')}</label>
          <input
            type="datetime-local"
            id={field.name}
            name={field.name}
            value={formData[field.name] ? new Date(formData[field.name]).toISOString().slice(0, 16) : ''}
            onChange={handleInputChange}
            disabled={disabled}
            required={field.required}
          />
        </div>
      );
    }
    
    return null;
  };

  // Render list view
  const renderListView = () => {
    return (
      <div className="admin-list-view">
        <div className="admin-toolbar">
          <h3>{activeTable}</h3>
          <button className="add-button" onClick={handleCreate}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Add New
          </button>
        </div>
        
        {loading ? (
          <p>Loading data...</p>
        ) : error ? (
          <p className="error-message">{error}</p>
        ) : tableData.length === 0 ? (
          <p>No records found.</p>
        ) : (
          <div className="table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  {TABLE_SCHEMAS[activeTable].map(field => (
                    <th key={field.name}>{field.name}</th>
                  ))}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tableData.map(item => (
                  <tr key={item.id}>
                    {TABLE_SCHEMAS[activeTable].map(field => (
                      <td key={field.name}>
                        {field.type === 'timestamp' && item[field.name] 
                          ? new Date(item[field.name]).toLocaleString() 
                          : field.type === 'bool'
                          ? String(item[field.name] || false)
                          : String(item[field.name] || '')}
                      </td>
                    ))}
                    <td className="action-cell">
                      <button className="icon-button edit-button" onClick={() => handleEdit(item)} title="Edit">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                      </button>
                      <button className="icon-button delete-button" onClick={() => handleDelete(item.id)} title="Delete">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          <line x1="10" y1="11" x2="10" y2="17"></line>
                          <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  // Render form view (create or edit)
  const renderFormView = () => {
    return (
      <div className="admin-form-view">
        <h3>{mode === 'create' ? 'Create New' : 'Edit'} {activeTable}</h3>
        
        {error && <p className="error-message">{error}</p>}
        
        <form onSubmit={handleSubmit}>
          {TABLE_SCHEMAS[activeTable].map(field => renderFormField(field))}
          
          <div className="form-actions">
            <button type="button" className="cancel-button" onClick={handleCancel} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="submit-button" disabled={loading}>
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    );
  };

  if (!isAdmin) {
    return (
      <section className="admin-section">
        <h2>Access Denied</h2>
        <p>You do not have permission to access the admin area.</p>
        <p>User ID: {user?.id}</p>
      </section>
    );
  }

  return (
    <section className="admin-section">
      <h2>Admin Dashboard</h2>
      
      <div className="admin-container">
        <div className="admin-sidebar">
          <ul className="admin-navigation">
            {Object.values(TABLES).map(tableName => (
              <li key={tableName}>
                <button 
                  className={activeTable === tableName ? 'active' : ''} 
                  onClick={() => handleTableChange(tableName)}
                >
                  {tableName}
                </button>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="admin-content">
          {mode === 'list' ? renderListView() : renderFormView()}
        </div>
      </div>
    </section>
  );
};

export default AdminPage;