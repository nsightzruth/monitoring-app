const TeamSelector = ({ teams, selectedTeam, onChange, disabled }) => {
    return (
      <div className="team-selector">
        <label htmlFor="team-select">Select Team:</label>
        <select 
          id="team-select"
          value={selectedTeam || ''}
          onChange={onChange}
          disabled={disabled}
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
    );
  };
  
  export default TeamSelector;