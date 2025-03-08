// File: src/components/ReferralsTable.jsx
import { format } from 'date-fns';

const ReferralsTable = ({ referrals, onView, onCopyNote }) => {
  if (!referrals || referrals.length === 0) {
    return <p className="no-data">No referrals submitted yet.</p>;
  }

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return format(date, 'MMM d, yyyy h:mm a');
    } catch (e) {
      console.error('Error formatting date:', e);
      return dateString;
    }
  };

  const handleView = (referral) => {
    console.log("View button clicked for referral:", referral.id);
    if (onView) {
      onView(referral);
    }
  };

  const handleCopyNote = (notes) => {
    console.log("Copy button clicked for notes");
    if (onCopyNote) {
      onCopyNote(notes);
    }
  };

  return (
    <div className="table-container">
      <table className="referrals-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Student Name</th>
            <th>Reason for Referral</th>
            <th>Referral Notes</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {referrals.map((referral) => (
            <tr key={referral.id}>
              <td>{formatDate(referral.created_at)}</td>
              <td>{referral.student_name}</td>
              <td>{referral.referral_reason}</td>
              <td>
                {referral.referral_notes ? (
                  <div className="notes-cell">
                    {referral.referral_notes.length > 100
                      ? `${referral.referral_notes.substring(0, 100)}...`
                      : referral.referral_notes}
                  </div>
                ) : (
                  <span className="no-notes">—</span>
                )}
              </td>
              <td>
                <span className={`status-badge ${referral.status.toLowerCase()}`}>
                  {referral.status}
                </span>
              </td>
              <td className="action-cell">
                <button 
                  className="icon-button view-button" 
                  onClick={() => handleView(referral)}
                  title="View details"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                </button>
                {referral.referral_notes && (
                  <button 
                    className="icon-button copy-button" 
                    onClick={() => handleCopyNote(referral.referral_notes)}
                    title="Copy notes"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ReferralsTable;