import { format } from 'date-fns';
import Table from '../common/Table';
import { IconButton } from '../common/Button';
import '../../styles/components/IncidentNotesTable.css';

/**
 * Component for displaying a table of incidents and notes
 */
const IncidentNotesTable = ({ records, onView, loading }) => {
  // Format date and time helper function
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

  // Format notes based on record type
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

  // Handle viewing a record
  const handleView = (record) => {
    if (onView) {
      onView(record);
    }
  };

  // Define table columns
  const columns = [
    {
      key: 'date_time',
      title: 'Date/Time',
      width: '10%',
      render: (item) => formatDateTime(item.date, item.time)
    },
    {
      key: 'student_name',
      title: 'Student',
      width: '20%',
      render: (item) => (
        <div>
          {item.student_name}
          {item.grade && <span className="student-grade"> ({item.grade})</span>}
        </div>
      )
    },
    {
      key: 'type',
      title: 'Type',
      width: '10%',
      cellClassName: 'type-cell'
    },
    {
      key: 'notes',
      title: 'Notes',
      width: '50%',
      render: (item) => formatNotes(item)
    },
    {
      key: 'actions',
      title: 'Actions',
      width: '10%',
      render: (item) => (
        <div className="action-cell">
          <IconButton 
            title="View details"
            onClick={() => handleView(item)}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            }
          />
        </div>
      )
    }
  ];

  return (
    <Table
      columns={columns}
      data={records}
      loading={loading}
      emptyMessage="No records submitted yet."
      loadingMessage="Loading records..."
      className="incidents-notes-table"
    />
  );
};

export default IncidentNotesTable;