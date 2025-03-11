import { formatLocalDateTime } from '../../utils/dateUtils';
import Table from '../common/Table';
import { IconButton } from '../common/Button';
import '../../styles/components/IncidentNotesTable.css';

/**
 * Component for displaying a table of incidents and notes
 * 
 * @param {Object} props - Component props
 * @param {Array} props.records - Array of incident/note records
 * @param {Function} props.onView - Function to call when viewing a record
 * @param {Function} props.onEdit - Function to call when editing a record
 * @param {boolean} props.loading - Whether the table is loading
 */
const IncidentNotesTable = ({ records, onView, onEdit, loading }) => {
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
  
  // Handle editing a record
  const handleEdit = (record) => {
    if (onEdit) {
      onEdit(record);
    }
  };

  // Define table columns
  const columns = [
    {
      key: 'date_time',
      title: 'Date/Time',
      width: '10%',
      render: (item) => formatLocalDateTime(item.date, item.time)
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
          <IconButton 
            title="Edit record"
            onClick={() => handleEdit(item)}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
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