import { format } from 'date-fns';
import Table from '../common/Table';
import { IconButton } from '../common/Button';
import '../../styles/components/IncidentNotesTable.css';

/**
 * Component for displaying a table of incidents and notes
 */
const IncidentNotesTable = ({ records, onView, onCopyNote, loading }) => {
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

  // Handle copying notes to clipboard
  const handleCopyNote = (record) => {
    if (!onCopyNote) {
      // If no handler is provided, implement default behavior
      let textToCopy = '';
      
      if (record.type === 'Incident') {
        // For incidents, include the offense, location, and note
        textToCopy = `${record.offense || 'Incident'}`;
        if (record.location) textToCopy += ` at ${record.location}`;
        if (record.note) textToCopy += ` - ${record.note}`;
      } else {
        // For notes, just copy the note text
        textToCopy = record.note || '';
      }
      
      // Format with date
      const dateStr = formatDateTime(record.date, record.time);
      textToCopy = `${dateStr}: ${textToCopy}`;
      
      // Copy to clipboard
      navigator.clipboard.writeText(textToCopy)
        .then(() => {
          alert('Notes copied to clipboard!');
        })
        .catch(err => {
          console.error('Failed to copy text: ', err);
          alert('Failed to copy notes. Please try again.');
        });
    } else {
      // Use the provided handler
      onCopyNote(record);
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
          {item.note && (
            <IconButton 
              title="Copy notes"
              onClick={() => handleCopyNote(item)}
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              }
            />
          )}
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