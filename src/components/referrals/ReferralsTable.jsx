import { format } from 'date-fns';
import Table from '../common/Table';
import { IconButton } from '../common/Button';
import '../../styles/components/ReferralsTable.css';

/**
 * Component for displaying a table of referrals
 */
const ReferralsTable = ({ referrals, onView, onCopyNote, loading }) => {
  // Format date helper function
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return format(date, 'MMM d, yyyy h:mm a');
    } catch (e) {
      console.error('Error formatting date:', e);
      return dateString;
    }
  };

  // Handle viewing a referral
  const handleView = (referral) => {
    if (onView) {
      onView(referral);
    }
  };

  // Handle copying a note
  const handleCopyNote = (notes) => {
    if (onCopyNote) {
      onCopyNote(notes);
    }
  };

  // Define table columns
  const columns = [
    {
      key: 'created_at',
      title: 'Date',
      render: (item) => formatDate(item.created_at)
    },
    {
      key: 'student_name',
      title: 'Student Name'
    },
    {
      key: 'referral_reason',
      title: 'Reason for Referral'
    },
    {
      key: 'referral_notes',
      title: 'Referral Notes',
      render: (item) => (
        item.referral_notes ? (
          <div className="notes-cell">
            {item.referral_notes.length > 100
              ? `${item.referral_notes.substring(0, 100)}...`
              : item.referral_notes}
          </div>
        ) : (
          <span className="no-notes">—</span>
        )
      )
    },
    {
      key: 'status',
      title: 'Status',
      render: (item) => (
        <span className={`status-badge ${item.status.toLowerCase()}`}>
          {item.status}
        </span>
      )
    },
    {
      key: 'actions',
      title: 'Actions',
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
          {item.referral_notes && (
            <IconButton 
              title="Copy notes"
              onClick={() => handleCopyNote(item.referral_notes)}
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
      data={referrals}
      loading={loading}
      emptyMessage="No referrals submitted yet."
      loadingMessage="Loading referrals..."
      className="referrals-table"
    />
  );
};

export default ReferralsTable;