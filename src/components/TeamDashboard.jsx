// src/components/TeamDashboard.jsx
import { useState, useEffect } from 'react';
import TeamSelector from './TeamSelector';
import StudentTable from './StudentTable';
import { useStudentData } from '../hooks/useStudentData';
import '../styles/TeamDashboard.css';

const TeamDashboard = ({ user, supabase }) => {
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [activeMenu, setActiveMenu] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(null);
  
  const { teams, students, loading, error, fetchStudentData } = useStudentData(
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
          actionLoading={actionLoading}
        />
      )}
    </section>
  );
};

export default TeamDashboard;