import StudentTableRow from './StudentTableRow';

const StudentTable = ({ 
  students, 
  activeMenu, 
  onToggleMenu, 
  onMarkReviewed, 
  onAddNote,
  actionLoading,
  menuRef
}) => {
  return (
    <div className="students-table-container">
      <table className="students-table">
        <thead>
          <tr>
            <th>Student</th>
            <th>Status</th>
            <th>Referral Type</th>
            <th>Referral Reason</th>
            <th>Notes</th>
            <th>Followups</th>
            <th>Last Review</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {students.map(student => (
            <StudentTableRow 
              key={student.id}
              student={student}
              activeMenu={activeMenu}
              onToggleMenu={onToggleMenu}
              onMarkReviewed={onMarkReviewed}
              onAddNote={onAddNote}
              actionLoading={actionLoading}
              menuRef={menuRef && activeMenu === student.id ? menuRef : null}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default StudentTable;