import { useEffect } from 'react';
import { useIncidents } from '../hooks/useIncidents';
import { useStudentData } from '../context/StudentDataContext';
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
  const { selectedStudent } = useStudentData();

  // Scroll to form if a student was selected in another page
  useEffect(() => {
    if (selectedStudent) {
      console.log('Student was selected in another page:', selectedStudent);
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

  // Handler for copying notes to clipboard
  const handleCopyNote = (record) => {
    let textToCopy = '';
    
    // Format date/time
    const dateTime = record.time 
      ? new Date(`${record.date}T${record.time}`)
      : new Date(record.date);
    
    const dateTimeStr = record.time
      ? dateTime.toLocaleString()
      : dateTime.toLocaleDateString();
    
    if (record.type === 'Incident') {
      // For incidents, include offense, location, and note
      textToCopy = `${dateTimeStr} - ${record.offense || 'Incident'}`;
      if (record.location) textToCopy += ` at ${record.location}`;
      if (record.note) textToCopy += `: ${record.note}`;
    } else {
      // For notes, include the date and note text
      textToCopy = `${dateTimeStr} - ${record.note || 'No details provided'}`;
    }
    
    // Copy to clipboard
    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        alert('Notes copied to clipboard!');
      })
      .catch(err => {
        console.error('Failed to copy text: ', err);
        alert('Failed to copy notes. Please try again.');
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
            onCopyNote={handleCopyNote}
            loading={loading}
          />
        )}
      </section>
    </>
  );
};

export default IncidentNotePage;