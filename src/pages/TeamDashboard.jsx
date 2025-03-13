import { useState, useEffect } from 'react';
import { useTeams } from '../hooks/useTeams';
import { useStudentData } from '../context/StudentDataContext';
import Select from '../components/common/Select';
import Table from '../components/common/Table';
import { IconButton } from '../components/common/Button';
import { FormMessage } from '../components/common/Form';
import '../styles/pages/TeamDashboard.css';
import { formatLocalDate } from '../utils/dateUtils';

/**
 * Page component for team dashboard with simplified dropdown menu
 */
const TeamDashboard = ({ user, onNavigate }) => {
  const [activeMenu, setActiveMenu] = useState(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const dropdown = document.getElementById('active-dropdown');
      if (activeMenu && dropdown && !dropdown.contains(event.target) && 
          !event.target.closest('.menu-trigger')) {
        setActiveMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeMenu]);

  // Use our teams hook
  const {
    teams,
    selectedTeam,
    students,
    studentData,
    loading,
    error,
    actionStatus,
    changeSelectedTeam,
    markStudentReviewed
  } = useTeams(user?.id);
  
  // Use student hook for navigation to incident form
  const { selectStudent } = useStudentData();

  // Handler for team selection
  const handleTeamChange = (e) => {
    changeSelectedTeam(e.target.value);
    // Close any open menu when changing teams
    setActiveMenu(null);
  };

  // Toggle the action menu for a student
  const toggleMenu = (studentId, event) => {
    // Prevent event from propagating to avoid immediate closing
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    
    if (activeMenu === studentId) {
      setActiveMenu(null);
    } else {
      setActiveMenu(studentId);
    }
  };

  // Handler for marking a student as reviewed
  const handleMarkReviewed = async (studentId, event) => {
    if (event) {
      event.stopPropagation();
    }
    
    try {
      await markStudentReviewed(studentId);
      // Close the menu after action
      setActiveMenu(null);
    } catch (err) {
      console.error('Error marking student as reviewed:', err);
    }
  };

  // Handler for adding a note for a student
  const handleAddNote = (student, event) => {
    if (event) {
      event.stopPropagation();
    }
    
    // Make sure we have the necessary student data
    if (!student || !student.id || !student.name) {
      console.error('Cannot add note: Missing student data', student);
      return;
    }
    
    console.log('Add note clicked for student:', student.name);
    
    // Store the selected student in context
    selectStudent({
      id: student.id,
      name: student.name,
      grade: student.grade || '',
      photo: student.photo || ''
    });
    
    // Close the menu
    setActiveMenu(null);
    
    // Navigate to incidents page
    if (typeof onNavigate === 'function') {
      onNavigate('incidents');
    } else {
      console.error('onNavigate prop is not a function:', onNavigate);
    }
  };

  // Handler for adding/updating followup for a student
  const handleAddFollowup = (student, event) => {
    if (event) {
      event.stopPropagation();
    }
    
    // Make sure we have the necessary student data
    if (!student || !student.id || !student.name) {
      console.error('Cannot add followup: Missing student data', student);
      return;
    }

    // Store the selected student in context
    selectStudent({
      id: student.id,
      name: student.name,
      grade: student.grade || '',
      photo: student.photo || ''
    });
    
    // Close the menu
    setActiveMenu(null);
    
    // Create query parameters for filtering followups by student
    const queryParams = new URLSearchParams();
    queryParams.set('student_id', student.id);
    queryParams.set('student_name', student.name);
    
    // Navigate to followups page
    if (typeof onNavigate === 'function') {
      onNavigate('followups', queryParams);
    } else {
      console.error('onNavigate prop is not a function:', onNavigate);
    }
  };

  // Define team select options
  const teamOptions = teams.map(team => ({
    value: team.id,
    label: team.name
  }));

  // Prepare student data for the table
  const tableData = students.map(student => {
    const data = studentData[student.id] || {};
    
    return {
      id: student.id,
      name: student.name,
      grade: student.grade,
      photo: student.photo,
      status: data.status || 'Unknown',
      referralType: data.referrals && data.referrals.length > 0 
        ? data.referrals[0].referral_type 
        : 'N/A',
      referralReason: data.referrals && data.referrals.length > 0 
        ? data.referrals[0].referral_reason 
        : 'N/A',
      notes: data.notes || '',
      lastReview: data.lastReview || 'Never',
      followups: data.followups || [],
      // Include the full student data for the action menu
      _fullData: { ...student, ...data }
    };
  });

  // Define table columns with a simpler dropdown approach
  const columns = [
    {
      key: 'student',
      title: 'Student',
      render: (item) => (
        <div className="student-cell">
          {item.photo ? (
            <img 
              src={item.photo} 
              alt={item.name} 
              className="student-photo" 
            />
          ) : (
            <div className="student-photo-placeholder">
              {item.name.charAt(0)}
            </div>
          )}
          <div className="student-info">
            <div className="student-name">{item.name}</div>
            {item.grade && <div className="student-grade">Grade: {item.grade}</div>}
          </div>
        </div>
      )
    },
    {
      key: 'status',
      title: 'Status',
      render: (item) => (
        <span className={`status-badge ${item.status.toLowerCase().replace(/\s+/g, '-')}`}>
          {item.status}
        </span>
      )
    },
    {
      key: 'referralType',
      title: 'Referral Type'
    },
    {
      key: 'notes',
      title: 'Notes',
      render: (item) => (
        <div className="notes-cell">
          {item.notes ? (
            item.notes.split('\n').map((note, idx) => (
              <p key={idx} className="truncate-note" title={note}>{note}</p>
            ))
          ) : (
            <span className="no-notes">No notes available</span>
          )}
        </div>
      )
    },
    {
      key: 'followups',
      title: 'Latest Followup',
      render: (item) => {
        // Get only the latest active followup
        const latestFollowup = item.followups && item.followups.length > 0 ? 
          item.followups.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))[0] : null;
          
        if (!latestFollowup) {
          return <span className="no-followups">No active followups</span>;
        }
        
        // Format the date
        const updatedDate = formatLocalDate(latestFollowup.updated_at);
        
        // Format based on followup type
        if (latestFollowup.type === 'Intervention') {
          return (
            <div className="followup-item">
              <span className={`followup-type ${latestFollowup.type.toLowerCase().replace(/\s+/g, '-')}`}>
                {latestFollowup.type}
              </span>
              <div className="followup-content">
                {updatedDate} - {latestFollowup.intervention} measured by {latestFollowup.metric}
                {latestFollowup.start_date && latestFollowup.end_date && 
                  ` ${formatLocalDate(latestFollowup.start_date)} - ${formatLocalDate(latestFollowup.end_date)}`}
                {latestFollowup.followup_notes && `: ${latestFollowup.followup_notes}`}
              </div>
            </div>
          );
        } else {
          return (
            <div className="followup-item">
              <span className={`followup-type ${latestFollowup.type.toLowerCase().replace(/\s+/g, '-')}`}>
                {latestFollowup.type}
              </span>
              <div className="followup-content">
                {updatedDate} - {latestFollowup.followup_notes || 'No details provided'}
              </div>
            </div>
          );
        }
      }
    },
    {
      key: 'responsiblePerson',
      title: 'Responsible Person',
      render: (item) => {
        // Get only the latest active followup
        const latestFollowup = item.followups && item.followups.length > 0 ? 
          item.followups.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))[0] : null;
          
        if (!latestFollowup) {
          return <span className="no-followups">—</span>;
        }
        
        return (
          <div className="responsible-person-item">
            {latestFollowup.responsible_person_name || 'Unassigned'}
          </div>
        );
      }
    },
    {
      key: 'lastReview',
      title: 'Last Review'
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (item) => (
        <div className="actions-cell">
          <div className="simple-menu-container">
            <IconButton 
              title="Open menu"
              onClick={(e) => toggleMenu(item.id, e)}
              className="menu-trigger"
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="1"></circle>
                  <circle cx="12" cy="5" r="1"></circle>
                  <circle cx="12" cy="19" r="1"></circle>
                </svg>
              }
            />
            
            {/* Simple dropdown menu - no portal, fixed position */}
            {activeMenu === item.id && (
              <div 
                id="active-dropdown"
                className="simple-dropdown-menu"
              >
                <button 
                  className="menu-item" 
                  onClick={(e) => handleMarkReviewed(item.id, e)}
                  disabled={actionStatus.loading}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 11l3 3L22 4"></path>
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                  </svg>
                  Reviewed today
                </button>
                
                <button 
                  className="menu-item" 
                  onClick={(e) => handleAddNote(item._fullData, e)}
                  disabled={actionStatus.loading}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                  Add note
                </button>

                <button 
                  className="menu-item" 
                  onClick={(e) => handleAddFollowup(item._fullData, e)}
                  disabled={actionStatus.loading}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                  </svg>
                  Add/Update Followup
                </button>
              </div>
            )}
          </div>
        </div>
      )
    }
  ];

  return (
    <section className="team-dashboard">
      <h2>Team Dashboard</h2>
      
      {error && <FormMessage type="error">{error}</FormMessage>}
      {actionStatus.error && <FormMessage type="error">{actionStatus.error}</FormMessage>}
      {actionStatus.success && <FormMessage type="success">{actionStatus.success}</FormMessage>}
      
      <div className="team-selector">
        <label htmlFor="team-select">Select Team:</label>
        <Select 
          id="team-select"
          options={teamOptions}
          value={selectedTeam || ''}
          onChange={handleTeamChange}
          disabled={loading || teams.length === 0}
          placeholder="Select a team"
        />
      </div>
      
      <div className="custom-table-wrapper">
        <Table
          columns={columns}
          data={tableData}
          loading={loading}
          emptyMessage="No students found with relevant status in this team."
          loadingMessage="Loading team data..."
          className="students-table"
        />
      </div>
    </section>
  );
};

export default TeamDashboard;