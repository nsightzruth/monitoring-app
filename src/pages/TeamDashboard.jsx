import { useState, useEffect } from 'react';
import TeamDashboardComponent from '../components/TeamDashboard';

const TeamDashboard = ({ user, supabase }) => {
  const [hasTeams, setHasTeams] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check if user has any team assignments
  useEffect(() => {
    const checkTeamMembership = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('StaffTeams')
          .select('team_id')
          .eq('staff_id', user.id)
          .limit(1);
          
        if (error) throw error;
        
        setHasTeams(data && data.length > 0);
      } catch (err) {
        console.error('Error checking team membership:', err);
        setHasTeams(false);
      } finally {
        setLoading(false);
      }
    };
    
    checkTeamMembership();
  }, [user, supabase]);

  if (loading) {
    return (
      <section className="loading-section">
        <p>Loading team information...</p>
      </section>
    );
  }

  if (!hasTeams) {
    return (
      <section className="error-section">
        <h2>Team Access</h2>
        <p>You are not currently assigned to any teams. Please contact an administrator to be added to a team.</p>
      </section>
    );
  }

  return <TeamDashboardComponent user={user} supabase={supabase} />;
};

export default TeamDashboard;