import { useState, useEffect, useCallback } from 'react';
import { teamService, studentService } from '../services/supabase';
import { incidentService } from '../services/supabase';
import { formatLocalDate } from '../utils/dateUtils';

/**
 * Custom hook for managing teams and students data
 * 
 * @param {string} staffId - Staff ID to fetch teams for
 * @returns {Object} - Teams and student data and operations
 */
export const useTeams = (staffId) => {
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [students, setStudents] = useState([]);
  const [studentData, setStudentData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionStatus, setActionStatus] = useState({ loading: false, error: null, success: null });

  // Fetch teams when staffId changes
  useEffect(() => {
    if (staffId) {
      fetchTeams();
    }
  }, [staffId]);

  // Fetch student data when selectedTeam changes
  useEffect(() => {
    if (selectedTeam) {
      fetchTeamStudents();
    }
  }, [selectedTeam]);

  /**
   * Fetch teams for the current staff member
   */
  const fetchTeams = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const teamsData = await teamService.getTeamsByStaff(staffId);
      setTeams(teamsData);
      
      // Set first team as selected if none is selected
      if (teamsData.length > 0 && !selectedTeam) {
        setSelectedTeam(teamsData[0].id);
      }
    } catch (err) {
      console.error('Error fetching teams:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [staffId, selectedTeam]);

  /**
   * Fetch students for the selected team
   */
  const fetchTeamStudents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get students with referrals
      const { students: teamStudents, referrals } = await teamService.getTeamStudentsWithReferrals(selectedTeam);
      setStudents(teamStudents);
      
      // Process student data
      await processStudentData(teamStudents, referrals);
    } catch (err) {
      console.error('Error fetching team students:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedTeam]);

  /**
   * Process student data to include referrals, incidents, and reviews
   * @param {Array} studentsArray - Array of students
   * @param {Array} referralsArray - Array of referrals
   */
  const processStudentData = useCallback(async (studentsArray, referralsArray) => {
    try {
      const processedData = {};
      
      // Process each student
      for (const student of studentsArray) {
        // Get student's referrals
        const studentReferrals = referralsArray.filter(ref => ref.student_id === student.id);
        
        // Get student's incidents
        const studentIncidents = await incidentService.getIncidentsByStudent(student.id);
        
        // Get student's reviews
        const studentReviews = await studentService.getStudentReviews(student.id);
        
        // Format incidents/notes
        const formattedNotes = studentIncidents.map(incident => {
          // Properly format the date from the incident record
          const noteDate = formatLocalDate(incident.date);
          
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
        
        // Add referral note if available and we have fewer than 5 notes
        if (studentReferrals.length > 0 && studentReferrals[0].referral_notes && formattedNotes.length < 5) {
          // Format the date correctly for the referral note
          const referralDate = formatLocalDate(studentReferrals[0].created_at);
          formattedNotes.push({
            date: studentReferrals[0].created_at,
            formattedNote: `${referralDate} - Referred: ${studentReferrals[0].referral_notes}`
          });
        }
        
        // Sort by date (newest first) and limit to 5 most recent
        const sortedNotes = formattedNotes
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, 5)
          .map(note => note.formattedNote)
          .join('\n');
        
        // Get latest review date
        const latestReview = studentReviews.length > 0 ? studentReviews[0] : null;
        const lastReviewDate = latestReview
          ? (latestReview.review_date ? formatLocalDate(latestReview.review_date) : formatLocalDate(latestReview.created_at))
          : (studentReferrals.length > 0 ? formatLocalDate(studentReferrals[0].created_at) : 'Never');
        
        // Store processed data
        processedData[student.id] = {
          referrals: studentReferrals,
          incidents: studentIncidents,
          reviews: studentReviews,
          notes: sortedNotes,
          lastReview: lastReviewDate,
          status: studentReferrals.length > 0 ? studentReferrals[0].status : 'Unknown'
        };
      }
      
      setStudentData(processedData);
    } catch (err) {
      console.error('Error processing student data:', err);
    }
  }, []);

  /**
   * Mark a student as reviewed
   * @param {string} studentId - Student ID
   */
  const markStudentReviewed = useCallback(async (studentId) => {
    try {
      setActionStatus({ loading: true, error: null, success: null });
      
      // Add review record
      const review = await studentService.addStudentReview(studentId);
      
      // Update student data
      setStudentData(prev => {
        const updatedData = { ...prev };
        if (updatedData[studentId]) {
          updatedData[studentId] = {
            ...updatedData[studentId],
            reviews: [review, ...(updatedData[studentId].reviews || [])],
            lastReview: formatLocalDate(new Date())
          };
        }
        return updatedData;
      });
      
      setActionStatus({ loading: false, error: null, success: 'Student marked as reviewed' });
      
      return { success: true };
    } catch (err) {
      console.error('Error marking student as reviewed:', err);
      setActionStatus({ loading: false, error: err.message, success: null });
      return { success: false, error: err.message };
    }
  }, []);

  /**
   * Reset the action status
   */
  const resetActionStatus = useCallback(() => {
    setActionStatus({ loading: false, error: null, success: null });
  }, []);

  /**
   * Change the selected team
   * @param {string} teamId - Team ID
   */
  const changeSelectedTeam = useCallback((teamId) => {
    setSelectedTeam(teamId);
  }, []);
  
  return {
    teams,
    selectedTeam,
    students,
    studentData,
    loading,
    error,
    actionStatus,
    fetchTeams,
    fetchTeamStudents,
    markStudentReviewed,
    changeSelectedTeam,
    resetActionStatus
  };
};