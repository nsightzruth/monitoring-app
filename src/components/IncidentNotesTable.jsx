import { format } from 'date-fns';
import '../styles/IncidentNotesTable.css'; // Changed to use its own CSS file

const IncidentNotesTable = ({ records, onView }) => {
  if (!records || records.length === 0) {
    return <p className="no-data">No records submitted yet.</p>;
  }

  const formatDateTime = (dateString, timeString) => {
    try {
      // If there's no time, just format the date
      if (!timeString) {
        return format(new Date(dateString), 'MMM d, yyyy');
      }
      
      // If there's a time, combine date and time
      const dateTime = new Date(`${dateString}T${timeString}`);
      return format(dateTime, 'MMM d, yyyy h:mm a');
    } catch (e) {
      console.error('Error formatting date/time:', e);
      return `${dateString} ${timeString || ''}`;
    }
  };

  const formatNotes = (record) => {
    if (record.type === 'Incident') {
      // Format for incidents: Offense at Location - Note
      return (
        <div className="truncate-text">
          <strong>{record.offense}</strong>
          {record.location && ` at ${record.location}`}
          {record.note && ` - ${record.note}`}
        </div>
      );
    } else {
      // For regular notes, just show the note
      return <div className="truncate-text">{record.note || '—'}</div>;
    }
  };

  const handleView = (record) => {
    if (onView) {
      onView(record);
    }
  };

  return (
    <div className="table-container">
      <table className="incidents-notes-table">
        <colgroup>
          <col style={{ width: '10%' }} /> {/* Date/Time - 1 part */}
          <col style={{ width: '20%' }} /> {/* Student - 2 parts */}
          <col style={{ width: '10%' }} /> {/* Type - 1 part */}
          <col style={{ width: '50%' }} /> {/* Notes - 5 parts (adjusted from 7 for better proportion) */}
          <col style={{ width: '10%' }} /> {/* Actions - 1 part */}
        </colgroup>
        <thead>
          <tr>
            <th>Date/Time</th>
            <th>Student</th>
            <th>Type</th>
            <th>Notes</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <tr key={record.id}>
              <td className="date-time-cell">{formatDateTime(record.date, record.time)}</td>
              <td className="student-cell">
                {record.student_name}
                {record.grade && <span className="student-grade"> ({record.grade})</span>}
              </td>
              <td className="type-cell">{record.type}</td>
              <td className="notes-cell">
                {formatNotes(record)}
              </td>
              <td className="action-cell">
                <button 
                  className="icon-button view-button" 
                  onClick={() => handleView(record)}
                  title="View details"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default IncidentNotesTable;