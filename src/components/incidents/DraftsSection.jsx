import React from 'react';
import { formatLocalDate } from '../../utils/dateUtils';
import Button from '../common/Button';
import { IconButton } from '../common/Button';

/**
 * Component for displaying draft notes
 * 
 * @param {Object} props - Component props
 * @param {Array} props.drafts - Array of draft records
 * @param {Function} props.onEdit - Function to call when editing a draft
 * @param {Function} props.onDelete - Function to call when deleting a draft
 * @param {boolean} props.loading - Whether the drafts are loading
 */
const DraftsSection = ({ drafts = [], onEdit, onDelete, loading = false }) => {
  // Skip rendering if no drafts
  if (!loading && drafts.length === 0) {
    return null;
  }
  
  // Get truncated text for preview
  const getTruncatedText = (text, maxLength = 120) => {
    if (!text) return '—';
    if (text.length <= maxLength) return text;
    return `${text.substring(0, maxLength)}...`;
  };

  return (
    <div className="drafts-section">
        <h3>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
            Voice Note Drafts
        </h3>
      
      {loading ? (
        <p>Loading drafts...</p>
      ) : (
        drafts.map(draft => (
          <div key={draft.id} className="draft-item">
            <div className="draft-content">
              <div className="draft-date">{formatLocalDate(draft.date)}</div>
              <div className="draft-text">{getTruncatedText(draft.note)}</div>
            </div>
            <div className="draft-actions">
              <IconButton 
                title="Edit draft"
                onClick={() => onEdit(draft)}
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                }
              />
              <IconButton 
                title="Delete draft"
                onClick={() => onDelete(draft.id)}
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                  </svg>
                }
              />
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default DraftsSection;