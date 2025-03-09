import { useState, useEffect } from 'react';
import '../styles/TeamDashboard.css';

const VALID_STATUSES = ['New', 'In Progress', 'On Watch', 'Closed'];

const TeamDashboard = ({ user, supabase }) => {
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch teams the staff member belongs to
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        // Get teams for the current staff member
        const { data, error } = await supabase
          .from('StaffTeams')
          .select(`
            team_id,
            Team:team_id (
              id,
              name
            )
          `)
          .eq('staff_id', user.id);
          
        if (error) throw error;
        
        // Use Set to filter out duplicate team IDs before mapping
        const uniqueTeamIds = [...new Set(data.map(item => item.team_id))];
        
        // Extract and format unique team data
        const teamsData = uniqueTeamIds.map(teamId => {
          const teamData = data.find(item => item.team_id === teamId);
          return {
            id: teamData.Team.id,
            name: teamData.Team.name
          };
        });
        
        console.log('Unique teams found:', teamsData);
        setTeams(teamsData);
        
        // Set initially selected team
        if (teamsData.length > 0) {
          setSelectedTeam(teamsData[0].id);
        }
      } catch (err) {
        console.error('Error fetching teams:', err);
        setError(err.message);
      }
    };
    
    fetchTeams();
  }, [user, supabase]);

  // Fetch student data when selected team changes
  useEffect(() => {
    if (selectedTeam) {
      fetchStudentData();
    }
  }, [selectedTeam]);

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching data for team ID:', selectedTeam);
      
      // Complex query to fetch all required data efficiently
      // 1. First get all students in the selected team
      const { data: studentsData, error: studentsError } = await supabase
        .from('Student')
        .select('id, name, grade, photo')
        .eq('team_id', selectedTeam);
        
      if (studentsError) throw studentsError;
      
      console.log('Students found in team:', studentsData?.length || 0);
      
      // Prepare to fetch data for all students at once
      const studentIds = studentsData.map(student => student.id);
      
      // 2. Fetch referrals for all these students in a single query
      const { data: referralsData, error: referralsError } = await supabase
        .from('Referrals')
        .select('id, student_id, referral_type, referral_reason, referral_notes, status, created_at')
        .in('student_id', studentIds)
        .in('status', VALID_STATUSES)
        .order('created_at', { ascending: false });
        
      if (referralsError) throw referralsError;
      
      console.log('Referrals found with valid statuses:', referralsData?.length || 0);
      
      // 3. Fetch status changelog for all students
      const { data: statusData, error: statusError } = await supabase
        .from('StatusChangelog')
        .select('student_id, new_status, created_at')
        .in('student_id', studentIds)
        .order('created_at', { ascending: false });
        
      if (statusError) throw statusError;
      
      // 4. Fetch followups for all students
      const { data: followupData, error: followupError } = await supabase
        .from('Followup')
        .select(`
          id, 
          student_id, 
          type, 
          followup_notes, 
          followup_status,
          created_at,
          responsible_person,
          intervention,
          metric,
          start_date,
          end_date,
          Staff:responsible_person (
            id,
            name
          )
        `)
        .in('student_id', studentIds)
        .eq('followup_status', 'In Progress');
        
      if (followupError) throw followupError;
      
      // 5. Fetch review dates for all students
      const { data: reviewData, error: reviewError } = await supabase
        .from('Reviews')
        .select('student_id, review_date, created_at')
        .in('student_id', studentIds)
        .order('created_at', { ascending: false });
        
      if (reviewError) throw reviewError;
      
      // Filter students who have referrals with valid statuses
      const studentsWithValidReferrals = studentsData.filter(student => {
        return referralsData.some(ref => ref.student_id === student.id);
      });
      
      console.log('Students with valid referrals:', studentsWithValidReferrals.length);
      
      // Process and combine all data
      const processedStudents = studentsWithValidReferrals.map(student => {
        // Get referrals for this student
        const studentReferrals = referralsData.filter(
          ref => ref.student_id === student.id
        );
        
        console.log(`Processing student ${student.name} with ${studentReferrals.length} referrals`);
        
        // Get latest status from changelog or use referral status
        const latestStatusChange = statusData.find(
          status => status.student_id === student.id
        );
        
        const currentStatus = latestStatusChange 
          ? latestStatusChange.new_status 
          : (studentReferrals.length > 0 ? studentReferrals[0].status : 'Unknown');
        
        // Format referral notes with dates
        const notes = studentReferrals.map(ref => {
          const createdDate = new Date(ref.created_at).toISOString().split('T')[0];
          return `${createdDate} - ${ref.referral_notes || 'No notes provided'}`;
        }).join('\n\n');
        
        // Get followups for this student
        const studentFollowups = followupData.filter(followup => followup.student_id === student.id);
        console.log(`Found ${studentFollowups.length} followups for student ${student.name}`);
        
        const followups = studentFollowups
          .map(followup => {
            const followupDate = new Date(followup.created_at).toISOString().split('T')[0];
            const responsiblePerson = followup.Staff ? followup.Staff.name : 'Unassigned';
            
            let formattedFollowup;
            if (followup.type !== 'intervention') {
              formattedFollowup = `${followupDate} - ${followup.type}: ${followup.followup_notes || 'No notes provided'} (${responsiblePerson})`;
            } else {
              formattedFollowup = `${followupDate} - ${followup.type}: ${followup.intervention || 'No intervention defined'} to be measured by ${followup.metric || 'N/A'} from ${followup.start_date || 'N/A'} to ${followup.end_date || 'N/A'}. ${followup.followup_notes || ''} (${responsiblePerson})`;
            }
            
            return formattedFollowup;
          }).join('\n\n');
        
        // Get latest review date - using the review_date field as shown in schema
        const studentReviews = reviewData.filter(review => review.student_id === student.id);
        const latestReview = studentReviews.length > 0 ? studentReviews[0] : null;
        
        console.log(`Found ${studentReviews.length} reviews for student ${student.name}`);
        
        const lastReviewDate = latestReview 
          ? (latestReview.review_date ? new Date(latestReview.review_date).toISOString().split('T')[0] : new Date(latestReview.created_at).toISOString().split('T')[0])
          : (studentReferrals.length > 0 ? new Date(studentReferrals[0].created_at).toISOString().split('T')[0] : 'Never');
        
        return {
          id: student.id,
          name: student.name,
          grade: student.grade,
          photo: student.photo,
          status: currentStatus,
          referralType: studentReferrals.length > 0 ? studentReferrals[0].referral_type : 'N/A',
          referralReason: studentReferrals.length > 0 ? studentReferrals[0].referral_reason : 'N/A',
          notes,
          followups,
          lastReview: lastReviewDate
        };
      });
      
      // Set students state
      setStudents(processedStudents);
    } catch (err) {
      console.error('Error fetching student data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
    
    // For debugging
    console.log('TeamDashboard fetch completed');
  };

  const handleTeamChange = (e) => {
    setSelectedTeam(e.target.value);
  };

  return (
    <section className="team-dashboard">
      <h2>Team Dashboard</h2>
      
      {error && <div className="message error">{error}</div>}
      
      <div className="team-selector">
        <label htmlFor="team-select">Select Team:</label>
        <select 
          id="team-select"
          value={selectedTeam || ''}
          onChange={handleTeamChange}
          disabled={loading || teams.length === 0}
        >
          {teams.length === 0 ? (
            <option value="">No teams available</option>
          ) : (
            teams.map(team => (
              <option key={team.id} value={team.id}>{team.name}</option>
            ))
          )}
        </select>
      </div>
      
      {loading ? (
        <div className="loading-indicator">Loading team data...</div>
      ) : students.length === 0 ? (
        <div className="no-data">No students found with relevant status in this team.</div>
      ) : (
        <div className="students-table-container">
          <table className="students-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Status</th>
                <th>Referral Type</th>
                <th>Referral Reason</th>
                <th>Notes</th>
                <th>Followups</th>
                <th>Last Review</th>
              </tr>
            </thead>
            <tbody>
              {students.map(student => (
                <tr key={student.id}>
                  <td className="student-cell">
                    {student.photo ? (
                      <img 
                        src={student.photo} 
                        alt={student.name} 
                        className="student-photo" 
                      />
                    ) : (
                      <div className="student-photo-placeholder">
                        {student.name.charAt(0)}
                      </div>
                    )}
                    <div className="student-info">
                      <div className="student-name">{student.name}</div>
                      {student.grade && <div className="student-grade">Grade: {student.grade}</div>}
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge ${student.status.toLowerCase().replace(/\s+/g, '-')}`}>
                      {student.status}
                    </span>
                  </td>
                  <td>{student.referralType}</td>
                  <td>{student.referralReason}</td>
                  <td>
                    <div className="notes-cell">
                      {student.notes ? (
                        student.notes.split('\n\n').map((note, idx) => (
                          <p key={idx}>{note}</p>
                        ))
                      ) : (
                        <span className="no-notes">No notes available</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="followups-cell">
                      {student.followups ? (
                        student.followups.split('\n\n').map((followup, idx) => (
                          <p key={idx}>{followup}</p>
                        ))
                      ) : (
                        <span className="no-followups">No active followups</span>
                      )}
                    </div>
                  </td>
                  <td>{student.lastReview}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

export default TeamDashboard;