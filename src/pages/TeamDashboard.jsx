import { useState, useEffect, useRef } from 'react';
import { useStudentData as useTeamStudentData } from '../hooks/useStudentData';
import { useStudentData } from '../context/StudentDataContext';
import TeamSelector from '../components/TeamSelector';
import StudentTable from '../components/StudentTable';
import '../styles/TeamDashboard.css';

const TeamDashboard = ({ user, supabase, onNavigate }) => {
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [activeMenu, setActiveMenu] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(null);
  const menuRef = useRef(null);
  
  // Get context for cross-page communication
  const { selectStudent } = useStudentData();
  
  const { teams, students, loading, error, fetchStudentData } = useTeamStudentData(
    supabase,
    user,
    selectedTeam
  );

  // Set initially selected team
  useEffect(() => {
    if (teams.length > 0 && !selectedTeam) {
      setSelectedTeam(teams[0].id);
    }
  }, [teams, selectedTeam]);

  // Close menu when clicking outside
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

  // Auto-hide success message after 3 seconds
  useEffect(() => {
    if (actionSuccess) {
      const timer = setTimeout(() => {
        setActionSuccess(null);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [actionSuccess]);

  const handleTeamChange = (e) => {
    setSelectedTeam(e.target.value);
  };

  const toggleMenu = (studentId) => {
    if (activeMenu === studentId) {
      setActiveMenu(null);
    } else {
      setActiveMenu(studentId);
    }
  };

  const handleMarkReviewed = async (studentId) => {
    try {
      setActionLoading(true);
      
      // Get today's date in ISO format (YYYY-MM-DD)
      const today = new Date().toISOString().split('T')[0];
      
      // Create a new review record
      const { data, error } = await supabase
        .from('Reviews')
        .insert([{
          student_id: studentId,
          review_date: today,
        }])
        .select();
      
      if (error) throw error;
      
      // Update the UI
      setActionSuccess(`Review recorded for student`);
      
      // Refresh the data to show the updated review date
      fetchStudentData();
      
      // Close the menu
      setActiveMenu(null);
    } catch (err) {
      console.error('Error recording review:', err);
      setError(`Failed to record review: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };
  
  const handleAddNote = (student) => {
    // Store the selected student in context
    selectStudent(student);
    
    // Navigate to incidents page
    if (onNavigate) {
      onNavigate('incidents');
    }
  };

  return (
    <section className="team-dashboard">
      <h2>Team Dashboard</h2>
      
      {error && <div className="message error">{error}</div>}
      {actionSuccess && <div className="message success">{actionSuccess}</div>}
      
      <TeamSelector 
        teams={teams}
        selectedTeam={selectedTeam}
        onChange={handleTeamChange}
        disabled={loading || teams.length === 0}
      />
      
      {loading ? (
        <div className="loading-indicator">Loading team data...</div>
      ) : students.length === 0 ? (
        <div className="no-data">No students found with relevant status in this team.</div>
      ) : (
        <StudentTable 
          students={students}
          activeMenu={activeMenu}
          onToggleMenu={toggleMenu}
          onMarkReviewed={handleMarkReviewed}
          onAddNote={handleAddNote}
          actionLoading={actionLoading}
          menuRef={menuRef}
        />
      )}
    </section>
  );
};

export default TeamDashboard;