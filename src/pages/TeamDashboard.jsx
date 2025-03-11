import { useState, useRef, useEffect } from 'react';
import { useTeams } from '../hooks/useTeams';
import { useStudentData } from '../context/StudentDataContext'
// import { useStudent } from '../hooks/useStudent';
import Select from '../components/common/Select';
import Table from '../components/common/Table';
import Button from '../components/common/Button';
import { IconButton } from '../components/common/Button';
import FormMessage from '../components/common/Form';
import '../styles/pages/TeamDashboard.css';

/**
 * Page component for team dashboard
 */
const TeamDashboard = ({ user, onNavigate }) => {
  const [activeMenu, setActiveMenu] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const handleGlobalClick = (event) => {
      // Check if the active menu is open and the click is outside
      if (activeMenu && menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveMenu(null);
      }
    };
  
    // Add the event listener
    document.addEventListener('mousedown', handleGlobalClick);
  
    return () => {
      // Clean up the event listener
      document.removeEventListener('mousedown', handleGlobalClick);
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
    markStudentReviewed,
    resetActionStatus
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
  const toggleMenu = (studentId) => {
    console.log('Toggle menu called for student:', studentId);
    if (activeMenu === studentId) {
      setActiveMenu(null);
    } else {
      setActiveMenu(studentId);
    }
  };
  // Handler for marking a student as reviewed
  const handleMarkReviewed = async (studentId) => {
    await markStudentReviewed(studentId);
    // Close the menu after action
    setActiveMenu(null);
  };

  // Handler for adding a note for a student
  const handleAddNote = (student) => {
    // Make sure we have the necessary student data
    if (!student || !student.id || !student.name) {
      console.error('Cannot add note: Missing student data', student);
      return;
    }
    
    console.log('Adding note for student:', student.name, student.id);
    
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
    if (onNavigate) {
      console.log('Navigating to incidents page');
      onNavigate('incidents');
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
      // Include the full student data for the action menu
      _fullData: { ...student, ...data }
    };
  });

  // Define table columns
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
      key: 'referralReason',
      title: 'Referral Reason'
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
      key: 'lastReview',
      title: 'Last Review'
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (item) => (
        <div className="actions-cell">
          <div className="menu-container" ref={item.id === activeMenu ? menuRef : null}>
            <IconButton 
              title="Open menu"
              onClick={(e) => {
                e.stopPropagation(); // Prevent event bubbling
                toggleMenu(item.id);
              }}
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="1"></circle>
                  <circle cx="12" cy="5" r="1"></circle>
                  <circle cx="12" cy="19" r="1"></circle>
                </svg>
              }
            />
            
            {activeMenu === item.id && (
              <div className="dropdown-menu">
                <button 
                  className="menu-item" 
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent event bubbling
                    handleMarkReviewed(item.id);
                  }}
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
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent event bubbling
                    console.log('Add note clicked for student:', item.id);
                    handleAddNote(item._fullData);
                  }}
                  disabled={actionStatus.loading}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                  Add note
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
      
      <Table
        columns={columns}
        data={tableData}
        loading={loading}
        emptyMessage="No students found with relevant status in this team."
        loadingMessage="Loading team data..."
        className="students-table"
      />
    </section>
  );
};

export default TeamDashboard;