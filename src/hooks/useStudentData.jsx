import { useState, useEffect } from 'react';

const VALID_STATUSES = ['New', 'In Progress', 'On Watch', 'Closed'];

export const useStudentData = (supabase, user, selectedTeam) => {
  const [teams, setTeams] = useState([]);
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
      } catch (err) {
        console.error('Error fetching teams:', err);
        setError(err.message);
      }
    };
    
    fetchTeams();
  }, [user, supabase]);

  // Fetch student data function
  const fetchStudentData = async () => {
    if (!selectedTeam) return;
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching data for team ID:', selectedTeam);
      
      // 1. First get all students in the selected team
      const { data: studentsData, error: studentsError } = await supabase
        .from('Student')
        .select('id, name, grade, photo')
        .eq('team_id', selectedTeam);
        
      if (studentsError) throw studentsError;
      
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
      
      // 6. Fetch incidents/notes for all students
      const { data: incidentsData, error: incidentsError } = await supabase
        .from('IncidentsNotes')
        .select('id, student_id, type, location, offense, note, date, time, created_at')
        .in('student_id', studentIds)
        .order('date', { ascending: false });
        
      if (incidentsError) throw incidentsError;
      
      // Filter students who have referrals with valid statuses
      const studentsWithValidReferrals = studentsData.filter(student => {
        return referralsData.some(ref => ref.student_id === student.id);
      });
      
      // Process and combine all data
      const processedStudents = studentsWithValidReferrals.map(student => {
        // Get referrals for this student
        const studentReferrals = referralsData.filter(
          ref => ref.student_id === student.id
        );
        
        // Get latest status from changelog or use referral status
        const latestStatusChange = statusData.find(
          status => status.student_id === student.id
        );
        
        const currentStatus = latestStatusChange 
          ? latestStatusChange.new_status 
          : (studentReferrals.length > 0 ? studentReferrals[0].status : 'Unknown');
        
        // Get incidents/notes for this student
        const studentIncidents = incidentsData.filter(
          incident => incident.student_id === student.id
        );
        
        // Format notes with the required structure
        const formattedNotes = studentIncidents.map(incident => {
          const noteDate = new Date(incident.date).toISOString().split('T')[0];
          
          if (incident.type === 'Incident') {
            return {
              date: incident.date,
              formattedNote: `${noteDate} - ${incident.offense || 'Incident'} at ${incident.location || 'Unknown'}: ${incident.note || ''}`
            };
          } else {
            return {
              date: incident.date,
              formattedNote: `${noteDate} - ${incident.note || 'No details provided'}`
            };
          }
        });
        
        // If we have fewer than 5 notes and there's a referral note, add it
        if (formattedNotes.length < 5 && studentReferrals.length > 0 && studentReferrals[0].referral_notes) {
          const referralDate = new Date(studentReferrals[0].created_at).toISOString().split('T')[0];
          formattedNotes.push({
            date: studentReferrals[0].created_at,
            formattedNote: `${referralDate} - ${studentReferrals[0].referral_notes}`
          });
        }
        
        // Sort by date (newest first), limit to 5, and join with line breaks
        const combinedNotes = formattedNotes
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, 5)
          .map(note => note.formattedNote)
          .join('\n');
        
        // Format referral notes with dates (for backward compatibility)
        const notes = studentReferrals.map(ref => {
          const createdDate = new Date(ref.created_at).toISOString().split('T')[0];
          return `${createdDate} - ${ref.referral_notes || 'No notes provided'}`;
        }).join('\n\n');
        
        // Get followups for this student
        const studentFollowups = followupData.filter(followup => followup.student_id === student.id);
        
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
        
        // Get latest review date
        const studentReviews = reviewData.filter(review => review.student_id === student.id);
        const latestReview = studentReviews.length > 0 ? studentReviews[0] : null;
        
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
          notes, // Keep original notes format for backward compatibility
          incidentNotes: combinedNotes, // New field for the combined incident notes
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
  };

  // Fetch student data when selected team changes
  useEffect(() => {
    if (selectedTeam) {
      fetchStudentData();
    }
  }, [selectedTeam]);

  return {
    teams,
    students,
    loading,
    error,
    fetchStudentData
  };
};