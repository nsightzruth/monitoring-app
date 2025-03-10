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
    addIncident,
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

  // Handler for form submission
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

  return (
    <>
      <section className="form-section">
        <h2>Submit New Incident/Note</h2>
        <IncidentNoteForm 
          onSubmit={handleSubmitRecord} 
          incidentToView={currentRecord}
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
            onView={viewRecord}
            loading={loading}
          />
        )}
      </section>
    </>
  );
};

export default IncidentNotePage;