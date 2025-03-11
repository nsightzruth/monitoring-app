import { useEffect } from 'react';
import { useIncidents } from '../hooks/useIncidents';
import { useStudent } from '../hooks/useStudent';
import IncidentNoteForm from '../components/incidents/IncidentNoteForm';
import IncidentNotesTable from '../components/incidents/IncidentNotesTable';
import '../styles/pages/IncidentNotePage.css';

/**
 * Page component for managing incidents and notes
 */
const IncidentNotePage = ({ user }) => {
  // Use our incidents hook
  const {
    records,
    currentRecord,
    loading,
    error,
    editMode,
    addIncident,
    editIncident,
    viewRecord,
    resetCurrentRecord
  } = useIncidents(user?.id);
  
  // Student context is used to check if a student was pre-selected
  const { selectedStudent } = useStudent();

  // Scroll to form if a student was selected in another page
  useEffect(() => {
    if (selectedStudent) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [selectedStudent]);

  // Handler for form submission (new record)
  const handleSubmitRecord = async (formData) => {
    return await addIncident({
      studentId: formData.studentId,
      studentName: formData.studentName,
      type: formData.type,
      date: formData.date,
      time: formData.time || null,
      location: formData.type === 'Incident' ? formData.location : null,
      offense: formData.type === 'Incident' ? formData.offense : null,
      note: formData.note
    });
  };

  // Handler for editing a record
  const handleEditRecord = async (recordId, formData) => {
    return await editIncident(recordId, formData);
  };

  // Handler for viewing a record
  const handleViewRecord = (record) => {
    viewRecord(record, false);
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handler for editing a record
  const handleEditButtonClick = (record) => {
    viewRecord(record, true);
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <section className="form-section">
        <h2>{currentRecord && editMode ? 'Edit Incident/Note' : 'Submit New Incident/Note'}</h2>
        <IncidentNoteForm 
          onSubmit={handleSubmitRecord}
          onEdit={handleEditRecord}
          incidentToView={currentRecord}
          editMode={editMode}
          onReset={resetCurrentRecord}
        />
      </section>
      
      <section className="table-section">
        <h2>Your Incidents & Notes</h2>
        {error ? (
          <p className="error-message">{error}</p>
        ) : (
          <IncidentNotesTable 
            records={records} 
            onView={handleViewRecord}
            onEdit={handleEditButtonClick}
            loading={loading}
          />
        )}
      </section>
    </>
  );
};

export default IncidentNotePage;