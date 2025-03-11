import { formatLocalDate } from '../../utils/dateUtils';
import Table from '../common/Table';
import { IconButton } from '../common/Button';
import '../../styles/components/FollowupsTable.css';

/**
 * Component for displaying a table of followups
 * 
 * @param {Object} props - Component props
 * @param {Array} props.followups - Array of followup objects
 * @param {Function} props.onView - Function to call when viewing a followup
 * @param {Function} props.onEdit - Function to call when editing a followup
 * @param {Function} props.onComplete - Function to call when completing a followup
 * @param {Function} props.onDelete - Function to call when deleting a followup
 * @param {boolean} props.loading - Whether the data is loading
 */
const FollowupsTable = ({ 
  followups, 
  onView, 
  onEdit, 
  onComplete, 
  onDelete, 
  loading 
}) => {
  // Format notes based on followup type
  const formatNotes = (followup) => {
    if (followup.type === 'Intervention') {
      return (
        <div className="note-cell">
          <strong>{followup.intervention || 'Intervention'}</strong>
          {followup.metric && ` measured by ${followup.metric}`}
          {followup.start_date && followup.end_date && 
            ` from ${formatLocalDate(followup.start_date)} to ${formatLocalDate(followup.end_date)}`}
          {followup.followup_notes && `: ${followup.followup_notes}`}
        </div>
      );
    } else {
      // For other types, just show the notes
      return (
        <div className="note-cell">
          {followup.followup_notes || <span className="no-notes">—</span>}
        </div>
      );
    }
  };

  // Get CSS class for type badge
  const getTypeBadgeClass = (type) => {
    const typeKey = type.toLowerCase().replace(/\s+/g, '-');
    return `type-badge ${typeKey}`;
  };

  // Handle viewing a followup
  const handleView = (followup) => {
    if (onView) {
      onView(followup);
    }
  };
  
  // Handle editing a followup
  const handleEdit = (followup) => {
    if (onEdit) {
      onEdit(followup, true);
    }
  };
  
  // Handle completing a followup
  const handleComplete = (followup) => {
    if (onComplete && window.confirm('Mark this followup as complete?')) {
      onComplete(followup.id);
    }
  };
  
  // Handle deleting a followup
  const handleDelete = (followupId) => {
    if (onDelete && window.confirm('Are you sure you want to delete this followup?')) {
      onDelete(followupId);
    }
  };

  // Define table columns
  const columns = [
    {
      key: 'updated_at',
      title: 'Date',
      width: '10%',
      render: (item) => formatLocalDate(item.updated_at)
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
      width: '15%',
      render: (item) => (
        <span className={getTypeBadgeClass(item.type)}>
          {item.type}
        </span>
      )
    },
    {
      key: 'responsible_person_name',
      title: 'Responsible',
      width: '15%'
    },
    {
      key: 'notes',
      title: 'Details',
      width: '25%',
      render: (item) => formatNotes(item)
    },
    {
      key: 'actions',
      title: 'Actions',
      width: '15%',
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
            title="Edit followup"
            onClick={() => handleEdit(item)}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            }
          />
          <IconButton 
            title="Mark as complete"
            onClick={() => handleComplete(item)}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            }
          />
          <IconButton 
            title="Delete followup"
            onClick={() => handleDelete(item.id)}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
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
      data={followups}
      loading={loading}
      emptyMessage="No followups found."
      loadingMessage="Loading followups..."
      className="followups-table"
    />
  );
};

export default FollowupsTable;