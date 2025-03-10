import StudentActionMenu from './StudentActionMenu';

const StudentTableRow = ({ 
  student, 
  activeMenu, 
  onToggleMenu, 
  onMarkReviewed,
  onAddNote,
  actionLoading,
  menuRef
}) => {
  return (
    <tr>
      <td className="student-cell">
        {student.photo ? (
          <img 
            src={student.photo} 
            alt={student.name} 
            className="student-photo" 
          />
        ) : (
          <div className="student-photo-placeholder">
            {student.name.charAt(0)}
          </div>
        )}
        <div className="student-info">
          <div className="student-name">{student.name}</div>
          {student.grade && <div className="student-grade">Grade: {student.grade}</div>}
        </div>
      </td>
      <td>
        <span className={`status-badge ${student.status.toLowerCase().replace(/\s+/g, '-')}`}>
          {student.status}
        </span>
      </td>
      <td>{student.referralType}</td>
      <td>{student.referralReason}</td>
      <td>
        <div className="notes-cell">
          {student.incidentNotes ? (
            student.incidentNotes.split('\n').map((note, idx) => (
              <p key={idx} className="truncate-note" title={note}>{note}</p>
            ))
          ) : (
            <span className="no-notes">No notes available</span>
          )}
        </div>
      </td>
      <td>
        <div className="followups-cell">
          {student.followups ? (
            student.followups.split('\n\n').map((followup, idx) => (
              <p key={idx}>{followup}</p>
            ))
          ) : (
            <span className="no-followups">No active followups</span>
          )}
        </div>
      </td>
      <td>{student.lastReview}</td>
      <td className="actions-cell">
        <StudentActionMenu 
          studentId={student.id}
          student={student}
          isOpen={activeMenu === student.id}
          onToggle={onToggleMenu}
          onMarkReviewed={onMarkReviewed}
          onAddNote={onAddNote}
          isLoading={actionLoading}
          menuRef={menuRef}
        />
      </td>
    </tr>
  );
};

export default StudentTableRow;